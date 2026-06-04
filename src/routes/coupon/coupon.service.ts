import { HttpException, Injectable, Logger, NotFoundException } from '@nestjs/common'
import { CouponResponseType, CouponType, CreateCouponBodyType, UpdateCouponBodyType } from './coupon.model'
import {
  AtLeastOneFieldMustBeProvidedCouponException,
  CouponAlreadyExistsException,
  CouponNotFoundException,
  InternalCreateCouponErrorException,
  InternalUpdateCouponErrorException,
} from './coupon.error'
import { CouponRepository } from './coupon.repo'
import { PrismaService } from 'src/shared/services/prisma.service'
import { error } from 'console'
import { PAGINATION } from 'src/shared/constants/pagination.constant'
import { CreateCouponDTO } from './dto/coupon.dto'

@Injectable()
export class CouponService {
  private readonly logger = new Logger(CouponRepository.name)
  constructor(
    private readonly couponRepository: CouponRepository,
    private readonly prismaService: PrismaService,
  ) {}

  /**
   * Create a new coupon.
   * - If `code` is provided, it will be checked for uniqueness.
   * - If no `code` is provided, a random 8-character code will be generated.
   * - If `courseId` is provided, the course must exist.
   *
   * @param data - Coupon creation payload
   * @param createdById - ID of the user creating the coupon
   * @returns The created coupon
   * @throws CouponAlreadyExistsException if code already exists
   * @throws NotFoundException if course does not exist
   * @throws InternalCreateCouponErrorException for unexpected errors
   */
  async createCoupon(data: CreateCouponDTO, createdById: number): Promise<CouponResponseType> {
    return this.prismaService
      .$transaction(async (tx) => {
        if (data.code) {
          const existing = await this.couponRepository.findCouponByCode(data.code)
          if (existing) throw CouponAlreadyExistsException
        }
        if (data.courseId) {
          const course = await tx.course.findUnique({ where: { id: data.courseId } })
          if (!course) throw new NotFoundException(`Course ${data.courseId} not found`)
        }
        return this.couponRepository.create(data, createdById)
      })
      .catch((error) => {
        this.logger.error(`Create coupon error: ${error.message}`)
        throw InternalCreateCouponErrorException
      })
  }

  /**
   * Update an existing coupon.
   * - Requires at least one field in the request body.
   * - Coupon must exist and not be deleted.
   *
   * @param id - Coupon ID
   * @param data - Coupon update payload
   * @param updatedById - ID of the user updating the coupon
   * @returns The updated coupon
   * @throws AtLeastOneFieldMustBeProvidedCouponException if body is empty
   * @throws CouponNotFoundException if coupon does not exist or is deleted
   * @throws InternalUpdateCouponErrorException for unexpected errors
   */
  async updateCoupon(id: number, data: UpdateCouponBodyType, updatedById: number): Promise<CouponResponseType> {
    try {
      if (Object.keys(data).length === 0) throw AtLeastOneFieldMustBeProvidedCouponException
      const coupon = await this.checkCouponExists(id)
      return this.couponRepository.update(id, data, updatedById)
    } catch (error) {
      if (error instanceof HttpException) throw error
      throw InternalUpdateCouponErrorException
    }
  }

  private async checkCouponExists(id: number): Promise<CouponType> {
    const coupon = await this.couponRepository.findById(id)
    if (!coupon || coupon.deletedAt !== null) {
      throw CouponNotFoundException
    }
    return coupon
  }

  /**
   * Soft delete a coupon by ID.
   * - Marks the coupon as deleted and sets deletedAt.
   *
   * @param id - Coupon ID
   * @returns A success message with the coupon code
   * @throws CouponNotFoundException if coupon does not exist or is already deleted
   * @throws InternalUpdateCouponErrorException for unexpected errors
   */
  async deleteCoupon(id: number) {
    try {
      const coupon = await this.checkCouponExists(id)
      await this.couponRepository.softDelete(id)
      return { message: `Coupon ${coupon.code} deleted successfully` }
    } catch (error) {
      if (error instanceof HttpException) throw error
      throw InternalUpdateCouponErrorException
    }
  }

  /**
   * Find a coupon by ID.
   * - Coupon must exist and not be deleted.
   *
   * @param id - Coupon ID
   * @returns The coupon if found
   * @throws CouponNotFoundException if coupon does not exist or is deleted
   */
  async findOne(id: number): Promise<CouponResponseType> {
    const coupon = await this.checkCouponExists(id)
    return coupon
  }

  /**
   * Get a paginated list of coupons.
   * - Excludes soft-deleted coupons by default.
   *
   * @param skip - Number of records to skip (default from pagination constant)
   * @param take - Number of records to take (default from pagination constant)
   * @returns A list of coupons
   */
  async listCoupons(
    skip: number = PAGINATION.DEFAULT_SKIP,
    take: number = PAGINATION.DEFAULT_TAKE,
  ): Promise<CouponResponseType[]> {
    return this.couponRepository.listCoupons(skip, take)
  }
}
