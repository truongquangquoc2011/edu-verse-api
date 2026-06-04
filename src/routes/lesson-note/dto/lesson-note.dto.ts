import { createZodDto } from 'nestjs-zod'
import {
  CreateLessonNoteSchema,
  UpdateLessonNoteSchema,
  LessonNoteResSchema,
  ListLessonNotesQuerySchema,
  ListLessonNotesResSchema,
  PinLessonNoteSchema,
} from '../lesson-note.model'

export class CreateLessonNoteDTO extends createZodDto(CreateLessonNoteSchema) {}
export class UpdateLessonNoteDTO extends createZodDto(UpdateLessonNoteSchema) {}
export class LessonNoteResDTO extends createZodDto(LessonNoteResSchema) {}
export class ListLessonNotesQueryDTO extends createZodDto(ListLessonNotesQuerySchema) {}
export class ListLessonNotesResDTO extends createZodDto(ListLessonNotesResSchema) {}
export class PinLessonNoteDTO extends createZodDto(PinLessonNoteSchema) {}