// src/modules/cart/cart.controller.ts
import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseIntPipe, Post, Query } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiParam, ApiBody } from '@nestjs/swagger'
import { Auth } from 'src/shared/decorator/auth.decorator'
import { ActiveUser } from 'src/shared/decorator/active-user.decorator'
import { AuthTypes, ConditionGuard } from 'src/shared/constants/auth.constant'
import { ZodSerializerDto } from 'nestjs-zod'
import { ApiStandardResponses } from 'src/shared/decorator/api-standard-response'
import { HttpStatusCode } from 'src/shared/swagger/swagger.interface'
import { RESPONSE_MESSAGES } from 'src/shared/constants/swagger.constant'
import { CartService } from './cart.service'
import { AddCartDTO, AddCartResDTO, ListCartQueryDTO, ListCartResDTO } from './dto/cart.dto'
import { MessageResDTO } from 'src/shared/dto/response.dto'

@ApiTags('Cart')
@Controller('cart')
export class CartController {
  constructor(private readonly service: CartService) {}

  /**
   * Retrieve all cart items for the authenticated user.
   *
   * - Requires authentication via Bearer token or API Key.
   * - Supports pagination via query parameters.
   * - Returns a paginated list of courses in the user's cart.
   *
   * @param userId - The ID of the authenticated user (injected via `@ActiveUser`)
   * @param query - Pagination query parameters (`skip`, `take`)
   * @returns Paginated list of cart items (`ListCartResDTO`)
   */
  @Auth([AuthTypes.BEARER, AuthTypes.APIKey], { condition: ConditionGuard.OR })
  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'List cart items',
    description: 'Retrieve all cart items for the authenticated user with pagination.',
  })
  @ZodSerializerDto(ListCartResDTO)
  @ApiStandardResponses(HttpStatusCode.OK, RESPONSE_MESSAGES.CART.LIST, ListCartResDTO)
  getCart(@ActiveUser('userId') userId: number, @Query() query: ListCartQueryDTO) {
    return this.service.getCart(userId, query)
  }

  /**
   * Add a course to the authenticated user's cart.
   *
   * - Requires authentication via Bearer token or API Key.
   * - If the course is free, the user is automatically enrolled.
   * - Throws `ConflictException` if the course already exists in the cart.
   *
   * @param userId - The ID of the authenticated user
   * @param body - The payload containing the course ID (`AddCartDTO`)
   * @returns The created cart item or an enrollment confirmation (`AddCartResDTO`)
   */
  @Auth([AuthTypes.BEARER, AuthTypes.APIKey], { condition: ConditionGuard.OR })
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Add course to cart',
    description: 'Add a new course to the cart or enroll if the course is free.',
  })
  @ApiBody({ type: AddCartDTO })
  @ZodSerializerDto(AddCartResDTO)
  @ApiStandardResponses(HttpStatusCode.CREATED, RESPONSE_MESSAGES.CART.ADDED, AddCartResDTO)
  addToCart(@ActiveUser('userId') userId: number, @Body() body: AddCartDTO) {
    return this.service.addToCart(userId, body)
  }

  /**
   * Remove a specific course from the user's cart.
   *
   * - Requires authentication via Bearer token or API Key.
   * - Throws `NotFoundException` if the course is not found in the cart.
   *
   * @param userId - The ID of the authenticated user
   * @param courseId - The ID of the course to be removed
   * @returns A confirmation message (`MessageResDTO`)
   */
  @Auth([AuthTypes.BEARER, AuthTypes.APIKey], { condition: ConditionGuard.OR })
  @Delete(':courseId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Remove course from cart',
    description: 'Remove a specific course from the authenticated user’s cart.',
  })
  @ApiParam({ name: 'courseId', type: Number, description: 'Course ID' })
  @ZodSerializerDto(MessageResDTO)
  @ApiStandardResponses(HttpStatusCode.OK, RESPONSE_MESSAGES.CART.REMOVED, MessageResDTO)
  removeFromCart(@ActiveUser('userId') userId: number, @Param('courseId', ParseIntPipe) courseId: number) {
    return this.service.removeFromCart(userId, courseId)
  }

  /**
   * Clear all items in the authenticated user's cart.
   *
   * - Requires authentication via Bearer token or API Key.
   * - Removes all cart items for the user.
   *
   * @param userId - The ID of the authenticated user
   * @returns A confirmation message (`MessageResDTO`)
   */
  @Auth([AuthTypes.BEARER, AuthTypes.APIKey], { condition: ConditionGuard.OR })
  @Delete()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Clear user cart',
    description: 'Remove all items from the authenticated user’s cart.',
  })
  @ZodSerializerDto(MessageResDTO)
  @ApiStandardResponses(HttpStatusCode.OK, RESPONSE_MESSAGES.CART.CLEARED, MessageResDTO)
  clearCart(@ActiveUser('userId') userId: number) {
    return this.service.clearCart(userId)
  }
}
