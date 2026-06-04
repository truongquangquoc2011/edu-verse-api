import { Injectable, Logger, BadRequestException, ConflictException, NotFoundException } from '@nestjs/common'
import { PrismaService } from 'src/shared/services/prisma.service'
import { ValidationService } from 'src/shared/services/validation.service'
import { MomoService } from 'src/shared/services/momo.service'
import { ACTIVE_ENROLL_STATUSES } from 'src/shared/constants/cart.constants'
import { computePricingAndBestCoupon } from 'src/shared/helper/cart.helper'
import {
  BuyNowInputType,
  CheckoutCartInputType,
  PaymentInitResType,
  MomoIpnType,
  MomoReturnQueryType,
} from './order.model'
import { OrderStatus, OrderType, Prisma } from '@prisma/client'
import { CURRENCY, PAYMENT_METHOD, MOMO } from 'src/shared/constants/payment.constant'
import { COURSE_STATUS } from 'src/shared/constants/course-field.constant'

import {
  TERMINAL_ORDER_STATUSES,
  getPaymentRef,
  verifyAndLoadOrder,
  markOrderStatus,
  markPaidAndFulfill,
} from '../../shared/helper/order.helpers'

/** ---- SELECT shape (course fields needed for order items) ---- */
const ORDER_COURSE_MINI_SELECT = {
  id: true,
  title: true,
  thumbnail: true,
  price: true,
  isFree: true,
} as const

@Injectable()
export class OrderRepository {
  private readonly logger = new Logger(OrderRepository.name)

  constructor(
    private readonly prisma: PrismaService,
    private readonly validation: ValidationService,
    private readonly momo: MomoService,
  ) {}

  // ========= COMMON =========

  /** Validate that the user exists and is active. */
  private async validateActiveUser(userId: number) {
    await this.validation.validateUserStatus(userId)
  }

  /** Find a course that is approved and not deleted. (run inside a transaction) */
  private async findApprovedCourse(tx: Prisma.TransactionClient, courseId: number) {
    const course = await tx.course.findFirst({
      where: { id: courseId, status: COURSE_STATUS.APPROVED, deletedAt: null, isDelete: false },
      select: ORDER_COURSE_MINI_SELECT,
    })
    if (!course) throw new BadRequestException('Course unavailable')
    return course
  }

  /** Ensure the user does not already own the given course. (run inside a transaction) */
  private async ensureNotOwned(tx: Prisma.TransactionClient, userId: number, courseId: number) {
    const owned = await tx.enrollment.findFirst({
      where: { userId, courseId, isDelete: false, status: { in: ACTIVE_ENROLL_STATUSES } },
      select: { id: true },
    })
    if (owned) throw new ConflictException('You already own this course')
  }

  /** Automatically enroll a user in a free course (skips payment). */
  private async enrollFreeCourse(userId: number, courseId: number) {
    await this.prisma.enrollment.upsert({
      where: { userId_courseId: { userId, courseId } },
      update: {},
      create: { userId, courseId, status: 'NotStarted', enrolledAt: new Date(), createdById: userId },
    })
  }

  /** Build order items from courseIds (check ownership + compute pricing) in one place. */
  private async prepareItems(
    tx: Prisma.TransactionClient,
    userId: number,
    courseIds: number[],
  ): Promise<
    {
      courseId: number
      title: string
      thumbnail?: string | null
      original: number
      discount: number
      final: number
    }[]
  > {
    const items = await Promise.all(
      courseIds.map(async (courseId) => {
        const course = await this.findApprovedCourse(tx, courseId)
        await this.ensureNotOwned(tx, userId, courseId)

        const { pricing } = await computePricingAndBestCoupon(this.prisma, userId, {
          courseId: course.id,
          isFree: course.isFree,
          price: course.price,
        })

        return {
          courseId: course.id,
          title: course.title,
          thumbnail: course.thumbnail,
          original: pricing.originalPrice,
          discount: pricing.discount,
          final: pricing.finalPrice,
        }
      }),
    )

    return items
  }

  /**
   * Create an Order and its OrderItems as a snapshot of current pricing.
   */
  private async createOrderSnapshot(params: {
    userId: number
    context: 'BUY_NOW' | 'CART'
    items: {
      courseId: number
      title: string
      thumbnail?: string | null
      original: number
      discount: number
      final: number
    }[]
  }) {
    const subtotal = params.items.reduce((s, i) => s + i.original, 0)
    const discount = params.items.reduce((s, i) => s + i.discount, 0)
    const total = params.items.reduce((s, i) => s + i.final, 0)

    const orderNumber = `${params.context}_${params.userId}_${Date.now()}`

    const order = await this.prisma.order.create({
      data: {
        orderNumber,
        userId: params.userId,
        subtotalAmount: subtotal,
        discountAmount: discount,
        taxAmount: 0,
        feeAmount: 0,
        totalAmount: total,
        currency: CURRENCY.VND,
        status: OrderStatus.Draft, // Draft -> Pending -> Paid/Failed
        orderType: OrderType.Purchase,
        orderItems: {
          create: params.items.map((it) => ({
            courseId: it.courseId,
            originalPrice: it.original,
            discountedPrice: it.discount,
            finalPrice: it.final,
            courseTitle: it.title,
            courseThumbnail: it.thumbnail ?? null,
            discountAmount: it.discount,
          })),
        },
      },
      include: { orderItems: true },
    })

    return order
  }

  // ========= USE CASES =========

