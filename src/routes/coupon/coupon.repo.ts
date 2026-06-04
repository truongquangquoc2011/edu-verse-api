import { Injectable } from '@nestjs/common'
import { PrismaService } from 'src/shared/services/prisma.service'
import { CouponResponseType, CreateCouponBodyType, UpdateCouponBodyType } from './coupon.model'
import { Prisma } from '@prisma/client'
import { PAGINATION } from 'src/shared/constants/pagination.constant'
import { CouponNotFoundException } from './coupon.error'
import { CODE_CHARS, DEFAULT_LENGTH, MAX_ATTEMPTS } from 'src/shared/config'
export const COUPON_DEFAULT_SELECT = {
  id: true,
  code: true,
  discountType: true,
  discountAmount: true,
  maxUses: true,
  perUserLimit: true,
  expirationDate: true,
  createdAt: true,
  updatedAt: true,
  courseId: true,
  createdById: true,
  deletedAt: true,
  updatedById: true,
} as const

@Injectable()
export class CouponRepository {
  constructor(private readonly prismaService: PrismaService) {}

  /**
   * Generate a random coupon code with a given length.
   * Uses characters defined in COUPON_CONFIG.CODE_CHARS.
   *
   * @param length - Number of characters in the code (default from config).
   * @returns A random string of the given length.
   */
  private generateRandomCouponCode(length = DEFAULT_LENGTH): string {
    const chars = CODE_CHARS
    let code = ''
    for (let i = 0; i < length; i++) {
      const idx = Math.floor(Math.random() * chars.length)
      code += chars[idx]
    }
    return code
  }

  /**
   * Generate a unique coupon code.
   * Will attempt to generate up to `maxAttempts` times.
   * Each attempt checks against the database for duplicates.
   *
   * @param length - Length of the coupon code.
   * @param maxAttempts - Maximum retries if duplicates are found.
   * @throws Error if unable to generate a unique code.
   * @returns A unique coupon code string.
   */
  private async generateUniqueCouponCode(length = DEFAULT_LENGTH, maxAttempts = MAX_ATTEMPTS): Promise<string> {
    for (let i = 0; i < maxAttempts; i++) {
      const code = this.generateRandomCouponCode(length)

      const existing = await this.prismaService.coupon.findUnique({
        where: { code },
      })

      if (!existing) return code
    }
    throw new Error('Generate Unique Coupon Code Failed')
  }

  /**
   * Create a new coupon record in the database.
   * If no code is provided, a unique random one will be generated.
   *
   * @param data - Coupon creation payload.
   * @param createdById - ID of the user creating the coupon.
   * @returns The created coupon object.
   */
  async create(data: CreateCouponBodyType, createdById: number): Promise<CouponResponseType> {
    const code = data.code || (await this.generateUniqueCouponCode(8))

    return this.prismaService.coupon.create({
      data: {
        code,
        discountType: data.discountType,
        discountAmount: data.discountAmount,
        maxUses: data.maxUses,
        perUserLimit: data.perUserLimit,
        expirationDate: data.expirationDate,
        courseId: data.courseId,
        createdById,
      },
    })
  }

  /**
   * Find a coupon by its unique code.
   *
   * @param code - Coupon code.
   * @returns The coupon if found, otherwise null.
   */
  async findCouponByCode(code: string) {
    return this.prismaService.coupon.findFirst({
      where: { code, deletedAt: null },
    })
  }

  /**
   * Find a coupon by its ID.
   * Intended to exclude logically deleted coupons.
   *
   * @param id - Coupon ID.
   * @returns The coupon if found, otherwise null.
   */
  async findById(id: number) {
    const coupon = await this.prismaService.coupon.findFirst({
      where: { id, deletedAt: null },
    })
    if (!coupon) throw CouponNotFoundException
    return coupon
  }

  /**
   * Update an existing coupon by ID.
   * Will also track the user who performed the update.
   *
   * @param id - Coupon ID.
   * @param data - Coupon update payload.
   * @param updatedById - ID of the user performing the update.
   * @returns The updated coupon object.
   */
  async update(id: number, data: UpdateCouponBodyType, updatedById: number): Promise<CouponResponseType> {
    await this.findById(id)
    return this.prismaService.coupon.update({
      where: { id, isDelete: false },
      data: { ...data, updatedById },
    })
  }

  /**
   * Soft delete a coupon.
   * Marks it as deleted by setting `isDelete` and `deletedAt`.
   *
   * @param id - Coupon ID.
   * @returns The updated coupon object (soft deleted).
   */
  async softDelete(id: number) {
    await this.findById(id)
    return this.prismaService.coupon.update({
      where: { id },
      data: { isDelete: true, deletedAt: new Date() },
    })
  }

  /**
   * Get a paginated list of coupons.
   * Excludes soft-deleted coupons (deletedAt != null).
   *
   * @param skip - Number of records to skip (pagination).
   * @param take - Number of records to take (pagination).
   * @returns An array of coupon objects with default select fields.
   */
  async listCoupons(skip: number = PAGINATION.DEFAULT_SKIP, take: number = PAGINATION.DEFAULT_TAKE) {
    return this.prismaService.coupon.findMany({
      where: { deletedAt: null },
      select: COUPON_DEFAULT_SELECT,
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    })
  }
}
