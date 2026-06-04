import { applyDecorators, Type } from '@nestjs/common'
import { HttpStatusCode, ResponseMessage } from '../swagger/swagger.interface'
import { ApiExtraModels, ApiResponse, ApiResponseOptions, getSchemaPath } from '@nestjs/swagger'

interface SwaggerProp {
  type?: string
  example?: any
  description?: string
  format?: string
  items?: { $ref: string }
  allOf?: any[]
}

export function ApiSuccessResponse<TModel extends Type<unknown>>(
  statusCode: HttpStatusCode,
  responseMessage: ResponseMessage,
  model?: TModel,
  isArray = false,
  extraProps: Record<string, SwaggerProp> = {},
) {
  const baseProps: Record<string, SwaggerProp> = {
    statusCode: { type: 'number', example: responseMessage.statusCode, description: 'HTTP response status code' },
    message: { type: 'string', example: responseMessage.message, description: 'Response feedback message' },
    dateTime: {
      type: 'string',
      format: 'date-time',
      example: '2023-01-01T00:00:00.000Z',
      description: 'Response timestamp',
    },
    ...extraProps,
  }

  if (model) {
    baseProps.data = isArray
      ? { type: 'array', items: { $ref: getSchemaPath(model) }, description: 'Array of response data models' }
      : { allOf: [{ $ref: getSchemaPath(model) }], description: 'Response data model' }
  }

  const responseOptions: ApiResponseOptions = {
    status: statusCode,
    description: responseMessage.description || responseMessage.message,
    schema: {
      type: 'object',
      properties: baseProps,
      required: ['statusCode', 'message', 'dateTime', ...(model ? ['data'] : [])],
    },
  }

  return model
    ? applyDecorators(ApiExtraModels(model), ApiResponse(responseOptions))
    : applyDecorators(ApiResponse(responseOptions))
}
