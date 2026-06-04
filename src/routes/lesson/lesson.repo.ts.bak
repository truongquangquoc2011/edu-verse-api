import { BadRequestException, Injectable } from '@nestjs/common'
import { PrismaService } from 'src/shared/services/prisma.service'
import { ValidationService } from 'src/shared/services/validation.service'
import { Prisma } from '@prisma/client'
import { LESSON_MESSAGES } from 'src/shared/constants/lesson-message.constant'
import {
  CreateLessonResType,
  CreateLessonType,
  UpdateLessonType,
  LessonResType,
  ListLessonsResType,
  LessonStudyItemType,
  ListLessonsStudyQueryType,
  ListLessonsStudyResType,
  LessonStudyDetailType,
} from './lesson.model'
import { PaginationQueryType } from 'src/shared/models/pagination.model'
import {
  DuplicateTitlesException,
  LessonNotFoundOrForbiddenException,
  ModuleNotFoundOrForbiddenException,
} from 'src/shared/constants/lesson-error.constant'
import { LESSON_PUBLIC_SELECT } from 'src/shared/constants/lesson.select'
import { Logger } from '@nestjs/common'
import { ERROR_MESSAGE } from 'src/shared/constants/error-message.constant'
import { QuizStatus } from '@prisma/client'
import {
  ListLessonQuizQueryType,
  ListLessonQuizResType,
  LessonQuizItemType,
  LessonQuizResultType,
} from './lesson.model'
// Select shape for STUDY list endpoint
const LESSON_STUDY_LIST_SELECT = {
  id: true,
  title: true,
  lessonOrder: true,
  isPreviewable: true,
}

// Select shape for STUDY detail endpoint
const LESSON_STUDY_DETAIL_SELECT = {
  id: true,
  chapterId: true,
  title: true,
  videoUrl: true,
  documentUrl: true,
  lessonOrder: true,
  isPreviewable: true,
  createdAt: true,
  updatedAt: true,
  module: {
    select: {
      courseId: true,
    },
  },
}

@Injectable()
export class LessonRepository {
  private readonly logger = new Logger(LessonRepository.name)
  constructor(
    private readonly prisma: PrismaService,
    private readonly validation: ValidationService,
  ) {}

  /**
   * Ensures that the given user owns the target module or lesson.
   *
   * - For `module`: verifies the module exists, not deleted, and belongs to the user’s course.
   * - For `lesson`: verifies the lesson exists, not deleted, and belongs to a module owned by the user.
   *
   * @param userId - ID of the authenticated user
   * @param entityId - Target entity ID (moduleId or lessonId)
   * @param entityType - Type of entity to validate ownership for (`module` | `lesson`)
   * @throws ModuleNotFoundOrForbiddenException if the user has no access to the module
   * @throws LessonNotFoundOrForbiddenException if the user has no access to the lesson
   */
  private async assertOwnership(userId: number, entityId: number, entityType: 'module' | 'lesson'): Promise<void> {
    await this.validation.validateUserStatus(userId)

    if (entityType === 'module') {
      const module = await this.prisma.module.findFirst({
        where: {
          id: entityId,
          isDelete: false,
          course: { createdById: userId, isDelete: false },
        },
        select: { id: true },
      })
      if (!module) {
        throw ModuleNotFoundOrForbiddenException
      }
    } else {
      const lesson = await this.prisma.lesson.findFirst({
        where: {
          id: entityId,
          deletedAt: null,
          module: {
            isDelete: false,
            course: { createdById: userId, isDelete: false },
          },
        },
        select: { id: true },
      })
      if (!lesson) {
        throw LessonNotFoundOrForbiddenException
      }
    }
  }

  /**
   * Get the next lesson order number for a module.
   *
   * - Looks up the highest current `lessonOrder` in the module.
   * - Returns that value + 1, or 1 if there are no lessons.
   *
   * @param moduleId - ID of the module
   * @returns Next available lesson order (sequential)
   */
  private async getNextLessonOrder(moduleId: number): Promise<number> {
    const aggregate = await this.prisma.lesson.aggregate({
      where: { chapterId: moduleId, deletedAt: null },
      _max: { lessonOrder: true },
    })
    return (aggregate._max.lessonOrder ?? 0) + 1
  }

