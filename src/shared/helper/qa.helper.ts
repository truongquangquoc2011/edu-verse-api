import { Prisma } from '@prisma/client'
import { ThreadPublicResType, PostPublicResType, ListThreadsQueryType } from '../../routes/qa/qa.model'
import { QA_POST_PUBLIC_SELECT, QA_THREAD_PUBLIC_SELECT } from '../constants/qa.selects'

/**
 * Map a Prisma `QaThread` record (selected with `QA_THREAD_PUBLIC_SELECT`)
 * into a simplified public-facing thread DTO (`ThreadPublicResType`).
 *
 * - Safely handles nullable fields such as `title`, `acceptedPostId`, etc.
 * - Includes lightweight nested relations (lesson, course, author, instructor).
 * - Falls back to `createdAt` if `lastActivityAt` is missing.
 *
 * @param row - Prisma thread record with `QA_THREAD_PUBLIC_SELECT` projection
 * @returns Thread mapped to `ThreadPublicResType`
 */
export function mapThreadPublic(
  row: Prisma.QaThreadGetPayload<{ select: typeof QA_THREAD_PUBLIC_SELECT }>,
): ThreadPublicResType {
  return {
    id: row.id,
    courseId: row.courseId,
    lessonId: row.lessonId,
    instructorId: row.instructorId,
    authorId: row.authorId,
    title: row.title ?? null,
    status: row.status as any, // cast enum to client-facing type
    isResolved: row.isResolved,
    acceptedPostId: row.acceptedPostId ?? null,
    locked: row.locked,
    postsCount: row._count?.posts ?? 0,
    lastActivityAt: row.lastActivityAt ?? row.createdAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,

    // Related entities (optional joins)
    lesson: row.lesson ? { id: row.lesson.id, title: row.lesson.title } : undefined,
    course: row.course ? { id: row.course.id, title: row.course.title } : undefined,
    author: row.author ? { id: row.author.id, fullname: row.author.fullname } : undefined,
    instructor: row.instructor ? { id: row.instructor.id, fullname: row.instructor.fullname } : undefined,
  }
}

/**
 * Map a Prisma `QaPost` record (selected with `QA_POST_PUBLIC_SELECT`)
 * into a standardized public-facing post DTO (`PostPublicResType`).
 *
 * - Includes accepted flag comparison (`acceptedPostId === post.id`).
 * - Handles edited/deleted metadata gracefully.
 * - Includes optional author sub-object.
 *
 * @param post - Prisma post record with `QA_POST_PUBLIC_SELECT` projection
 * @param acceptedPostId - Optional accepted post ID to determine accepted flag
 * @returns Post mapped to `PostPublicResType`
 */
export function mapPostPublic(
  post: Prisma.QaPostGetPayload<{ select: typeof QA_POST_PUBLIC_SELECT }>,
  acceptedPostId?: number | null,
): PostPublicResType {
  return {
    id: post.id,
    threadId: post.threadId,
    authorId: post.authorId,
    content: post.content,
    parentId: post.parentId ?? null,
    accepted: acceptedPostId ? acceptedPostId === post.id : false,
    isEdited: post.isEdited,
    editedAt: post.editedAt ?? null,
    isDelete: post.isDelete,
    createdAt: post.createdAt,
    updatedAt: post.updatedAt,

    // Include author metadata if joined
    author: post.author
      ? { id: post.author.id, fullname: post.author.fullname, avatar: post.author.avatar ?? null }
      : undefined,
  }
}

/**
 * Utility function to compute pagination skip/take parameters.
 *
 * - Normalizes `page` and `pageSize` from query.
 * - Provides defaults: page = 1, pageSize = 20.
 * - Returns ready-to-use object for Prisma queries.
 *
 * @param query - Object containing `page` and `pageSize` (can be from query DTO)
 * @returns Object `{ page, pageSize, skip, take }`
 */
export function toSkipTake(query: ListThreadsQueryType | { page: number; pageSize: number }) {
  const page = Number(query.page ?? 1)
  const pageSize = Number(query.pageSize ?? 20)
  const skip = (page - 1) * pageSize
  const take = pageSize
  return { page, pageSize, skip, take }
}
