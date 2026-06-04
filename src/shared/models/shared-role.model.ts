import { z } from 'zod'

export const RoleSchema = z.object({
  id: z.number().int().positive({ message: 'Role ID must be a positive integer' }),
  name: z
    .string({ message: 'Role name is required' })
    .min(1, { message: 'Role name must not be empty' })
    .max(500, { message: 'Role name must be at most 500 characters long' }),
  description: z
    .string({ message: 'Role description is required' })
    .min(1, { message: 'Role description must not be empty' }),
  isActive: z.boolean({ message: 'Role active status must be a boolean' }).default(true),
  createdById: z.number().int().positive().nullable(),
  updatedById: z.number().int().positive().nullable(),
  deletedById: z.number().int().positive().nullable(),
  deletedAt: z.date().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
})