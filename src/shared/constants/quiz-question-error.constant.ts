import { NotFoundException } from '@nestjs/common'

export const QuizQuestionNotFoundException = new NotFoundException({
  message: 'quiz-question.error.notFoundOrForbidden',
  path: 'quizQuestion',
})