import { Injectable, Logger } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { PrismaService } from 'src/shared/services/prisma.service'
import { ValidationService } from 'src/shared/services/validation.service'
import { PaginationQueryType } from 'src/shared/models/pagination.model'

import { LessonNotFoundOrForbiddenException } from 'src/shared/constants/lesson-error.constant'
import {
  QuizNotFoundOrForbiddenException,
  QuizQuestionNotFoundOrForbiddenException,
} from 'src/shared/constants/quiz-error.constant'
import {
  QuizAttemptNotFoundOrForbiddenException,
  QuizAttemptAlreadySubmittedException,
  QuizAnswerInvalidException,
} from 'src/shared/constants/quiz-attempt-error.constant'

import {
  QuizAttemptQuestionsResType,
  QuizAttemptResType,
  ListQuizAttemptResType,
  SaveQuizAnswerType,
  QuizAttemptFullResType,
  SubmitQuizAttemptResType,
} from './quiz.model'

/** ----- Public fields selection for attempts ----- */
const ATTEMPT_PUBLIC_SELECT = {
  id: true,
  quizId: true,
  userId: true,
  score: true,
  completedAt: true,
  createdAt: true,
  updatedAt: true,
} as const

export interface AttemptContext {
  userId: number
  courseId?: number
  moduleId?: number
  lessonId?: number
  quizId?: number
  attemptId?: number
  questionId?: number
  answerOptionId?: number
}

@Injectable()
export class QuizAttemptRepository {
  private readonly logger = new Logger(QuizAttemptRepository.name)
  constructor(
    private readonly prisma: PrismaService,
    private readonly validation: ValidationService,
  ) {}

  /**
   * Ensures the user owns the referenced lesson or quiz in the route path.
   * @param ctx - Request context with path IDs.
   * @param entity - Entity type to validate.
   * @returns Void if validation passes.
   * @example await (repo as any).assertOwnership({ userId: 1, courseId: 10, moduleId: 20, lessonId: 30, quizId: 40 }, 'quiz');
   */
  private async assertOwnership(ctx: AttemptContext, entity: 'lesson' | 'quiz'): Promise<void> {
    const { userId, courseId, moduleId, lessonId, quizId } = ctx
    await this.validation.validateUserStatus(userId)

    if (entity === 'lesson') {
      const lesson = await this.prisma.lesson.findFirst({
        where: {
          id: lessonId,
          deletedAt: null,
          chapterId: moduleId,
          module: {
            id: moduleId,
            isDelete: false,
            course: { id: courseId, createdById: userId, isDelete: false },
          },
        },
        select: { id: true },
      })
      if (!lesson) throw LessonNotFoundOrForbiddenException
    }

    if (entity === 'quiz') {
      const quiz = await this.prisma.quizz.findFirst({
        where: {
          id: quizId,
          lessonId,
          lesson: {
            id: lessonId,
            deletedAt: null,
            chapterId: moduleId,
            module: {
              id: moduleId,
              isDelete: false,
              course: { id: courseId, createdById: userId, isDelete: false },
            },
          },
        },
        select: { id: true },
      })
      if (!quiz) throw QuizNotFoundOrForbiddenException
    }
  }

  /**
   * Fetches an attempt and ensures it belongs to the given user.
   * @param attemptId - Attempt ID.
   * @param currentUserId - Current user ID.
   * @param tx - Optional transaction client.
   * @returns Minimal attempt info.
   * @example await (repo as any).getAttemptOrThrow(22, 1);
   */
  private async getAttemptOrThrow(attemptId: number, currentUserId: number, tx?: Prisma.TransactionClient) {
    const db = tx ?? this.prisma
    const attempt = await db.quizAttempt.findUnique({
      where: { id: attemptId },
      select: { id: true, userId: true, quizId: true, completedAt: true },
    })
    if (!attempt) throw QuizAttemptNotFoundOrForbiddenException
    if (attempt.userId !== currentUserId) throw QuizAttemptNotFoundOrForbiddenException
    return attempt
  }

