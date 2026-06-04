import { BadRequestException } from '@nestjs/common'

export const DuplicateTitlesException = new BadRequestException({
  message: 'Error.DuplicateTitles',
  path: 'lesson',
})

export const LessonNotFoundOrForbiddenException = new BadRequestException({
  message: 'Error.LessonNotFoundOrForbidden',
  path: 'lesson',
})

export const ModuleNotFoundOrForbiddenException = new BadRequestException({
  message: 'Error.ModuleNotFoundOrForbidden',
  path: 'module',
})

export const CourseNotFoundOrForbiddenException = new BadRequestException({
  message: 'Error.CourseNotFoundOrForbidden',
  path: 'course',
})