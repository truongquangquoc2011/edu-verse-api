import { PaginationQuerySchema, PaginationResBaseSchema } from 'src/shared/models/pagination.model'
import z from 'zod'

export const PublicProfileSchema = z.object({
  id: z.number(),
  username: z.string().nullable(),
  fullname: z.string(),
  avatar: z.string().nullable(),
  email: z.string().nullable(),
  phoneNumber: z.string().nullable(),
  status: z.string().optional(),
  dateOfBirth: z.date().nullable().optional(),
  createdAt: z.date(),

  role: z.object({
    id: z.number(),
    name: z.string(),
  }),

  _count: z.object({
    userFollower: z.number(),
    userEnrollment: z.number(),
    userCertificate: z.number(),
  }),
})

export const TeacherPublicItemSchema = z.object({
  id: z.number(),
  fullname: z.string(),
  avatar: z.string().nullable(),
})


export const TeacherListQuerySchema = PaginationQuerySchema.extend({
  search: z.string().trim().optional(),
})


export const TeacherListResSchema = PaginationResBaseSchema.extend({
  items: z.array(TeacherPublicItemSchema),
})

export type TeacherPublicItem = z.infer<typeof TeacherPublicItemSchema>
export type TeacherListQueryType = z.infer<typeof TeacherListQuerySchema>
export type TeacherListResType = z.infer<typeof TeacherListResSchema>
export type PublicProfileResType = z.infer<typeof PublicProfileSchema>
