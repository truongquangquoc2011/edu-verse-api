import { createZodDto } from 'nestjs-zod'
import {
  HashtagPublicSchema,
  CreateHashtagBodySchema,
  UpdateHashtagBodySchema,
  GetHashtagsResponseSchema,
} from '../hashtag.model'

export class CreateHashtagDTO extends createZodDto(CreateHashtagBodySchema) {}
export class UpdateHashtagDTO extends createZodDto(UpdateHashtagBodySchema) {}
export class HashtagResDTO extends createZodDto(HashtagPublicSchema) {}
export class GetHashtagsResDTO extends createZodDto(GetHashtagsResponseSchema) {}
