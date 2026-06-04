import { ApiResponse, ApiResponseOptions } from '@nestjs/swagger'
import { HttpStatusCode, ResponseMessage } from '../swagger/swagger.interface'
import { applyDecorators } from '@nestjs/common'

export function ApiErrorResponse(statusCode: HttpStatusCode, responseMessage: ResponseMessage) {
  const responseOptions: ApiResponseOptions = {
    status: statusCode,
    description: responseMessage.description || responseMessage.message,
    schema: {
      type: 'object',
      properties: {
        statusCode: {
          type: 'number',
          example: responseMessage.statusCode,
          description: 'Error code identifier',
        },
        message: {
          type: 'string',
          example: responseMessage.message,
          description: 'Error message',
        },
        dateTime: {
          type: 'string',
          format: 'date-time',
          example: new Date().toISOString(),
          description: 'Time of error',
        },
      },
      required: ['statusCode', 'message', 'dateTime'],
    },
  }

  return applyDecorators(ApiResponse(responseOptions))
}
