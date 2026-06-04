import { UnauthorizedException } from '@nestjs/common'
import { ERROR_MESSAGE } from '../constants/error-message.constant'

export function validateUserStatus(status: string) {
  if (status === 'INACTIVE') {
    throw new UnauthorizedException(ERROR_MESSAGE.USER.ACCOUNT_INACTIVE)
  }

  if (status === 'BLOCKED') {
    throw new UnauthorizedException(ERROR_MESSAGE.USER.ACCOUNT_BLOCKED)
  }

  if (status === 'SUSPENDED') {
    throw new UnauthorizedException(ERROR_MESSAGE.USER.ACCOUNT_SUSPENDED)
  }
}
