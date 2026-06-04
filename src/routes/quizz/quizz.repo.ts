import { Injectable, Logger } from '@nestjs/common'
import { PrismaService } from 'src/shared/services/prisma.service'
import { ValidationService } from 'src/shared/services/validation.service'
import { Prisma } from '@prisma/client'
import {
  CreateQuizType,
  UpdateQuizType,
  QuizResType,
  ListQuizResType,
  CreateQuizQuestionType,
  QuizQuestionResType,
  UpdateQuizQuestionType,
  ListQuizQuestionResType,
  ReorderQuizQuestionType,
  CreateQuizAnswerOptionType,
  QuizAnswerOptionResType,
  ListQuizAnswerOptionResType,
  UpdateQuizAnswerOptionType,
  ReorderQuizAnswerOptionType,
} from './quiz.model'
import { PaginationQueryType } from 'src/shared/models/pagination.model'
import { LessonNotFoundOrForbiddenException } from 'src/shared/constants/lesson-error.constant'
import {
  QuizAnswerOptionNotFoundOrForbiddenException,
  QuizNotFoundOrForbiddenException,
  QuizQuestionNotFoundOrForbiddenException,
} from 'src/shared/constants/quiz-error.constant'
import { QUIZ_ANSWER_OPTION_MESSAGES, QUIZ_MESSAGES } from 'src/shared/constants/quiz-message.constant'
import { QUIZ_PUBLIC_SELECT, QUIZ_QUESTION_PUBLIC_SELECT } from 'src/shared/constants/quiz.select'

import { QUIZ_QUESTION_MESSAGES } from 'src/shared/constants/quiz-question-success.constant'
import { QuizQuestionNotFoundException } from 'src/shared/constants/quiz-question-error.constant'
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library'
import {
  getCurrentOptionOrThrow,
  shiftOrdersOnInsert,
  swapOrMoveOptionOrder,
  enforceSingleChoice,
} from '../../shared/helper/quiz.helper'
/**
 * Shared context object for quiz operations.
 * - quizId is optional (not needed for create/list).
 */
export interface QuizContext {
  userId: number
  courseId: number
  moduleId: number
  lessonId?: number
  quizId?: number
  questionId?: number
  optionId?: number
}

@Injectable()
export class QuizzRepository {
  private readonly logger = new Logger(QuizzRepository.name)

