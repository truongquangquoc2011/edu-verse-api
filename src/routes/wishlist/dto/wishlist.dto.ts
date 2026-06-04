import { createZodDto } from 'nestjs-zod'
import {
  AddWishlistInputSchema,
  AddWishlistResSchema,
  WishlistItemPathParamsSchema,
  ListWishlistQuerySchema,
  ListWishlistResSchema,
  WishlistMessageResSchema,
} from '../wishlist.model'

// ===== Wishlist: Add / Remove / List =====
export class AddWishlistDTO extends createZodDto(AddWishlistInputSchema) {}
export class AddWishlistResDTO extends createZodDto(AddWishlistResSchema) {}

export class WishlistItemPathParamsDTO extends createZodDto(WishlistItemPathParamsSchema) {}

export class ListWishlistQueryDTO extends createZodDto(ListWishlistQuerySchema) {}
export class ListWishlistResDTO extends createZodDto(ListWishlistResSchema) {}

export class WishlistMessageResDTO extends createZodDto(WishlistMessageResSchema) {}
