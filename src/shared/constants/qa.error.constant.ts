import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common'

// Align naming and payload with your quiz-question pattern
export const QaThreadNotFoundOrForbiddenException = new ForbiddenException({
  message: 'qa.thread.error.notFoundOrForbidden',
  path: 'qaThread',
})

export const QaPostNotFoundOrForbiddenException = new ForbiddenException({
  message: 'qa.post.error.notFoundOrForbidden',
  path: 'qaPost',
})

export const QaEnrollmentRequiredException = new ForbiddenException({
  message: 'qa.error.enrollmentRequired',
  path: 'enrollment',
})

export const QaThreadLockedException = new BadRequestException({
  message: 'qa.thread.error.locked',
  path: 'qaThread',
})

export const QaAcceptInvalidException = new BadRequestException({
  message: 'qa.answer.error.notBelongToThread',
  path: 'qaPost',
})

export const QaLessonNotFoundException = new NotFoundException({
  message: 'lesson.error.notFoundOrForbidden',
  path: 'lesson',
})

export const QaCourseNotFoundException = new NotFoundException({
  message: 'course.error.notFoundOrInvalid',
  path: 'course',
})