  constructor(
    private readonly prisma: PrismaService,
    private readonly validation: ValidationService,
  ) {}
  private readonly OPTION_PUBLIC_SELECT = {
    id: true,
    questionId: true,
    content: true,
    isCorrect: true,
    optionOrder: true,
    createdAt: true,
    updatedAt: true,
  } as const
  /**
   * Ensures that the given user owns the target entity (lesson or quiz).
   */
  private async assertOwnership(ctx: QuizContext, entityType: 'lesson' | 'quiz' | 'module'): Promise<void> {
    const { userId, courseId, moduleId, lessonId, quizId } = ctx
    await this.validation.validateUserStatus(userId)

    // Verify ownership for a lesson
    if (entityType === 'lesson') {
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

    // Verify ownership for a module (used when quiz belongs to a module directly)
    if (entityType === 'module') {
      const mod = await this.prisma.module.findFirst({
        where: {
          id: moduleId,
          isDelete: false,
          course: { id: courseId, createdById: userId, isDelete: false },
        },
        select: { id: true },
      })
      if (!mod) throw LessonNotFoundOrForbiddenException // Replace with ModuleNotFoundOrForbiddenException if available
    }

    //  Verify ownership for a quiz (quiz can belong either to a lesson or a module)
    if (entityType === 'quiz') {
      const quiz = await this.prisma.quizz.findFirst({
        where: {
          id: quizId,
          // remove deletedAt: null → để nó tìm luôn cả soft-deleted quiz
          OR: [
            // Case 1: Quiz is attached to a lesson
            lessonId
              ? {
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
                }
              : undefined,
            // Case 2: Quiz is attached directly to a module
            {
              module: {
                id: moduleId,
                isDelete: false,
                course: { id: courseId, createdById: userId, isDelete: false },
              },
            },
          ].filter(Boolean) as any,
        },
        select: { id: true },
      })
      if (!quiz) throw QuizNotFoundOrForbiddenException
    }
  }

  private async verifyAccess(ctx: QuizContext): Promise<void> {
    await this.assertOwnership(ctx, 'quiz')
    await this.ensureQuestionInQuiz(ctx)
  }

  private async ensureQuestionInQuiz(ctx: QuizContext) {
    const { quizId, questionId } = ctx
    const found = await this.prisma.quizQuestion.findFirst({
      where: { id: questionId, quizId, deletedAt: null },
      select: { id: true },
    })
    if (!found) throw QuizQuestionNotFoundOrForbiddenException
  }
  /**
   * Creates a new quiz.
   * @param ctx - Quiz context.
   * @param payload - Validated DTO.
   * @returns Created quiz.
   * @example await createQuiz({ userId: 1, lessonId: 10 }, { title: 'New Quiz' });
   */
  async createQuiz(ctx: QuizContext, payload: CreateQuizType): Promise<QuizResType> {
    const isLessonParent = ctx.lessonId != null

    if (isLessonParent) {
      await this.assertOwnership(ctx, 'lesson')
    } else {
      if (ctx.moduleId == null) {
        throw new Error('moduleId is required for module-level quizzes')
      }
      await this.assertOwnership(ctx, 'module')
    }

    return this.prisma.quizz.create({
      data: {
        ...(isLessonParent ? { lessonId: ctx.lessonId! } : { moduleId: ctx.moduleId! }),
        title: payload.title,
        description: payload.description ?? null,
        status: payload.status ?? 'Published',
        createdById: ctx.userId,
      },
      select: QUIZ_PUBLIC_SELECT,
    })
  }

  /**
   * Update an existing quiz.
   */
  async updateQuiz(ctx: QuizContext, payload: UpdateQuizType): Promise<QuizResType> {
    await this.assertOwnership(ctx, 'quiz')

    return this.prisma.quizz.update({
      where: { id: ctx.quizId },
      data: { ...payload, updatedById: ctx.userId },
      select: QUIZ_PUBLIC_SELECT,
    })
  }

  /**
   * Soft delete a quiz (set `deletedAt` instead of removing from DB).
   */
  async softDeleteQuiz(ctx: QuizContext): Promise<{ message: string }> {
    await this.assertOwnership(ctx, 'quiz')

    const updated = await this.prisma.quizz.updateMany({
      where: { id: ctx.quizId, deletedAt: null },
      data: { deletedAt: new Date(), updatedById: ctx.userId },
    })

    if (updated.count === 0) {
      throw QuizNotFoundOrForbiddenException
    }

    return { message: QUIZ_MESSAGES.DELETED }
  }

  /**
   * Restore a soft-deleted quiz (set `deletedAt` to null).
   */
  async restoreQuiz(ctx: QuizContext): Promise<{ message: string }> {
    await this.assertOwnership(ctx, 'quiz')

    const restored = await this.prisma.quizz.updateMany({
      where: { id: ctx.quizId, deletedAt: { not: null } },
      data: { deletedAt: null, updatedById: ctx.userId },
    })

    if (restored.count === 0) {
      throw QuizNotFoundOrForbiddenException
    }

    return { message: QUIZ_MESSAGES.RESTORED }
  }

  /**
   * List quizzes of a lesson with pagination.
   */
  /**
   * Lists quizzes for either a lesson or a module.
   * Supports pagination and unified ownership validation.
   */
  async listQuizzes(ctx: QuizContext, query: PaginationQueryType): Promise<ListQuizResType> {
    const isLessonParent = ctx.lessonId != null

    if (isLessonParent) {
      await this.assertOwnership(ctx, 'lesson')
    } else {
      if (ctx.moduleId == null) {
        throw new Error('moduleId is required for module-level quizzes')
      }
      await this.assertOwnership(ctx, 'module')
    }

    const where: Prisma.QuizzWhereInput = {
      deletedAt: null,
      ...(isLessonParent ? { lessonId: ctx.lessonId! } : { moduleId: ctx.moduleId! }),
    }

    const [items, total] = await Promise.all([
      this.prisma.quizz.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: query.skip,
        take: query.take,
        select: QUIZ_PUBLIC_SELECT,
      }),
      this.prisma.quizz.count({ where }),
    ])

