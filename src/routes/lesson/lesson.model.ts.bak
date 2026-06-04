import { z } from 'zod'
import { ERROR_MESSAGE } from 'src/shared/constants/error-message.constant'
import { PaginationQuerySchema, PaginationResBaseSchema } from 'src/shared/models/pagination.model'
import { QuizStatus } from '@prisma/client'

const LESSON_ERR = ERROR_MESSAGE.VALIDATION.LESSON
const TITLE_MIN_LENGTH = 1
const TITLE_MAX_LENGTH = 255
export const CreateLessonSchema = z
  .object({
    title: z
      .string({
        required_error: LESSON_ERR.TITLE_REQUIRED,
        invalid_type_error: LESSON_ERR.TITLE_INVALID,
      })
      .min(TITLE_MIN_LENGTH, { message: LESSON_ERR.TITLE_EMPTY })
      .max(TITLE_MAX_LENGTH, { message: LESSON_ERR.TITLE_MAX }),
    videoUrl: z
      .string({ invalid_type_error: LESSON_ERR.VIDEO_URL_INVALID })
      .url({ message: LESSON_ERR.VIDEO_URL_FORMAT })
      .nullable()
      .optional(),

    documentUrl: z
      .string({ invalid_type_error: LESSON_ERR.DOCUMENT_URL_INVALID })
      .url({ message: LESSON_ERR.DOCUMENT_URL_FORMAT })
      .optional()
      .refine((val) => !val || val.startsWith('https://'), { message: 'Document URL must be HTTPS' }),

    lessonOrder: z.coerce
      .number({ invalid_type_error: LESSON_ERR.LESSON_ORDER_INVALID })
      .int()
      .nonnegative()
      .optional(),

    isPreviewable: z.boolean({ invalid_type_error: LESSON_ERR.IS_PREVIEWABLE_INVALID }).optional(),
  })
  .strict()

export const CreateLessonResSchema = z.object({
  id: z.number(),
  chapterId: z.number(),
  title: z.string(),
  videoUrl: z.string().nullable(),
  documentUrl: z.string().nullable(),
  lessonOrder: z.number(),
  isPreviewable: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
})
export const CreateLessonsSchema = z.object({
  lessons: z.array(CreateLessonSchema).nonempty({
    message: LESSON_ERR.EMPTY_ARRAY,
  }),
})
export const UpdateLessonSchema = CreateLessonSchema.partial().strict()
export const UpdateLessonResSchema = CreateLessonResSchema

export const ListLessonsResSchema = PaginationResBaseSchema.extend({
  items: z.array(CreateLessonResSchema),
})

export const ListLessonsQuerySchema = PaginationQuerySchema

export const AddVideoLinkSchema = z.object({
  videoUrl: z
    .string({ invalid_type_error: LESSON_ERR.VIDEO_URL_INVALID })
    .url({ message: LESSON_ERR.VIDEO_URL_FORMAT }),
})
export const AddPdfSchema = z.object({
  documentUrl: z
    .string({ invalid_type_error: LESSON_ERR.DOCUMENT_URL_INVALID })
    .url({ message: LESSON_ERR.DOCUMENT_URL_FORMAT })
    .refine((val) => val.startsWith('https://'), { message: LESSON_ERR.DOCUMENT_URL_HTTPS }),
})

/**
 * CLIENT STUDY: List lessons in a module with completion status
 * for endpoint: GET /modules/:moduleId/lessons
 */
export const LessonStudyItemSchema = z.object({
  id: z.number(),
  title: z.string(),
  lessonOrder: z.number(),
  isPreviewable: z.boolean(),
  isCompleted: z.boolean().describe('Has the current user completed this lesson?'),
})

export const ListLessonsStudyQuerySchema = PaginationQuerySchema

export const ListLessonsStudyResSchema = PaginationResBaseSchema.extend({
  items: z.array(LessonStudyItemSchema),
})

/**
 * CLIENT STUDY: Lesson detail with completion status
 * for endpoint: GET /lessons/:lessonId
 *
 * Reuse CreateLessonResSchema shape and add isCompleted.
 */
export const LessonStudyDetailSchema = CreateLessonResSchema.extend({
  isCompleted: z.boolean().describe('Has the current user completed this lesson?'),
})

// ===== QUIZ FOR LESSON (CLIENT STUDY) =====
export const LessonQuizResultSchema = z.object({
  score: z.number(),
  submitted_at: z.date().nullable(),
})

export const LessonQuizItemSchema = z.object({
  id: z.number(),
  title: z.string(),
  description: z.string().nullable().optional(),
  status: z.nativeEnum(QuizStatus),
  quiz_result: LessonQuizResultSchema.nullable(),
})

export const ListLessonQuizQuerySchema = PaginationQuerySchema

export const ListLessonQuizResSchema = PaginationResBaseSchema.extend({
  items: z.array(LessonQuizItemSchema),
})

// types
export type LessonQuizResultType = z.infer<typeof LessonQuizResultSchema>
export type LessonQuizItemType = z.infer<typeof LessonQuizItemSchema>
export type ListLessonQuizQueryType = z.infer<typeof ListLessonQuizQuerySchema>
export type ListLessonQuizResType = z.infer<typeof ListLessonQuizResSchema>
export type CreateLessonType = z.infer<typeof CreateLessonSchema>
export type CreateLessonResType = z.infer<typeof CreateLessonResSchema>
export type UpdateLessonType = z.infer<typeof UpdateLessonSchema>
export type UpdateLessonResType = z.infer<typeof UpdateLessonResSchema>
export type LessonResType = z.infer<typeof CreateLessonResSchema>
export type ListLessonsResType = z.infer<typeof ListLessonsResSchema>
export type AddVideoLinkType = z.infer<typeof AddVideoLinkSchema>
export type AddPdfType = z.infer<typeof AddPdfSchema>
// client study types
export type LessonStudyItemType = z.infer<typeof LessonStudyItemSchema>
export type ListLessonsStudyQueryType = z.infer<typeof ListLessonsStudyQuerySchema>
export type ListLessonsStudyResType = z.infer<typeof ListLessonsStudyResSchema>
export type LessonStudyDetailType = z.infer<typeof LessonStudyDetailSchema>
