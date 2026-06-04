// src/shared/constants/qa.constant.ts

/** QA user-facing and internal messages */
export const QA_MESSAGES = {
  THREAD_DELETED: 'Thread deleted',
  POST_DELETED: 'Post deleted',
  POST_CANNOT_DELETE_ACCEPTED: 'Cannot delete the accepted answer',
  THREAD_LOCKED: 'Thread is locked',
} as const

/** QA error message strings (to build HttpExceptions consistently) */
export const QA_ERRORS = {
  THREAD_FORBIDDEN: 'Thread not found or forbidden',
  POST_FORBIDDEN: 'Post not found or forbidden',
  ENROLLMENT_REQUIRED: 'Enrollment required',
  ACCEPT_INVALID: 'Post does not belong to this thread',
  LESSON_NOT_FOUND: 'Lesson not found or not in the course',
  COURSE_NOT_FOUND: 'Course not found or invalid',
} as const