  /**
   * Ensures the attempt in the URL belongs to the correct course/module/lesson/quiz chain.
   * @param ctx - Request context with path IDs.
   * @returns The validated attempt row.
   * @example await (repo as any).assertAttemptLocatedInPath({ userId: 1, courseId: 10, moduleId: 20, lessonId: 30, quizId: 40, attemptId: 22 });
   */
  private async assertAttemptLocatedInPath(ctx: AttemptContext) {
    const { attemptId, userId, courseId, moduleId, lessonId } = ctx
    if (!attemptId) throw QuizAttemptNotFoundOrForbiddenException

    // Attempt must exist and belong to the current user
    const attempt = await this.getAttemptOrThrow(attemptId, userId)

    // Cross-check hierarchical chain (lesson-level quiz)
    const ok = await this.prisma.quizz.findFirst({
      where: {
        id: attempt.quizId, // attempt belongs to this quiz
        lessonId,
        lesson: {
          id: lessonId,
          deletedAt: null,
          chapterId: moduleId,
          module: {
            id: moduleId,
            isDelete: false,
            course: { id: courseId, isDelete: false },
          },
        },
      },
      select: { id: true },
    })

    if (!ok) throw QuizNotFoundOrForbiddenException
    return attempt
  }

  /**
   * Validates that the selected answer option is bound to the question and attempt's quiz.
   * @param tx - Transaction client.
   * @param args - Attempt/question/option identifiers.
   * @returns Void if validation passes.
   * @example await (repo as any).validateAnswerBinding(tx, { attemptId: 22, questionId: 5, answerOptionId: 12 });
   */
  private async validateAnswerBinding(
    tx: Prisma.TransactionClient,
    args: { attemptId: number; questionId: number; answerOptionId: number },
  ) {
    const attempt = await tx.quizAttempt.findUnique({ where: { id: args.attemptId } })
    if (!attempt) throw QuizAttemptNotFoundOrForbiddenException

    const question = await tx.quizQuestion.findFirst({
      where: { id: args.questionId, quizId: attempt.quizId, deletedAt: null },
      select: { id: true },
    })
    if (!question) throw QuizQuestionNotFoundOrForbiddenException

    const option = await tx.quizAnswerOption.findFirst({
      where: { id: args.answerOptionId, questionId: args.questionId, deletedAt: null },
      select: { id: true },
    })
    if (!option) throw QuizAnswerInvalidException
  }
  /**
   * Assert that a quiz exists and belongs to the given lesson and course.
   *
   * @param ctx - Attempt context containing course, lesson, and quiz identifiers
   * @returns The existing quiz (selected fields only)
   * @throws QuizNotFoundOrForbiddenException
   */
  private async assertLessonQuizExists(ctx: AttemptContext) {
    const { courseId, lessonId, quizId } = ctx
    if (!courseId || !lessonId || !quizId) throw QuizNotFoundOrForbiddenException

    const quiz = await this.prisma.quizz.findFirst({
      where: {
        id: quizId,
        lessonId,
        isDelete: false,
        lesson: {
          id: lessonId,
          deletedAt: null,
          module: {
            isDelete: false,
            course: { id: courseId, isDelete: false },
          },
        },
      },
      select: { id: true },
    })

    if (!quiz) throw QuizNotFoundOrForbiddenException
    return quiz
  }

  /**
   * Validates that a module-level quiz exists under the given course/module
   * and is not soft deleted.
   *
   * This is used for learner-side module-level attempt flows
   * (no lessonId in the route).
   */
  private async assertModuleQuizExists(ctx: AttemptContext) {
    const { courseId, moduleId, quizId } = ctx
    if (!courseId || !moduleId || !quizId) throw QuizNotFoundOrForbiddenException

    const quiz = await this.prisma.quizz.findFirst({
      where: {
        id: quizId,
        moduleId,
        isDelete: false,
        module: {
          id: moduleId,
          isDelete: false,
          course: {
            id: courseId,
            isDelete: false,
          },
        },
      },
      select: { id: true },
    })

    if (!quiz) throw QuizNotFoundOrForbiddenException
    return quiz
  }

