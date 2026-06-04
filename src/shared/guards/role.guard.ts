import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { ROLES_KEY } from '../decorator/role.decorator'
import { REQUEST_USER_KEY } from '../constants/auth.constant'

@Injectable()
export class RoleGuard implements CanActivate {
  constructor(private reflector: Reflector) {}
  /**
   * Determines whether the current user has one of the required roles to access a route.
   * This method uses the Reflector to retrieve the roles metadata defined by the
   * `@Roles()` decorator on the route handler or class.
   * - If no roles are specified, access is granted by default.
   * - If roles are specified, it checks whether the user's role matches one of the required roles.
   * @param {ExecutionContext} context - The execution context for the current request.
   * @returns {boolean} `true` if the user's role matches any of the required roles; otherwise, `false`.
   */
  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ])
    if (!requiredRoles || requiredRoles.length === 0) return true

    const request = context.switchToHttp().getRequest()
    const user = request[REQUEST_USER_KEY]
    return requiredRoles.includes(user?.roleName)
  }
}
