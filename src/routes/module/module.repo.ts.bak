import { BadRequestException, Injectable } from '@nestjs/common'
import { PrismaService } from 'src/shared/services/prisma.service'

import { ERROR_MESSAGE } from 'src/shared/constants/error-message.constant'
import { MODULE_MESSAGES } from 'src/shared/constants/module-message.constant'
import { ValidationService } from 'src/shared/services/validation.service'
import { MODULE_PUBLIC_SELECT } from 'src/shared/constants/module.select'
import {
  CreateModuleResType,
  CreateModuleType,
  ListModulesResType,
  ListModuleStudyQueryType,
  ListModuleStudyResType,
  ModuleResType,
  ModuleStudyItemType,
  UpdateModuleType,
  ListModuleQuizQueryType,
  ListModuleQuizResType,
  ModuleQuizItemType,
  ModuleQuizResultType,
} from './module.model'
import { PaginationQueryType } from 'src/shared/models/pagination.model'
import { Prisma, QuizStatus } from '@prisma/client'
import {
  DuplicateTitlesException,
  ModuleNotFoundOrForbiddenException,
} from 'src/shared/constants/module-error.constant'
import {
  buildCompletedLessonCountMapByModules,
  buildLessonCountMapByModules,
  mapModuleToStudyItem,
} from 'src/shared/helper/module.helper'

