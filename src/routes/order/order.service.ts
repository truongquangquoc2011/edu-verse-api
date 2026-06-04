import { Injectable } from '@nestjs/common'
import {
  BuyNowInputType,
  CheckoutCartInputType,
  MomoIpnType,
  MomoReturnQueryType,
  PaymentInitResType,
} from './order.model'
import { OrderRepository } from './order.repo'

@Injectable()
export class OrderService {
  constructor(private readonly repo: OrderRepository) {}

  /**
   * Initialize a buy-now order and create a MoMo payment session.
   *
   * Endpoint: POST /orders/buy-now
   */
  initBuyNow(userId: number, payload: BuyNowInputType): Promise<PaymentInitResType> {
    return this.repo.initBuyNow(userId, payload)
  }

  /**
   * Initialize a cart checkout order (using server-side cart) and create a MoMo payment session.
   *
   * Endpoint: POST /orders/cart-checkout
   */
  initCartCheckout(userId: number, payload: CheckoutCartInputType): Promise<PaymentInitResType> {
    return this.repo.initCartCheckout(userId, payload)
  }

  /**
   * Handle MoMo IPN callback (server-to-server).
   *
   * Endpoint: POST /orders/momo/ipn
   */
  handleMomoIpn(ipn: MomoIpnType): Promise<{ status: string }> {
    return this.repo.handleMomoIpn(ipn)
  }

  /**
   * Handle MoMo return (user redirect back with query params).
   *
   * Endpoint: GET /orders/momo/return
   */
  handleMomoReturn(q: MomoReturnQueryType): Promise<{ status: string; orderNumber: string }> {
    return this.repo.handleMomoReturn(q)
  }
}
