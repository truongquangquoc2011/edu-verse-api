import axios from 'axios'
import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { ChatbotRepository } from './chatbot.repo'

@Injectable()
export class ChatbotService {
  private readonly logger = new Logger(ChatbotService.name)

  private readonly apiKey: string
  private readonly model: string

  // relevance threshold (demo friendly)
  private readonly MIN_BEST_SCORE = 15

  constructor(
    private readonly repo: ChatbotRepository,
    private readonly config: ConfigService,
  ) {
    this.apiKey = this.config.get<string>('GEMINI_API_KEY') || ''
    this.model = this.config.get<string>('GEMINI_MODEL') || 'models/gemini-2.5-flash'

    if (!this.apiKey) this.logger.error('Missing GEMINI_API_KEY in env')
    this.logger.log(`Gemini model=${this.model}`)
  }

  // ===== accent-insensitive helper =====
  private stripAccents(s: string) {
    return (s || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'D')
  }

  // ====== Helpers: detect meta chat ======
  private isMetaMessage(text: string) {
    const t = (text || '').toLowerCase()
    return /(nãy|hồi nãy|lúc nãy|vừa nãy|mới hỏi|hỏi gì|nói gì|nhắc lại|lặp lại|bạn hỏi gì|ý bạn là gì|bạn nói gì|repeat|say again|what did you ask|what did you say|remind me|can you repeat|you asked|previous question|last question)/i.test(
      t,
    )
  }

