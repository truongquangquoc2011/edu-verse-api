import z from 'zod'

const HASHTAG_NAME_MIN_LENGTH = 1
const HASHTAG_NAME_MAX_LENGTH = 100

export const HashtagNameSchema = z.object({
  id: z.number().int(),
  name: z.string(),
  normalizedName: z.string(),
  isDelete: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
  deletedAt: z.date().nullable(),
  createdById: z.number().nullable(),
  updatedById: z.number().nullable(),
})

export const HashtagPublicSchema = HashtagNameSchema.omit({
  isDelete: true,
  deletedAt: true,
  createdById: true,
  updatedById: true,
})

export const CreateHashtagBodySchema = z
  .object({
    name: z
      .string()
      .min(HASHTAG_NAME_MIN_LENGTH, { message: 'Hashtag name is required and must be at least 1 character' })
      .max(HASHTAG_NAME_MAX_LENGTH, { message: `Hashtag name must be at most ${HASHTAG_NAME_MAX_LENGTH} characters` })
      .refine((val) => val.trim().length > 0, { message: 'Hashtag name cannot be only whitespace' })
      .refine((val) => !val.startsWith('#'), { message: 'Hashtag name should not start with "#"' })
      .transform((val) => val.trim().toLowerCase()),
  })
  .strict()

export const UpdateHashtagBodySchema = CreateHashtagBodySchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  { message: 'At least one field must be provided for update' },
)

export const GetHashtagsResponseSchema = z.object({
  data: z.array(HashtagPublicSchema),
  pagination: z.object({
    page: z.number().int().positive(),
    limit: z.number().int().positive(),
    total: z.number().int().nonnegative(),
    totalPages: z.number().int().nonnegative(),
  }),
})

export type HashtagType = z.infer<typeof HashtagNameSchema>
export type HashtagResponseType = z.infer<typeof HashtagPublicSchema>
export type CreateHashtagBodyType = z.infer<typeof CreateHashtagBodySchema>
export type UpdateHashtagBodyType = z.infer<typeof UpdateHashtagBodySchema>
