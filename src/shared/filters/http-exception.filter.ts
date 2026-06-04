// src/shared/filters/http-exception.filter.ts
import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus, Logger } from '@nestjs/common'
import { Response } from 'express'
import { ZodSerializationException } from 'nestjs-zod'

@Catch() // catch-all: HttpException + non-HTTP exceptions
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name)

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp()
    const res = ctx.getResponse<Response>()

    // 
    let status = HttpStatus.INTERNAL_SERVER_ERROR
    let message = 'Internal.ServerError'
    let error = 'Internal Server Error'

    // Zod serialization logging (tuỳ chọn)
    if (exception instanceof ZodSerializationException) {
      const zerr = exception.getZodError()
      this.logger.error(`ZodSerializationException: ${zerr.message}`)
    }

    if (exception instanceof HttpException) {
      const body: any = exception.getResponse()
      status = exception.getStatus()
      message = typeof body === 'string' ? body : body?.message || exception.message || message
      error = body?.error || exception.name
    } else {
      // Non-HttpException: log full
      this.logger.error((exception as any)?.stack || (exception as any)?.message || exception)
    }

    return res.status(status).json({
      message,
      error,
      statusCode: status,
    })
  }
}
