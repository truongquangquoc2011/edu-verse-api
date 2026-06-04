import { createZodDto } from 'nestjs-zod'
import { CreateEnrollmentBodySchema, CreateEnrollmentResSchema } from '../enroll.model';

export class CreateEnrollmentBodyDTO extends createZodDto(CreateEnrollmentBodySchema) {}
export class CreateEnrollmentResDTO extends createZodDto(CreateEnrollmentResSchema) {}