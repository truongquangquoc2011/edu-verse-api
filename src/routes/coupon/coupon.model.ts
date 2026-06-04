import { CouponDiscount } from 'src/shared/constants/coupon.constant'
import z from 'zod'

const MAX_CODE_LENGTH = 8

const CouponBaseSchema = z.object({
  id: z.number().int(),
  code: z.string().max(MAX_CODE_LENGTH, {
    message: `Code must be at most ${MAX_CODE_LENGTH} characters`,
  }),
  discountType: z.enum([CouponDiscount.FIXED, CouponDiscount.PERCENTAGE]),
  discountAmount: z.number().positive({ message: 'Discount amount must be positive' }),
  maxUses: z.number().int().nullable(),
  perUserLimit: z.number().int().nullable(),
  expirationDate: z.date(),
  createdAt: z.date(),
  updatedAt: z.date(),
  deletedAt: z.date().nullable(),
  courseId: z.number().nullable(),
  createdById: z.number().nullable(),
  updatedById: z.number().nullable(),
})

export const CouponSchema = CouponBaseSchema.superRefine((data, ctx) => {
  if (data.discountType === CouponDiscount.PERCENTAGE && data.discountAmount > 100) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Percentage discount cannot exceed 100',
      path: ['discountAmount'],
    })
  }
  if (data.expirationDate <= new Date()) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Expiration date must be in the future',
      path: ['expirationDate'],
    })
  }
})

export const CouponResponseSchema = CouponSchema

export const GetCouponsResSchema = z.object({
  data: z.array(CouponResponseSchema),
  pagination: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().default(10),
    search: z.string().optional(),
    total: z.number().int().nonnegative(),
    totalPages: z.number().int().nonnegative(),
  }),
})

export const CreateCouponBodySchema = CouponBaseSchema.pick({
  code: true,
  discountType: true,
  discountAmount: true,
  maxUses: true,
  perUserLimit: true,
  expirationDate: true,
  courseId: true,
})

export const GetCouponQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 1)),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 10)),
  search: z.string().optional(),
  includeDeleted: z
    .string()
    .optional()
    .transform((val) => val === 'true'),
})

export const CreateCouponResSchema = CouponResponseSchema
export const UpdateCouponBodySchema = CreateCouponBodySchema.partial()
export const UpdateCouponResSchema = CouponResponseSchema

export type CouponType = z.infer<typeof CouponSchema>
export type CouponResponseType = z.infer<typeof CouponResponseSchema>
export type GetCouponsResType = z.infer<typeof GetCouponsResSchema>
export type CreateCouponBodyType = z.infer<typeof CreateCouponBodySchema>
export type UpdateCouponBodyType = z.infer<typeof UpdateCouponBodySchema>
