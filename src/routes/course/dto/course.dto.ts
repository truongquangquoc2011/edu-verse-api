import { createZodDto } from 'nestjs-zod'
import { CreateCourseSchema, CreateCourseResSchema, UpdateCourseSchema, UpdateCourseResSchema, GetCourseResSchema, ListCourseQuerySchema, ListCourseResSchema, UpdateCourseStatusSchema, UpdateCourseStatusResSchema, CourseBuilderResSchema, ListEnrolledCourseResSchema, ListEnrolledCourseQuerySchema, CourseStudyResSchema, PublicCourseDetailSchema, PublicCourseListResSchema } from '../course.model'

export class CreateCourseDTO extends createZodDto(CreateCourseSchema) {}
export class CreateCourseResDTO extends createZodDto(CreateCourseResSchema) {}
export class UpdateCourseDTO extends createZodDto(UpdateCourseSchema) {}
export class UpdateCourseResDTO extends createZodDto(UpdateCourseResSchema) {}
export class GetCourseResDTO extends createZodDto(GetCourseResSchema) {}
export class ListCourseQueryDTO extends createZodDto(ListCourseQuerySchema) {}
export class ListCourseResDTO extends createZodDto(ListCourseResSchema) {}
export class UpdateCourseStatusDTO extends createZodDto(UpdateCourseStatusSchema) {}
export class UpdateCourseStatusResDTO extends createZodDto(UpdateCourseStatusResSchema) {}
export class CourseBuilderResDTO extends createZodDto(CourseBuilderResSchema) {}
// CLIENT: enrolled course list
export class ListEnrolledCourseQueryDTO extends createZodDto(ListEnrolledCourseQuerySchema) {}
export class ListEnrolledCourseResDTO extends createZodDto(ListEnrolledCourseResSchema) {}
export class CourseStudyResDTO extends createZodDto(CourseStudyResSchema) {}
export class PublicCourseDetailResDTO extends createZodDto(PublicCourseDetailSchema) {}
export class PublicCourseListResDTO extends createZodDto(PublicCourseListResSchema) {}