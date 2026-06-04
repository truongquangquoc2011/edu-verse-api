import { BadRequestException } from '@nestjs/common'

export const LessonNoteNotFoundException = new BadRequestException(
  'Lesson note not found or you do not have permission to access it',
)

export const LessonNotAccessibleException = new BadRequestException('Lesson not accessible')

export const DuplicateLessonNoteTimestampException = new BadRequestException(
  'A lesson note already exists at this timestamp',
)