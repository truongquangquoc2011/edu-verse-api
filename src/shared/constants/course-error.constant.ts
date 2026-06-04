import { BadRequestException, NotFoundException } from '@nestjs/common'

export const CourseNotFoundOrForbiddenException = new NotFoundException({
  message: 'Error.CourseNotFoundOrForbidden',
  path: 'course',
})

export const CourseAlreadyDeletedException = new BadRequestException({
  message: 'Error.CourseAlreadyDeleted',
  path: 'course',
})

export const CourseNotDeletedException = new BadRequestException({
  message: 'Error.CourseNotDeleted',
  path: 'course',
})

export const CourseCannotDeleteApprovedException = new BadRequestException({
  message: 'Error.CourseCannotDeleteApproved',
  path: 'course',
})
