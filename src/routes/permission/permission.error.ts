import { BadRequestException, InternalServerErrorException, NotFoundException, UnprocessableEntityException } from "@nestjs/common";

export const PermissionAlreadyExistsException = new UnprocessableEntityException ({
    message: 'Errol.PermisisonAlreadyExists',
    path: 'permission',
})

export const InternalCreatePermissionErrorException = new UnprocessableEntityException({
  message: 'Error.InternalCreatePermissionError',
  path: 'permission',
})

export const AtLeastOneFieldMustBeProvidedException = new BadRequestException({
  message: 'Error.AtLeastOneFieldMustBeProvided',
  path: 'permissions',
})

export const PermissionNotFoundException = new NotFoundException({
  message: 'Error.PermissionNotFound',
  path: 'permissions',
})

export const InternalUpdatePermissionErrorException = new InternalServerErrorException({
  message: 'Error.InternalUpdatePermissionError',
  path: 'permissions',
})

export const InternalAssignRoleToPermissionErrorException = new InternalServerErrorException({
  message: 'Error.InternalAssignRoleToPermissionError',
  path: 'permissions',
})

export const InternalRetrievePermissionErrorException = new InternalServerErrorException({
  message: 'Error.InternalRetrievePermissionError',
  path: 'permissions',
})

export const InternalDeletePermissionErrorException = new InternalServerErrorException({
  message: 'Error.InternalDeletePermissionError',
  path: 'permissions',
})