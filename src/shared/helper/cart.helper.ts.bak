import { NotFoundException } from '@nestjs/common'
import { Cart, Course, Teacher, User, PrismaClient, CouponDiscountType } from '@prisma/client'
import { CartCourseMiniType } from 'src/routes/cart/cart.model'
import { CART_MESSAGES } from '../constants/cart-message.constant'
type DiscountKind = 'PERCENT' | 'AMOUNT'
/**
 * Prisma SELECT object for minimal course data when joined with Cart.
 * Shared between repository and helper functions.
 */
export const COURSE_MINI_SELECT = {
  id: true,
  title: true,
  thumbnail: true,
  price: true,
  isFree: true,
  status: true,
  deletedAt: true,
  isDelete: true,
  category: { select: { id: true, name: true } },
  teacher: { select: { id: true, user: { select: { fullname: true, username: true } } } },
} as const

/**
 * Internal type representing a course with joined relations
 * according to COURSE_MINI_SELECT.
 */
type CourseWithJoins = Course & {
  category: { id: number; name: string } | null
  teacher: (Teacher & { user: Pick<User, 'fullname' | 'username'> | null }) | null
}

/**
 * Safely convert Prisma Decimal or other unknown numeric values to a displayable form,
 * ensuring price precision is not lost during JSON serialization.
 */
export function toDisplayPrice(v: unknown): string | number {
  // If Prisma Decimal or any object with toString(), use it; otherwise return the raw value.
  // @ts-ignore
  return v && typeof v === 'object' && typeof (v as any).toString === 'function' ? (v as any).toString() : (v as any)
}

/** Convert an unknown price to a numeric value for calculations (floored to avoid fractions). */
export function toNumberPrice(v: unknown): number {
  const s = toDisplayPrice(v)
  if (typeof s === 'number') return Math.floor(s)
  const n = Number(s ?? 0)
  return Number.isFinite(n) ? Math.floor(n) : 0
}

/**
 * Map a course entity (selected via COURSE_MINI_SELECT)
 * into the minimal course representation used in cart responses.
 */
export function mapCourseToMini(c: CourseWithJoins): CartCourseMiniType {
  return {
    id: c.id,
    title: c.title,
    thumbnail: c.thumbnail ?? null,
    price: toDisplayPrice(c.price),
    isFree: c.isFree,
    category: c.category ? { id: c.category.id, name: c.category.name } : null,
    teacher: c.teacher
      ? {
          id: c.teacher.id,
          fullname: c.teacher.user?.fullname ?? undefined,
          username: c.teacher.user?.username ?? null,
        }
      : null,
  }
}

/**
 * Type representing a single cart row including its joined course data.
 * Used as input to the cart item mapper.
 */
export type CartRowForMap = {
  courseId: number
  createdAt: Date
  course: {
    id: number
    title: string
    thumbnail: string | null
    price: unknown
    isFree: boolean
    category: { id: number; name: string } | null
    teacher: { id: number; user: { fullname: string | null; username: string | null } | null } | null
  }
}

/**
 * Map a single cart row into a full cart item representation with pricing and coupon placeholders.
 */
export function mapCartRowToItem(row: CartRowForMap) {
  const originalPrice = row.course.isFree ? 0 : toNumberPrice(row.course.price)
  return {
    courseId: row.courseId,
    addedAt: row.createdAt,
    course: mapCourseToMini(row.course as any),
    pricing: {
      originalPrice,
      discount: 0,
      finalPrice: originalPrice,
    },
    bestCoupon: null as {
      code: string
      kind: 'PERCENT' | 'AMOUNT'
      value: number
      discountAmount: number
    } | null,
  }
}

// PRICING & COUPON HELPERS

/** Calculate discount amount based on coupon type (supports PERCENT/AMOUNT/Percentage/Fixed). */
export function calcDiscountAmount(
  price: number,
  discountType: CouponDiscountType | 'PERCENT' | 'AMOUNT' | 'Percentage' | 'Fixed' | 'PERCENTAGE' | 'FIXED',
  discountAmount: number,
): number {
  if (price <= 0) return 0

  const kind = normalizeCouponKind(discountType)

  if (kind === 'PERCENT') {
    // discountAmount is a percentage value; floor to stabilize totals
    return Math.floor((price * discountAmount) / 100)
  }
  // AMOUNT (Fixed): cap at base price; floor to avoid fractions
  return Math.min(price, Math.floor(discountAmount))
}

