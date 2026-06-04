// src/modules/wishlist/wishlist.repo.ts
import { Injectable, Logger, BadRequestException, ConflictException, NotFoundException } from '@nestjs/common'
import { PrismaService } from 'src/shared/services/prisma.service'
import { ValidationService } from 'src/shared/services/validation.service'
import { PaginationQueryType } from 'src/shared/models/pagination.model'
import { Prisma } from '@prisma/client'
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library'
import { COURSE_MINI_SELECT } from 'src/shared/helper/cart.helper'
import { COURSE_STATUS } from 'src/shared/constants/course-field.constant' // ✅ thêm

import {
  AddWishlistInputType,
  AddWishlistResType,
  ListWishlistResType,
  WishlistItemResponseType,
  WISHLIST_MAX_ITEMS_CONST,
} from './wishlist.model'
import { WISHLIST_MESSAGES } from 'src/shared/constants/wishlist-message.constant'

/** ---- SELECT shape  ---- */
const WISHLIST_ROW_SELECT = {
  courseId: true,
  createdAt: true,
  course: { select: COURSE_MINI_SELECT },
}

@Injectable()
export class WishlistRepository {
  private readonly logger = new Logger(WishlistRepository.name)

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

  private mapWishlistRowToItem(row: any): WishlistItemResponseType {
    return {
      courseId: row.courseId,
      addedAt: row.createdAt,
      course: {
        id: row.course.id,
        title: row.course.title,
        thumbnail: row.course.thumbnail ?? null,
        price: row.course.price,
        isFree: row.course.isFree,
        category: row.course.category ? { id: row.course.category.id, name: row.course.category.name } : null,
        teacher: row.course.teacher
          ? {
              id: row.course.teacher.id,
              fullname: row.course.teacher.user?.fullname ?? undefined,
              username: row.course.teacher.user?.username ?? null,
            }
          : null,
      },
    }
  }

  // ========= BUSINESS HELPERS =========

  /**
   * Check if the wishlist already reached the maximum allowed items.
   *
   * @param tx - Prisma transaction client
   * @param userId - ID of the user
   * @throws {BadRequestException} if the limit is exceeded
   */
  private async checkWishlistLimit(tx: Prisma.TransactionClient, userId: number) {
    const current = await tx.wishlist.count({ where: { userId, isDelete: false } })
    if (current >= WISHLIST_MAX_ITEMS_CONST) throw new BadRequestException(WISHLIST_MESSAGES.LIMIT_EXCEEDED)
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
      where: { id: courseId, status: COURSE_STATUS.APPROVED, deletedAt: null, isDelete: false }, // ✅ dùng constant
      select: COURSE_MINI_SELECT,
    })
    if (!course) throw new BadRequestException(WISHLIST_MESSAGES.COURSE_UNAVAILABLE)
    return course
  }

  // ========= CRUD METHODS =========

  /**
   * Retrieve paginated wishlist items of a user.
   *
   * **GET /wishlist**
   *
   * @param userId - ID of the user whose wishlist will be retrieved
   * @param query - Pagination parameters (skip, take)
   * @returns Paginated list of wishlist items and metadata
   */
  async getWishlist(userId: number, query: PaginationQueryType): Promise<ListWishlistResType> {
    await this.validateActiveUser(userId)

    const where: Prisma.WishlistWhereInput = { userId, isDelete: false }
    const [rows, total] = await Promise.all([
      this.prisma.wishlist.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: query.skip,
        take: query.take,
        include: {
          course: {
            select: {
              id: true,
              title: true,
              thumbnail: true,
              price: true,
              isFree: true,
              category: { select: { id: true, name: true } },
              teacher: { select: { id: true, user: { select: { fullname: true, username: true } } } },
            },
          },
        },
      }),
      this.prisma.wishlist.count({ where }),
    ])

    const items = rows.map(this.mapWishlistRowToItem)
    return { items, total, skip: query.skip, take: query.take }
  }

  /**
   * Add a course to the user's wishlist.
   *
   * **POST /wishlist**
   *
   * - Validates active user
   * - Checks wishlist item limit
   * - Ensures course is approved
   * - Prevents duplicate active row
   *
   * @param userId - ID of the user adding the course
   * @param payload - Request payload containing courseId
   * @returns Wishlist addition result (added flag, item info, message)
   */
  async addToWishlist(userId: number, payload: AddWishlistInputType): Promise<AddWishlistResType> {
    await this.validateActiveUser(userId)
    const { courseId } = payload

    return this.prisma.$transaction(async (tx) => {
      await this.checkWishlistLimit(tx, userId)

      await this.findApprovedCourse(tx, courseId)

      const existed = await tx.wishlist.findFirst({ where: { userId, courseId, isDelete: false } })
      if (existed) throw new ConflictException(WISHLIST_MESSAGES.ITEM_EXISTS)
      const row = await tx.wishlist.create({
        data: { userId, courseId, createdById: userId },
        include: {
          course: {
            select: {
              id: true,
              title: true,
              thumbnail: true,
              price: true,
              isFree: true,
              category: { select: { id: true, name: true } },
              teacher: { select: { id: true, user: { select: { fullname: true, username: true } } } },
            },
          },
        },
      })
      return { added: true, item: this.mapWishlistRowToItem(row), message: WISHLIST_MESSAGES.ADDED }
    })
  }

  /**
   * Remove a specific course from the user's wishlist.
   *
   * **DELETE /wishlist/:courseId**
   *
   * @param userId - ID of the user performing the deletion
   * @param courseId - ID of the course to remove from wishlist
   * @returns A confirmation message object
   * @throws {NotFoundException} if the course was not in the wishlist
   */
  async removeFromWishlist(userId: number, courseId: number): Promise<{ message: string }> {
    await this.validateActiveUser(userId)

    const res = await this.prisma.wishlist.deleteMany({
      where: { userId, courseId, deletedAt: null },
    })
    if (res.count === 0) throw new NotFoundException(WISHLIST_MESSAGES.ITEM_NOT_FOUND)
    return { message: WISHLIST_MESSAGES.REMOVED }
  }

  /**
   * Clear all wishlist items of the user.
   *
   * **DELETE /wishlist**
   *
   * @param userId - ID of the user
   * @returns A confirmation message
   */
  async clearWishlist(userId: number): Promise<{ message: string }> {
    await this.validateActiveUser(userId)
    await this.prisma.wishlist.deleteMany({ where: { userId } })
    return { message: WISHLIST_MESSAGES.CLEARED }
  }
}
