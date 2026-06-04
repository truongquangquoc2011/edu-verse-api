/** Currencies */
export const CURRENCY = {
  VND: 'VND',
} as const

/** Payment methods */
export const PAYMENT_METHOD = {
  MOMO: 'MOMO',
} as const

/** MoMo constants */
export const MOMO = {
  REQUEST_TYPE: 'captureWallet',
  RETURN_CODE: {
    SUCCESS: 0,
    USER_CANCELLED: 1006,
  },
} as const
