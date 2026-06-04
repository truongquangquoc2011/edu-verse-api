import { CallHandler, ExecutionContext, Injectable, Logger, NestInterceptor } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { map, Observable } from 'rxjs'
import { FieldPolicy, SanitizedUser, SanitizeOptions, UserRole } from 'src/shared/constants/role.constant'

@Injectable()
export class SensitiveFieldInterceptor implements NestInterceptor {
  private readonly logger = new Logger(SensitiveFieldInterceptor.name)
  private readonly fieldPolicyCache = new Map<string, string[]>()
  constructor(private readonly configService: ConfigService) {}
  /**
   * Intercept request and sanitize response.
   * @param context - Execution context.
   * @param next - Next handler.
   * @returns Observable sanitized data.
   */
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== 'http') {
      this.logger.warn('Interceptor only for HTTP contexts')
      return next.handle()
    }

    const request = context.switchToHttp().getRequest()
    const user = request.user as SanitizedUser | undefined
    if (!user?.roleName) {
      this.logger.debug('No user role found, skipping sanitization')
      return next.handle()
    }

    const role = user.roleName.toUpperCase() as UserRole
    const forbiddenFields = this.getForbiddenFields(role)

    return next.handle().pipe(map((data) => this.sanitizeData(data, { forbiddenFields, maxDepth: 5 })))
  }

  /**
   * Get forbidden fields for role (cached).
   * @param role - User role.
   * @returns Array fields need omit.
   */
  private getForbiddenFields(role: UserRole): string[] {
    if (this.fieldPolicyCache.has(role)) {
      return this.fieldPolicyCache.get(role)!
    }

    const policy = this.configService.get<FieldPolicy>('FIELD_POLICY', {})
    const fields = policy[role] ?? []
    this.fieldPolicyCache.set(role, fields)
    return fields
  }

  /**
   * Sanitize data recursively (handle nested objects/arrays).
   * @param data - Data to sanitize.
   * @param options - Options for omit.
   * @returns Data has omitted sensitive fields.
   * @example sanitizeData({ user: { name: 'John', email: 'john@ex.com' } }, { forbiddenFields: ['email'] }) → { user: { name: 'John' } }
   */
  private sanitizeData(data: unknown, options: SanitizeOptions, depth = 0): unknown {
    if (depth > options.maxDepth!) {
      this.logger.warn(`Max depth exceeded at depth ${depth}`)
      return data
    }

    if (
      !data ||
      typeof data !== 'object' ||
      (Array.isArray(data) === false && Object.getPrototypeOf(data) !== Object.prototype)
    ) {
      return data
    }

    if (Array.isArray(data)) {
      return data.map((item) => this.sanitizeData(item, options, depth + 1))
    }

    const obj = data as Record<string, unknown>
    const sanitized = {} as Record<string, unknown>

    for (const [key, value] of Object.entries(obj)) {
      if (!options.forbiddenFields.includes(key)) {
        sanitized[key] = this.sanitizeData(value, options, depth + 1)
      } else {
        this.logger.debug(`Omitted sensitive field: ${key} for role`)
      }
    }

    return sanitized
  }
}
