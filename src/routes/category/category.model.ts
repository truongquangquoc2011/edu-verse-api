import z from 'zod'

const NAME_MIN_LENGTH = 1
const NAME_MAX_LENGTH = 100

export const CategoryEntitySchema = z.object({
  id: z.number().int(),
  name: z.string(),
  description: z.string().nullable(),
  parentCategoryId: z.number().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
  deletedAt: z.date().nullable(),
  createdById: z.number().nullable(),
  updatedById: z.number().nullable(),
})

export const CategoryPublicSchema = CategoryEntitySchema.omit({
  deletedAt: true,
  createdById: true,
  updatedById: true,
})

export const CreateCategoryBodySchema = z
  .object({
    name: z
      .string()
      .min(NAME_MIN_LENGTH, { message: 'Name is required and must be at least 1 character' })
      .max(NAME_MAX_LENGTH, { message: `Name must be at most ${NAME_MAX_LENGTH} characters` })
      .refine((val) => val.trim().length > 0, { message: 'Name cannot be only whitespace' }),
    description: z.string().optional(),
    parentCategoryId: z.number().optional(),
  })
  .strict()

export const UpdateCategoryBodySchema = CreateCategoryBodySchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  {
    message: 'At least one field must be provided for update',
  },
)

export const GetCategoriesResponseSchema = z.object({
  data: z.array(CategoryPublicSchema),
  pagination: z.object({
    page: z.number().int().positive(),
    limit: z.number().int().positive(),
    total: z.number().int().nonnegative(),
    totalPages: z.number().int().nonnegative(),
  }),
})

export const ListCategoryFilterSchema = z.object({
  skip: z.coerce.number().int().nonnegative().default(0).optional(),
  take: z.coerce.number().int().positive().max(100).default(20).optional(),
  text: z.string().min(1).optional(),
})

export type CategoryType = z.infer<typeof CategoryEntitySchema>
export type CategoryResponseType = z.infer<typeof CategoryPublicSchema>
export type CreateCategoryBodyType = z.infer<typeof CreateCategoryBodySchema>
export type UpdateCategoryBodyType = z.infer<typeof UpdateCategoryBodySchema>
