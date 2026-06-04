import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseIntPipe, Post, Query } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiParam, ApiBody } from '@nestjs/swagger'
import { Auth } from 'src/shared/decorator/auth.decorator'
import { ActiveUser } from 'src/shared/decorator/active-user.decorator'
import { AuthTypes, ConditionGuard } from 'src/shared/constants/auth.constant'
import { ZodSerializerDto } from 'nestjs-zod'
import { ApiStandardResponses } from 'src/shared/decorator/api-standard-response'
import { HttpStatusCode } from 'src/shared/swagger/swagger.interface'
import { RESPONSE_MESSAGES } from 'src/shared/constants/swagger.constant'
import { WishlistService } from './wishlist.service'
import { AddWishlistDTO, AddWishlistResDTO, ListWishlistQueryDTO, ListWishlistResDTO } from './dto/wishlist.dto'
import { MessageResDTO } from 'src/shared/dto/response.dto'

@ApiTags('Wishlist')
@Controller('wishlist')
export class WishlistController {
  constructor(private readonly service: WishlistService) {}

  /**
   * Retrieve all wishlist items for the authenticated user.
   *
   * - Requires authentication via Bearer token or API Key.
   * - Supports pagination via query parameters.
   * - Returns a paginated list of courses in the user's wishlist.
   *
   * @param userId - The ID of the authenticated user (injected via `@ActiveUser`)
   * @param query - Pagination query parameters (`skip`, `take`)
   * @returns Paginated list of wishlist items (`ListWishlistResDTO`)
   */
  @Auth([AuthTypes.BEARER, AuthTypes.APIKey], { condition: ConditionGuard.OR })
  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'List wishlist items',
    description: 'Retrieve all wishlist items for the authenticated user with pagination.',
  })
  @ZodSerializerDto(ListWishlistResDTO)
  @ApiStandardResponses(HttpStatusCode.OK, RESPONSE_MESSAGES.WISHLIST.LIST, ListWishlistResDTO)
  getWishlist(@ActiveUser('userId') userId: number, @Query() query: ListWishlistQueryDTO) {
    return this.service.getWishlist(userId, query)
  }

  /**
   * Add a course to the authenticated user's wishlist.
   *
   * - Requires authentication via Bearer token or API Key.
   * - Throws `ConflictException` if the course already exists in the wishlist.
   *
   * @param userId - The ID of the authenticated user
   * @param body - The payload containing the course ID (`AddWishlistDTO`)
   * @returns The created wishlist item (`AddWishlistResDTO`)
   */
  @Auth([AuthTypes.BEARER, AuthTypes.APIKey], { condition: ConditionGuard.OR })
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Add course to wishlist',
    description: 'Add a new course to the wishlist for the authenticated user.',
  })
  @ApiBody({ type: AddWishlistDTO })
  @ZodSerializerDto(AddWishlistResDTO)
  @ApiStandardResponses(HttpStatusCode.CREATED, RESPONSE_MESSAGES.WISHLIST.ADDED, AddWishlistResDTO)
  addToWishlist(@ActiveUser('userId') userId: number, @Body() body: AddWishlistDTO) {
    return this.service.addToWishlist(userId, body)
  }

  /**
   * Remove a specific course from the user's wishlist.
   *
   * - Requires authentication via Bearer token or API Key.
   * - Throws `NotFoundException` if the course is not found in the wishlist.
   *
   * @param userId - The ID of the authenticated user
   * @param courseId - The ID of the course to be removed
   * @returns A confirmation message (`MessageResDTO`)
   */
  @Auth([AuthTypes.BEARER, AuthTypes.APIKey], { condition: ConditionGuard.OR })
  @Delete(':courseId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Remove course from wishlist',
    description: 'Remove a specific course from the authenticated user’s wishlist.',
  })
  @ApiParam({ name: 'courseId', type: Number, description: 'Course ID' })
  @ZodSerializerDto(MessageResDTO)
  @ApiStandardResponses(HttpStatusCode.OK, RESPONSE_MESSAGES.WISHLIST.REMOVED, MessageResDTO)
  removeFromWishlist(@ActiveUser('userId') userId: number, @Param('courseId', ParseIntPipe) courseId: number) {
    return this.service.removeFromWishlist(userId, courseId)
  }

  /**
   * Clear all items in the authenticated user's wishlist.
   *
   * - Requires authentication via Bearer token or API Key.
   * - Removes all wishlist items for the user.
   *
   * @param userId - The ID of the authenticated user
   * @returns A confirmation message (`MessageResDTO`)
   */
  @Auth([AuthTypes.BEARER, AuthTypes.APIKey], { condition: ConditionGuard.OR })
  @Delete()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Clear user wishlist',
    description: 'Remove all items from the authenticated user’s wishlist.',
  })
  @ZodSerializerDto(MessageResDTO)
  @ApiStandardResponses(HttpStatusCode.OK, RESPONSE_MESSAGES.WISHLIST.CLEARED, MessageResDTO)
  clearWishlist(@ActiveUser('userId') userId: number) {
    return this.service.clearWishlist(userId)
  }
}