  /**
   * Ensures the user is enrolled in the course that owns the given module.
   *
   * Used for client/study endpoints (learner view).
   *
   * @param userId - Current user id
   * @param moduleId - Module id (chapterId)
   * @returns courseId of the module
   * @throws ModuleNotFoundOrForbiddenException if module/course not found
   * @throws BadRequestException if user is not enrolled in the course
   */
  private async ensureUserEnrolledInModuleCourse(userId: number, moduleId: number): Promise<number> {
    await this.validation.validateUserStatus(userId)

    const module = await this.prisma.module.findFirst({
      where: {
        id: moduleId,
        isDelete: false,
        course: { isDelete: false },
      },
      select: {
        id: true,
        courseId: true,
      },
    })

    if (!module) {
      throw ModuleNotFoundOrForbiddenException
    }

    const enrollment = await this.prisma.enrollment.findFirst({
      where: {
        userId,
        courseId: module.courseId,
        isDelete: false,
      },
      select: { id: true },
    })

    if (!enrollment) {
      throw new BadRequestException(ERROR_MESSAGE.COURSE.NOT_ENROLLED)
    }

    return module.courseId
  }

  /**
   * Loads a completion set (lessonId) for the given user and module.
   *
   * @param userId - Current user id
   * @param moduleId - Module id (chapterId)
   */
  private async getCompletionSetForModule(userId: number, moduleId: number): Promise<Set<number>> {
    const completions = await this.prisma.lessonCompletion.findMany({
      where: {
        userId,
        isDelete: false,
        lesson: {
          chapterId: moduleId,
          deletedAt: null,
        },
      },
      select: {
        lessonId: true,
      },
    })

    return new Set<number>(completions.map((c) => c.lessonId))
  }

  /**
   * Maps a raw lesson record into a LessonStudyItemType with completion flag.
   */
  private mapLessonToStudyItem(
    lesson: Prisma.LessonGetPayload<{ select: typeof LESSON_STUDY_LIST_SELECT }>,
    completedSet: Set<number>,
  ): LessonStudyItemType {
    return {
      id: lesson.id,
      title: lesson.title,
      lessonOrder: lesson.lessonOrder,
      isPreviewable: lesson.isPreviewable,
      isCompleted: completedSet.has(lesson.id),
    }
  }

  /**
   * Validates enrollment and fetches a lesson with its courseId for study detail.
   *
   * @param userId - Current user id
   * @param lessonId - Lesson id
   */
  private async getLessonWithCourseForStudy(
    userId: number,
    lessonId: number,
  ): Promise<Prisma.LessonGetPayload<{ select: typeof LESSON_STUDY_DETAIL_SELECT }>> {
    await this.validation.validateUserStatus(userId)

    const lesson = await this.prisma.lesson.findFirst({
      where: {
        id: lessonId,
        deletedAt: null,
        module: {
          isDelete: false,
          course: {
            isDelete: false,
          },
        },
      },
      select: LESSON_STUDY_DETAIL_SELECT,
    })

    if (!lesson) {
      throw LessonNotFoundOrForbiddenException
    }

    const enrollment = await this.prisma.enrollment.findFirst({
      where: {
        userId,
        courseId: lesson.module.courseId,
        isDelete: false,
      },
      select: { id: true },
    })

    if (!enrollment) {
      throw new BadRequestException(ERROR_MESSAGE.COURSE.NOT_ENROLLED)
    }

    return lesson
  }

  /**
   * Create one or multiple lessons under a specific module.
   *
   * - Validates user ownership of the module.
   * - Prevents duplicate lesson titles in the same batch.
   * - Automatically calculates lesson order if not provided.
   * - Uses transaction: create lessons → return them sorted by lesson order.
   *
   * @param userId - ID of the authenticated user
   * @param moduleId - ID of the module
   * @param payloads - Array of lesson creation payloads
   * @returns Array of created lessons, typed as `CreateLessonResType[]`
   * @throws DuplicateTitlesException if titles are duplicated in the request
   */
  async createLessons(userId: number, moduleId: number, payloads: CreateLessonType[]): Promise<CreateLessonResType[]> {
    await this.assertOwnership(userId, moduleId, 'module')

    const titles = payloads.map((p) => p.title)
    if (new Set(titles).size !== titles.length) throw DuplicateTitlesException

    let nextOrder = await this.getNextLessonOrder(moduleId)

    // Prepare data for bulk insertion
    const data = payloads.map((p) => ({
      chapterId: moduleId,
      title: p.title,
      videoUrl: p.videoUrl ?? null,
      documentUrl: p.documentUrl ?? null,
      lessonOrder: p.lessonOrder ?? nextOrder++,
      isPreviewable: p.isPreviewable ?? false,
      createdById: userId,
    }))

    // Transaction ensures all lessons are created atomically
    return this.prisma
      .$transaction(async (tx) => {
        await tx.lesson.createMany({ data })
        return tx.lesson.findMany({
          where: { chapterId: moduleId, title: { in: titles } },
          select: LESSON_PUBLIC_SELECT,
          orderBy: { lessonOrder: 'asc' },
        })
      })
      .catch((err) => {
        this.logger.error(`Create lessons error: ${err.message}`)
        if (err.code === 'P2002') throw DuplicateTitlesException
        throw err
      })
  }

