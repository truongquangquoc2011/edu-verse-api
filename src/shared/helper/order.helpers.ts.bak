import { OrderStatus } from '@prisma/client'
import { PrismaService } from 'src/shared/services/prisma.service'
import { MomoService } from 'src/shared/services/momo.service'
import { BadRequestException, NotFoundException } from '@nestjs/common'
import { PAYMENT_METHOD } from 'src/shared/constants/payment.constant'

/** Minimal payload structure used to extract a payment reference */
export type PaymentRefLike = { transId?: string | number; requestId?: string }

/** Type used for MoMo signature verification (avoids using any) */
export type MomoSignable = Record<string, string | number | boolean | null | undefined>

/** Set of terminal order statuses (end-of-lifecycle states) */
export const TERMINAL_ORDER_STATUSES = new Set<OrderStatus>([
  OrderStatus.Paid,
  OrderStatus.Failed,
  OrderStatus.Cancelled,
  OrderStatus.Refunded,
  OrderStatus.PartialRefund,
  OrderStatus.Expired,
] as const)

/** Minimal Order shape required for fulfillment */
export type OrderForFulfill = {
  id: number
  userId: number
  orderNumber: string
  orderedAt: Date | null
  orderItems: Array<{
    courseId: number
    courseTitle: string
    courseThumbnail: string | null
    originalPrice: number
    finalPrice: number
    discountAmount: number
  }>
}

/** Safely extract a payment reference in a consistent way */
export function getPaymentRef(p: PaymentRefLike, fallback?: string) {
  return String(p.transId ?? p.requestId ?? fallback ?? '')
}

/** Cast payload into a signable format without using any */
export function toSignable(payload: unknown): MomoSignable {
  return payload as MomoSignable
}

/** Verify MoMo signature; throw if invalid */
export function verifySignatureOrThrow(momo: MomoService, payload: unknown) {
  const ok = momo.verifySignature(toSignable(payload))
  if (!ok) throw new BadRequestException('Invalid MoMo signature')
}

/**
 * Load an order by its orderNumber, always including orderItems.
 * Returns a strictly typed object compatible with OrderForFulfill.
 */
export async function loadOrderOrThrow(
  prisma: PrismaService,
  orderNumber: string,
): Promise<
  OrderForFulfill & {
    status: OrderStatus
    paymentReference: string | null
  }
> {
  const order = await prisma.order.findFirst({
    where: { orderNumber },
    include: { orderItems: true },
  })
  if (!order) throw new NotFoundException('Order not found')

  // Controlled cast: Prisma includes orderItems; we declare type explicitly for TS awareness.
  return order as unknown as OrderForFulfill & {
    status: OrderStatus
    paymentReference: string | null
  }
}

/**
 * Combined helper to verify MoMo signature and load the corresponding order.
 * Useful for IPN and return flows.
 */
export async function verifyAndLoadOrder(
  momo: MomoService,
  prisma: PrismaService,
  payload: { orderId: string | number },
): Promise<
  OrderForFulfill & {
    status: OrderStatus
    paymentReference: string | null
  }
> {
  verifySignatureOrThrow(momo, payload)
  const orderNumber = String(payload.orderId)
  return loadOrderOrThrow(prisma, orderNumber)
}

/**
 * Update order status (Failed, Cancelled, etc.) in a clean, concise way.
 */
export async function markOrderStatus(
  prisma: PrismaService,
  id: number,
  status: OrderStatus,
  note?: string,
  paymentRef?: string,
) {
  await prisma.order.update({
    where: { id },
    data: {
      status,
      ...(note ? { adminNotes: note } : {}),
      ...(paymentRef ? { paymentReference: paymentRef } : {}),
    },
  })
}

/**
 * Mark an order as Paid, grant course access, record purchase history,
 * and clear the user's cart — all within a single transaction.
 */
export async function markPaidAndFulfill(
  prisma: PrismaService,
  order: OrderForFulfill,
  paymentRef: string,
  adminNote?: string,
) {
  await prisma.$transaction(async (tx) => {
    await tx.order.update({
      where: { id: order.id },
      data: {
        status: OrderStatus.Paid,
        paymentMethod: PAYMENT_METHOD.MOMO,
        paymentReference: paymentRef,
        paidAt: new Date(),
        ...(adminNote ? { adminNotes: adminNote } : {}),
      },
    })

    for (const it of order.orderItems) {
      await tx.enrollment.upsert({
        where: { userId_courseId: { userId: order.userId, courseId: it.courseId } },
        update: { status: 'NotStarted' },
        create: {
          userId: order.userId,
          courseId: it.courseId,
          status: 'NotStarted',
          enrolledAt: new Date(),
          createdById: order.userId,
        },
      })

      await tx.purchaseHistory.create({
        data: {
          userId: order.userId,
          orderId: order.id,
          orderNumber: order.orderNumber,
          courseId: it.courseId,
          courseTitle: it.courseTitle,
          courseThumbnail: it.courseThumbnail ?? undefined,
          originalPrice: it.originalPrice,
          finalPrice: it.finalPrice,
          discountAmount: it.discountAmount,
          currency: 'VND', // equivalent to CURRENCY.VND, avoids circular imports
          orderStatus: OrderStatus.Paid,
          paymentMethod: PAYMENT_METHOD.MOMO,
          orderedAt: order.orderedAt ?? new Date(),
          paidAt: new Date(),
          accessGrantedAt: new Date(),
          accessStatus: 'Active',
        },
      })

      await tx.cart.deleteMany({ where: { userId: order.userId, courseId: it.courseId } })
    }
  })
}