  /**
   * Returns full quiz for a module-level attempt:
   *  - quiz info
   *  - questions
   *  - options (including isCorrect flag) with IDs.
   *
   * Intended for:
   *   GET /courses/:courseId/modules/:moduleId/quizzes/:quizId/attempt
   */
  async getModuleQuizForAttempt(ctx: AttemptContext): Promise<QuizAttemptFullResType> {
    const { userId, courseId, moduleId, quizId } = ctx
    if (!courseId || !moduleId || !quizId) throw QuizNotFoundOrForbiddenException

    await this.validation.validateUserStatus(userId)
    await this.assertModuleQuizExists(ctx)

    const quiz = await this.prisma.quizz.findFirst({
      where: {
        id: quizId,
        moduleId,
        isDelete: false,
      },
      select: {
        id: true,
        title: true,
        description: true,
        quizQuestions: {
          where: { deletedAt: null },
          orderBy: { questionOrder: 'asc' },
          select: {
            id: true,
            content: true,
            explanation: true,
            questionOrder: true,
            quizAnswerOptions: {
              where: { deletedAt: null },
              orderBy: { optionOrder: 'asc' },
              select: {
                id: true,
                content: true,
                isCorrect: true,
                optionOrder: true,
              },
            },
          },
        },
      },
    })

    if (!quiz) throw QuizNotFoundOrForbiddenException

    return {
      quizId: quiz.id,
      title: quiz.title,
      description: quiz.description,
      questions: quiz.quizQuestions.map((q) => ({
        questionId: q.id,
        content: q.content,
        explanation: q.explanation ?? '',
        order: q.questionOrder,
        options: q.quizAnswerOptions.map((o) => ({
          optionId: o.id,
          content: o.content,
          order: o.optionOrder,
          isCorrect: o.isCorrect,
        })),
      })),
    }
  }

  /**
   * Submits all answers for a module-level quiz in a single request.
   *
   * Responsibilities:
   *  - Validate quiz/module/course chain.
   *  - Validate each (questionId, answerOptionId) pair belongs to the quiz.
   *  - Compute score percentage in range [0, 100].
   *  - Create QuizAttempt with final score and completedAt.
   *  - Create QuizUserAnswer rows for each answered question.
   *
   * Intended for:
   *   POST /courses/:courseId/modules/:moduleId/quizzes/:quizId/attempt
   */
  async submitModuleAttempt(
    ctx: AttemptContext,
    payload: { answers: SaveQuizAnswerType[] },
  ): Promise<SubmitQuizAttemptResType> {
    const { userId, courseId, moduleId, quizId } = ctx
    if (!courseId || !moduleId || !quizId) throw QuizNotFoundOrForbiddenException

    await this.validation.validateUserStatus(userId)

    return this.prisma.$transaction(async (tx) => {
      // Ensure module-level quiz exists
      const quiz = await tx.quizz.findFirst({
        where: {
          id: quizId,
          moduleId,
          isDelete: false,
          module: {
            id: moduleId,
            isDelete: false,
            course: {
              id: courseId,
              isDelete: false,
            },
          },
        },
        select: { id: true },
      })

      if (!quiz) throw QuizNotFoundOrForbiddenException

      // Load all non-deleted questions of this quiz
      const questions = await tx.quizQuestion.findMany({
        where: { quizId: quiz.id, deletedAt: null },
        select: { id: true },
      })
      const questionIds = new Set(questions.map((q) => q.id))
      const totalQuestions = questionIds.size

      // Normalize answers: ensure one answer per question (take last occurrence)
      const normalized = new Map<number, number>()
      for (const ans of payload.answers ?? []) {
        normalized.set(ans.questionId, ans.answerOptionId)
      }
      const normalizedAnswers: SaveQuizAnswerType[] = Array.from(normalized.entries()).map(
        ([questionId, answerOptionId]) => ({ questionId, answerOptionId }),
      )

      if (totalQuestions === 0) {
        // No questions: create attempt with 0 score for consistency
        const attempt = await tx.quizAttempt.create({
          data: {
            quizId: quiz.id,
            userId,
            score: new Prisma.Decimal(0),
            completedAt: new Date(),
            createdById: userId,
            updatedById: userId,
          },
          select: ATTEMPT_PUBLIC_SELECT,
        })

        return {
          id: attempt.id,
          quizId: attempt.quizId,
          userId: attempt.userId,
          score: Number(attempt.score),
          completedAt: attempt.completedAt,
          createdAt: attempt.createdAt,
          updatedAt: attempt.updatedAt,
          totalQuestions: 0,
          correctCount: 0,
        }
      }

      // Validate that all answered questions belong to this quiz
      for (const ans of normalizedAnswers) {
        if (!questionIds.has(ans.questionId)) {
          throw QuizQuestionNotFoundOrForbiddenException
        }
      }

      const answerOptionIds = normalizedAnswers.map((a) => a.answerOptionId)

      // Load all candidate options for those questions
      const options = await tx.quizAnswerOption.findMany({
        where: {
          questionId: { in: Array.from(questionIds) },
          id: { in: answerOptionIds },
          deletedAt: null,
        },
        select: {
          id: true,
          questionId: true,
          isCorrect: true,
        },
      })

      const optionById = new Map<number, { id: number; questionId: number; isCorrect: boolean }>()
      for (const o of options) {
        optionById.set(o.id, o)
      }

      // Ensure each (questionId, answerOptionId) pair is valid
      for (const ans of normalizedAnswers) {
        const opt = optionById.get(ans.answerOptionId)
        if (!opt || opt.questionId !== ans.questionId) {
          throw QuizAnswerInvalidException
        }
      }

      // Compute correctCount
      let correctCount = 0
      for (const ans of normalizedAnswers) {
        const opt = optionById.get(ans.answerOptionId)
        if (opt?.isCorrect) {
          correctCount += 1
        }
      }

      // Compute score in [0, 100], rounded to 2 decimals
      let scorePct = 0
      if (totalQuestions > 0) {
        scorePct = Number(((correctCount / totalQuestions) * 100).toFixed(2))
        if (scorePct < 0) scorePct = 0
        if (scorePct > 100) scorePct = 100
      }

      // Create attempt with final score
      const attempt = await tx.quizAttempt.create({
        data: {
          quizId: quiz.id,
          userId,
          score: new Prisma.Decimal(scorePct),
          completedAt: new Date(),
          createdById: userId,
          updatedById: userId,
        },
        select: ATTEMPT_PUBLIC_SELECT,
      })

      // Persist user answers
      if (normalizedAnswers.length > 0) {
        await tx.quizUserAnswer.createMany({
          data: normalizedAnswers.map((ans) => ({
            attemptId: attempt.id,
            questionId: ans.questionId,
            answerOptionId: ans.answerOptionId,
            createdById: userId,
          })),
        })
      }

      return {
        id: attempt.id,
        quizId: attempt.quizId,
        userId: attempt.userId,
        score: Number(attempt.score),
        completedAt: attempt.completedAt,
        createdAt: attempt.createdAt,
        updatedAt: attempt.updatedAt,
        totalQuestions,
        correctCount,
      }
    })
  }

