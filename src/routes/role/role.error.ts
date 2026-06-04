import {
  ForbiddenException,
  InternalServerErrorException,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common'

export const RoleAlreadyExistsException = new UnprocessableEntityException({
  message: 'Error.RoleAlreadyExists',
  path: 'role',
})

// === Role Internal Server Exceptions ===
export const InternalCreateRoleErrorException = new InternalServerErrorException({
  message: 'Error.InternalCreateRoleError',
  path: 'role',
})

export const RoleNotFoundException = new NotFoundException({
  message: 'Error.RoleNotFound',
  path: 'role',
})

export const InternalAssignPermissionsToRoleErrorException = new InternalServerErrorException({
  message: 'Error.InternalAssignPermissionsToRoleError',
  path: 'roles',
})

export const UserNotFoundException = new NotFoundException({
  message: 'Error.UserNotFound',
  path: 'user',
})

export const InternalAssignRolesToUserErrorException = new InternalServerErrorException({
  message: 'Error.InternalAssignRolesToUserError',
  path: 'roles',
})

export const InternalRestoreRoleErrorException = new InternalServerErrorException({
  message: 'Error.Role.RestoreFailed',
  path: 'role',
})
export const InternalDeleteRoleErrorException = new InternalServerErrorException({
  message: 'Error.Role.DeleteFailed',
  path: 'role',
})

export const InternalUpdateRoleErrorException = new InternalServerErrorException({
  message: 'Error.Role.UpdateFailed',
  path: 'role',
})

export const CannotUpdateAdminException = new ForbiddenException({
  message: 'Error.Role.CannotUpdateAdmin',
  path: 'role',
})
