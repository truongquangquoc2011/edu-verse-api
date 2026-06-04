import { createZodDto } from 'nestjs-zod'
import {
  CreateFeedbackBodySchema,
  FeedbackPublicSchema,
  GetAdminFeedbackQuerySchema,
  GetFeedbacksResponseSchema,
} from '../feedback.model'

export class CreateFeedbackDTO extends createZodDto(CreateFeedbackBodySchema) {}
export class FeedbackResDTO extends createZodDto(FeedbackPublicSchema) {}
export class GetAdminFeedbackQueryDTO extends createZodDto(GetAdminFeedbackQuerySchema) {}
export class GetFeedbacksResDTO extends createZodDto(GetFeedbacksResponseSchema) {}
