import { z } from 'zod'
import { PaginationQuerySchema, PaginationResBaseSchema } from 'src/shared/models/pagination.model'
// Constants configurable
const TITLE_MIN_LENGTH = 1
const TITLE_MAX_LENGTH = 255
const QUIZ_STATUS_VALUES = ['Draft', 'Published', 'Archived'] as const
const QUESTION_MIN_LENGTH = 1
const QUESTION_MAX_LENGTH = 1000
export const QuizStatus = z.enum(QUIZ_STATUS_VALUES)
const SCORE_MIN = 0
const SCORE_MAX = 100

// Input schema with refinements
export const CreateQuizInputSchema = z
  .object({
    title: z
      .string()
      .min(TITLE_MIN_LENGTH, { message: 'Title is required and must be at least 1 character' })
      .max(TITLE_MAX_LENGTH, { message: `Title must be at most ${TITLE_MAX_LENGTH} characters` })
      .refine((val) => val.trim().length > 0, { message: 'Title cannot be only whitespace' }),
    description: z.string().nullable().optional(),
    status: QuizStatus.default('Published'),
  })
  .strict()

// Response schema reusing input
export const CreateQuizResponseSchema = z.object({
  id: z.number().int(),
  title: z.string(),
  description: z.string().nullable(),
  status: QuizStatus,
  createdAt: z.date(),
  updatedAt: z.date(),
  // now nullable because a quiz can belong to a module instead
  lessonId: z.number().int().nullable(),
  // include moduleId (also nullable)
  moduleId: z.number().int().nullable(),
})

// ==================== MODULE-LEVEL PATH PARAMS ====================
export const ModuleQuizPathParamsSchema = z.object({
  courseId: z.coerce.number().int().positive(),
  moduleId: z.coerce.number().int().positive(),
})

export const ModuleQuizIdPathParamsSchema = ModuleQuizPathParamsSchema.extend({
  quizId: z.coerce.number().int().positive(),
})

export const ModuleQuizAttemptPathParamsSchema = z.object({
  courseId: z.coerce.number().int().positive(),
  moduleId: z.coerce.number().int().positive(),
  quizId: z.coerce.number().int().positive(),
})

//  module-level question/option (no lessonId)
export const ModuleQuizQuestionPathParamsSchema = ModuleQuizIdPathParamsSchema.extend({
  questionId: z.coerce.number().int().positive(),
})

export const ModuleQuizOptionPathParamsSchema = ModuleQuizQuestionPathParamsSchema.extend({
  optionId: z.coerce.number().int().positive(),
})

// ==================== QUIZ UPDATE/LIST ====================
export const UpdateQuizInputSchema = CreateQuizInputSchema.partial()
  .strict()
  .refine((data) => Object.keys(data).length > 0, { message: 'At least one field must be provided for update' })

export const UpdateQuizResSchema = CreateQuizResponseSchema

export const ListQuizResSchema = PaginationResBaseSchema.extend({
  items: z.array(CreateQuizResponseSchema),
})
export const ListQuizQuerySchema = PaginationQuerySchema

// ==================== LESSON-LEVEL PATH PARAMS ====================
export const QuizPathParamsSchema = z.object({
  courseId: z.coerce.number().int().positive({ message: 'Course ID must be positive integer' }),
  moduleId: z.coerce.number().int().positive({ message: 'Module ID must be positive integer' }),
  lessonId: z.coerce.number().int().positive({ message: 'Lesson ID must be positive integer' }),
  quizId: z.coerce.number().int().positive({ message: 'Quiz ID must be positive integer' }).optional(),
})

// ===== QUIZ QUESTION =====

// Input schema for creating a Quiz Question
export const CreateQuizQuestionInputSchema = z
  .object({
    content: z
      .string()
      .min(QUESTION_MIN_LENGTH, { message: 'Content is required' })
      .max(QUESTION_MAX_LENGTH, { message: `Content must be at most ${QUESTION_MAX_LENGTH} characters` })
      .refine((val) => val.trim().length > 0, { message: 'Content cannot be only whitespace' }),
    explanation: z
      .string()
      .max(QUESTION_MAX_LENGTH, { message: `Explanation must be at most ${QUESTION_MAX_LENGTH} characters` })
      .optional()
      .transform((val) => val ?? ''), // always return string
  })
  .strict()

