import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common'

export const UserNotFoundException = new NotFoundException({
  message: 'Error.UserNotFound',
  path: 'enrollments',
})

export const UserInactiveException = new ForbiddenException({
  message: 'Error.UserInactive',
  path: 'enrollments',
})

export const CourseNotFoundException = new NotFoundException({
  message: 'Error.CourseNotFound',
  path: 'enrollments',
})

export const AlreadyEnrolledException = new ConflictException({
  message: 'Error.AlreadyEnrolled',
  path: 'enrollments',
})

export const DataInvalidException = new BadRequestException({
  message: 'Error.DataInvalid',
  path: 'enrollments',
})

export const InternalCreateEnrollmentException = new InternalServerErrorException({
  message: 'Error.InternalCreateEnrollment',
  path: 'enrollments',
})
