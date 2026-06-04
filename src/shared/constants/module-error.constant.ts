import { BadRequestException } from '@nestjs/common'

export const DuplicateTitlesException = new BadRequestException({
  message: 'Error.DuplicateTitles',
  path: 'course',
})

export const ModuleNotFoundOrForbiddenException = new BadRequestException({
  message: 'Error.ModuleNotFoundOrForbidden',
  path: 'module',
})