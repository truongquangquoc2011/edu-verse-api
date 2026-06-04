import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  HttpCode,
} from '@nestjs/common'
import { CouponService } from './coupon.service'
import { Auth, IsPublic } from 'src/shared/decorator/auth.decorator'
import { AuthTypes } from 'src/shared/constants/auth.constant'
import { ActiveUser } from 'src/shared/decorator/active-user.decorator'
import { ZodSerializerDto } from 'nestjs-zod'
import { CreateCouponDTO, CreateCouponResDTO, UpdateCouponDTO, UpdateCouponResDTO } from './dto/coupon.dto'
import { CreateCouponBodyType, UpdateCouponBodyType } from './coupon.model'
import { parseSkipTake } from 'src/shared/utils/pagination.util'
import { ApiTags, ApiBody, ApiOperation, ApiParam, ApiQuery } from '@nestjs/swagger'
import { HttpStatusCode } from 'src/shared/swagger/swagger.interface'
import { RESPONSE_MESSAGES } from 'src/shared/constants/swagger.constant'
import { ApiStandardResponses } from 'src/shared/decorator/api-standard-response'
@ApiTags('Coupon')
@Controller('coupon')
export class CouponController {
  constructor(private readonly couponService: CouponService) {}

  /**
   * Create a new coupon.
   * - If `code` is provided, it will be validated for uniqueness.
   * - If `code` is not provided, a random 8-character code will be generated.
   * - Requires `discountType`, `discountAmount`, and `expirationDate` as mandatory fields.
   *
   * @param body - Coupon creation payload
   * @param userId - ID of the currently active user (creator)
   * @returns The created coupon object
   */
  @Post()
  @Auth([AuthTypes.BEARER])
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create coupon',
    description:
      'Create a new coupon. If `code` not provided, a random code will be generated. Requires discountType, discountAmount, and expirationDate.',
  })
  @ApiBody({ type: CreateCouponDTO })
  @ZodSerializerDto(CreateCouponResDTO)
  @ApiStandardResponses(HttpStatusCode.CREATED, RESPONSE_MESSAGES.COUPON.CREATED, CreateCouponResDTO)
  async create(@Body() body: CreateCouponBodyType, @ActiveUser('userId') userId: number) {
    return this.couponService.createCoupon(body, userId)
  }

  /**
   * Update an existing coupon by ID.
   * - At least one field must be provided in the request body.
   * - Throws an exception if the coupon does not exist or is already deleted.
   *
   * @param id - Coupon ID to update
   * @param body - Coupon update payload
   * @param userId - ID of the currently active user (updater)
   * @returns The updated coupon object
   */
  @Patch(':id')
  @Auth([AuthTypes.BEARER])
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update coupon',
    description:
      'Update an existing coupon by ID. Requires at least one field. Throws if not found or already deleted.',
  })
  @ApiParam({ name: 'id', type: Number, description: 'Coupon ID' })
  @ApiBody({ type: UpdateCouponDTO })
  @ZodSerializerDto(UpdateCouponResDTO)
  @ApiStandardResponses(HttpStatusCode.OK, RESPONSE_MESSAGES.COUPON.UPDATED, UpdateCouponResDTO)
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateCouponBodyType,
    @ActiveUser('userId') userId: number,
  ) {
    return this.couponService.updateCoupon(id, body, userId)
  }

  /**
   * Soft delete a coupon by ID.
   * - Marks the coupon as deleted and sets `deletedAt`.
   * - Does not permanently remove the record from the database.
   *
   * @param id - Coupon ID to delete
   * @returns A success message or deleted coupon info
   */
  @Delete(':id')
  @Auth([AuthTypes.BEARER])
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Delete coupon (soft)',
    description: 'Marks the coupon as deleted and sets deletedAt (not permanently removed).',
  })
  @ApiParam({ name: 'id', type: Number, description: 'Coupon ID' })
  @ApiStandardResponses(HttpStatusCode.OK, RESPONSE_MESSAGES.COUPON.DELETED)
  async delete(@Param('id', ParseIntPipe) id: number) {
    return this.couponService.deleteCoupon(id)
  }

  /**
   * Retrieve details of a single coupon by ID.
   * - Throws an exception if the coupon is not found or deleted.
   *
   * @param id - Coupon ID to retrieve
   * @returns The coupon object
   */
  @Get(':id')
  @Auth([AuthTypes.BEARER])
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get coupon detail',
    description: 'Retrieve coupon details by ID. Throws if not found or deleted.',
  })
  @ApiParam({ name: 'id', type: Number, description: 'Coupon ID' })
  // @ZodSerializerDto(CreateCouponResDTO)
  @ApiStandardResponses(HttpStatusCode.OK, RESPONSE_MESSAGES.COUPON.DETAIL, CreateCouponResDTO)
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.couponService.findOne(id)
  }

  /**
   * Get a paginated list of coupons.
   * - Supports optional `skip` and `take` query params for pagination.
   * - Returns both the data and pagination metadata.
   *
   * @param userId - ID of the current user (not always required, but may be used for filtering)
   * @param skip - Number of records to skip
   * @param take - Number of records to take
   * @returns Paginated list of coupons
   */
  @Get()
  @Auth([AuthTypes.BEARER])
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'List coupons (paginated)',
    description: 'Retrieve paginated coupons. Supports `skip` and `take` query params.',
  })
  @ApiQuery({ name: 'skip', required: false, type: Number, description: 'Records to skip' })
  @ApiQuery({ name: 'take', required: false, type: Number, description: 'Records to take' })
  // @ZodSerializerDto(CreateCouponResDTO)
  @ApiStandardResponses(HttpStatusCode.OK, RESPONSE_MESSAGES.COUPON.LIST, CreateCouponResDTO)
  async listCoupon(@ActiveUser('userId') userId: number, @Query('skip') skip?: string, @Query('take') take?: string) {
    const { skip: parsedSkip, take: parsedTake } = parseSkipTake(skip, take)
    return this.couponService.listCoupons(parsedSkip, parsedTake)
  }
}