  /**
   * Starts a new attempt (score = 0, completedAt = null).
   * @param ctx - Attempt context (must include quizId and userId).
   * @returns Created attempt.
   * @example await repo.startAttempt({ userId: 1, courseId: 10, moduleId: 20, lessonId: 30, quizId: 40 });
   */
  async startAttempt(ctx: AttemptContext): Promise<QuizAttemptResType> {
    await this.assertOwnership(ctx, 'quiz')

    const created = await this.prisma.quizAttempt.create({
      data: {
        quizId: ctx.quizId!,
        userId: ctx.userId,
        score: new Prisma.Decimal(0),
        completedAt: null,
        createdById: ctx.userId,
      },
      select: ATTEMPT_PUBLIC_SELECT,
    })
    // Cast to response shape
    return {
      ...created,
      score: Number(created.score),
    }
  }

  /**
   * Saves (upserts) one answer for a question in an attempt (only if not submitted).
   * @param ctx - Attempt context (must include attemptId and userId).
   * @param payload - Validated DTO with question/answer IDs.
   * @returns Saved answer ID.
   * @example await repo.saveAnswer({ userId: 1, courseId: 10, moduleId: 20, lessonId: 30, quizId: 40, attemptId: 22 }, { questionId: 5, answerOptionId: 12 });
   */
  async saveAnswer(ctx: AttemptContext, payload: SaveQuizAnswerType): Promise<{ id: number }> {
    const { attemptId, userId } = ctx
    if (!attemptId) throw QuizAttemptNotFoundOrForbiddenException

    // Ensure path validity before writing
    await this.assertAttemptLocatedInPath(ctx)

    return this.prisma.$transaction(async (tx) => {
      const attempt = await this.getAttemptOrThrow(attemptId, userId, tx)
      if (attempt.completedAt) throw QuizAttemptAlreadySubmittedException

      await this.validateAnswerBinding(tx, {
        attemptId,
        questionId: payload.questionId,
        answerOptionId: payload.answerOptionId,
      })

      await tx.quizUserAnswer.deleteMany({ where: { attemptId, questionId: payload.questionId } })
      const saved = await tx.quizUserAnswer.create({
        data: {
          attemptId,
          questionId: payload.questionId,
          answerOptionId: payload.answerOptionId,
          createdById: userId,
        },
        select: { id: true },
      })
      return saved
    })
  }

