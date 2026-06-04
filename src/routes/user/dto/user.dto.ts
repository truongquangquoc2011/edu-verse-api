import { createZodDto } from "nestjs-zod";
import { PublicProfileSchema, TeacherListQuerySchema, TeacherListResSchema } from "../user.model";

export class PublicProfileResDTO extends createZodDto(PublicProfileSchema) {}
export class TeacherListQueryDTO extends createZodDto(TeacherListQuerySchema) {}
export class TeacherListResDTO   extends createZodDto(TeacherListResSchema) {}