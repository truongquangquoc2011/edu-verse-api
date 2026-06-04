import { Module } from '@nestjs/common'
import { QuizzService } from './quizz.service'
import { QuizzController } from './quizz.controller'
import { QuizzRepository } from './quizz.repo'
import { QuizAttemptService } from './attempt.service'
import { QuizAttemptRepository } from './attempt.repo'
import { AttemptController } from './attempt.controller'
import { ModuleQuizzController } from './module-quizz.controller'
import { ModuleAttemptController } from './module-quiz-attempt.controller'
import { LessonAttemptController } from './lesson-attempt.controller'

@Module({
  controllers: [QuizzController, AttemptController,ModuleQuizzController,ModuleAttemptController,LessonAttemptController],
  providers: [QuizzService, QuizzRepository, QuizAttemptService, QuizAttemptRepository],
})
export class QuizzModule {}