  /**
   * Submits an attempt: computes score (2 decimals), clamps to [0..100], sets completedAt.
   * @param ctx - Attempt context (must include attemptId and userId).
   * @returns Updated attempt with final score.
   * @example await repo.submitAttempt({ userId: 1, courseId: 10, moduleId: 20, lessonId: 30, quizId: 40, attemptId: 22 });
   */
  async submitAttempt(ctx: AttemptContext): Promise<QuizAttemptResType> {
    const { attemptId, userId } = ctx
    if (!attemptId) throw QuizAttemptNotFoundOrForbiddenException

    // Ensure path validity before submit
    await this.assertAttemptLocatedInPath(ctx)

    const updated = await this.prisma.$transaction(async (tx) => {
      const attempt = await this.getAttemptOrThrow(attemptId, userId, tx)
      if (attempt.completedAt) throw QuizAttemptAlreadySubmittedException

      const totalQuestions = await tx.quizQuestion.count({
        where: { quizId: attempt.quizId, deletedAt: null },
      })

      let pct = 0
      if (totalQuestions > 0) {
        const correctCount = await tx.quizUserAnswer.count({
          where: {
            attemptId: attempt.id,
            deletedAt: null,
            answerOption: { isCorrect: true, deletedAt: null },
          },
        })
        pct = Number(((correctCount / totalQuestions) * 100).toFixed(2))
        if (pct < 0) pct = 0
        if (pct > 100) pct = 100
      }

      const row = await tx.quizAttempt.update({
        where: { id: attempt.id },
        data: { score: new Prisma.Decimal(pct), completedAt: new Date(), updatedById: userId },
        select: ATTEMPT_PUBLIC_SELECT,
      })
      return row
    })

    return { ...updated, score: Number(updated.score) }
  }

  /**
   * Gets the current user's attempt detail.
   * @param ctx - Attempt context (must include attemptId and userId).
   * @returns Attempt detail with public fields.
   * @example await repo.getAttempt({ userId: 1, courseId: 10, moduleId: 20, lessonId: 30, quizId: 40, attemptId: 22 });
   */
  async getAttempt(ctx: AttemptContext): Promise<QuizAttemptResType> {
    const { attemptId, userId } = ctx
    if (!attemptId) throw QuizAttemptNotFoundOrForbiddenException

    // Ensure attempt is under the correct chain path
    await this.assertAttemptLocatedInPath(ctx)

    const row = await this.prisma.quizAttempt.findUnique({
      where: { id: attemptId },
      select: ATTEMPT_PUBLIC_SELECT,
    })
    if (!row || row.userId !== userId) throw QuizAttemptNotFoundOrForbiddenException

    return { ...row, score: Number(row.score) }
  }

