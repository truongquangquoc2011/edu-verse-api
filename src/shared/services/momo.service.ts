import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import axios from 'axios'
import * as crypto from 'crypto'

@Injectable()
export class MomoService {
  private readonly logger = new Logger(MomoService.name)

  // Cached env values (loaded once in constructor)
  private readonly partnerCode: string
  private readonly accessKey: string
  private readonly secretKey: string
  private readonly createUrl: string
  private readonly redirectUrl: string
  private readonly ipnUrl: string

  constructor(private readonly config: ConfigService) {
    // Read from ConfigService first; fallback to process.env to be resilient
    this.partnerCode = this.config.get<string>('MOMO_PARTNER_CODE') ?? process.env.MOMO_PARTNER_CODE ?? ''
    this.accessKey = this.config.get<string>('MOMO_ACCESS_KEY') ?? process.env.MOMO_ACCESS_KEY ?? ''
    this.secretKey = this.config.get<string>('MOMO_SECRET_KEY') ?? process.env.MOMO_SECRET_KEY ?? ''
    this.createUrl = this.config.get<string>('MOMO_CREATE_URL') ?? process.env.MOMO_CREATE_URL ?? ''
    this.redirectUrl = this.config.get<string>('MOMO_REDIRECT_URL') ?? process.env.MOMO_REDIRECT_URL ?? ''
    this.ipnUrl = this.config.get<string>('MOMO_IPN_URL') ?? process.env.MOMO_IPN_URL ?? ''

    // Basic validation to fail fast on misconfiguration
    const missing: string[] = []
    if (!this.partnerCode) missing.push('MOMO_PARTNER_CODE')
    if (!this.accessKey) missing.push('MOMO_ACCESS_KEY')
    if (!this.secretKey) missing.push('MOMO_SECRET_KEY')
    if (!this.createUrl) missing.push('MOMO_CREATE_URL')
    if (!this.redirectUrl) missing.push('MOMO_REDIRECT_URL')
    if (!this.ipnUrl) missing.push('MOMO_IPN_URL')

    if (missing.length) {
      this.logger.error(`MoMo config missing: ${missing.join(', ')}`)
      throw new Error(`MoMo configuration is incomplete. Missing: ${missing.join(', ')}`)
    }
  }

  /** Create a payment on MoMo and return payUrl + identifiers. */
  async createPayment(orderId: string, amount: number, orderInfo: string) {
    // MoMo expects integer VND as string
    const amt = Math.max(0, Math.floor(Number(amount)) || 0)
    if (amt <= 0) throw new Error('Invalid amount for MoMo payment')

    const requestId = `${this.partnerCode}_${Date.now()}`

    // Raw signature must follow MoMo's exact order for "create" API
    const rawSignature =
      `accessKey=${this.accessKey}` +
      `&amount=${amt}` +
      `&extraData=` +
      `&ipnUrl=${this.ipnUrl}` +
      `&orderId=${orderId}` +
      `&orderInfo=${orderInfo}` +
      `&partnerCode=${this.partnerCode}` +
      `&redirectUrl=${this.redirectUrl}` +
      `&requestId=${requestId}` +
      `&requestType=captureWallet`

    const signature = crypto.createHmac('sha256', this.secretKey).update(rawSignature).digest('hex')

    const payload = {
      partnerCode: this.partnerCode,
      accessKey: this.accessKey,
      requestId,
      amount: String(amt),
      orderId,
      orderInfo,
      redirectUrl: this.redirectUrl,
      ipnUrl: this.ipnUrl,
      extraData: '',
      requestType: 'captureWallet',
      signature,
      lang: 'vi',
    }

    const { data } = await axios.post(this.createUrl, payload, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 15000,
    })

    if (!data || typeof data !== 'object' || !data.payUrl) {
      this.logger.error(`MoMo create error: ${JSON.stringify(data)}`)
      throw new Error('MoMo create payment failed')
    }

    this.logger.log(`MoMo payment created: ${JSON.stringify({ orderId: data.orderId, requestId: data.requestId })}`)
    return data
  }

  /**
   * Verify MoMo IPN signature (v2).
   * IMPORTANT: Must follow MoMo's exact key order — DO NOT sort keys alphabetically.
   */
  verifySignature(params: Record<string, any>): boolean {
    const {
      partnerCode,
      orderId,
      requestId,
      amount,
      orderInfo,
      orderType = 'momo_wallet',
      transId = '',
      resultCode,
      message,
      payType = '',
      responseTime = '',
      extraData = '',
      signature,
    } = params

    const raw =
      `accessKey=${this.accessKey}` +
      `&amount=${amount}` +
      `&extraData=${extraData}` +
      `&message=${message}` +
      `&orderId=${orderId}` +
      `&orderInfo=${orderInfo}` +
      `&orderType=${orderType}` +
      `&partnerCode=${partnerCode}` +
      `&payType=${payType}` +
      `&requestId=${requestId}` +
      `&responseTime=${responseTime}` +
      `&resultCode=${resultCode}` +
      `&transId=${transId}`

    const expected = crypto.createHmac('sha256', this.secretKey).update(raw).digest('hex')
    return expected === signature
  }
}
