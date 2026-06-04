import { Injectable, Logger, BadRequestException, ConflictException, NotFoundException } from '@nestjs/common'
import { PrismaService } from 'src/shared/services/prisma.service'
import { ValidationService } from 'src/shared/services/validation.service'
import { PaginationQueryType } from 'src/shared/models/pagination.model'
import { CART_MESSAGES } from 'src/shared/constants/cart-message.constant'
import {
  AddCartInputType,
  AddCartResType,
  ListCartResType,
  CartItemResponseType,
  CART_MAX_ITEMS_CONST,
} from './cart.model'
import {
  COURSE_MINI_SELECT,
  mapCartRowToItem,
  computePricingAndBestCoupon, 
} from 'src/shared/helper/cart.helper'
import { Prisma } from '@prisma/client'
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library'
import { ACTIVE_ENROLL_STATUSES } from 'src/shared/constants/cart.constants'

/** ---- SELECT shape  ---- */
const CART_ROW_SELECT = {
  courseId: true,
  createdAt: true,
  course: { select: COURSE_MINI_SELECT },
}

@Injectable()
export class CartRepository {
  private readonly logger = new Logger(CartRepository.name)

  constructor(
    private readonly prisma: PrismaService,
    private readonly validation: ValidationService,
  ) {}

  // ========= COMMON =========

  /**
   * Validate that the user exists and is active.
   *
   * @param userId - ID of the user to validate
   * @throws {BadRequestException} if the user is inactive or invalid
   */
  private async validateActiveUser(userId: number) {
    await this.validation.validateUserStatus(userId)
  }

  // ========= BUSINESS HELPERS =========
  /**
   * Check if the cart already reached the maximum allowed items.
   *
   * @param tx - Prisma transaction client
   * @param userId - ID of the user
   * @throws {BadRequestException} if the limit is exceeded
   */
  private async checkCartLimit(tx: Prisma.TransactionClient, userId: number) {
    const current = await tx.cart.count({ where: { userId, isDelete: false } })
    if (current >= CART_MAX_ITEMS_CONST) throw new BadRequestException(CART_MESSAGES.LIMIT_EXCEEDED)
  }

  /**
   * Find a course that is approved and not deleted.
   *
   * @param tx - Prisma transaction client
   * @param courseId - ID of the course
   * @returns Approved course record
   * @throws {BadRequestException} if the course is unavailable or deleted
   */
  private async findApprovedCourse(tx: Prisma.TransactionClient, courseId: number) {
    const course = await tx.course.findFirst({
      where: { id: courseId, status: 'Approved', deletedAt: null, isDelete: false },
      select: COURSE_MINI_SELECT,
    })
    if (!course) throw new BadRequestException(CART_MESSAGES.COURSE_UNAVAILABLE)
    return course
  }
  /**
   * Ensure the user does not already own the given course.
   *
   * @param tx - Prisma transaction client
   * @param userId - ID of the user
   * @param courseId - ID of the course
   * @throws {ConflictException} if the course is already owned/enrolled
   */
  private async ensureNotOwned(tx: Prisma.TransactionClient, userId: number, courseId: number) {
    const owned = await tx.enrollment.findFirst({
      where: { userId, courseId, isDelete: false, status: { in: ACTIVE_ENROLL_STATUSES } },
      select: { id: true },
    })
    if (owned) throw new ConflictException(CART_MESSAGES.COURSE_OWNED)
  }
  /**
   * Automatically enroll a user in a free course (skips cart).
   *
   * @param tx - Prisma transaction client
   * @param userId - ID of the user
   * @param courseId - ID of the free course
   */
  private async enrollFreeCourse(tx: Prisma.TransactionClient, userId: number, courseId: number) {
    await tx.enrollment.upsert({
      where: { userId_courseId: { userId, courseId } },
      update: {},
      create: { userId, courseId, status: 'NotStarted', enrolledAt: new Date(), createdById: userId },
    })
  }

  // ========= CRUD METHODS =========

