import { HTTPMethod } from '@prisma/client'
import { PermissionSchema } from 'src/shared/models/shared-permission.model'
import z from 'zod'
import { RoleSchema } from '../auth/auth.model'

const HTTPMethodSchema = z.enum([
  HTTPMethod.GET,
  HTTPMethod.POST,
  HTTPMethod.PUT,
  HTTPMethod.DELETE,
  HTTPMethod.PATCH,
  HTTPMethod.OPTIONS,
  HTTPMethod.HEAD,
])

const RoleOfInfoUserSchema = z.object({
  id: z.number().int().positive(),
  name: z.string(),
})

export const InfoUserSchema = z.object ({
   id: z.number().int().positive(),
   fullname: z.string(),
   role: RoleOfInfoUserSchema.nullable().optional()
})

// === Permission Response Schema ===
export const PermissionResponseSchema = PermissionSchema.omit({
  deletedAt: true,
})

// === Create Permission Schema ===
export const CreatePermissionBodySchema = PermissionSchema.pick({
  name: true,
  description: true,
  path: true,
  method: true,
}).strict()

// === Permission with Relations Schema ===
export const PermissionWithRelationsSchema = PermissionSchema.extend({
  roles: z.array(z.any()).optional(),
  users: z.array(z.any()).optional(),
  createdBy: InfoUserSchema.nullable().optional(),
  updatedBy: InfoUserSchema.nullable().optional().nullable().optional(),
})

// === Role Assignment Schema ===
export const AssignRoleToPermissionSchema = z.object({
  roleIds: z
    .array(z.number().int().positive())
    .min(1, { message: 'At least one role ID must be provided' })
    .max(20, { message: 'Cannot assign more than 20 roles at once' }),
})

// === permission With Permissions Schema ===
export const PermissionWithRoleSchema = PermissionSchema.extend({
  roles: z.array(RoleSchema),
})

// === Permission List Using Pagination Response Schema ===
export const GetPermissionsResSchema = z.object({
  data: z.array(PermissionResponseSchema),
  pagination: z.object({
    page: z.number().int().positive(),
    limit: z.number().int().positive(),
    total: z.number().int().nonnegative(),
    totalPages: z.number().int().nonnegative(),
  }),
})

// === Permission Query Parameters Schema ===
export const GetPermissionQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 1))
    .refine((val) => val > 0, { message: 'Page must be a positive number' }),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 10))
    .refine((val) => val > 0 && val <= 100, { message: 'Limit must be between 1 and 100' }),
  search: z
    .string()
    .optional()
    .transform((val) => (val ? val.trim() : undefined))
    .refine((val) => !val || val.length >= 2, { message: 'Search term must be at least 2 characters long' }),
  method: z
    .string()
    .optional()
    .transform((val) => (val ? val.trim() : undefined))
    .refine((val) => !val || val.length >= 2, { message: 'method term must be at least 2 characters long' }),
  isActive: z
    .string()
    .optional()
    .transform((val) => (val === 'true' ? true : val === 'false' ? false : undefined)),
  includeDeleted: z
    .string()
    .optional()
    .transform((val) => val === 'true')
    .default('false'),
})

// === Base Permission Schema ===
export const getPermissionResSchema = z.object({
  data: z.array(
    PermissionSchema.omit({
      deletedAt: true
    }),
  ),
  totalItems: z.number(),
})

export const UpdatePermissionBodySchema = CreatePermissionBodySchema.partial().strict()
export const CreatePermissionResSchema = PermissionResponseSchema.extend({
  createdBy: InfoUserSchema.nullable().optional()
})
export const UpdatePermissionResSchema = PermissionResponseSchema.extend({
  createdBy: InfoUserSchema.nullable().optional(),
  updatedBy: InfoUserSchema.nullable().optional()
})
export const AssignRoleToPermissionResSchema = PermissionWithRelationsSchema
export const GetPermissionDetailSchema = PermissionResponseSchema

export type HTTPMethodType = (typeof HTTPMethod)[keyof typeof HTTPMethod]
export type PermissionResponseType = z.infer<typeof PermissionResponseSchema>
export type CreatePermissionBodyType = z.infer<typeof CreatePermissionBodySchema>
export type UpdatePermissionBodyType = z.infer<typeof UpdatePermissionBodySchema>
export type PermissionType = z.infer<typeof PermissionResponseSchema>
export type AssignRoleToPermissionType = z.infer<typeof AssignRoleToPermissionSchema>
export type PermissionWithRelationsType = z.infer<typeof PermissionWithRelationsSchema>
export type PermissionWithRoleType = z.infer<typeof PermissionWithRoleSchema>
export type GetPermissionQueryTye = z.infer<typeof GetPermissionQuerySchema>
export type GetPermissionsResType = z.infer<typeof GetPermissionsResSchema>
export type GetAllPermissionsResType = z.infer<typeof getPermissionResSchema>