/** Build a pricing summary block for one item. */
export function buildPricing(originalPrice: number, discount: number) {
  const finalPrice = Math.max(0, originalPrice - discount)
  return { originalPrice, discount, finalPrice }
}

/** Basic valid-coupon filter condition (ignores global/per-user quota for now). */
function buildCouponWhere(courseId: number) {
  return {
    isDelete: false,
    expirationDate: { gte: new Date() },
    OR: [{ courseId }, { courseId: null }],
  }
}

/** Retrieve coupons applicable to a specific (userId, courseId). Can be extended with quota checks later. */
export async function findApplicableCoupons(prisma: PrismaClient, _userId: number, courseId: number) {
  return prisma.coupon.findMany({
    where: buildCouponWhere(courseId),
    select: {
      id: true,
      code: true,
      discountType: true,
      discountAmount: true,
      maxUses: true,
      perUserLimit: true,
    },
  })
}

/** Normalize CouponDiscountType enum → 'PERCENT' | 'AMOUNT' to avoid type mismatches. */
export function normalizeCouponKind(
  kind: CouponDiscountType | 'PERCENT' | 'AMOUNT' | 'Percentage' | 'Fixed' | 'PERCENTAGE' | 'FIXED',
): 'PERCENT' | 'AMOUNT' {
  const s = String(kind).toLowerCase()
  if (s === 'percent' || s === 'percentage') return 'PERCENT'
  if (s === 'amount' || s === 'fixed') return 'AMOUNT'
  throw new Error('Invalid discount type')
}

type ChosenCoupon = {
  code: string
  kind: 'PERCENT' | 'AMOUNT'
  value: number
  computedOff: number
}

/**
 * Coupon selection strategy:
 * - If couponCode is provided and valid, apply it.
 * - Otherwise, automatically choose the coupon giving the highest discount.
 * Returns normalized kind.
 */
export async function chooseCoupon(
  prisma: PrismaClient,
  userId: number,
  courseId: number,
  basePrice: number,
  couponCode?: string,
): Promise<ChosenCoupon | null> {
  if (couponCode) {
    // Direct lookup by code with validity filter
    const c = await prisma.coupon.findFirst({
      where: { code: couponCode, ...buildCouponWhere(courseId) },
      select: { code: true, discountType: true, discountAmount: true },
    })
    if (!c) return null
    const kind = normalizeCouponKind(c.discountType)
    const off = calcDiscountAmount(basePrice, kind, c.discountAmount)
    if (off <= 0) return null
    return { code: c.code, kind, value: c.discountAmount, computedOff: off }
  }

  // Auto-pick the best coupon when no code is provided
  const coupons = await findApplicableCoupons(prisma, userId, courseId)
  let best: ChosenCoupon | null = null
  for (const c of coupons) {
    const kind = normalizeCouponKind(c.discountType)
    const off = calcDiscountAmount(basePrice, kind, c.discountAmount)
    if (!best || off > best.computedOff) {
      best = { code: c.code, kind, value: c.discountAmount, computedOff: off }
    }
  }
  return best
}

/**
 * Compute pricing and determine the best applicable coupon for one cart item.
 * Returns both pricing and the best coupon (if any).
 */
export async function computePricingAndBestCoupon(
  prisma: PrismaClient,
  userId: number,
  opt: {
    courseId: number
    isFree: boolean
    price: unknown
    couponCode?: string
  },
) {
  const basePrice = opt.isFree ? 0 : toNumberPrice(opt.price)
  let discount = 0
  let best: ChosenCoupon | null = null

  if (!opt.isFree && basePrice > 0) {
    if (opt.couponCode) {
      // Enforce "not found" / "not applicable" as 404 when a code is provided
      best = await chooseCoupon(prisma, userId, opt.courseId, basePrice, opt.couponCode)
      if (!best) {
        // All comments in English as requested
        throw new NotFoundException(CART_MESSAGES.COUPON_NOT_FOUND ?? 'Coupon not found')
      }
      discount = best.computedOff
    } else {
      // Auto-pick when no couponCode provided
      best = await chooseCoupon(prisma, userId, opt.courseId, basePrice)
      discount = best?.computedOff ?? 0
    }
  }

  const pricing = buildPricing(basePrice, discount)
  const bestCoupon = best
    ? { code: best.code, kind: best.kind, value: best.value, discountAmount: best.computedOff }
    : null

  return { pricing, bestCoupon }
}
