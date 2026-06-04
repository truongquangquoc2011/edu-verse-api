import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  Res,
} from '@nestjs/common'
import { ApiTags, ApiOperation, ApiBody } from '@nestjs/swagger'
import { Auth } from 'src/shared/decorator/auth.decorator'
import { ActiveUser } from 'src/shared/decorator/active-user.decorator'
import { AuthTypes, ConditionGuard } from 'src/shared/constants/auth.constant'
import { ZodSerializerDto } from 'nestjs-zod'
import { Response } from 'express'

import { OrderService } from './order.service'
import { BuyNowDTO, CheckoutCartDTO, MomoIpnDTO, PaymentInitResDTO, MomoReturnDTO } from './dto/order.dto'
import { RESPONSE_MESSAGES } from 'src/shared/constants/swagger.constant'
import { HttpStatusCode } from 'src/shared/swagger/swagger.interface'
import { ApiStandardResponses } from 'src/shared/decorator/api-standard-response'
import { envConfig } from 'src/shared/config'

@ApiTags('Order')
@Controller('orders')
export class OrderController {
  private readonly momoSuccessRedirectBase: URL
  private readonly momoFailRedirectBase: URL

  constructor(private readonly service: OrderService) {
    this.momoSuccessRedirectBase = new URL(envConfig.frontendSuccessUrl)
    this.momoFailRedirectBase = new URL(envConfig.frontendFailUrl)
  }

  /**
   * Build URL redirect for frontend with query params.
   */
  private buildRedirectUrl(base: URL, params: Record<string, string | number>): string {
    const url = new URL(base.toString())

    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.set(key, String(value))
    })

    return url.toString()
  }

  /**
   * Initialize a buy-now MoMo payment for a single course.
   *
   * - Requires authentication via Bearer token or API Key.
   * - Server computes the amount (no price from frontend).
   * - Returns MoMo `payUrl` and `orderNumber` for redirection.
   */
  @Auth([AuthTypes.BEARER, AuthTypes.APIKey], { condition: ConditionGuard.OR })
  @Post('buy-now')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Buy now (MoMo)',
    description: 'Create a buy-now order and initialize a MoMo payment session for a single course.',
  })
  @ApiBody({ type: BuyNowDTO })
  @ZodSerializerDto(PaymentInitResDTO)
  @ApiStandardResponses(HttpStatusCode.CREATED, RESPONSE_MESSAGES.ORDER.BUY_NOW, PaymentInitResDTO)
  buyNow(@ActiveUser('userId') userId: number, @Body() body: BuyNowDTO) {
    return this.service.initBuyNow(userId, body)
  }

  /**
   * Initialize a cart checkout MoMo payment using server-side cart data.
   *
   * - Requires authentication via Bearer token or API Key.
   * - Server loads cart from DB and computes totals (not from frontend).
   * - Returns MoMo `payUrl` and `orderNumber` for redirection.
   *
   * NOTE: Body must be JSON `{}` to satisfy DTO (Content-Type: application/json).
   */
  @Auth([AuthTypes.BEARER, AuthTypes.APIKey], { condition: ConditionGuard.OR })
  @Post('cart-checkout')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Checkout cart (MoMo)',
    description: 'Create an order from the user cart and initialize a MoMo payment session.',
  })
  @ApiBody({ type: CheckoutCartDTO })
  @ZodSerializerDto(PaymentInitResDTO)
  @ApiStandardResponses(HttpStatusCode.CREATED, RESPONSE_MESSAGES.ORDER.CART_CHECKOUT, PaymentInitResDTO)
  cartCheckout(@ActiveUser('userId') userId: number, @Body() body: CheckoutCartDTO) {
    return this.service.initCartCheckout(userId, body)
  }

  /**
   * MoMo IPN endpoint (public).
   *
   * - Verifies signature.
   * - Updates order status (Paid/Failed).
   * - Grants course access, writes purchase history, clears cart.
   *
   * Returns: `{ status: 'PAID' | 'FAILED' }`
   */
  @Post('momo/ipn')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'MoMo IPN',
    description: 'Handle MoMo payment notifications (server-to-server).',
  })
  @ApiBody({ type: MomoIpnDTO })
  momoIpn(@Body() payload: MomoIpnDTO) {
    return this.service.handleMomoIpn(payload)
  }

  /**
   * MoMo return (redirect after user action on MoMo page).
   *
   * - Verifies query signature.
   * - Updates order status (Paid/Cancelled/Failed).
   * - Redirect to frontend:
   *   - Success: FRONTEND_SUCCESS_URL
   *   - Fail/Cancel: FRONTEND_FAIL_URL
   */
  @Get('momo/return')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'MoMo return',
    description:
      'Handle user redirect from MoMo with query params; verify signature and then redirect to frontend.',
  })
  async momoReturn(@Query() q: MomoReturnDTO, @Res() res: Response) {
    const { status, orderNumber } = await this.service.handleMomoReturn(q)

    const isPaid = String(status).toLowerCase() === 'paid'

    const redirectUrl = isPaid
      ? this.buildRedirectUrl(this.momoSuccessRedirectBase, { orderNumber })
      : this.buildRedirectUrl(this.momoFailRedirectBase, { orderNumber, status })

    return res.redirect(redirectUrl)
  }
}
