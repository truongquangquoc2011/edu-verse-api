import { createZodDto } from 'nestjs-zod'
import {
  CreateLessonSchema,
  CreateLessonResSchema,
  UpdateLessonSchema,
  UpdateLessonResSchema,
  ListLessonsResSchema,
  ListLessonsQuerySchema,
  CreateLessonsSchema,
  AddVideoLinkSchema,
  AddPdfSchema,
  ListLessonsStudyQuerySchema,
  ListLessonsStudyResSchema,
  LessonStudyDetailSchema,
  ListLessonQuizQuerySchema,
  ListLessonQuizResSchema,
} from '../lesson.model'

export class CreateLessonDTO extends createZodDto(CreateLessonSchema) {}
export class CreateLessonResDTO extends createZodDto(CreateLessonResSchema) {}
export class CreateLessonsDTO extends createZodDto(CreateLessonsSchema) {}
export class UpdateLessonDTO extends createZodDto(UpdateLessonSchema) {}
export class UpdateLessonResDTO extends createZodDto(UpdateLessonResSchema) {}

export class ListLessonsResDTO extends createZodDto(ListLessonsResSchema) {}
export class ListLessonsQueryDTO extends createZodDto(ListLessonsQuerySchema) {}
export class AddVideoLinkDTO extends createZodDto(AddVideoLinkSchema) {}
export class AddPdfDTO extends createZodDto(AddPdfSchema) {}

// CLIENT STUDY DTOs
export class ListLessonsStudyQueryDTO extends createZodDto(ListLessonsStudyQuerySchema) {}
export class ListLessonsStudyResDTO extends createZodDto(ListLessonsStudyResSchema) {}
export class LessonStudyDetailDTO extends createZodDto(LessonStudyDetailSchema) {}

export class ListLessonQuizQueryDTO extends createZodDto(ListLessonQuizQuerySchema) {}
export class ListLessonQuizResDTO extends createZodDto(ListLessonQuizResSchema) {}