  /**
   * Update an existing lesson.
   *
   * - Validates ownership of the lesson.
   * - Updates lesson data and sets `updatedById`.
   *
   * @param userId - ID of the authenticated user
   * @param lessonId - ID of the lesson to update
   * @param payload - Lesson update payload
   * @returns Updated lesson, typed as `LessonResType`
   */
  async updateLesson(userId: number, lessonId: number, payload: UpdateLessonType): Promise<LessonResType> {
    await this.assertOwnership(userId, lessonId, 'lesson')

    return this.prisma.lesson.update({
      where: { id: lessonId },
      data: { ...payload, updatedById: userId },
      select: LESSON_PUBLIC_SELECT,
    })
  }

  /**
   * Soft delete a lesson (set `deletedAt` instead of removing from DB).
   *
   * - Validates ownership of the lesson.
   * - Sets `deletedAt` and `updatedById`.
   *
   * @param userId - ID of the authenticated user
   * @param lessonId - ID of the lesson to soft delete
   * @returns Message confirming deletion
   * @throws LessonNotFoundOrForbiddenException if lesson not found or no permission
   */
  async softDeleteLesson(userId: number, lessonId: number): Promise<{ message: string }> {
    await this.assertOwnership(userId, lessonId, 'lesson')

    const updated = await this.prisma.lesson.update({
      where: {
        id: lessonId,
        deletedAt: null,
        module: { course: { createdById: userId, isDelete: false } },
      },
      data: { deletedAt: new Date(), updatedById: userId },
    })

    if (!updated) throw LessonNotFoundOrForbiddenException
    return { message: LESSON_MESSAGES.DELETED }
  }

  /**
   * Restore a soft-deleted lesson.
   *
   * - Validates user status (active).
   * - Restores lesson by setting `deletedAt` to null.
   *
   * @param userId - ID of the authenticated user
   * @param lessonId - ID of the lesson to restore
   * @returns Message confirming restoration
   * @throws LessonNotFoundOrForbiddenException if no matching lesson found
   */
  async restoreLesson(userId: number, lessonId: number): Promise<{ message: string }> {
    await this.validation.validateUserStatus(userId)

    const restored = await this.prisma.lesson.updateMany({
      where: {
        id: lessonId,
        deletedAt: { not: null },
        module: { course: { createdById: userId, isDelete: false } },
      },
      data: { deletedAt: null, updatedById: userId },
    })

    if (restored.count === 0) throw LessonNotFoundOrForbiddenException
    return { message: LESSON_MESSAGES.RESTORED }
  }

  /**
   * List lessons of a module with pagination.
   *
   * - Validates ownership of the module.
   * - Fetches lessons with `skip`/`take` pagination.
   * - Uses transaction to return lessons and total count in one query.
   *
   * @param userId - ID of the authenticated user
   * @param moduleId - ID of the module
   * @param query - Pagination parameters (`skip`, `take`)
   * @returns Paginated lessons, typed as `ListLessonsResType`
   */
  async listLessons(userId: number, moduleId: number, query: PaginationQueryType): Promise<ListLessonsResType> {
    await this.assertOwnership(userId, moduleId, 'module')

    const where: Prisma.LessonWhereInput = { chapterId: moduleId, deletedAt: null }

    // Transaction: fetch lessons and count in parallel
    const [items, total] = await Promise.all([
      this.prisma.lesson.findMany({
        where,
        select: LESSON_PUBLIC_SELECT,
        orderBy: { lessonOrder: 'asc' },
        skip: query.skip,
        take: query.take,
      }),
      this.prisma.lesson.count({ where }),
    ])
    return { items, total, skip: query.skip, take: query.take }
  }

