import { FeedbackStatus, FeedbackType } from 'src/shared/constants/feedback.constant'
import z from 'zod'

const TITLE_MIN_LENGTH = 1
const CONTENT_MIN_LENGTH = 1

// Reusable string validation
const RequiredStringSchema = (field: string, min: number) =>
  z
    .string()
    .min(min, { message: `${field} is required and must be at least ${min} character` })
    .refine((val) => val.trim().length > 0, { message: `${field} cannot be only whitespace` })

export const FeedbackSchema = z.object({
  id: z.number().int(),
  userId: z.number().int(),
  courseId: z.number().int().nullable().optional(),
  title: RequiredStringSchema('Title', TITLE_MIN_LENGTH),
  content: RequiredStringSchema('Content', CONTENT_MIN_LENGTH),
  feedbackType: z.nativeEnum(FeedbackType).optional(),
  status: z.nativeEnum(FeedbackStatus).optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
  deletedAt: z.date().nullable(),
  createdById: z.number().nullable(),
  updatedById: z.number().nullable(),
})

export const FeedbackPublicSchema = FeedbackSchema.omit({
  deletedAt: true,
  createdById: true,
  updatedById: true,
})

// Create input schema
/** Schema for creating feedback, requires title/content. */
export const CreateFeedbackBodySchema = z
  .object({
    title: RequiredStringSchema('Title', TITLE_MIN_LENGTH),
    content: RequiredStringSchema('Content', CONTENT_MIN_LENGTH),
    feedbackType: z.nativeEnum(FeedbackType).optional(),
    courseId: z.number().int().nullable().optional(),
  })
  .strict()

// Admin query schema
/** Schema for admin feedback query filters and pagination. */
export const GetAdminFeedbackQuerySchema = z
  .object({
    status: z.nativeEnum(FeedbackStatus),
    feedbackType: z.nativeEnum(FeedbackType),
    userId: z.coerce.number().int().optional(),
    courseId: z.coerce.number().int().optional(),
    skip: z.coerce.number().int().nonnegative().optional(),
    take: z.coerce.number().int().positive().optional(),
  })
  .strict()

// List response schema
/** Schema for paginated feedbacks response. */
export const GetFeedbacksResponseSchema = z.object({
  data: z.array(FeedbackPublicSchema),
  pagination: z.object({
    page: z.number().int().positive(),
    limit: z.number().int().positive(),
    total: z.number().int().nonnegative(),
    totalPages: z.number().int().nonnegative(),
  }),
})

export type FeedbackModelType = z.infer<typeof FeedbackSchema>
export type FeedbackResponseType = z.infer<typeof FeedbackPublicSchema>
export type CreateFeedbackBodyType = z.infer<typeof CreateFeedbackBodySchema>
export type GetAdminFeedbackQueryType = z.infer<typeof GetAdminFeedbackQuerySchema>