// Response schema for Quiz Question
export const QuizQuestionResponseSchema = CreateQuizQuestionInputSchema.extend({
  id: z.number(),
  quizId: z.number(),
  questionOrder: z.number(),
  createdAt: z.date(),
  updatedAt: z.date(),
})

// Update schema for Quiz Question
export const UpdateQuizQuestionInputSchema = z
  .object({
    content: z
      .string()
      .min(QUESTION_MIN_LENGTH, { message: 'Content is required' })
      .max(QUESTION_MAX_LENGTH, { message: `Content must be at most ${QUESTION_MAX_LENGTH} characters` })
      .refine((val) => val.trim().length > 0, { message: 'Content cannot be only whitespace' })
      .optional(),
    explanation: z
      .string()
      .max(QUESTION_MAX_LENGTH, { message: `Explanation must be at most ${QUESTION_MAX_LENGTH} characters` })
      .optional()
      .transform((val) => val ?? ''), // convert null to empty string
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided for update',
  })

// Reorder schema for Quiz Question
export const ReorderQuizQuestionInputSchema = z
  .object({
    newOrder: z.number().int().positive({ message: 'New order must be a positive integer' }),
  })
  .strict()

// List schema with pagination
export const ListQuizQuestionResSchema = PaginationResBaseSchema.extend({
  items: z.array(QuizQuestionResponseSchema),
})
export const ListQuizQuestionQuerySchema = PaginationQuerySchema

// LESSON-LEVEL question path params
export const QuizQuestionPathParamsSchema = z.object({
  courseId: z.coerce.number().int().positive(),
  moduleId: z.coerce.number().int().positive(),
  lessonId: z.coerce.number().int().positive(),
  quizId: z.coerce.number().int().positive(),
  questionId: z.coerce.number().int().positive(),
})

// ===== QUIZ ANSWER OPTION =====
const CONTENT_MIN_LENGTH = 1
const OptionContentSchema = z
  .string()
  .min(CONTENT_MIN_LENGTH, { message: 'Content is required and must be at least 1 character' })
  .trim()
  .refine((val) => val.length > 0, { message: 'Content cannot be only whitespace' })

/** Schema for creating quiz answer option, requires content and order. */
export const CreateQuizAnswerOptionInputSchema = z
  .object({
    content: OptionContentSchema,
    isCorrect: z.boolean().optional().default(false),
    optionOrder: z.coerce.number().int().nonnegative({ message: 'Option order must be non-negative integer' }),
  })
  .strict()
  .superRefine((data, ctx) => {
    // Example: Additional check if needed
    if (data.isCorrect && data.content.length < 5) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Correct option content must be at least 5 characters',
        path: ['content'],
      })
    }
  })

/** Schema for updating quiz answer option, at least one field required. */
export const UpdateQuizAnswerOptionInputSchema = z
  .object({
    content: OptionContentSchema.optional(),
    isCorrect: z.boolean().optional(),
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0, { message: 'At least one field must be provided for update' })

export const ReorderQuizAnswerOptionInputSchema = z.object({
  optionOrder: z.coerce.number().int().nonnegative(),
})

export const QuizAnswerOptionResponseSchema = z.object({
  id: z.number(),
  questionId: z.number(),
  content: z.string(),
  isCorrect: z.boolean(),
  optionOrder: z.number().int(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})

export const ListQuizAnswerOptionQuerySchema = PaginationQuerySchema

export const ListQuizAnswerOptionResSchema = PaginationResBaseSchema.extend({
  items: z.array(QuizAnswerOptionResponseSchema),
})

// LESSON-LEVEL option path params
export const QuizOptionPathParamsSchema = z.object({
  courseId: z.coerce.number().int().positive(),
  moduleId: z.coerce.number().int().positive(),
  lessonId: z.coerce.number().int().positive(),
  quizId: z.coerce.number().int().positive(),
  questionId: z.coerce.number().int().positive(),
  optionId: z.coerce.number().int().positive(),
})

// ===== QUIZ ATTEMPT =====
const PositiveIdSchema = z.coerce.number().int().positive({ message: 'ID must be positive integer' })
/** Schema for quiz attempt path parameters, all positive IDs. */
export const QuizAttemptPathParamsSchema = z.object({
  courseId: PositiveIdSchema,
  moduleId: PositiveIdSchema,
  lessonId: PositiveIdSchema,
  quizId: PositiveIdSchema,
})

// When interacting directly with an attempt (get/submit/save answers)
export const QuizAttemptIdParamsSchema = z.object({
  attemptId: z.coerce.number().int().positive(),
})

/** Schema for quiz attempt response, with score validation. */
export const QuizAttemptResponseSchema = z
  .object({
    id: z.number().int(),
    quizId: z.number().int(),
    userId: z.number().int(),
    score: z.coerce
      .number()
      .min(SCORE_MIN, { message: `Score must be at least ${SCORE_MIN}` })
      .max(SCORE_MAX, { message: `Score must be at most ${SCORE_MAX}` }),
    completedAt: z.coerce.date().nullable(),
    createdAt: z.coerce.date(),
    updatedAt: z.coerce.date(),
  })
  .superRefine((data, ctx) => {
    if (data.completedAt && data.score < SCORE_MIN) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Completed attempt must have valid score',
        path: ['score'],
      })
    }
  })

