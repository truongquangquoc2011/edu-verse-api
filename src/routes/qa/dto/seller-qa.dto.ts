import { createZodDto } from 'nestjs-zod'
import {
  // inputs
  SellerCreatePostInputSchema,
  SellerAcceptAnswerInputSchema,
  SellerUpdateThreadStatusInputSchema,
  SellerLockThreadInputSchema,
  ListThreadsQuerySchema,
  PaginationQuerySchema,
  // responses
  ListThreadsResSchema,
  ListPostsResSchema,
  PostPublicResSchema,
  ThreadPublicResSchema,
} from '../qa.model'

// ===== Threads =====
export class SellerListThreadsQueryDto extends createZodDto(ListThreadsQuerySchema) {}
export class SellerListThreadsResDto extends createZodDto(ListThreadsResSchema) {}
export class SellerThreadPublicResDto extends createZodDto(ThreadPublicResSchema) {}

// ===== Posts (reply) =====
export class SellerCreatePostInputDto extends createZodDto(SellerCreatePostInputSchema) {}
export class SellerListPostsQueryDto extends createZodDto(PaginationQuerySchema) {}
export class SellerListPostsResDto extends createZodDto(ListPostsResSchema) {}
export class SellerPostPublicResDto extends createZodDto(PostPublicResSchema) {}

// ===== Mutations (accept/status/lock) =====
export class SellerAcceptAnswerInputDto extends createZodDto(SellerAcceptAnswerInputSchema) {}
export class SellerUpdateThreadStatusInputDto extends createZodDto(SellerUpdateThreadStatusInputSchema) {}
export class SellerLockThreadInputDto extends createZodDto(SellerLockThreadInputSchema) {}
