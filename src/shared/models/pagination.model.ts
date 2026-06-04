import { z } from 'zod'
import { createZodDto } from 'nestjs-zod'

/**
 * Shared pagination schema
 */
export const PaginationQuerySchema = z.object({
  skip: z.coerce.number().int().nonnegative().default(0),
  take: z.coerce.number().int().positive().max(100).default(10),
})

export type PaginationQueryType = z.infer<typeof PaginationQuerySchema>

export class PaginationQueryDTO extends createZodDto(PaginationQuerySchema) {}

/**
 * Shared pagination response schema (generic)
 */
export const PaginationResBaseSchema = z.object({
  total: z.number().int().nonnegative(),
  skip: z.number().int().nonnegative(),
  take: z.number().int().positive(),
})

export type PaginationResBaseType = z.infer<typeof PaginationResBaseSchema>
