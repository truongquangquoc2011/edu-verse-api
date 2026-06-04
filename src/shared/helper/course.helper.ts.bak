import { BadRequestException } from '@nestjs/common'
import { CourseStatus, Prisma, PrismaClient } from '@prisma/client'
import { CreateCourseType, UpdateCourseType } from 'src/routes/course/course.model'
import { ERROR_MESSAGE } from 'src/shared/constants/error-message.constant'
import {
  CourseAlreadyDeletedException,
  CourseCannotDeleteApprovedException,
  CourseNotDeletedException,
  CourseNotFoundOrForbiddenException,
} from '../constants/course-error.constant'
import { COURSE_DETAIL_SELECT } from '../constants/course-field.constant'
import { PrismaService } from '../services/prisma.service'

const prisma = new PrismaService()
/**
 * Builds the Prisma-compatible data for creating a course.
 *
 * @param userId - ID of the user creating the course
 * @param rest - Other fields (excluding categoryId, hashtagIds)
 * @param categoryId - Optional category ID
 * @param hashtagIds - Optional hashtag IDs
 * @returns Prisma-compatible data object
 */
export function buildCourseData(
  userId: number,
  courseData: Omit<CreateCourseType, 'categoryId' | 'hashtagIds'>,
  categoryId?: number,
  hashtagIds: number[] = [],
) {
  const data: any = {
    ...courseData,
    status: CourseStatus.Pending,
    createdBy: {
      connect: { id: userId }, // Link to the creator using relation
    },
  }
  // If categoryId is provided, link the course to the category
  if (categoryId) {
    data.category = {
      connect: { id: categoryId },
    }
  }

  if (hashtagIds.length > 0) {
    data.hashtags = {
      connect: hashtagIds.map((id) => ({ id })), // Must use array of { id }
    }
  }

  return data
}

/**
 * Builds the Prisma-compatible data for updating a course.
 *
 * @param userId - ID of the user updating the course
 * @param rest - Other fields (excluding categoryId, hashtagIds)
 * @param categoryId - Optional category ID
 * @param hashtagIds - Optional hashtag IDs
 * @returns Prisma-compatible data object
 */
export function buildUpdateCourseData(
  userId: number,
  courseData: Omit<UpdateCourseType, 'categoryId' | 'hashtagIds'>,
  categoryId?: number,
  hashtagIds: number[] = [],
) {
  const data: any = {
    ...courseData,
    updatedBy: {
      connect: { id: userId }, // Track who performed the update
    },
    updatedAt: new Date(),
  }
  // If categoryId is provided, re-link the course to the new category
  if (categoryId) {
    data.category = {
      connect: { id: categoryId },
    }
  }
  // If hashtagIds are provided, replace all current hashtags with the new ones
  // Use `set` to overwrite, not `connect` (which would just append)
  if (hashtagIds.length > 0) {
    data.hashtags = {
      set: hashtagIds.map((id) => ({ id })), // `set` replaces all existing relations
    }
  }

  return data
}
type DiagnoseIntent = 'softDelete' | 'restore'

/** Minimal fields needed for diagnosing both intents */
async function getCourseForDiagnose(tx: Prisma.TransactionClient, courseId: number, userId: number) {
  return tx.course.findFirst({
    where: { id: courseId, createdById: userId },
    select: { id: true, isDelete: true, status: true },
  })
}

/**
 * Diagnose why an atomic course operation failed and throw a specific custom exception.
 * Use after updateMany(...).count === 0
 */
export async function diagnoseCourseFailure(
  tx: Prisma.TransactionClient,
  courseId: number,
  userId: number,
  intent: DiagnoseIntent,
): Promise<never> {
  const found = await getCourseForDiagnose(tx, courseId, userId)

  if (!found) throw CourseNotFoundOrForbiddenException

  if (intent === 'softDelete') {
    if (found.isDelete) throw CourseAlreadyDeletedException
    if (found.status === CourseStatus.Approved) throw CourseCannotDeleteApprovedException
    // any non-Pending that isn’t Approved falls back to generic “not deletable”
    throw CourseNotDeletedException
  }

  // intent === 'restore'
  if (!found.isDelete) throw CourseNotDeletedException

  // fallback (shouldn’t happen)
  throw CourseNotFoundOrForbiddenException
}

/**
 * Get basic course info by userId & courseId
 */
export function getCourseRaw(userId: number, courseId: number) {
  return prisma.course.findFirst({
    where: { id: courseId, createdById: userId, isDelete: false },
    select: COURSE_DETAIL_SELECT,
  })
}
export function getCoursePublicRaw(courseId: number) {
  return prisma.course.findFirst({
    where: { id: courseId, isDelete: false },
    select: COURSE_DETAIL_SELECT,
  })
}
/**
 * Count modules of a course
 */
export function countModules(courseId: number) {
  return prisma.module.count({
    where: { courseId, isDelete: false },
  })
}

/**
 * Count lessons of a course
 */
export function countLessons(courseId: number) {
  return prisma.lesson.count({
    where: { module: { courseId }, isDelete: false },
  })
}

/**
 * Convert Decimal -> number in course entity
 */
export function formatCourse(courseRaw: any) {
  return {
    ...courseRaw,
    price: (courseRaw.price as Prisma.Decimal).toNumber(),
  }
}