  // ====== detect teacher query in English/Vietnamese ======
  private parseTeacherName(text: string): string | null {
    const raw = (text || '').trim()
    if (!raw) return null

    // Examples:
    // "courses by Roney John"
    // "send me Mr. Quoc's courses"
    // "teacher Quoc"
    // "giảng viên Quốc"
    // "khóa học của thầy Quốc"
    const t = raw

    // by/of/from/teacher/instructor + NAME
    const m1 = t.match(
      /\b(by|of|from|teacher|instructor|giảng\s*viên|thầy|cô)\b\s+([A-Za-zÀ-ỹĐđ\s'.-]{2,60})/i,
    )
    if (m1?.[2]) return m1[2].trim()

    // Mr/Ms/Dr + NAME + ('s)? (courses)
    const m2 = t.match(
      /\b(mr|mrs|ms|miss|dr|prof)\.?\s+([A-Za-zÀ-ỹĐđ\s'.-]{2,60})(?:'s)?/i,
    )
    if (m2?.[2]) return m2[2].trim()

    // "NAME's courses" (loose)
    const m3 = t.match(/([A-Za-zÀ-ỹĐđ\s'.-]{2,60})'s\s+(course|courses)\b/i)
    if (m3?.[1]) return m3[1].trim()

    // "khóa học của NAME"
    const m4 = t.match(/khóa\s*học\s*của\s+([A-Za-zÀ-ỹĐđ\s'.-]{2,60})/i)
    if (m4?.[1]) return m4[1].trim()

    return null
  }

  // ====== Intent parse (free/rating/basic/practical/price/field + teacher) ======
  private parseUserIntent(text: string) {
    const t = (text || '').toLowerCase()

    const wantsFree = /(miễn\s*phí|free|no\s*cost|zero\s*cost|0\s*đ|không\s*mất\s*phí)/i.test(t)
    const wantsHighRating =
      /(rating\s*cao|đánh\s*giá\s*cao|high\s*rating|top\s*rated|best\s*rated|5\s*sao|4\s*sao|5\s*star|4\s*star|uy\s*tín)/i.test(
        t,
      )

    const wantsBasic =
      /(cơ\s*bản|beginner|newbie|starter|mới\s*bắt\s*đầu|nhập\s*môn|foundation|basics)/i.test(t)

    const wantsPractical =
      /(thực\s*chiến|project|dự\s*án|đi\s*làm|job|portfolio|case\s*study|hands[\s-]*on|practical|real[\s-]*world)/i.test(
        t,
      )

    let maxPrice: number | null = null
    const m =
      t.match(/(dưới|<=|<|under|below|max)\s*([0-9]{2,})(k|000|\.000)?/i) ||
      t.match(/([0-9]{2,})(k)\s*(or\s*less|max|under|below)/i)

    if (m) {
      const num = Number(m[2] ?? m[1])
      const suffix = (m[3] ?? m[2] ?? '').toString().toLowerCase()
      if (suffix === 'k') maxPrice = num * 1000
      else if (suffix === '000' || suffix === '.000') maxPrice = num * 1000
      else maxPrice = num
    }

    const fields = [
      { key: 'python', regex: /python/ },
      { key: 'nodejs', regex: /(nodejs|node\.js|\bnode\b)/ },
      { key: 'backend', regex: /backend/ },
      { key: 'frontend', regex: /frontend/ },
      { key: 'data', regex: /(data|analytics|analysis|phân\s*tích|dữ\s*liệu|big\s*data)/ },
      { key: 'guitar', regex: /guitar/ },
      { key: 'piano', regex: /piano/ },
    ]
    const field = fields.find((f) => f.regex.test(t))?.key ?? null

    const teacherName = this.parseTeacherName(text)

    return { wantsFree, wantsHighRating, wantsBasic, wantsPractical, maxPrice, field, teacherName }
  }

  private scoreCourse(course: any, userText: string, intent: ReturnType<typeof this.parseUserIntent>) {
    const title = (course.title || '').toLowerCase()
    const desc = ((course.previewDescription || course.description || '') as string).toLowerCase()
    const cat = (course.category?.name || '').toLowerCase()
    const teacher = (course.createdBy?.fullname || '').toLowerCase()
    const text = `${title} ${desc} ${cat} ${teacher}`

    let score = 0

    const kws = (userText || '')
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s]/gu, ' ')
      .split(/\s+/)
      .filter((w) => w.length >= 2)
      .slice(0, 12)

    for (const kw of kws) {
      if (title.includes(kw)) score += 6
      else if (cat.includes(kw)) score += 4
      else if (text.includes(kw)) score += 2
    }

    // free / price
    if (intent.wantsFree) score += course.isFree ? 50 : -10
    if (intent.maxPrice != null) {
      const p = Number(course.price ?? 0)
      score += p <= intent.maxPrice ? 15 : -15
    }

    // rating
    const rating = Number(course.rating ?? 0)
    score += intent.wantsHighRating ? rating * 10 : rating * 2

    // basic/practical
    const isBasicLike =
      /(cơ bản|beginner|nhập môn|foundation|basics|starter)/i.test(course.title) ||
      /(cơ bản|beginner|nhập môn|foundation|basics)/i.test(desc)

    const isPracticalLike =
      /(thực chiến|project|dự án|job|portfolio|case study|hands-on|practical|real-world)/i.test(
        course.title,
      ) ||
      /(thực chiến|project|dự án|portfolio|hands-on|practical|real-world)/i.test(desc)

    if (intent.wantsBasic) score += isBasicLike ? 25 : -2
    if (intent.wantsPractical) score += isPracticalLike ? 25 : -2

    // field boost
    if (intent.field && text.includes(intent.field)) score += 20

    // featured
    if (course.isFeatured) score += 5

    // teacher boost if user asked teacher explicitly
    if (intent.teacherName) {
      const want = this.stripAccents(intent.teacherName).toLowerCase()
      const have = this.stripAccents(teacher).toLowerCase()
      if (have.includes(want)) score += 60
    }

    return score
  }

  private rerankCourses(courses: any[], userText: string) {
    const intent = this.parseUserIntent(userText)

    const kws = (userText || '')
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s]/gu, ' ')
      .split(/\s+/)
      .filter((w) => w.length >= 2)
      .slice(0, 12)

    let anyHit = 0
    for (const c of courses) {
      const title = (c.title || '').toLowerCase()
      const desc = ((c.previewDescription || c.description || '') as string).toLowerCase()
      const cat = (c.category?.name || '').toLowerCase()
      const teacher = (c.createdBy?.fullname || '').toLowerCase()
      const text = `${title} ${desc} ${cat} ${teacher}`

      if (kws.some((k) => text.includes(k))) {
        anyHit = 1
        break
      }
    }

    const scored = courses.map((c) => ({ c, s: this.scoreCourse(c, userText, intent) }))
    scored.sort((a, b) => b.s - a.s)

    const bestScore = scored[0]?.s ?? -999
    return { intent, ranked: scored.map((x) => x.c), bestScore, anyHit }
  }

  private buildCourseContext(courses: any[]) {
    return courses.map((c) => ({
      id: c.id,
      title: c.title,
      description: c.previewDescription || c.description || '',
      isFree: c.isFree,
      price: Number(c.price ?? 0),
      rating: c.rating ?? 0,
      category: c.category?.name ?? null,
      teacher: c.createdBy?.fullname ?? null,
      isFeatured: c.isFeatured ?? false,
      isPreorder: c.isPreorder ?? false,
    }))
  }

  private buildHistoryForModel(rows: { senderId: number | null; content: string }[], userId: number) {
    return rows.map((m) => ({
      role: m.senderId === userId ? 'user' : 'model',
      parts: [{ text: m.content }],
    }))
  }

  private safeParseJson(rawText: string) {
    const cleaned = (rawText || '').replace(/```json/gi, '').replace(/```/g, '').trim()
    try {
      return JSON.parse(cleaned)
    } catch {
      const m = cleaned.match(/\{[\s\S]*\}/)
      if (m) {
        try {
          return JSON.parse(m[0])
        } catch {}
      }
      return null
    }
  }

  // ====== Public APIs ======
  async start(userId: number) {
    const conv = await this.repo.createConversationForUser(userId)

    const welcomeText =
      "Hi 👋 I can help you pick the right course. What's your goal (get a job / switch career / build a project)?"

    const welcome = await this.repo.createMessage(conv.id, null, welcomeText)
    return { conversationId: conv.id, welcomeMessage: welcome }
  }

  async listMessages(conversationId: number, userId: number, take = 20, before?: string) {
    await this.repo.ensureParticipant(conversationId, userId)
    const safeTake = Math.min(Math.max(Number(take) || 20, 1), 50)
    return this.repo.listMessages(conversationId, safeTake, before)
  }

  async chat(conversationId: number, userId: number, message: string) {
    if (!message || !message.trim()) throw new BadRequestException('Message is empty')
    await this.repo.ensureParticipant(conversationId, userId)

    const cleanMsg = message.trim()

    // 1) save user message first (memory)
    const userMsg = await this.repo.createMessage(conversationId, userId, cleanMsg)

    // 2) get recent history
    const history = await this.repo.getRecentMessages(conversationId, 12)

    // META
    if (this.isMetaMessage(cleanMsg)) {
      const lastBot = [...history].reverse().find((m) => m.senderId === null)?.content
      const replyText = lastBot
        ? `My last question was: "${lastBot}". Could you answer these two quickly: (1) your goal and (2) your current level?`
        : `Could you tell me (1) your learning goal and (2) your current level (beginner / basic / intermediate)?`

      const botMsg = await this.repo.createMessage(conversationId, null, replyText)
      return { reply: replyText, recommendedCourses: [], messages: [userMsg, botMsg] }
    }

    // ✅ TEACHER INTENT FIRST (fix English "Mr. X's courses")
    const intent0 = this.parseUserIntent(cleanMsg)
    if (intent0.teacherName) {
      const teacherKey = this.stripAccents(intent0.teacherName).toLowerCase()
      const byTeacher = await this.repo.findCoursesByTeacherLoose(teacherKey, 20)

      if (byTeacher.length > 0) {
        const replyText = `I found ${byTeacher.length} course(s) taught by ${intent0.teacherName}.`
        const botMsg = await this.repo.createMessage(conversationId, null, replyText)

        await this.repo.saveRecommendations(
          botMsg.id,
          byTeacher.slice(0, 6).map((c) => c.id),
        )

        return {
          reply: replyText,
          recommendedCourses: byTeacher.slice(0, 6).map((c) => this.repo.toRecommended(c)),
          messages: [
            userMsg,
            { ...botMsg, recommendedCourses: byTeacher.slice(0, 6).map((c) => this.repo.toRecommended(c)) },
          ],
        }
      }
      // if teacher detected but none found -> continue normal flow (Gemini will ask follow-up)
    }

    // 3) search candidates in DB (keyword)
    let candidates: any[] = []
    try {
      candidates = await this.repo.searchApprovedCoursesSmart(cleanMsg, 12)
    } catch (e: any) {
      this.logger.error(`searchApprovedCoursesSmart failed: ${e?.message}`)
      candidates = []
    }

    const { intent, ranked, bestScore, anyHit } = this.rerankCourses(candidates, cleanMsg)

    this.logger.log(
      `Intent=${JSON.stringify(intent)} candidates=${candidates.length} anyHit=${anyHit} bestScore=${bestScore}`,
    )

    const isRelevant = anyHit === 1 && bestScore >= this.MIN_BEST_SCORE

    const topForContext = isRelevant ? ranked.slice(0, 10) : []
    const courseContext = this.buildCourseContext(topForContext)

    const system = `
You are a course recommendation assistant for an e-learning platform.

RULES:
- Use ONLY courses from COURSE_CONTEXT. Do NOT invent courses.
- If COURSE_CONTEXT is empty: ask at most 2 short questions (goal + level). Do NOT recommend courses.
- If COURSE_CONTEXT has enough info: recommend 1-3 courses with short reasons, then ask 1 follow-up question.
- Keep the conversation consistent with HISTORY, natural chat tone.
- Respond in English. Keep it concise. Use bullets when listing.

OUTPUT MUST BE PURE JSON (no markdown, no \`\`\`):
{
  "reply": "string",
  "recommendedCourseIds": number[]
}
`.trim()

    const prompt = `
HISTORY:
${history.map((h) => `${h.senderId === null ? 'BOT' : 'USER'}: ${h.content}`).join('\n')}

COURSE_CONTEXT:
${JSON.stringify(courseContext)}

USER_MESSAGE:
${cleanMsg}
`.trim()

    if (!this.apiKey) {
      this.logger.error('GEMINI_API_KEY missing => cannot call Gemini')
      throw new InternalServerErrorException('Missing GEMINI_API_KEY')
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/${this.model}:generateContent?key=${this.apiKey}`

    // 4) call gemini
    let rawText = ''
    try {
      const contents = [
        ...this.buildHistoryForModel(
          history.map((h) => ({ senderId: h.senderId, content: h.content })),
          userId,
        ),
        { role: 'user', parts: [{ text: system + '\n\n' + prompt }] },
      ]

      const resp = await axios.post(
        url,
        {
          contents,
          generationConfig: {
            temperature: 0.6,
            maxOutputTokens: 700,
            responseMimeType: 'application/json',
          },
        },
        { timeout: 20000 },
      )

      rawText = resp?.data?.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
    } catch (e: any) {
      this.logger.error(`Gemini request failed: status=${e?.response?.status} message=${e?.message}`)
      if (e?.response?.data) this.logger.error(`Gemini error data: ${JSON.stringify(e.response.data)}`)
      throw new InternalServerErrorException('Gemini request failed')
    }

    // 5) parse output
    const parsed = this.safeParseJson(rawText)

    const replyText =
      parsed?.reply ||
      (isRelevant
        ? 'I found a few courses that match. Do you prefer a beginner-friendly track or a hands-on, job-ready approach?'
        : 'What topic do you want to learn, and what is your current level (beginner / basic / intermediate)?')

    const ids = new Set<number>((parsed?.recommendedCourseIds || []).slice(0, 3))

    const recommended =
      topForContext.length === 0
        ? []
        : ids.size > 0
          ? topForContext
              .filter((c) => ids.has(c.id))
              .slice(0, 3)
              .map((c) => this.repo.toRecommended(c))
          : topForContext.slice(0, 3).map((c) => this.repo.toRecommended(c))

    // 6) save bot message
    const botMsg = await this.repo.createMessage(conversationId, null, replyText)

    await this.repo.saveRecommendations(
      botMsg.id,
      recommended.map((c) => c.id),
    )

    return {
      reply: replyText,
      recommendedCourses: recommended,
      messages: [userMsg, { ...botMsg, recommendedCourses: recommended }],
    }
  }

  async listConversations(userId: number, take = 20, cursor?: number) {
    return this.repo.listChatbotConversations(userId, take, cursor)
  }
}
