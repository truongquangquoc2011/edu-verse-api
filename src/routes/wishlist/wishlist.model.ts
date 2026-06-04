import { z } from 'zod'
import { PaginationQuerySchema, PaginationResBaseSchema } from 'src/shared/models/pagination.model'

// ==================== CONSTANTS ====================
export const WISHLIST_MAX_ITEMS = 50
// Reusable positive int
const PositiveIntSchema = z.coerce.number().int().positive({ message: 'Must be positive integer' });

// ==================== INPUT SCHEMAS ====================

// Add item to wishlist
export const AddWishlistInputSchema = z
  .object({
    courseId: z.coerce.number().int().positive({ message: 'courseId must be a positive integer' }),
  })
  .strict()

// Remove item path params
export const WishlistItemPathParamsSchema = z.object({
  courseId: z.coerce.number().int().positive({ message: 'courseId must be a positive integer' }),
})

// List 
export const ListWishlistQuerySchema = PaginationQuerySchema

// ==================== RESPONSE SCHEMAS ====================

// Reusable course mini
/** Schema for mini course in wishlist. */
export const WishlistCourseMiniSchema = z.object({
  id: PositiveIntSchema,
  title: z.string(),
  thumbnail: z.string().nullable(),
  price: z.coerce.number({ message: 'Price must be number' }), // Coerce string to number
  isFree: z.boolean(),
  category: z.object({ id: PositiveIntSchema, name: z.string() }).nullable(),
  teacher: z.object({ id: PositiveIntSchema, fullname: z.string().optional(), username: z.string().nullable() }).nullable(),
});

// One wishlist row
export const WishlistItemResponseSchema = z.object({
  courseId: z.number().int(),
  addedAt: z.coerce.date(), // createdAt from Wishlist
  course: WishlistCourseMiniSchema,
})

// List wishlist response
export const ListWishlistResSchema = PaginationResBaseSchema.extend({
  items: z.array(WishlistItemResponseSchema),
})

// Add item response 
export const AddWishlistResSchema = z.object({
  added: z.boolean().default(true),
  item: WishlistItemResponseSchema.optional(),
  message: z.string(),
})

// Simple message for remove/clear
export const WishlistMessageResSchema = z.object({
  message: z.string(),
})

// ==================== TYPES ====================

export type AddWishlistInputType = z.infer<typeof AddWishlistInputSchema>
export type WishlistItemPathParamsType = z.infer<typeof WishlistItemPathParamsSchema>

export type WishlistCourseMiniType = z.infer<typeof WishlistCourseMiniSchema>
export type WishlistItemResponseType = z.infer<typeof WishlistItemResponseSchema>

export type ListWishlistQueryType = z.infer<typeof ListWishlistQuerySchema>
export type ListWishlistResType = z.infer<typeof ListWishlistResSchema>

export type AddWishlistResType = z.infer<typeof AddWishlistResSchema>
export type WishlistMessageResType = z.infer<typeof WishlistMessageResSchema>


export const WISHLIST_MAX_ITEMS_CONST = WISHLIST_MAX_ITEMS
