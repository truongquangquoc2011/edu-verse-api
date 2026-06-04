import { createZodDto } from 'nestjs-zod'
import {
  BuyNowInputSchema,
  CheckoutCartInputSchema,
  MomoIpnSchema,
  MomoReturnQuerySchema,
  PaymentInitResSchema,
} from '../order.model'

// ===== Order / Payment =====

/** Buy-now single course */
export class BuyNowDTO extends createZodDto(BuyNowInputSchema) {}

/** Checkout entire cart */
export class CheckoutCartDTO extends createZodDto(CheckoutCartInputSchema) {}

/** Response after initializing MoMo session */
export class PaymentInitResDTO extends createZodDto(PaymentInitResSchema) {}

/** MoMo IPN payload */
export class MomoIpnDTO extends createZodDto(MomoIpnSchema) {}
/** MoMo return (redirect) query */
export class MomoReturnDTO extends createZodDto(MomoReturnQuerySchema) {}