  /**
   * Lists attempts of a quiz (controller/service should enforce teacher/admin guard).
   * @param ctx - Attempt context (must include quizId).
   * @param query - Pagination options.
   * @returns Paginated list of attempts.
   * @example await repo.listAttemptsByQuiz({ userId: 1, courseId: 10, moduleId: 20, lessonId: 30, quizId: 40 }, { skip: 0, take: 10 });
   */
  async listAttemptsByQuiz(ctx: AttemptContext, query: PaginationQueryType): Promise<ListQuizAttemptResType> {
    await this.assertOwnership(ctx, 'quiz')

    const where: Prisma.QuizAttemptWhereInput = {
      quizId: ctx.quizId!,
      isDelete: false,
    }

    const [items, total] = await Promise.all([
      this.prisma.quizAttempt.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: query.skip,
        take: query.take,
        select: ATTEMPT_PUBLIC_SELECT,
      }),
      this.prisma.quizAttempt.count({ where }),
    ])

    return {
      items: items.map((a) => ({ ...a, score: Number(a.score) })),
      total,
      skip: query.skip,
      take: query.take,
    }
  }

  /**
   * Gets questions and selected answers for an attempt (useful for resuming UI).
   * @param ctx - Attempt context (must include attemptId and userId).
   * @returns Array of question items with the selected answer (if any).
   * @example await repo.getAttemptQuestions({ userId: 1, courseId: 10, moduleId: 20, lessonId: 30, quizId: 40, attemptId: 22 });
   */
  async getAttemptQuestions(ctx: AttemptContext): Promise<QuizAttemptQuestionsResType['items']> {
    const { attemptId } = ctx
    if (!attemptId) throw QuizAttemptNotFoundOrForbiddenException

    // Validate chain path
    const attempt = await this.assertAttemptLocatedInPath(ctx)

    const questions = await this.prisma.quizQuestion.findMany({
      where: { quizId: attempt.quizId, deletedAt: null },
      orderBy: { questionOrder: 'asc' },
      select: {
        id: true,
        content: true,
        explanation: true,
        questionOrder: true,
        quizAnswerOptions: {
          where: { deletedAt: null },
          orderBy: { optionOrder: 'asc' },
          select: { id: true, content: true, optionOrder: true },
        },
      },
    })

    const answers = await this.prisma.quizUserAnswer.findMany({
      where: { attemptId, deletedAt: null },
      select: { questionId: true, answerOptionId: true },
    })
    const selected = new Map<number, number>()
    answers.forEach((a) => selected.set(a.questionId, a.answerOptionId))

    return questions.map((q) => ({
      questionId: q.id,
      content: q.content,
      explanation: q.explanation ?? '',
      order: q.questionOrder,
      options: q.quizAnswerOptions.map((o) => ({
        optionId: o.id,
        content: o.content,
        order: o.optionOrder,
      })),
      selectedAnswerOptionId: selected.get(q.id) ?? null,
    }))
  }

  /**
   * Get a lesson quiz (with questions & options) for attempting.
   *
   * - Validates presence of `courseId`, `lessonId`, and `quizId` in attempt context.
   * - Validates user status.
   * - Ensures the quiz belongs to the given lesson/course and is accessible.
   * - Fetches quiz details including:
   *   - Questions (ordered by `questionOrder`, not deleted)
   *   - Answer options (ordered by `optionOrder`, not deleted)
   *
   * @param ctx - Attempt context containing user/course/lesson/quiz identifiers
   * @returns Full quiz attempt payload, typed as `QuizAttemptFullResType`
   * @throws QuizNotFoundOrForbiddenException
   */
  async getLessonQuizForAttempt(ctx: AttemptContext): Promise<QuizAttemptFullResType> {
    const { userId, courseId, lessonId, quizId } = ctx
    if (!courseId || !lessonId || !quizId) throw QuizNotFoundOrForbiddenException

    await this.validation.validateUserStatus(userId)
    await this.assertLessonQuizExists(ctx)

    const quiz = await this.prisma.quizz.findFirst({
      where: {
        id: quizId,
        lessonId,
        isDelete: false,
      },
      select: {
        id: true,
        title: true,
        description: true,
        quizQuestions: {
          where: { deletedAt: null },
          orderBy: { questionOrder: 'asc' },
          select: {
            id: true,
            content: true,
            explanation: true,
            questionOrder: true,
            quizAnswerOptions: {
              where: { deletedAt: null },
              orderBy: { optionOrder: 'asc' },
              select: {
                id: true,
                content: true,
                isCorrect: true,
                optionOrder: true,
              },
            },
          },
        },
      },
    })

    if (!quiz) throw QuizNotFoundOrForbiddenException

    return {
      quizId: quiz.id,
      title: quiz.title,
      description: quiz.description,
      questions: quiz.quizQuestions.map((q) => ({
        questionId: q.id,
        content: q.content,
        explanation: q.explanation ?? '',
        order: q.questionOrder,
        options: q.quizAnswerOptions.map((o) => ({
          optionId: o.id,
          content: o.content,
          order: o.optionOrder,
          isCorrect: o.isCorrect,
        })),
      })),
    }
  }

  /**
 * @param ctx - Attempt context containing user/course/lesson/quiz identifiers
 * @param payload - Submitted answers
 * @returns Attempt result summary, typed as `SubmitQuizAttemptResType`
 * @throws QuizNotFoundOrForbiddenException
 * @throws QuizQuestionNotFoundOrForbiddenException
 * @throws QuizAnswerInvalidException
 */
  async submitLessonAttempt(
    ctx: AttemptContext,
    payload: { answers: SaveQuizAnswerType[] },
  ): Promise<SubmitQuizAttemptResType> {
    const { userId, courseId, lessonId, quizId } = ctx
    if (!courseId || !lessonId || !quizId) throw QuizNotFoundOrForbiddenException

    await this.validation.validateUserStatus(userId)

    return this.prisma.$transaction(async (tx) => {
      const quiz = await tx.quizz.findFirst({
        where: {
          id: quizId,
          lessonId,
          isDelete: false,
          lesson: {
            id: lessonId,
            deletedAt: null,
            module: {
              isDelete: false,
              course: { id: courseId, isDelete: false },
            },
          },
        },
        select: { id: true },
      })

      if (!quiz) throw QuizNotFoundOrForbiddenException

      const questions = await tx.quizQuestion.findMany({
        where: { quizId: quiz.id, deletedAt: null },
        select: { id: true },
      })
      const questionIds = new Set(questions.map((q) => q.id))
      const totalQuestions = questionIds.size

      const normalized = new Map<number, number>()
      for (const ans of payload.answers ?? []) normalized.set(ans.questionId, ans.answerOptionId)
      const normalizedAnswers: SaveQuizAnswerType[] = Array.from(normalized.entries()).map(
        ([questionId, answerOptionId]) => ({
          questionId,
          answerOptionId,
        }),
      )

      if (totalQuestions === 0) {
        const attempt = await tx.quizAttempt.create({
          data: {
            quizId: quiz.id,
            userId,
            score: new Prisma.Decimal(0),
            completedAt: new Date(),
            createdById: userId,
            updatedById: userId,
          },
          select: ATTEMPT_PUBLIC_SELECT,
        })

        return {
          id: attempt.id,
          quizId: attempt.quizId,
          userId: attempt.userId,
          score: Number(attempt.score),
          completedAt: attempt.completedAt,
          createdAt: attempt.createdAt,
          updatedAt: attempt.updatedAt,
          totalQuestions: 0,
          correctCount: 0,
        }
      }

      for (const ans of normalizedAnswers) {
        if (!questionIds.has(ans.questionId)) throw QuizQuestionNotFoundOrForbiddenException
      }

      const answerOptionIds = normalizedAnswers.map((a) => a.answerOptionId)

      const options = await tx.quizAnswerOption.findMany({
        where: {
          questionId: { in: Array.from(questionIds) },
          id: { in: answerOptionIds },
          deletedAt: null,
        },
        select: { id: true, questionId: true, isCorrect: true },
      })

      const optionById = new Map<number, { id: number; questionId: number; isCorrect: boolean }>()
      for (const o of options) optionById.set(o.id, o)

      for (const ans of normalizedAnswers) {
        const opt = optionById.get(ans.answerOptionId)
        if (!opt || opt.questionId !== ans.questionId) throw QuizAnswerInvalidException
      }

      let correctCount = 0
      for (const ans of normalizedAnswers) {
        if (optionById.get(ans.answerOptionId)?.isCorrect) correctCount += 1
      }

      let scorePct = 0
      scorePct = Number(((correctCount / totalQuestions) * 100).toFixed(2))
      if (scorePct < 0) scorePct = 0
      if (scorePct > 100) scorePct = 100

      const attempt = await tx.quizAttempt.create({
        data: {
          quizId: quiz.id,
          userId,
          score: new Prisma.Decimal(scorePct),
          completedAt: new Date(),
          createdById: userId,
          updatedById: userId,
        },
        select: ATTEMPT_PUBLIC_SELECT,
      })

      if (normalizedAnswers.length > 0) {
        await tx.quizUserAnswer.createMany({
          data: normalizedAnswers.map((ans) => ({
            attemptId: attempt.id,
            questionId: ans.questionId,
            answerOptionId: ans.answerOptionId,
            createdById: userId,
          })),
        })
      }

      return {
        id: attempt.id,
        quizId: attempt.quizId,
        userId: attempt.userId,
        score: Number(attempt.score),
        completedAt: attempt.completedAt,
        createdAt: attempt.createdAt,
        updatedAt: attempt.updatedAt,
        totalQuestions,
        correctCount,
      }
    })
  }
}