  /** Create a buy-now order and initialize a MoMo session. */
  async initBuyNow(userId: number, payload: BuyNowInputType): Promise<PaymentInitResType> {
    await this.validateActiveUser(userId)

    const { courseId, couponCode } = payload

    // pre-checks + enroll free inside a transaction to keep consistency
    const precheck = await this.prisma.$transaction(async (tx) => {
      const course = await this.findApprovedCourse(tx, courseId)
      await this.ensureNotOwned(tx, userId, courseId)

      if (course.isFree) {
        await this.enrollFreeCourse(userId, courseId)
        return { isFree: true }
      }

      // compute pricing with coupon for the one item
      const { pricing } = await computePricingAndBestCoupon(this.prisma, userId, {
        courseId: course.id,
        isFree: course.isFree,
        price: course.price,
        couponCode,
      })

      return {
        isFree: false,
        item: {
          courseId: course.id,
          title: course.title,
          thumbnail: course.thumbnail,
          original: pricing.originalPrice,
          discount: pricing.discount,
          final: pricing.finalPrice,
        },
      }
    })

    if (precheck.isFree) {
      throw new BadRequestException('This course is free and has been enrolled already')
    }

    const item = precheck.item!
    if (item.final <= 0) throw new BadRequestException('Nothing to charge')

    const order = await this.createOrderSnapshot({
      userId,
      context: 'BUY_NOW',
      items: [item],
    })

    // Call MoMo
    const amount = Number(order.totalAmount)
    const res = await this.momo.createPayment(order.orderNumber, amount, `Buy course #${courseId}`)
    if (!res?.payUrl) throw new BadRequestException('Failed to create MoMo payment')

    await this.prisma.order.update({
      where: { id: order.id },
      data: {
        status: OrderStatus.Pending,
        paymentMethod: PAYMENT_METHOD.MOMO,
        paymentReference: res.requestId ?? null,
        orderedAt: new Date(),
      },
    })

    return { payUrl: res.payUrl, orderNumber: order.orderNumber }
  }

  /** Create a cart order (from DB cart only) and initialize a MoMo session. */
  async initCartCheckout(userId: number, _payload: CheckoutCartInputType): Promise<PaymentInitResType> {
    await this.validateActiveUser(userId)
    return this.prisma.$transaction(async (tx) => {
      const rows = await tx.cart.findMany({
        where: { userId, deletedAt: null },
        include: { course: { select: ORDER_COURSE_MINI_SELECT } },
        orderBy: { createdAt: 'asc' },
      })
      if (rows.length === 0) throw new BadRequestException('Cart is empty')
      const courseIds = rows.map((r) => r.courseId)
      const items = await this.prepareItems(tx, userId, courseIds)
      const order = await this.createOrderSnapshot({ userId, context: 'CART', items })
      if (Number(order.totalAmount) <= 0) throw new BadRequestException('Nothing to charge')
      const res = await this.momo.createPayment(
        order.orderNumber,
        Number(order.totalAmount),
        `Checkout cart (${items.length} items)`,
      )
      if (!res?.payUrl) throw new BadRequestException('Failed to create MoMo payment')
      await tx.order.update({
        where: { id: order.id },
        data: {
          status: OrderStatus.Pending,
          paymentMethod: PAYMENT_METHOD.MOMO,
          paymentReference: res.requestId ?? null,
          orderedAt: new Date(),
        },
      })
      return { payUrl: res.payUrl, orderNumber: order.orderNumber }
    })
  }

  /** Handle MoMo IPN: verify signature, update order status, grant course access, write history, clear cart. */
  async handleMomoIpn(ipn: MomoIpnType): Promise<{ status: string }> {
    const order = await verifyAndLoadOrder(this.momo, this.prisma, ipn)
    if (TERMINAL_ORDER_STATUSES.has(order.status as OrderStatus)) {
      return { status: order.status }
    }

    const succeeded = Number(ipn.resultCode) === MOMO.RETURN_CODE.SUCCESS

    if (succeeded) {
      await markPaidAndFulfill(this.prisma, order, getPaymentRef(ipn, order.paymentReference ?? undefined))
      return { status: 'PAID' }
    }

    await markOrderStatus(
      this.prisma,
      order.id,
      OrderStatus.Failed,
      `MoMo failed: ${ipn.message ?? ''} (code=${ipn.resultCode})`,
    )
    this.logger.warn(`MoMo payment failed for order=${order.orderNumber}: ${ipn.message}`)
    return { status: 'FAILED' }
  }

  /**
   * Handle MoMo return (redirect with query params).
   * - Verify signature from query
   * - If resultCode === 0  → mark Paid immediately, enroll, write history, clear cart
   * - If resultCode === 1006 → Cancelled
   * - Else → Failed
   * NOTE: This trusts the return flow; IPN is still recommended as source of truth in production.
   */
  async handleMomoReturn(q: MomoReturnQueryType): Promise<{ status: string; orderNumber: string }> {
    const order = await verifyAndLoadOrder(this.momo, this.prisma, q)
    if (TERMINAL_ORDER_STATUSES.has(order.status as OrderStatus)) {
      return { status: order.status, orderNumber: order.orderNumber }
    }

    const rc = Number(q.resultCode)

    if (rc === MOMO.RETURN_CODE.SUCCESS) {
      await markPaidAndFulfill(
        this.prisma,
        order,
        getPaymentRef(q, order.paymentReference ?? undefined),
        q.message ? `MoMo return: ${q.message} (code=${rc})` : `MoMo return code=${rc}`,
      )
      return { status: 'Paid', orderNumber: order.orderNumber }
    }

    const newStatus: OrderStatus = rc === MOMO.RETURN_CODE.USER_CANCELLED ? OrderStatus.Cancelled : OrderStatus.Failed

    await markOrderStatus(
      this.prisma,
      order.id,
      newStatus,
      q.message ? `MoMo return: ${q.message} (code=${rc})` : `MoMo return code=${rc}`,
      getPaymentRef(q, order.paymentReference ?? undefined),
    )

    return { status: newStatus, orderNumber: order.orderNumber }
  }
}
