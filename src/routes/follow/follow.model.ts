import z from 'zod'

export const TeacherIdParamSchema = z.object({
  teacherId: z
    .string()
    .transform((v) => parseInt(v, 10))
    .refine((n) => Number.isFinite(n) && n > 0, { message: 'Teacher ID must be a positive integer' }),
})

export const PaginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
})

export const FollowResSchema = z.object({
  success: z.literal(true),
  followerId: z.number().int().positive(),
})

export const UnfollowResSchema = z.object({
  success: z.literal(true),
})

export const FollowerItemSchema = z.object({
  id: z.number().int().positive(),
  createdAt: z.date(),
  user: z.object({
    id: z.number().int().positive(),
    fullname: z.string().nullable().optional(),
    username: z.string().nullable().optional(),
    avatar: z.string().nullable().optional(),
  }),
})

export const FollowersListResSchema = z.object({
  items: z.array(FollowerItemSchema),
  total: z.number().int().nonnegative(),
  page: z.number().int().positive(),
  limit: z.number().int().positive(),
})

export const FollowingItemSchema = z.object({
  id: z.number().int().positive(),
  createdAt: z.date(),
  teacher: z.object({
    id: z.number().int().positive(),
    specialization: z.string().nullable().optional(),
    followersCount: z.number().int().nonnegative(),
    user: z.object({
      id: z.number().int().positive(),
      fullname: z.string().nullable().optional(),
      avatar: z.string().nullable().optional(),
    }),
  }),
})

export const FollowingListResSchema = z.object({
  items: z.array(FollowingItemSchema),
  total: z.number().int().nonnegative(),
  page: z.number().int().positive(),
  limit: z.number().int().positive(),
})

export const UserIdParamSchema = z.object({
  userId: z
    .string()
    .transform((v) => parseInt(v, 10))
    .refine((n) => Number.isFinite(n) && n > 0, { message: 'User ID must be a positive integer' }),
})

export type TeacherIdParamType = z.infer<typeof TeacherIdParamSchema>
export type PaginationQueryType = z.infer<typeof PaginationQuerySchema>
export type FollowResType = z.infer<typeof FollowResSchema>
export type UnfollowResType = z.infer<typeof UnfollowResSchema>
export type FollowersListResType = z.infer<typeof FollowersListResSchema>
export type FollowingListResType = z.infer<typeof FollowingListResSchema>