// Input payload for saving a quiz answer
export const SaveQuizAnswerInputSchema = z
  .object({
    questionId: z.coerce.number().int().positive(),
    answerOptionId: z.coerce.number().int().positive(),
  })
  .strict()

// Response for listing quiz attempts
export const ListQuizAttemptResSchema = PaginationResBaseSchema.extend({
  items: z.array(QuizAttemptResponseSchema),
})

// Lightweight option structure for quiz-taking view (does not expose isCorrect)
export const QuizAttemptOptionLiteSchema = z.object({
  optionId: z.number().int(),
  content: z.string(),
  order: z.number().int(),
})

/** Schema for quiz question item in attempt, with options and selected. */
export const QuizAttemptQuestionItemSchema = z.object({
  questionId: z.number().int(),
  content: z.string(),
  explanation: z.string().optional().default(''),
  order: z.number().int(),
  options: z.array(QuizAttemptOptionLiteSchema),
  selectedAnswerOptionId: z
    .number()
    .int()
    .nullable()
    .refine((val) => val !== null || true, { message: 'Selected option required for submission' }),
})

// Response for endpoint: GET /attempts/:attemptId/questions
export const QuizAttemptQuestionsResSchema = z.object({
  items: z.array(QuizAttemptQuestionItemSchema),
})

// ===== FULL QUIZ FOR ATTEMPT (with correct answers) =====

/**
 * Option structure for full quiz attempt view, including correctness.
 * Maps to QuizAnswerOption in DB.
 */
export const QuizAttemptOptionWithCorrectSchema = z.object({
  optionId: z.number().int(), // maps to QuizAnswerOption.id
  content: z.string(),
  order: z.number().int(), // maps to QuizAnswerOption.optionOrder
  isCorrect: z.boolean(),
})

/**
 * Question structure for full quiz attempt view, including its options.
 * Maps to QuizQuestion in DB.
 */
export const QuizAttemptQuestionWithCorrectSchema = z.object({
  questionId: z.number().int(), // maps to QuizQuestion.id
  content: z.string(),
  explanation: z.string().optional().default(''),
  order: z.number().int(), // maps to QuizQuestion.questionOrder
  options: z.array(QuizAttemptOptionWithCorrectSchema),
})

/**
 * Response schema for:
 *   GET /courses/:courseId/modules/:moduleId/quizzes/:quizId/attempt
 * Returns full quiz with questions and options (including correct answers).
 */
export const QuizAttemptFullResSchema = z.object({
  quizId: z.number().int(),
  title: z.string(),
  description: z.string().nullable(),
  questions: z.array(QuizAttemptQuestionWithCorrectSchema),
})

/**
 * Input schema for submitting all answers for a quiz attempt in a single request.
 * Reuses SaveQuizAnswerInputSchema for individual answers.
 */
export const SubmitQuizAttemptInputSchema = z
  .object({
    answers: z.array(SaveQuizAnswerInputSchema).min(1, {
      message: 'At least one answer is required',
    }),
  })
  .strict()

