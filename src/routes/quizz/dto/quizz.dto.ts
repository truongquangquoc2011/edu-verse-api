import { createZodDto } from 'nestjs-zod'
import {
  CreateQuizInputSchema,
  CreateQuizResponseSchema,
  UpdateQuizResSchema,
  ListQuizResSchema,
  ListQuizQuerySchema,
  QuizPathParamsSchema,
  QuizQuestionPathParamsSchema,
  UpdateQuizInputSchema,
  CreateQuizAnswerOptionInputSchema,
  UpdateQuizAnswerOptionInputSchema,
  ReorderQuizAnswerOptionInputSchema,
  QuizAnswerOptionResponseSchema,
  ListQuizAnswerOptionQuerySchema,
  ListQuizAnswerOptionResSchema,
  QuizOptionPathParamsSchema,
} from '../quiz.model'
import {
  CreateQuizQuestionInputSchema,
  QuizQuestionResponseSchema,
  UpdateQuizQuestionInputSchema,
  ReorderQuizQuestionInputSchema,
  ListQuizQuestionResSchema,
  ListQuizQuestionQuerySchema,
} from '../quiz.model'
import {
  QuizAttemptResponseSchema,
  ListQuizAttemptResSchema,
  ListQuizAttemptQuerySchema,
  QuizAttemptPathParamsSchema,
  QuizAttemptIdParamsSchema,
  SaveQuizAnswerInputSchema,
  QuizAttemptQuestionsResSchema,
  QuizAttemptFullResSchema,
  SubmitQuizAttemptInputSchema,
  SubmitQuizAttemptResSchema,
} from '../quiz.model'
// Module-level path params schemas (no lessonId)
import {
  ModuleQuizPathParamsSchema,
  ModuleQuizIdPathParamsSchema,
  ModuleQuizAttemptPathParamsSchema,
  ModuleQuizQuestionPathParamsSchema,
  ModuleQuizOptionPathParamsSchema,
} from '../quiz.model'
import { LessonQuizAttemptPathParamsSchema } from '../quiz.model'
export class CreateQuizDTO extends createZodDto(CreateQuizInputSchema) {}
export class CreateQuizResDTO extends createZodDto(CreateQuizResponseSchema) {}
export class UpdateQuizDTO extends createZodDto(UpdateQuizInputSchema) {}
export class UpdateQuizResDTO extends createZodDto(UpdateQuizResSchema) {}
export class ListQuizResDTO extends createZodDto(ListQuizResSchema) {}
export class ListQuizQueryDTO extends createZodDto(ListQuizQuerySchema) {}
export class QuizPathParamsDTO extends createZodDto(QuizPathParamsSchema) {}

// ========== DTO QuizQuestion ==========
export class CreateQuizQuestionDTO extends createZodDto(CreateQuizQuestionInputSchema) {}
export class QuizQuestionResDTO extends createZodDto(QuizQuestionResponseSchema) {}
export class UpdateQuizQuestionDTO extends createZodDto(UpdateQuizQuestionInputSchema) {}
export class ReorderQuizQuestionDTO extends createZodDto(ReorderQuizQuestionInputSchema) {}
export class ListQuizQuestionResDTO extends createZodDto(ListQuizQuestionResSchema) {}
export class ListQuizQuestionQueryDTO extends createZodDto(ListQuizQuestionQuerySchema) {}
export class QuizQuestionPathParamsDTO extends createZodDto(QuizQuestionPathParamsSchema) {}

// ====================== DTO: QUIZ ANSWER OPTION ======================
export class CreateQuizAnswerOptionDTO extends createZodDto(CreateQuizAnswerOptionInputSchema) {}
export class UpdateQuizAnswerOptionDTO extends createZodDto(UpdateQuizAnswerOptionInputSchema) {}
export class ReorderQuizAnswerOptionDTO extends createZodDto(ReorderQuizAnswerOptionInputSchema) {}

export class QuizAnswerOptionResDTO extends createZodDto(QuizAnswerOptionResponseSchema) {}

export class ListQuizAnswerOptionQueryDTO extends createZodDto(ListQuizAnswerOptionQuerySchema) {}
export class ListQuizAnswerOptionResDTO extends createZodDto(ListQuizAnswerOptionResSchema) {}

export class QuizOptionPathParamsDTO extends createZodDto(QuizOptionPathParamsSchema) {}

//  DTO: QUIZ ATTEMPT (shared / lesson-level)

export class QuizAttemptResDTO extends createZodDto(QuizAttemptResponseSchema) {}
export class ListQuizAttemptResDTO extends createZodDto(ListQuizAttemptResSchema) {}
export class ListQuizAttemptQueryDTO extends createZodDto(ListQuizAttemptQuerySchema) {}
export class QuizAttemptPathParamsDTO extends createZodDto(QuizAttemptPathParamsSchema) {}
export class QuizAttemptIdParamsDTO extends createZodDto(QuizAttemptIdParamsSchema) {}
export class SaveQuizAnswerDTO extends createZodDto(SaveQuizAnswerInputSchema) {}
export class QuizAttemptQuestionsResDTO extends createZodDto(QuizAttemptQuestionsResSchema) {}

const QuizAttemptFullPathParamsSchema = QuizAttemptPathParamsSchema.merge(QuizAttemptIdParamsSchema) // add @Param('attemptId') attemptId: number

/** Used for routes with :attemptId to maintain style: const ctx = { userId, ...params } */
export class QuizAttemptFullPathParamsDTO extends createZodDto(QuizAttemptFullPathParamsSchema) {}

// NEW: full quiz for attempt (GET) & submit all answers (POST)

export class QuizAttemptFullResDTO extends createZodDto(QuizAttemptFullResSchema) {}
export class SubmitQuizAttemptDTO extends createZodDto(SubmitQuizAttemptInputSchema) {}
export class SubmitQuizAttemptResDTO extends createZodDto(SubmitQuizAttemptResSchema) {}

// Module-level: `/courses/:courseId/modules/:moduleId/quizzes`
export class ModuleQuizPathParamsDTO extends createZodDto(ModuleQuizPathParamsSchema) {}

// Module-level: adds `quizId` for single quiz routes
export class ModuleQuizIdPathParamsDTO extends createZodDto(ModuleQuizIdPathParamsSchema) {}

// Module-level: adds `questionId` for question routes
export class ModuleQuizQuestionPathParamsDTO extends createZodDto(ModuleQuizQuestionPathParamsSchema) {}

// Module-level: adds `optionId` for option routes
export class ModuleQuizOptionPathParamsDTO extends createZodDto(ModuleQuizOptionPathParamsSchema) {}

// Module-level: attempt path params `/courses/:courseId/modules/:moduleId/quizzes/:quizId/attempt`
export class ModuleQuizAttemptPathParamsDTO extends createZodDto(ModuleQuizAttemptPathParamsSchema) {}

export class LessonQuizAttemptPathParamsDTO extends createZodDto(LessonQuizAttemptPathParamsSchema) {}
