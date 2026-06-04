import { z } from 'zod'
import { PaginationQuerySchema, PaginationResBaseSchema } from 'src/shared/models/pagination.model'

// ==================== CONSTANTS ====================
export const CART_MAX_ITEMS = 50

// ==================== INPUT SCHEMAS ====================

// Add item to cart
export const AddCartInputSchema = z
  .object({
    courseId: z.coerce.number().int().positive({ message: 'courseId must be a positive integer' }),
    // NEW: optional coupon code
    couponCode: z.string().trim().min(1).max(64).optional(),
  })
  .strict()

// Remove item path params
export const CartItemPathParamsSchema = z.object({
  courseId: z.coerce.number().int().positive({ message: 'courseId must be a positive integer' }),
})

// List (you can extend later for filters if needed)
export const ListCartQuerySchema = PaginationQuerySchema

// ==================== RESPONSE SCHEMAS ====================

// Minimal course info for cart list (no sensitive fields, no isCorrect, etc.)
export const CartCourseMiniSchema = z.object({
  id: z.number().int(),
  title: z.string(),
  thumbnail: z.string().nullable().optional(),
  // Decimal from Prisma can be serialized as string; allow number|string to be flexible with your global transformer
  price: z.union([z.number(), z.string()]),
  isFree: z.boolean(),
  category: z
    .object({
      id: z.number().int(),
      name: z.string(),
    })
    .nullable()
    .optional(),
  teacher: z
    .object({
      id: z.number().int(),
      fullname: z.string().optional(),
      username: z.string().nullable().optional(),
    })
    .nullable()
    .optional(),
})

// price block for each item
export const CartPricingSchema = z.object({
  originalPrice: z.number().int().nonnegative(),
  discount: z.number().int().nonnegative(),
  finalPrice: z.number().int().nonnegative(),
})

//  best coupon for item 
export const CartBestCouponSchema = z.object({
  code: z.string(),
  kind: z.enum(['PERCENT', 'AMOUNT']),
  value: z.number().nonnegative(), //% or amount of money, depending on the kind
  discountAmount: z.number().int().nonnegative(), // reality money
})

// One cart row
export const CartItemResponseSchema = z.object({
  courseId: z.number().int(),
  addedAt: z.coerce.date(), // createdAt from Cart
  course: CartCourseMiniSchema,
  pricing: CartPricingSchema,
  bestCoupon: CartBestCouponSchema.nullable(),
})

// List cart response
export const ListCartResSchema = PaginationResBaseSchema.extend({
  originalTotal: z.number().int().nonnegative(),
  discountTotal: z.number().int().nonnegative(),
  grandTotal: z.number().int().nonnegative(),
  items: z.array(CartItemResponseSchema),
})

// Add item response
export const AddCartResSchema = z.object({
  added: z.boolean().default(true), // true if add to cart
  enrolled: z.boolean().default(false), // true if course free -> auto-enroll
  item: CartItemResponseSchema.optional(), // sometimes enrolled for free so didn't pay for the item
  message: z.string(),
})

// Simple message for remove/clear
export const CartMessageResSchema = z.object({
  message: z.string(),
})

// ==================== TYPES ====================

export type AddCartInputType = z.infer<typeof AddCartInputSchema>
export type CartItemPathParamsType = z.infer<typeof CartItemPathParamsSchema>

export type CartCourseMiniType = z.infer<typeof CartCourseMiniSchema>
export type CartPricingType = z.infer<typeof CartPricingSchema>
export type CartBestCouponType = z.infer<typeof CartBestCouponSchema>
export type CartItemResponseType = z.infer<typeof CartItemResponseSchema>

export type ListCartQueryType = z.infer<typeof ListCartQuerySchema>
export type ListCartResType = z.infer<typeof ListCartResSchema>

export type AddCartResType = z.infer<typeof AddCartResSchema>
export type CartMessageResType = z.infer<typeof CartMessageResSchema>

// re-export constant for other layers (service/guard)
export const CART_MAX_ITEMS_CONST = CART_MAX_ITEMS
