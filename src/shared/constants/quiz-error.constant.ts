// src/shared/constants/quiz-error.constant.ts
import { BadRequestException } from '@nestjs/common'

export const DuplicateQuizTitlesException = new BadRequestException({
  message: 'Error.DuplicateQuizTitles',
  path: 'quiz',
})

export const QuizNotFoundOrForbiddenException = new BadRequestException({
  message: 'Error.QuizNotFoundOrForbidden',
  path: 'quiz',
})

export const QuizQuestionNotFoundOrForbiddenException = new BadRequestException({
  message: 'Error.QuizQuestionNotFoundOrForbidden',
  path: 'quizQuestion',
})

export const QuizAnswerOptionNotFoundOrForbiddenException = new BadRequestException({
  message: 'Error.QuizAnswerOptionNotFoundOrForbidden',
  path: 'quizAnswerOption',
})

export const QuizAttemptNotFoundOrForbiddenException = new BadRequestException({
  message: 'Error.QuizAttemptNotFoundOrForbidden',
  path: 'quizAttempt',
})

