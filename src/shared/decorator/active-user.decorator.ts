import { createParamDecorator, ExecutionContext } from '@nestjs/common'
import { Request } from 'express'
import { AccessTokenPayload } from '../@types/jwt.type'
import { REQUEST_USER_KEY } from '../constants/auth.constant'

/**
 * Extract user information from authenticated request.
 * @param field (Optional) Specific field in payload to retrieve
 * @returns Returns entire payload if no field passed, otherwise returns requested field value
 */
export const ActiveUser = createParamDecorator(
  (field: keyof AccessTokenPayload | undefined, context: ExecutionContext) => {
    const request = context.switchToHttp().getRequest<Request>()
    const user: AccessTokenPayload | undefined = request[REQUEST_USER_KEY]
    
    if (!user) {
      return undefined
    }

    return field ? user?.[field] : user
  },
)
