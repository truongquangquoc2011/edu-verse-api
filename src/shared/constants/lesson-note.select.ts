import { Prisma } from '@prisma/client'

/**
 * Public select shape for lesson note responses.
 */
export const LESSON_NOTE_PUBLIC_SELECT = {
  id: true,
  userId: true,
  courseId: true,
  lessonId: true,
  content: true,
  timestampSec: true,
  isPinned: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.LessonNoteSelect

/**
 * Minimal select shape used for validating lesson access.
 */
export const LESSON_NOTE_LESSON_ACCESS_SELECT = {
  id: true,
  module: {
    select: {
      courseId: true,
    },
  },
} satisfies Prisma.LessonSelect

/**
 * Default order for lesson notes.
 *
 * - Pinned notes first
 * - Then sorted by timestamp
 */
export const LESSON_NOTE_LIST_ORDER_BY = [
  { isPinned: 'desc' },
  { timestampSec: 'asc' },
] satisfies Prisma.LessonNoteOrderByWithRelationInput[]