import { createZodDto } from 'nestjs-zod'
import {
  // inputs
  ClientCreateThreadInputSchema,
  ClientCreatePostInputSchema,
  ClientEditPostInputSchema,
  ListThreadsQuerySchema,
  PaginationQuerySchema,
  // responses
  ListThreadsResSchema,
  ListPostsResSchema,
  PostPublicResSchema,
  ThreadPublicResSchema,
} from '../qa.model'

// ===== Threads =====
export class ClientCreateThreadInputDto extends createZodDto(ClientCreateThreadInputSchema) {}
export class ClientListThreadsQueryDto extends createZodDto(ListThreadsQuerySchema) {}
export class ClientListThreadsResDto extends createZodDto(ListThreadsResSchema) {}
export class ClientThreadPublicResDto extends createZodDto(ThreadPublicResSchema) {}

// ===== Posts =====
export class ClientCreatePostInputDto extends createZodDto(ClientCreatePostInputSchema) {}
export class ClientEditPostInputDto extends createZodDto(ClientEditPostInputSchema) {}
export class ClientListPostsQueryDto extends createZodDto(PaginationQuerySchema) {}
export class ClientListPostsResDto extends createZodDto(ListPostsResSchema) {}
export class ClientPostPublicResDto extends createZodDto(PostPublicResSchema) {}