@Injectable()
export class ModuleRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly validation: ValidationService,
  ) {}

  /**
   * Generic method to assert ownership for course or module.
   * @param userId - User ID
   * @param entityId - Course or Module ID
   * @param entityType - 'course' or 'module'
   * @throws BadRequestException if not owned or not found
   * @example
   * await this.assertOwnership(1, 10, 'course'); // Checks course ownership
   */
  private async assertOwnership(userId: number, entityId: number, entityType: 'course' | 'module'): Promise<void> {
    await this.validation.validateUserStatus(userId)

    if (entityType === 'course') {
      const entity = await this.prisma.course.findFirst({
        where: { id: entityId, createdById: userId, isDelete: false },
        select: { id: true },
      })
      if (!entity) {
        throw new BadRequestException(ERROR_MESSAGE.COURSE.NOT_FOUND_OR_FORBIDDEN)
      }
    } else {
      const entity = await this.prisma.module.findFirst({
        where: { id: entityId, isDelete: false, course: { createdById: userId } },
        select: { id: true },
      })
      if (!entity) {
        throw new BadRequestException(MODULE_MESSAGES.NOT_FOUND_OR_FORBIDDEN)
      }
    }
  }

  /**
   * Calculates the next chapter order number for a new module in a course.
   * - Finds the module with the highest existing chapterOrder.
   * - Returns the next incremental value.
   *
   * @param courseId - ID of the course to check for existing modules
   * @returns The next chapter order number
   */
  private async getNextChapterOrder(courseId: number): Promise<number> {
    const last = await this.prisma.module.findFirst({
      where: { courseId, isDelete: false },
      orderBy: { chapterOrder: 'desc' },
      select: { chapterOrder: true },
    })
    return (last?.chapterOrder ?? 0) + 1
  }

  /**
   * Ensures the user is **actively enrolled** in the course.
   * Used for STUDY pages (user must own the course, not necessarily create it).
   *
   * @param userId - current user ID
   * @param courseId - course to check
   * @throws BadRequestException if user is not enrolled
   */
  private async ensureUserEnrolledInCourse(userId: number, courseId: number): Promise<void> {
    await this.validation.validateUserStatus(userId)

    const enroll = await this.prisma.enrollment.findFirst({
      where: {
        userId,
        courseId,
        isDelete: false,
      },
      select: { id: true },
    })

    if (!enroll) {
      throw new BadRequestException(ERROR_MESSAGE.COURSE.NOT_ENROLLED)
    }
  }

  /**
   * Creates a new module under a specific course.
   * - Validates course ownership.
   * - Automatically calculates the chapter order if not provided.
   *
   * @param userId - ID of the user creating the module
   * @param courseId - ID of the course the module belongs to
   * @param payload - Data required to create the module
   * @returns The newly created module
   * @throws BadRequestException if the course is not found or not owned by the user
   */
  async createModules(userId: number, courseId: number, payloads: CreateModuleType[]): Promise<CreateModuleResType[]> {
    // 1. Ensure the course belongs to the user (ownership check)
    await this.assertOwnership(userId, courseId, 'course')

    // Check duplicate titles to avoid issues
    const titles = payloads.map((p) => p.title)
    if (new Set(titles).size !== titles.length) {
      throw DuplicateTitlesException
    }

    // 2. Get the next available chapter order for this course
    let nextOrder = await this.getNextChapterOrder(courseId)

    // 3. Normalize input payloads → add required fields & auto-generate chapterOrder if missing
    const data = payloads.map((p) => {
      const order = p.chapterOrder ?? nextOrder++
      return {
        courseId,
        title: p.title,
        description: p.description ?? null,
        chapterOrder: order,
        createdById: userId,
      }
    })

    // 4. Transaction: insert all records and query back inserted modules
    const createdModules = await this.prisma.$transaction(async (tx) => {
      // Insert many records
      await tx.module.createMany({ data })
      return tx.module.findMany({
        where: { courseId, title: { in: titles } },
        select: MODULE_PUBLIC_SELECT,
        orderBy: { chapterOrder: 'asc' },
      })
    })

    return createdModules
  }

  /**
   * Updates an existing module owned by the user.
   *
   * @param userId - ID of the user updating the module
   * @param moduleId - ID of the module to update
   * @param payload - Partial data to update (title, description, chapterOrder)
   * @returns The updated module
   * @throws BadRequestException if the module does not exist or is not owned by the user
   */
  async updateModule(userId: number, moduleId: number, payload: UpdateModuleType): Promise<ModuleResType> {
    await this.assertOwnership(userId, moduleId, 'module')

    return this.prisma.module.update({
      where: { id: moduleId },
      data: {
        ...payload,
        updatedById: userId,
      },
      select: MODULE_PUBLIC_SELECT,
    })
  }

  /**
   * Soft deletes a module (marks as deleted without physically removing it).
   *
   * @param userId - ID of the user deleting the module
   * @param moduleId - ID of the module to delete
   * @returns A success message
   * @throws BadRequestException if the module does not exist or is not owned by the user
   */
  async softDeleteModule(userId: number, moduleId: number): Promise<{ message: string }> {
    await this.assertOwnership(userId, moduleId, 'module')

    const updated = await this.prisma.module.update({
      where: { id: moduleId }, // Assume assert already checked existence
      data: { isDelete: true, deletedAt: new Date(), updatedById: userId },
    })
    if (!updated) throw ModuleNotFoundOrForbiddenException
    return { message: MODULE_MESSAGES.DELETED }
  }
  /**
   * Restores a previously soft-deleted module.
   *
   * @param userId - ID of the user restoring the module
   * @param moduleId - ID of the module to restore
   * @returns A success message
   * @throws BadRequestException if the module does not exist or is not owned by the user
   */
  async restoreModule(userId: number, moduleId: number): Promise<{ message: string }> {
    await this.validation.validateUserStatus(userId)

    const result = await this.prisma.module.updateMany({
      where: { id: moduleId, isDelete: true, course: { createdById: userId } },
      data: { isDelete: false, deletedAt: null, updatedById: userId },
    })

    if (result.count === 0) {
      throw new BadRequestException(MODULE_MESSAGES.NOT_FOUND_OR_FORBIDDEN)
    }

    return { message: MODULE_MESSAGES.RESTORED }
  }

  /**
   * Retrieves all modules for a given course owned by the user.
   * - Ensures the course belongs to the user.
   * - Returns modules sorted by chapterOrder.
   *
   * @param userId - ID of the user requesting the modules
   * @param courseId - ID of the course to retrieve modules for
   * @returns A list of modules belonging to the course
   * @throws BadRequestException if the course does not exist or is not owned by the user
   */
  async listModules(userId: number, courseId: number, query: PaginationQueryType): Promise<ListModulesResType> {
    await this.assertOwnership(userId, courseId, 'course')

    const where: Prisma.ModuleWhereInput = { courseId, isDelete: false }

    const [modules, total] = await this.prisma.$transaction([
      this.prisma.module.findMany({
        where,
        select: MODULE_PUBLIC_SELECT,
        orderBy: { chapterOrder: 'asc' },
        skip: query.skip,
        take: query.take,
      }),
      this.prisma.module.count({ where }),
    ])

    return { items: modules, total, skip: query.skip, take: query.take }
  }

  /**
   * CLIENT: Lists modules for a course in study context.
   *
   * - Requires the user to be active and enrolled in the course.
   * - Does NOT require course ownership (this is for learners).
   * - Includes lessonCount and completedLessonCount per module for the given user.
   */
  async listModulesForStudy(
    userId: number,
    courseId: number,
    query: ListModuleStudyQueryType,
  ): Promise<ListModuleStudyResType> {
    await this.ensureUserEnrolledInCourse(userId, courseId)

    const where: Prisma.ModuleWhereInput = {
      courseId,
      isDelete: false,
    }

    const [modules, total] = await this.prisma.$transaction([
      this.prisma.module.findMany({
        where,
        orderBy: { chapterOrder: 'asc' },
        skip: query.skip,
        take: query.take,
        select: {
          id: true,
          title: true,
          description: true,
          chapterOrder: true,
        },
      }),
      this.prisma.module.count({ where }),
    ])

    const moduleIds = modules.map((m) => m.id)
    if (!moduleIds.length) {
      return {
        items: [],
        total,
        skip: query.skip,
        take: query.take,
      }
    }

    const [lessonCountMap, completedCountMap] = await Promise.all([
      buildLessonCountMapByModules(this.prisma, moduleIds),
      buildCompletedLessonCountMapByModules(this.prisma, userId, moduleIds),
    ])

    const items: ModuleStudyItemType[] = modules.map((m) => mapModuleToStudyItem(m, lessonCountMap, completedCountMap))

    return {
      items,
      total,
      skip: query.skip,
      take: query.take,
    }
  }
  async listQuizzesForModuleStudy(
    userId: number,
    courseId: number,
    moduleId: number,
    query: ListModuleQuizQueryType,
  ): Promise<ListModuleQuizResType> {
    await this.ensureUserEnrolledInCourse(userId, courseId)

    const module = await this.prisma.module.findFirst({
      where: {
        id: moduleId,
        courseId,
        isDelete: false,
      },
      select: { id: true },
    })

    if (!module) {
      throw new BadRequestException(MODULE_MESSAGES.NOT_FOUND_OR_FORBIDDEN)
    }

    const where: Prisma.QuizzWhereInput = {
      moduleId,
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
              score: true, // Decimal
              completedAt: true, // Date | null
            },
          },
        },
      }),
      this.prisma.quizz.count({ where }),
    ])

    const items: ModuleQuizItemType[] = quizzes.map((q): ModuleQuizItemType => {
      const lastAttempt = q.quizAttempts[0]

      let quiz_result: ModuleQuizResultType | null = null

      if (lastAttempt) {
        // score: Decimal -> number
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

    return {
      items,
      total,
      skip,
      take,
    }
  }
}
