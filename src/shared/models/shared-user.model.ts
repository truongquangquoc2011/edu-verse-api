import { z } from 'zod'
import { UserStatus } from '../constants/auth.constant'

// === Main User schema ===
export const UserSchema = z.object({
  id: z.number(),
  email: z.string().email(),
  fullname: z
    .string()
    .min(1, { message: 'Name is required' })
    .max(100, { message: 'Name must be at most 100 characters long' }),
  password: z
    .string()
    .min(6, 'Password must be at least 6 characters long')
    .max(100, 'Password must be at most 100 characters long'),
  username: z.string().nullable(),
  phoneNumber: z
    .string()
    .min(10, { message: 'Phone number must be at least 10 characters long' })
    .max(15, { message: 'Phone number must be at most 15 characters long' }),
  avatar: z.string().nullable(),
  dateOfBirth: z.date().nullable(),
  totpSecret: z.string().nullable(),
  status: z.enum([UserStatus.ACTIVE, UserStatus.INACTIVE, UserStatus.BLOCKED, UserStatus.SUSPENDED]),
  roleId: z.number().positive(),
  createdById: z.number().nullable(),
  updatedById: z.number().nullable(),
  deletedAt: z.date().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
})
export type UserType = z.infer<typeof UserSchema>
  