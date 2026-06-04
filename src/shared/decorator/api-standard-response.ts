import { applyDecorators, Type } from '@nestjs/common'
import { HttpStatusCode, ResponseMessage } from '../swagger/swagger.interface'
import { ApiSuccessResponse } from './api-success-response.decorator'
import { ApiErrorResponse } from './api-error-response'
import { RESPONSE_MESSAGES } from '../constants/swagger.constant'

export function ApiStandardResponses<TModel extends Type<any>>(
  successStatus: HttpStatusCode,
  successMessage: ResponseMessage,
  model?: TModel,
  isArray?: boolean,
) {
  return applyDecorators(
    // Success response
    ApiSuccessResponse(successStatus, successMessage, model, isArray),

    // Common error responses
    ApiErrorResponse(HttpStatusCode.BAD_REQUEST, RESPONSE_MESSAGES.ERROR.BAD_REQUEST),
    ApiErrorResponse(HttpStatusCode.INTERNAL_SERVER_ERROR, RESPONSE_MESSAGES.ERROR.INTERNAL_ERROR),
  )
}
