import { applyDecorators, SetMetadata, UseGuards } from '@nestjs/common'
import { PermissionGuard } from '../guards/permission.guard'

export const PERMISSIONS_KEY = 'permissions'
export const PERMISSION_MODE_KEY = 'permission_mode'

// Kiểu check: ALL (mặc định) hoặc ANY
export type PermissionMode = 'ALL' | 'ANY'

// Viết ngắn gọn như Roles(...):
export function Permissions(...perms: string[]) {
  return SetMetadata(PERMISSIONS_KEY, perms)
}

// Alias siêu ngắn: Perm('course:create')
export const Perm = (...perms: string[]) => Permissions(...perms)

// Yêu cầu ANY thay vì ALL: AnyPerm('a','b') = có 1 trong 2 là pass
export function AnyPerm(...perms: string[]) {
  return applyDecorators(
    SetMetadata(PERMISSIONS_KEY, perms),
    SetMetadata(PERMISSION_MODE_KEY, 'ANY'),
  )
}

// 1 dòng khép kín: set metadata + tự gắn guard
// RequirePerm('course:create') hoặc RequirePerm(['a','b'],'ANY')
export function RequirePerm(
  perms: string[] | string,
  mode: PermissionMode = 'ALL',
) {
  const list = Array.isArray(perms) ? perms : [perms]
  return applyDecorators(
    SetMetadata(PERMISSIONS_KEY, list),
    SetMetadata(PERMISSION_MODE_KEY, mode),
    UseGuards(PermissionGuard),
  )
}

// Helper đặt namespace cho permission: P('course')('create','update') -> 'course:create','course:update'
export const P =
  (ns: string) =>
  (...actions: string[]) =>
    Permissions(...actions.map((a) => `${ns}:${a}`))