/**
 * Response schema for submitting a quiz attempt:
 *  - Extends QuizAttemptResponseSchema with additional statistics.
 */
export const SubmitQuizAttemptResSchema = QuizAttemptResponseSchema.and(
  z.object({
    totalQuestions: z.number().int().nonnegative(),
    correctCount: z.number().int().nonnegative(),
  }),
)
// ==================== LESSON-LEVEL ATTEMPT PATH PARAMS ====================
export const LessonQuizAttemptPathParamsSchema = z.object({
  courseId: z.coerce.number().int().positive(),
  lessonId: z.coerce.number().int().positive(),
  quizId: z.coerce.number().int().positive(),
})

export type LessonQuizAttemptPathParamsType = z.infer<typeof LessonQuizAttemptPathParamsSchema>
// ==================== TYPES ====================

// module quiz
export type CreateQuizType = z.infer<typeof CreateQuizInputSchema>
export type CreateQuizResType = z.infer<typeof CreateQuizResponseSchema>
export type UpdateQuizType = z.infer<typeof UpdateQuizInputSchema>
export type UpdateQuizResType = z.infer<typeof UpdateQuizResSchema>
export type ListQuizResType = z.infer<typeof ListQuizResSchema>
export type QuizResType = z.infer<typeof CreateQuizResponseSchema>
export type QuizPathParamsType = z.infer<typeof QuizPathParamsSchema>

// Quiz Question
export type CreateQuizQuestionType = z.infer<typeof CreateQuizQuestionInputSchema>
export type QuizQuestionResType = z.infer<typeof QuizQuestionResponseSchema>
export type UpdateQuizQuestionType = z.infer<typeof UpdateQuizQuestionInputSchema>
export type ReorderQuizQuestionType = z.infer<typeof ReorderQuizQuestionInputSchema>
export type ListQuizQuestionResType = z.infer<typeof ListQuizQuestionResSchema>

// QUIZ ANSWER
export type CreateQuizAnswerOptionType = z.infer<typeof CreateQuizAnswerOptionInputSchema>
export type UpdateQuizAnswerOptionType = z.infer<typeof UpdateQuizAnswerOptionInputSchema>
export type ReorderQuizAnswerOptionType = z.infer<typeof ReorderQuizAnswerOptionInputSchema>
export type QuizAnswerOptionResType = z.infer<typeof QuizAnswerOptionResponseSchema>
export type ListQuizAnswerOptionResType = z.infer<typeof ListQuizAnswerOptionResSchema>
export type QuizOptionPathParamsType = z.infer<typeof QuizOptionPathParamsSchema>

// Quiz attempt
export type QuizAttemptQuestionsResType = z.infer<typeof QuizAttemptQuestionsResSchema>
export type QuizAttemptResType = z.infer<typeof QuizAttemptResponseSchema>
export type SaveQuizAnswerType = z.infer<typeof SaveQuizAnswerInputSchema>
export const ListQuizAttemptQuerySchema = PaginationQuerySchema
export type ListQuizAttemptResType = z.infer<typeof ListQuizAttemptResSchema>
export type QuizAttemptPathParamsType = z.infer<typeof QuizAttemptPathParamsSchema>
export type QuizAttemptIdParamsType = z.infer<typeof QuizAttemptIdParamsSchema>

// New types for full quiz attempt + submit result
export type QuizAttemptFullResType = z.infer<typeof QuizAttemptFullResSchema>
export type SubmitQuizAttemptResType = z.infer<typeof SubmitQuizAttemptResSchema>

// ===== module-level path params types =====
export type ModuleQuizPathParamsType = z.infer<typeof ModuleQuizPathParamsSchema>
export type ModuleQuizIdPathParamsType = z.infer<typeof ModuleQuizIdPathParamsSchema>
export type ModuleQuizAttemptPathParamsType = z.infer<typeof ModuleQuizAttemptPathParamsSchema>
export type ModuleQuizQuestionPathParamsType = z.infer<typeof ModuleQuizQuestionPathParamsSchema>
export type ModuleQuizOptionPathParamsType = z.infer<typeof ModuleQuizOptionPathParamsSchema>
