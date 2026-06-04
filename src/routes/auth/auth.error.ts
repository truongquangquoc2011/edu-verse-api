import { BadRequestException, ForbiddenException, InternalServerErrorException, NotFoundException, UnprocessableEntityException } from "@nestjs/common";

export const EmailNotExistsException = new UnprocessableEntityException ({
    message: 'Errol.EmailNotExists',
    path: 'email',
})

export const InvalidOTPException = new UnprocessableEntityException({
    message: 'Error.InvalidOTP',
    path: 'code',
})

export const InvalidOTPExpiredExcepton = new UnprocessableEntityException({
    message: 'Error.InvalidOTPExpired',
    path: 'code',
})

export const InternalRetrieveUserErrorException = new InternalServerErrorException({
  message: 'Error.InternalRetrieveUserError',
  path: 'users',
})

export const UserNotFoundException = new NotFoundException({
  message: 'Error.UserNotFound',
  path: 'user',
})

export const LockPayloadRequiredException = new UnprocessableEntityException({
  message: 'Error.LockPayloadRequired', 
  path: 'user.lock',
})

export const LockUntilMustBeFutureException = new BadRequestException({
  message: 'Error.LockUntilMustBeFuture', 
  path: 'user.lock',
})

export const InvalidUntilDatetimeException = new UnprocessableEntityException({
  message: 'Error.InvalidUntilDatetime',
  path: 'user.lock',
})

export const InternalLockUserErrorException = new InternalServerErrorException({
  message: 'Error.InternalLockUser',
  path: 'user.lock',
})

export const InternalUnlockUserErrorException = new InternalServerErrorException({
  message: 'Error.InternalUnlockUser',
  path: 'user.unlock',
})

export const LockDurationRequiredForViolationException = new UnprocessableEntityException({
  message: 'Error.LockDurationRequiredForViolation',
  path: 'user.violation',
})

export const InternalCreateViolationErrorException = new InternalServerErrorException({
  message: 'Error.InternalCreateViolation',
  path: 'user.violation',
})

export const UserBlockedException = new ForbiddenException({
  message: 'Error.UserBlocked',
  path: 'user.status',
})