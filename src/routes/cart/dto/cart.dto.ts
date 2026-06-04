import { createZodDto } from 'nestjs-zod'
import {
  AddCartInputSchema,
  AddCartResSchema,
  CartItemPathParamsSchema,
  ListCartQuerySchema,
  ListCartResSchema,
  CartMessageResSchema,
} from '../cart.model'

// ===== Cart: Add / Remove / List =====
export class AddCartDTO extends createZodDto(AddCartInputSchema) {}
export class AddCartResDTO extends createZodDto(AddCartResSchema) {}

export class CartItemPathParamsDTO extends createZodDto(CartItemPathParamsSchema) {}

export class ListCartQueryDTO extends createZodDto(ListCartQuerySchema) {}
export class ListCartResDTO extends createZodDto(ListCartResSchema) {}

export class CartMessageResDTO extends createZodDto(CartMessageResSchema) {}