    return { items, total, skip: query.skip, take: query.take }
  }

  // ========== QUIZ QUESTION ==========

  /**
   * Create a new quiz question with the next order number.
   *
   * @param ctx - Quiz context including userId and quizId
   * @param payload - Question content and explanation
   * @returns The created quiz question
   */
  async createQuestion(ctx: QuizContext, payload: CreateQuizQuestionType): Promise<QuizQuestionResType> {
    await this.assertOwnership(ctx, 'quiz')

    // Find the current max order of existing questions
    const maxOrder = await this.prisma.quizQuestion.aggregate({
      where: { quizId: ctx.quizId, deletedAt: null },
      _max: { questionOrder: true },
    })
    const nextOrder = (maxOrder._max.questionOrder ?? 0) + 1

    return this.prisma.quizQuestion.create({
      data: {
        quizId: ctx.quizId!,
        content: payload.content,
        explanation: payload.explanation ?? null,
        questionOrder: nextOrder,
        createdById: ctx.userId,
      },
      select: QUIZ_QUESTION_PUBLIC_SELECT,
    })
  }

  /**
   * Update an existing quiz question.
   *
   * @param ctx - Quiz context
   * @param payload - Partial question fields to update
   * @returns The updated quiz question
   * @throws QuizQuestionNotFoundException if not found
   */
  async updateQuestion(ctx: QuizContext, payload: UpdateQuizQuestionType): Promise<QuizQuestionResType> {
    try {
      await this.assertOwnership(ctx, 'quiz')

      const question = await this.prisma.quizQuestion.update({
        where: { id: ctx.questionId, quizId: ctx.quizId, deletedAt: null },
        data: { ...payload, updatedById: ctx.userId },
        select: QUIZ_QUESTION_PUBLIC_SELECT,
      })

      if (!question) throw QuizQuestionNotFoundException
      return question
    } catch (error) {
      if (error.code === 'P2025') {
        throw QuizQuestionNotFoundException
      }
      throw error
    }
  }

  /**
   * Soft delete a quiz question (set deletedAt).
   *
   * @param ctx - Quiz context
   * @returns Success message
   */
  async deleteQuestion(ctx: QuizContext): Promise<{ message: string }> {
    await this.assertOwnership(ctx, 'quiz')

    const deleted = await this.prisma.quizQuestion.updateMany({
      where: { id: ctx.questionId, quizId: ctx.quizId, deletedAt: null },
      data: { deletedAt: new Date(), updatedById: ctx.userId },
    })

    if (deleted.count === 0) throw QuizQuestionNotFoundException
    return { message: QUIZ_QUESTION_MESSAGES.DELETED }
  }

  /**
   * Restore a soft-deleted quiz question (set deletedAt to null).
   *
   * @param ctx - Quiz context
   * @returns Success message
   */
  async restoreQuestion(ctx: QuizContext): Promise<{ message: string }> {
    await this.assertOwnership(ctx, 'quiz')

    const restored = await this.prisma.quizQuestion.updateMany({
      where: { id: ctx.questionId, quizId: ctx.quizId, deletedAt: { not: null } },
      data: { deletedAt: null, updatedById: ctx.userId },
    })

    if (restored.count === 0) throw QuizQuestionNotFoundException
    return { message: QUIZ_QUESTION_MESSAGES.RESTORED }
  }

  /**
   * List questions of a quiz with pagination.
   *
   * @param ctx - Quiz context
   * @param query - Pagination params { skip, take }
   * @returns Paginated questions
   */
  async listQuestions(ctx: QuizContext, query: PaginationQueryType): Promise<ListQuizQuestionResType> {
    await this.assertOwnership(ctx, 'quiz')

    const where: Prisma.QuizQuestionWhereInput = { quizId: ctx.quizId, deletedAt: null }

    const [items, total] = await Promise.all([
      this.prisma.quizQuestion.findMany({
        where,
        orderBy: { questionOrder: 'asc' }, // Always order questions ascending
        skip: query.skip,
        take: query.take,
        select: QUIZ_QUESTION_PUBLIC_SELECT,
      }),
      this.prisma.quizQuestion.count({ where }),
    ])

    return { items, total, skip: query.skip, take: query.take }
  }

  /**
   * Reorder a quiz question by updating its order value.
   *
   * @param ctx - Quiz context
   * @param payload - Contains new order
   * @returns The updated quiz question
   * @throws QuizQuestionNotFoundException if not found
   */
  async reorderQuestion(ctx: QuizContext, payload: ReorderQuizQuestionType): Promise<QuizQuestionResType> {
    await this.assertOwnership(ctx, 'quiz')

    try {
      await this.prisma.quizQuestion.update({
        where: { id: ctx.questionId },
        data: { questionOrder: payload.newOrder, updatedById: ctx.userId },
      })

      return this.prisma.quizQuestion.findUnique({
        where: { id: ctx.questionId },
        select: QUIZ_QUESTION_PUBLIC_SELECT,
      }) as Promise<QuizQuestionResType>
    } catch (error: any) {
      if (error.code === 'P2025') {
        throw QuizQuestionNotFoundException
      }
      throw error
    }
  }

  // QUIZ ANSWER OPTIONS

  /**
   * Create a new answer option for a quiz question.
   *
   * Automatically shifts existing option orders to avoid duplicates.
   * If `isCorrect` is true, it enforces single-choice behavior (unsets others).
   *
   * @param ctx - Quiz context (user, course, lesson, quiz, question)
   * @param payload - Option data (content, isCorrect, optionOrder)
   * @returns The created quiz answer option
   */
  async createOption(ctx: QuizContext, payload: CreateQuizAnswerOptionType): Promise<QuizAnswerOptionResType> {
    await this.assertOwnership(ctx, 'quiz')
    await this.ensureQuestionInQuiz(ctx)

    try {
      return await this.prisma.$transaction(async (tx) => {
        // Shift orders of existing options to prevent duplicate order numbers
        await shiftOrdersOnInsert(tx, ctx.questionId!, payload.optionOrder)

        const created = await tx.quizAnswerOption.create({
          data: {
            questionId: ctx.questionId!,
            content: payload.content,
            isCorrect: !!payload.isCorrect,
            optionOrder: payload.optionOrder,
            createdById: ctx.userId,
          },
          select: this.OPTION_PUBLIC_SELECT,
        })
        // Enforce single-choice: if this one is true, set others to false
        if (payload.isCorrect) {
          await enforceSingleChoice(tx, ctx.questionId!, created.id)
        }

        // Prisma select ensures typing here already matches QuizAnswerOptionResType
        return created
      })
    } catch (e) {
      if (e instanceof PrismaClientKnownRequestError) {
        if (e.code === 'P2003') throw QuizQuestionNotFoundOrForbiddenException // FK
        if (e.code === 'P2025') throw QuizAnswerOptionNotFoundOrForbiddenException // generic not-found
      }
      throw e
    }
  }

  /**
   * List all answer options for a given quiz question.
   *
   * @param ctx - Quiz context (user, course, lesson, quiz, question)
   * @param query - Pagination params (skip, take)
   * @returns Paginated list of quiz answer options
   */
  async listOptions(ctx: QuizContext, query: PaginationQueryType): Promise<ListQuizAnswerOptionResType> {
    await this.verifyAccess(ctx)

    const where: Prisma.QuizAnswerOptionWhereInput = {
      questionId: ctx.questionId!,
      deletedAt: null,
    }

    const [items, total] = await Promise.all([
      this.prisma.quizAnswerOption.findMany({
        where,
        orderBy: { optionOrder: 'asc' }, // sọt
        skip: query.skip,
        take: query.take,
        select: this.OPTION_PUBLIC_SELECT,
      }),
      this.prisma.quizAnswerOption.count({ where }),
    ])

    return { items, total, skip: query.skip, take: query.take }
  }

  /**
   * Update an existing quiz answer option.
   *
   * Supports partial updates (e.g. content or isCorrect).
   * Enforces single-choice rule if `isCorrect` is changed to true.
   *
   * @param ctx - Quiz context
   * @param payload - Fields to update
   * @returns The updated quiz answer option
   * @throws QuizAnswerOptionNotFoundOrForbiddenException if the option doesn't exist
   */
  async updateOption(ctx: QuizContext, payload: UpdateQuizAnswerOptionType): Promise<QuizAnswerOptionResType> {
    await this.verifyAccess(ctx)

    try {
      return await this.prisma.$transaction(async (tx) => {
        // làm đảm bảo tồn tại
        await getCurrentOptionOrThrow(tx, ctx)

        const updated = await tx.quizAnswerOption.update({
          where: { id: ctx.optionId!, questionId: ctx.questionId!, deletedAt: null },
          data: {
            content: payload.content ?? undefined,
            isCorrect: payload.isCorrect ?? undefined,
            updatedById: ctx.userId,
          },
          select: this.OPTION_PUBLIC_SELECT,
        })

        // Enforce single-choice if this option is now set as correct
        if (payload.isCorrect === true) {
          await enforceSingleChoice(tx, ctx.questionId!, updated.id)
        }

        return updated
      })
    } catch (e) {
      if (e instanceof PrismaClientKnownRequestError) {
        if (e.code === 'P2003') throw QuizQuestionNotFoundOrForbiddenException
        if (e.code === 'P2025') throw QuizAnswerOptionNotFoundOrForbiddenException
      }
      throw e
    }
  }

  /**
   * Reorder an answer option by updating its order number.
   *
   * If the target order already exists, the two options swap places.
   * Otherwise, the option simply moves to the new order.
   *
   * @param ctx - Quiz context
   * @param payload - Contains new option order
   * @returns The updated answer option
   * @throws QuizAnswerOptionNotFoundOrForbiddenException if not found
   */
  async reorderOption(ctx: QuizContext, payload: ReorderQuizAnswerOptionType): Promise<QuizAnswerOptionResType> {
    await this.verifyAccess(ctx)

    try {
      return await this.prisma.$transaction(async (tx) => {
        // Get the current option, ensure it belongs to the correct question & has not been deleted
        const current = await tx.quizAnswerOption.findFirst({
          where: { id: ctx.optionId!, questionId: ctx.questionId!, deletedAt: null },
          select: { id: true, optionOrder: true },
        })

        if (!current) {
          throw QuizAnswerOptionNotFoundOrForbiddenException
        }

        // Swap / move order
        await swapOrMoveOptionOrder(
          tx,
          ctx.questionId!,
          current.id,
          current.optionOrder,
          payload.optionOrder,
          ctx.userId,
        )

        // Retrieve the option after updating to return the new state
        const result = await tx.quizAnswerOption.findUnique({
          where: { id: current.id },
          select: this.OPTION_PUBLIC_SELECT,
        })

        // do vừa findUnique theo id nên chắc chắn tồn tại
        return result as QuizAnswerOptionResType
      })
    } catch (e) {
      if (e instanceof PrismaClientKnownRequestError) {
        if (e.code === 'P2003') throw QuizQuestionNotFoundOrForbiddenException
        if (e.code === 'P2025') throw QuizAnswerOptionNotFoundOrForbiddenException
      }
      throw e
    }
  }

  /**
   * Soft delete an answer option (marks deletedAt, doesn't remove permanently).
   *
   * @param ctx - Quiz context
   * @returns Success message
   * @throws QuizAnswerOptionNotFoundOrForbiddenException if the option doesn't exist
   */
  async deleteOption(ctx: QuizContext): Promise<{ message: string }> {
    await this.verifyAccess(ctx)

    try {
      await this.prisma.quizAnswerOption.update({
        where: { id: ctx.optionId!, questionId: ctx.questionId!, deletedAt: null },
        data: { deletedAt: new Date(), updatedById: ctx.userId },
      })
      return { message: QUIZ_ANSWER_OPTION_MESSAGES.DELETED }
    } catch (e) {
      if (e instanceof PrismaClientKnownRequestError && e.code === 'P2025') {
        // not found
        throw QuizAnswerOptionNotFoundOrForbiddenException
      }
      throw e
    }
  }

  /**
   * Restore a previously soft-deleted answer option.
   *
   * @param ctx - Quiz context
   * @returns Success message
   * @throws QuizAnswerOptionNotFoundOrForbiddenException if the option doesn't exist or is not deleted
   */
  async restoreOption(ctx: QuizContext): Promise<{ message: string }> {
    await this.verifyAccess(ctx)

    const res = await this.prisma.quizAnswerOption.updateMany({
      where: { id: ctx.optionId!, questionId: ctx.questionId!, deletedAt: { not: null } },
      data: { deletedAt: null, updatedById: ctx.userId },
    })
    if (res.count === 0) throw QuizAnswerOptionNotFoundOrForbiddenException

    return { message: QUIZ_ANSWER_OPTION_MESSAGES.RESTORED }
  }
}