  async listLessonsForStudy(
    userId: number,
    moduleId: number,
    query: PaginationQueryType,
  ): Promise<ListLessonsStudyResType> {
    // Ensure module exists and the user is enrolled in the parent course
    await this.ensureUserEnrolledInModuleCourse(userId, moduleId)

    const where: Prisma.LessonWhereInput = {
      chapterId: moduleId,
      deletedAt: null,
    }

    // Fetch lessons, total count, and completion set at the same time
    const [lessons, total, completedSet] = await Promise.all([
      this.prisma.lesson.findMany({
        where,
        select: LESSON_STUDY_LIST_SELECT,
        orderBy: { lessonOrder: 'asc' },
        skip: query.skip,
        take: query.take,
      }),

      this.prisma.lesson.count({ where }),

      this.getCompletionSetForModule(userId, moduleId),
    ])

    return {
      items: lessons.map((item) => ({
        ...item,
        isCompleted: completedSet.has(item.id),
      })),
      total,
      skip: query.skip,
      take: query.take,
    }
  }

  /**
   * CLIENT STUDY: Get lesson detail for a learner.
   *
   * - User must be active and enrolled in the course that owns the lesson.
   * - Returns full lesson metadata plus `isCompleted` flag.
   */
  async getLessonDetailForStudy(userId: number, lessonId: number): Promise<LessonStudyDetailType> {
    // Validate lesson and enrollment, then get lesson + course info
    const lesson = await this.getLessonWithCourseForStudy(userId, lessonId)

    const completion = await this.prisma.lessonCompletion.findFirst({
      where: {
        userId,
        lessonId,
        isDelete: false,
      },
      select: { id: true },
    })

    return {
      id: lesson.id,
      chapterId: lesson.chapterId,
      title: lesson.title,
      videoUrl: lesson.videoUrl,
      documentUrl: lesson.documentUrl,
      lessonOrder: lesson.lessonOrder,
      isPreviewable: lesson.isPreviewable,
      createdAt: lesson.createdAt,
      updatedAt: lesson.updatedAt,
      isCompleted: !!completion,
    }
  }

  /**
 * List quizzes of a lesson for study view with pagination.
 *
 * - Validates that the user has access to the lesson and its course.
 * - Only returns quizzes that are **published** and **not deleted**.
 * - Supports pagination using `skip` and `take`.
 * - Fetches quizzes and total count in a single transaction.
 * - For each quiz, retrieves the **latest attempt** of the user (if any)
 *   to include quiz result (score & submitted time).
 *
 * @param userId - ID of the authenticated user
 * @param lessonId - ID of the lesson
 * @param query - Pagination parameters (`skip`, `take`)
 * @returns Paginated quizzes with latest quiz result, typed as `ListLessonQuizResType`
 */
  async listQuizzesForLessonStudy(
    userId: number,
    lessonId: number,
    query: ListLessonQuizQueryType,
  ): Promise<ListLessonQuizResType> {
    await this.getLessonWithCourseForStudy(userId, lessonId)

    const where: Prisma.QuizzWhereInput = {
      lessonId,
      isDelete: false,
      status: QuizStatus.Published,
    }

    const skip = query.skip ?? 0
    const take = query.take ?? 10

    const [quizzes, total] = await this.prisma.$transaction([
      this.prisma.quizz.findMany({
        where,
        orderBy: { createdAt: 'asc' },
        skip,
        take,
        select: {
          id: true,
          title: true,
          description: true,
          status: true,
          quizAttempts: {
            where: { userId },
            orderBy: { completedAt: 'desc' },
            take: 1,
            select: {
              score: true,
              completedAt: true,
            },
          },
        },
      }),
      this.prisma.quizz.count({ where }),
    ])

    const items: LessonQuizItemType[] = quizzes.map((q) => {
      const lastAttempt = q.quizAttempts[0]
      let quiz_result: LessonQuizResultType | null = null

      if (lastAttempt) {
        const decimalScore = lastAttempt.score as unknown as Prisma.Decimal
        const scoreNumber =
          typeof (decimalScore as any)?.toNumber === 'function' ? decimalScore.toNumber() : Number(decimalScore)

        quiz_result = {
          score: scoreNumber,
          submitted_at: lastAttempt.completedAt ?? null,
        }
      }

      return {
        id: q.id,
        title: q.title,
        description: q.description,
        status: q.status,
        quiz_result,
      }
    })

    return { items, total, skip, take }
  }
}
