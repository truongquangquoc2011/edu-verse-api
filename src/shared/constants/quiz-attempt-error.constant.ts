import { BadRequestException } from '@nestjs/common'

export const QuizAttemptNotFoundOrForbiddenException = new BadRequestException({
  message: 'Error.QuizAttemptNotFoundOrForbidden',
  path: 'quizAttempt',
})

export const QuizAttemptAlreadySubmittedException = new BadRequestException({
  message: 'Error.QuizAttemptAlreadySubmitted',
  path: 'quizAttempt',
})

export const QuizAttemptInvalidStateException = new BadRequestException({
  message: 'Error.QuizAttemptInvalidState',
  path: 'quizAttempt',
})

export const QuizAnswerInvalidException = new BadRequestException({
  message: 'Error.QuizAnswerInvalid',
  path: 'quizAnswer',
})
