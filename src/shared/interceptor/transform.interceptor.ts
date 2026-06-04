import { Injectable, NestInterceptor, ExecutionContext, CallHandler, ClassSerializerInterceptor } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { Observable } from 'rxjs'
import { map } from 'rxjs/operators'

export interface Response<T> {
  data: T
}

// Cách 1: Sử dụng ClassSerializerInterceptor để tự động chuyển đổi kiểu dữ liệu
// @Injectable()
// export class TransformInterceptor<T> implements NestInterceptor<T, Response<T>> {
//   intercept(context: ExecutionContext, next: CallHandler): Observable<Response<T>> {
//     return next.handle().pipe(
//       map((data) => {
//         const response = context.switchToHttp().getResponse()
//         const statusCode = response.statusCode
//         const path = response.req.url
//         return { data, statusCode, path }
//       }),
//     )
//   }
// }

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, Response<T>> {
  constructor(private reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<Response<T>> {
    const serializerInterceptor = new ClassSerializerInterceptor(this.reflector)
    const transformed = serializerInterceptor.intercept(context, next)

    return transformed.pipe(
      map((data) => ({
        data,
        code: context.switchToHttp().getResponse().statusCode,
        path: context.switchToHttp().getRequest().url,
      })),
    )
  }
}
