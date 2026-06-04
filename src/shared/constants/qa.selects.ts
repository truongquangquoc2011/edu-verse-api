import { Prisma } from '@prisma/client'

export const QA_POST_PUBLIC_SELECT = {
  id: true,
  threadId: true,
  authorId: true,
  content: true,
  parentId: true,
  isEdited: true,
  editedAt: true,
  isDelete: true,
  createdAt: true,
  updatedAt: true,
  author: {
    select: {
      id: true,
      fullname: true,
      avatar: true,
    },
  },
} as const satisfies Prisma.QaPostSelect

export const QA_THREAD_PUBLIC_SELECT = {
  id: true,
  courseId: true,
  lessonId: true,
  instructorId: true,
  authorId: true,
  title: true,
  status: true,
  isResolved: true,
  acceptedPostId: true, // read-only; write via relation acceptedPost
  locked: true,
  lastActivityAt: true,
  createdAt: true,
  updatedAt: true,

  course: { select: { id: true, title: true, createdById: true, isDelete: true } },
  lesson: { select: { id: true, title: true } },
  author: { select: { id: true, fullname: true } },
  instructor: { select: { id: true, fullname: true } },

  _count: { select: { posts: true } },
} as const satisfies Prisma.QaThreadSelect
