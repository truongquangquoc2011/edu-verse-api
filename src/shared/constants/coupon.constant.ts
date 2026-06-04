export const CouponDiscount = {
  FIXED: 'Fixed',
  PERCENTAGE: 'Percentage',
} as const

export type TypeCouponDiscount = (typeof CouponDiscount)[keyof typeof CouponDiscount]

