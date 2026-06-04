// src/shared/helper/module.helper.ts
import { Prisma, PrismaClient } from '@prisma/client'
import { ModuleStudyItemType } from 'src/routes/module/module.model'

/**
 * Type helper: PrismaClient lẫn TransactionClient
 */
type PrismaLike = PrismaClient | Prisma.TransactionClient

/**
 * Build map: moduleId -> total active lessons in that module.
 *
 * @param prisma - Prisma client or transaction client
 * @param moduleIds - list of module IDs
 */
export async function buildLessonCountMapByModules(
  prisma: PrismaLike,
  moduleIds: number[],
): Promise<Map<number, number>> {
  if (!moduleIds.length) return new Map<number, number>()

  const lessonRows = await prisma.lesson.findMany({
    where: {
      isDelete: false,
      chapterId: { in: moduleIds },
    },
    select: {
      chapterId: true,
    },
  })

  const lessonCountMap = new Map<number, number>()
  for (const row of lessonRows) {
    const chapterId = row.chapterId
    lessonCountMap.set(chapterId, (lessonCountMap.get(chapterId) ?? 0) + 1)
  }

  return lessonCountMap
}

/**
 * Build map: moduleId -> completed lessons count in that module for a given user.
 *
 * @param prisma - Prisma client or transaction client
 * @param userId - current user ID
 * @param moduleIds - list of module IDs
 */
export async function buildCompletedLessonCountMapByModules(
  prisma: PrismaLike,
  userId: number,
  moduleIds: number[],
): Promise<Map<number, number>> {
  if (!moduleIds.length) return new Map<number, number>()

  const completionRows = await prisma.lessonCompletion.findMany({
    where: {
      userId,
      isDelete: false,
      lesson: {
        isDelete: false,
        chapterId: { in: moduleIds },
      },
    },
    select: {
      lesson: {
        select: {
          chapterId: true,
        },
      },
    },
  })

  const completedCountMap = new Map<number, number>()
  for (const row of completionRows) {
    const chapterId = row.lesson.chapterId
    completedCountMap.set(chapterId, (completedCountMap.get(chapterId) ?? 0) + 1)
  }

  return completedCountMap
}

/**
 * Map raw module row + 2 map count -> ModuleStudyItemType.
 *
 * @param module - raw module select
 * @param lessonCountMap - map moduleId -> total lessons
 * @param completedCountMap - map moduleId -> completed lessons for current user
 */
export function mapModuleToStudyItem(
  module: { id: number; title: string; description: string | null; chapterOrder: number },
  lessonCountMap: Map<number, number>,
  completedCountMap: Map<number, number>,
): ModuleStudyItemType {
  return {
    id: module.id,
    title: module.title,
    description: module.description,
    chapterOrder: module.chapterOrder,
    lessonCount: lessonCountMap.get(module.id) ?? 0,
    completedLessonCount: completedCountMap.get(module.id) ?? 0,
  }
}