  /**
   * Retrieve paginated cart items of a user.
   *
   * **GET /cart**
   *
   * @param userId - ID of the user whose cart will be retrieved
   * @param query - Pagination parameters (skip, take)
   * @returns Paginated list of cart items and metadata
   */
  async getCart(userId: number, query: PaginationQueryType): Promise<ListCartResType> {
    await this.validateActiveUser(userId)

    const where: Prisma.CartWhereInput = { userId, isDelete: false }
    const [rows, total] = await Promise.all([
      this.prisma.cart.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: query.skip,
        take: query.take,
        select: CART_ROW_SELECT,
      }),
      this.prisma.cart.count({ where }),
    ])

    let originalTotal = 0
    let discountTotal = 0

    const items: CartItemResponseType[] = await Promise.all(
      rows.map(async (row) => {
        const base = mapCartRowToItem(row)

        const { pricing, bestCoupon } = await computePricingAndBestCoupon(this.prisma, userId, {
          courseId: base.course.id,
          isFree: base.course.isFree,
          price: base.course.price,
        })

        originalTotal += pricing.originalPrice
        discountTotal += pricing.discount

        return {
          ...base,
          pricing,
          bestCoupon,
        }
      }),
    )

    return {
      items,
      total,
      skip: query.skip,
      take: query.take,
      originalTotal,
      discountTotal,
      grandTotal: Math.max(0, originalTotal - discountTotal),
    }
  }

  /**
   * Add a course to the user's cart.
   *
   * **POST /cart**
   *
   * - Validates active user
   * - Checks cart item limit
   * - Ensures course is approved and not owned
   * - Handles free-course auto-enrollment
   *
   * @param userId - ID of the user adding the course
   * @param payload - Request payload containing courseId
   * @returns Cart addition result (added/enrolled flag, item info, message)
   */
  async addToCart(userId: number, payload: AddCartInputType): Promise<AddCartResType> {
    await this.validateActiveUser(userId)
    const { courseId, couponCode } = payload as { courseId: number; couponCode?: string }

    return this.prisma.$transaction(async (tx) => {
      await this.checkCartLimit(tx, userId)

      const course = await this.findApprovedCourse(tx, courseId)
      await this.ensureNotOwned(tx, userId, courseId)

      // Enroll immediately if course is free
      if (course.isFree) {
        await this.enrollFreeCourse(tx, userId, courseId)
        return {
          added: false,
          enrolled: true,
          item: undefined,
          message: CART_MESSAGES.ENROLLED_FREE,
        }
      }

      // Check if item already exists in cart
      const existing = await tx.cart.findFirst({
        where: { userId, courseId, isDelete: false },
      })
      if (existing) {
        throw new ConflictException(CART_MESSAGES.ITEM_EXISTS)
      }
      try {
        const row = await tx.cart.create({
          data: { userId, courseId, createdById: userId },
          select: CART_ROW_SELECT,
        })

        const base = mapCartRowToItem(row)
        const { pricing, bestCoupon } = await computePricingAndBestCoupon(this.prisma, userId, {
          courseId: base.course.id,
          isFree: base.course.isFree,
          price: base.course.price,
          couponCode, 
        })

        const item: CartItemResponseType = { ...base, pricing, bestCoupon }
        return { added: true, enrolled: false, item, message: CART_MESSAGES.ADDED }
      } catch (e) {
        if ((e as PrismaClientKnownRequestError)?.code === 'P2002') {
          throw new ConflictException(CART_MESSAGES.ITEM_EXISTS)
        }
        throw e
      }
    })
  }

  /**
   * Remove a specific course from the user's cart.
   *
   * **DELETE /cart/:courseId**
   *
   * @param userId - ID of the user performing the deletion
   * @param courseId - ID of the course to remove from cart
   * @returns A confirmation message object
   * @throws {NotFoundException} if the course was not in the cart
   */
  async removeFromCart(userId: number, courseId: number): Promise<{ message: string }> {
    await this.validateActiveUser(userId)

    const res = await this.prisma.cart.deleteMany({ where: { userId, courseId } })
    if (res.count === 0) throw new NotFoundException(CART_MESSAGES.ITEM_NOT_FOUND)
    return { message: CART_MESSAGES.REMOVED }
  }

  /**
   * Clear all cart items of the user.
   *
   * **DELETE /cart**
   *
   * @param userId - ID of the user
   * @returns A confirmation message
   */
  async clearCart(userId: number): Promise<{ message: string }> {
    await this.validateActiveUser(userId)
    await this.prisma.cart.deleteMany({ where: { userId } })
    return { message: CART_MESSAGES.CLEARED }
  }
}
