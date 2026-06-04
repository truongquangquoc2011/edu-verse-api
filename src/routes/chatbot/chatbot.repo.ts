import { Injectable, ForbiddenException } from '@nestjs/common'
import { PrismaService } from 'src/shared/services/prisma.service'
import { CourseStatus, ConversationType, ParticipantRole, MessageType, Prisma } from '@prisma/client'

@Injectable()
export class ChatbotRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createConversationForUser(userId: number) {
    return this.prisma.conversation.create({
      data: {
        type: ConversationType.CHATBOT,
        isActive: true,
        participants: {
          create: {
            userId,
            role: ParticipantRole.MEMBER,
            isActive: true,
          },
        },
      },
      select: { id: true },
    })
  }

  async ensureParticipant(conversationId: number, userId: number) {
    const p = await this.prisma.conversationParticipant.findUnique({
      where: { conversationId_userId: { conversationId, userId } },
      select: { id: true, isActive: true },
    })
    if (!p || !p.isActive) throw new ForbiddenException('Not a participant')
    return p
  }

  async createMessage(conversationId: number, senderId: number | null, content: string) {
    return this.prisma.message.create({
      data: {
        conversationId,
        senderId, // null = BOT
        content,
        messageType: MessageType.TEXT,
      },
      select: { id: true, senderId: true, content: true, sentAt: true },
    })
  }
  private stripAccents(s: string) {
    return (s || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'D')
  }
  async findCoursesByTeacherLoose(teacherNameNoAccent: string, take = 20) {
    const rows = await this.prisma.course.findMany({
      where: {
        isDelete: false,
        status: CourseStatus.Approved,
      },
      take: 200, // read wide, filter in-memory
      orderBy: [{ isFeatured: 'desc' }, { rating: 'desc' }, { createdAt: 'desc' }],
      select: {
        id: true,
        title: true,
        description: true,
        previewDescription: true,
        isFree: true,
        price: true,
        rating: true,
        isFeatured: true,
        isPreorder: true,
        thumbnail: true,
        category: { select: { name: true } },
        createdBy: { select: { fullname: true } },
      },
    })

    const key = this.stripAccents(teacherNameNoAccent).toLowerCase()

    return rows
      .filter((c) => {
        const fullname = this.stripAccents(c.createdBy?.fullname || '').toLowerCase()
        return fullname.includes(key)
      })
      .slice(0, Math.min(Math.max(take, 1), 50))
  }

  async listMessages(conversationId: number, take: number, before?: string) {
    const where: Prisma.MessageWhereInput = {
      conversationId,
      isDeleted: false,
      ...(before ? { sentAt: { lt: new Date(before) } } : {}),
    }

    const messages = await this.prisma.message.findMany({
      where,
      orderBy: { sentAt: 'desc' },
      take,
      include: {
        recommendations: {
          orderBy: { rank: 'asc' },
          include: {
            course: {
              select: {
                id: true,
                title: true,
                thumbnail: true,
                isFree: true,
                price: true,
                rating: true,
                isFeatured: true,
                category: { select: { name: true } },
                createdBy: { select: { fullname: true } },
              },
            },
          },
        },
      },
    })

    const items = [...messages].reverse().map((m) => ({
      id: m.id,
      senderId: m.senderId,
      content: m.content,
      sentAt: m.sentAt,
      recommendedCourses: (m.recommendations || []).map((r) => this.toRecommended(r.course)),
    }))

    const nextBefore = messages.length === take ? messages[messages.length - 1].sentAt.toISOString() : null

    return { items, nextBefore }
  }

  async getRecentMessages(conversationId: number, limit = 12) {
    const rows = await this.prisma.message.findMany({
      where: { conversationId, isDeleted: false },
      orderBy: { sentAt: 'desc' },
      take: limit,
      select: { senderId: true, content: true, sentAt: true },
    })
    return rows.reverse()
  }

  // ===== SMART SEARCH (NO VECTOR, DEMO FRIENDLY) =====

  private normalizeText(s: string) {
    return (s || '')
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s]/gu, ' ')
      .replace(/\s+/g, ' ')
      .trim()
  }
  private stripVietnameseAccents(str: string) {
    // convert "Quốc" -> "Quoc"
    return (str || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'D')
  }

  private expandQueryAliases(q: string) {
    let s = this.normalizeText(q)
    const noAccent = this.normalizeText(this.stripVietnameseAccents(q))

    // Add both original + no-accent so "Quoc" can match "Quốc"
    // Also expand a few English -> Vietnamese hints (cheap but effective)
    const aliasPairs: Array<[RegExp, string]> = [
      [/\bmr\b|\bmister\b/g, ' thay '],
      [/\bms\b|\bmrs\b|\bmiss\b/g, ' co '],
      [/\bteacher\b|\binstructor\b|\bmentor\b/g, ' giang vien thay co '],
      [/\bfree\b|\bno cost\b|\b0\b/g, ' mien phi '],
      [/\brating\b|\bstars?\b/g, ' danh gia sao rating '],
      [/\bbeginner\b|\bbasic\b|\bfoundation\b/g, ' co ban nhap mon beginner '],
      [/\bpractical\b|\bproject\b|\bportfolio\b/g, ' thuc chien du an portfolio '],
    ]

    for (const [re, add] of aliasPairs) {
      if (re.test(s)) s = s.replace(re, ` ${add} `)
      if (re.test(noAccent)) s = s + ` ${add} `
    }

    // return merged query text
    return `${s} ${noAccent}`.replace(/\s+/g, ' ').trim()
  }

  private extractKeywords(q: string) {
    const stop = new Set([
      // vi
      'tôi',
      'mình',
      'tao',
      'tớ',
      'bạn',
      'anh',
      'chị',
      'em',
      'cho',
      'xin',
      'lấy',
      'tìm',
      'cần',
      'muốn',
      'học',
      'khóa',
      'khoá',
      'course',
      'về',
      'liên',
      'quan',
      'nào',
      'đi',
      'làm',
      'để',
      'với',
      'và',
      'hoặc',
      'có',
      'không',
      'nhé',
      'ạ',
      'giúp',
      'giùm',
      'vậy',
      'thì',
      'một',
      'cái',
      'các',
      'những',
      'toàn',
      'bộ',
      'được',
      'đang',
      'sẽ',
      'nha',
      'ơi',

      // en
      'the',
      'a',
      'an',
      'to',
      'for',
      'and',
      'or',
      'of',
      'in',
      'on',
      'at',
      'is',
      'are',
      'am',
      'be',
      'been',
      'being',
      'i',
      'you',
      'me',
      'my',
      'your',
      'we',
      'us',
      'our',
      'this',
      'that',
      'these',
      'those',
      'with',
      'about',
      'want',
      'need',
      'learn',
      'learning',
      'course',
      'courses',
      'please',
      'help',
      'find',
      'search',
      'send',
      'show',
      'give',
      'me',
      'my',
      'please',
      'pls',
      'course',
      'courses',
      'class',
      'classes',
      'mr',
      'mrs',
      'ms',
      'dr',
      'teacher',
      'instructor',
      'by',
      'of',
      'from',
      'all',
    ])

    const norm = this.normalizeText(q)
    const parts = norm.split(' ').filter(Boolean)

    // keywords length >= 2 and not stopword
    const keywords = parts.filter((w) => w.length >= 2 && !stop.has(w))

    // unique + limit 8 to keep query light
    const uniq: string[] = []
    for (const k of keywords) {
      if (!uniq.includes(k)) uniq.push(k)
      if (uniq.length >= 8) break
    }
    return uniq
  }

  async searchApprovedCoursesSmart(q: string, take = 12) {
    const expanded = this.expandQueryAliases(q)
    const keywords = this.extractKeywords(expanded)

    const or: Prisma.CourseWhereInput[] = []
    for (const kw of keywords) {
      or.push(
        { title: { contains: kw, mode: 'insensitive' } },
        { description: { contains: kw, mode: 'insensitive' } },
        { previewDescription: { contains: kw, mode: 'insensitive' } },
        { category: { name: { contains: kw, mode: 'insensitive' } } },
        { createdBy: { fullname: { contains: kw, mode: 'insensitive' } } },
      )
    }

    const qNorm = this.normalizeText(expanded)
    if (qNorm.length > 0 && qNorm.length <= 40) {
      or.push(
        { title: { contains: qNorm, mode: 'insensitive' } },
        { description: { contains: qNorm, mode: 'insensitive' } },
        { previewDescription: { contains: qNorm, mode: 'insensitive' } },
      )
    }

    const baseWhere: Prisma.CourseWhereInput = {
      isDelete: false,
      status: CourseStatus.Approved,
    }

    const main = await this.prisma.course.findMany({
      where: { ...baseWhere, ...(or.length ? { OR: or } : {}) },
      take,
      orderBy: [{ isFeatured: 'desc' }, { rating: 'desc' }, { createdAt: 'desc' }],
      select: {
        id: true,
        title: true,
        description: true,
        previewDescription: true,
        isFree: true,
        price: true,
        rating: true,
        isFeatured: true,
        isPreorder: true,
        thumbnail: true,
        category: { select: { name: true } },
        createdBy: { select: { fullname: true } },
      },
    })

    // if too few => pull "wide candidates" for service to re-rank
    if (main.length < Math.min(5, take)) {
      const wide = await this.prisma.course.findMany({
        where: baseWhere,
        take: 30,
        orderBy: [{ isFeatured: 'desc' }, { rating: 'desc' }, { createdAt: 'desc' }],
        select: {
          id: true,
          title: true,
          description: true,
          previewDescription: true,
          isFree: true,
          price: true,
          rating: true,
          isFeatured: true,
          isPreorder: true,
          thumbnail: true,
          category: { select: { name: true } },
          createdBy: { select: { fullname: true } },
        },
      })

      const map = new Map<number, any>()
      for (const c of [...main, ...wide]) map.set(c.id, c)
      return Array.from(map.values()).slice(0, 30)
    }

    return main
  }

  toRecommended(c: any) {
    return {
      id: c.id,
      title: c.title,
      thumbnail: c.thumbnail ?? null,
      isFree: !!c.isFree,
      price: Number(c.price ?? 0),
      rating: c.rating ?? 0,
      category: c.category?.name ?? null,
      teacher: c.createdBy?.fullname ?? null,
      isFeatured: !!c.isFeatured,
    }
  }

  async listChatbotConversations(userId: number, take = 20, cursor?: number) {
    // cursor = conversationId pagination (fetch where id < cursor)
    const where: Prisma.ConversationWhereInput = {
      type: ConversationType.CHATBOT,
      isActive: true,
      participants: {
        some: {
          userId,
          isActive: true,
        },
      },
      ...(cursor ? { id: { lt: cursor } } : {}),
    }

    const rows = await this.prisma.conversation.findMany({
      where,
      orderBy: { id: 'desc' },
      take: Math.min(Math.max(take, 1), 50),
      select: {
        id: true,
        title: true,
        updatedAt: true,
        createdAt: true,
        messages: {
          where: { isDeleted: false },
          orderBy: { sentAt: 'desc' },
          take: 1,
          select: {
            id: true,
            senderId: true,
            content: true,
            sentAt: true,
          },
        },
      },
    })

    const items = rows.map((c) => ({
      id: c.id,
      title: c.title ?? 'Course Assistant',
      updatedAt: c.updatedAt,
      createdAt: c.createdAt,
      lastMessage: c.messages[0] ?? null,
    }))

    const nextCursor = items.length === take ? items[items.length - 1].id : null
    return { items, nextCursor }
  }

  async saveRecommendations(messageId: number, courseIds: number[]) {
    const ids = (courseIds || []).filter(Boolean)
    if (!ids.length) return

    await this.prisma.messageCourseRecommendation.createMany({
      data: ids.map((courseId, idx) => ({
        messageId,
        courseId,
        rank: idx,
      })),
      skipDuplicates: true,
    })
  }
}
