// src/routes/order/order.model.ts
import { z } from 'zod'
import { createZodDto } from 'nestjs-zod'
// Configurable (inject in service if need validate runtime)
const COUPON_MAX_LENGTH = 64

// Reusable positive int
const PositiveIntSchema = z.coerce.number().int().positive({ message: 'Must be positive integer' })
/**
 * ==================== INPUT SCHEMAS ====================
 */

/** Buy-now: FE only sends courseId (+ optional couponCode). Price is computed on server. */
export const BuyNowInputSchema = z
  .object({
    courseId: PositiveIntSchema,
    couponCode: z
      .string()
      .trim()
      .min(1, { message: 'Coupon code required if provided' })
      .max(COUPON_MAX_LENGTH, { message: `Coupon code max ${COUPON_MAX_LENGTH} characters` })
      .optional(),
  })
  .strict()

/** Cart checkout: currently no body fields (kept for future extensibility). */
export const CheckoutCartInputSchema = z.object({}).strict().default({})

/** MoMo IPN payload (only the fields we actually use/verify). */
export const MomoIpnSchema = z
  .object({
    partnerCode: z.string(),
    orderId: z.string(),
    requestId: z.string(),
    amount: z.coerce.number().min(0, { message: 'Amount must be non-negative' }),
    orderInfo: z.string(),
    orderType: z.string().optional(),
    transId: z.coerce.number().optional(),
    resultCode: z.number(),
    message: z.string(),
    payType: z.string().optional(),
    responseTime: z.coerce.number().optional(),
    extraData: z.string().optional(),
    signature: z.string(),
  })
  .superRefine((data, ctx) => {
    // Placeholder: Verify signature (implement in service with secret)
    if (data.signature === '') {
      // Example check
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Invalid signature', path: ['signature'] })
    }
  })
// ===== MoMo RETURN (redirect) =====
export const MomoReturnQuerySchema = z.object({
  partnerCode: z.string(),
  orderId: z.string(), // your orderNumber
  requestId: z.string(),
  amount: z.string(),
  orderInfo: z.string(),
  orderType: z.string().optional(),
  transId: z.string().optional(),
  resultCode: z.coerce.number(),
  message: z.string().optional(),
  payType: z.string().optional(),
  responseTime: z.string().optional(),
  extraData: z.string().optional(),
  signature: z.string(),
})
/**
 * ==================== RESPONSE SCHEMAS ====================
 */

/** Response returned to FE after initializing a MoMo session. */
export const PaymentInitResSchema = z.object({
  payUrl: z.string().url(),
  orderNumber: z.string(),
})

/**
 * Optional: public order status enum to keep in sync with Prisma enums.
 * If you want to validate IPN handler return shape later, reuse this.
 */
export const OrderStatusPublicSchema = z.enum([
  'Draft',
  'Pending',
  'Processing',
  'Paid',
  'Failed',
  'Cancelled',
  'Refunded',
  'PartialRefund',
  'Expired',
])

/**
 * ==================== DTO CLASSES ====================
 */

export class BuyNowInputDto extends createZodDto(BuyNowInputSchema) {}
export class CheckoutCartInputDto extends createZodDto(CheckoutCartInputSchema) {}
export class MomoIpnDto extends createZodDto(MomoIpnSchema) {}

/**
 * ==================== TYPES ====================
 */

export type BuyNowInputType = z.infer<typeof BuyNowInputSchema>
export type CheckoutCartInputType = z.infer<typeof CheckoutCartInputSchema>
export type MomoIpnType = z.infer<typeof MomoIpnSchema>

export type PaymentInitResType = z.infer<typeof PaymentInitResSchema>
export type OrderStatusPublicType = z.infer<typeof OrderStatusPublicSchema>
export type MomoReturnQueryType = z.infer<typeof MomoReturnQuerySchema>
