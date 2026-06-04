import { z } from 'zod'
import { createZodDto } from 'nestjs-zod'
import { ERROR_MESSAGE } from 'src/shared/constants/error-message.constant'

// Error aliases
const COMMON_ERR = ERROR_MESSAGE.VALIDATION.COMMON
const THREAD_ERR = ERROR_MESSAGE.VALIDATION.THREAD
const POST_ERR = ERROR_MESSAGE.VALIDATION.POST

// Reusable primitives
const PositiveIntSchema = z.coerce
  .number({ invalid_type_error: COMMON_ERR.ID_INVALID })
  .int()
  .positive({ message: COMMON_ERR.ID_POSITIVE })

const NonEmptyString = z
  .string({
    required_error: COMMON_ERR.STRING_REQUIRED,
    invalid_type_error: COMMON_ERR.STRING_INVALID,
  })
  .trim()
  .min(1, { message: COMMON_ERR.STRING_EMPTY })

const BooleanSchema = z.boolean({ invalid_type_error: COMMON_ERR.BOOL_INVALID })
const DateCoerce = z.coerce.date({ invalid_type_error: COMMON_ERR.DATE_INVALID })

// Public Enums (keep in sync with Prisma) – leave as-is
export const QaStatusPublicSchema = z.enum(['PENDING', 'UNREAD', 'RESOLVED'])
export type QaStatusPublicType = z.infer<typeof QaStatusPublicSchema>

// Pagination (lightweight local copy)
export const PaginationQuerySchema = z
  .object({
    page: z.coerce.number().int().positive().default(1),
    pageSize: z.coerce.number().int().positive().max(100).default(20),
  })
  .strict()

export const PaginationResBaseSchema = z.object({
  total: z.number().int().nonnegative(),
  page: z.number().int().positive(),
  pageSize: z.number().int().positive(),
})

// INPUT SCHEMAS
// CLIENT: Create a new thread (question)
export const ClientCreateThreadInputSchema = z
  .object({
    courseId: PositiveIntSchema,
    lessonId: PositiveIntSchema,
    title: z
      .string({ invalid_type_error: THREAD_ERR.TITLE_INVALID })
      .trim()
      .max(255, { message: THREAD_ERR.TITLE_MAX })
      .optional(), // may be auto-generated from content
    content: z
      .string({
        required_error: THREAD_ERR.CONTENT_REQUIRED,
        invalid_type_error: THREAD_ERR.CONTENT_INVALID,
      })
      .trim()
      .min(1, { message: THREAD_ERR.CONTENT_EMPTY }), // initial question content
  })
  .strict()

// CLIENT/SELLER: List threads (simple filter/sort)
export const ListThreadsQuerySchema = PaginationQuerySchema.extend({
  courseId: PositiveIntSchema.optional(),
  lessonId: PositiveIntSchema.optional(),
  status: QaStatusPublicSchema.optional(),
  search: z
    .string({ invalid_type_error: THREAD_ERR.SEARCH_INVALID })
    .trim()
    .min(1, { message: THREAD_ERR.SEARCH_EMPTY })
    .optional(),
  sortBy: z.enum(['lastActivityAt', 'createdAt']).default('lastActivityAt'),
  order: z.enum(['asc', 'desc']).default('desc'),
}).strict()

// CLIENT: Create a post/reply (supports nested via parentId)
export const ClientCreatePostInputSchema = z
  .object({
    threadId: PositiveIntSchema,
    content: z
      .string({
        required_error: POST_ERR.CONTENT_REQUIRED,
        invalid_type_error: POST_ERR.CONTENT_INVALID,
      })
      .trim()
      .min(1, { message: POST_ERR.CONTENT_EMPTY }),
    parentId: z.coerce
      .number({ invalid_type_error: POST_ERR.PARENT_ID_INVALID })
      .int()
      .positive()
      .nullable()
      .optional(), // null/undefined = top level
  })
  .strict()

// CLIENT: Edit/Delete own post
export const ClientEditPostInputSchema = z
  .object({
    content: z
      .string({
        required_error: POST_ERR.CONTENT_REQUIRED,
        invalid_type_error: POST_ERR.CONTENT_INVALID,
      })
      .trim()
      .min(1, { message: POST_ERR.CONTENT_EMPTY }),
  })
  .strict()

// SELLER: Reply to a thread (same as creating a post)
export const SellerCreatePostInputSchema = ClientCreatePostInputSchema

// SELLER: Accept one post as the answer
export const SellerAcceptAnswerInputSchema = z
  .object({
    postId: PositiveIntSchema,
  })
  .strict()

// SELLER: Update thread status (only PENDING/RESOLVED; UNREAD is auto-set on reply)
export const SellerUpdateThreadStatusInputSchema = z
  .object({
    status: z.enum(['PENDING', 'RESOLVED']),
  })
  .strict()

// SELLER: Lock/Unlock a thread
export const SellerLockThreadInputSchema = z
  .object({
    locked: BooleanSchema,
  })
  .strict()

// RESPONSE SCHEMAS
// Post (flat list; FE reconstructs tree via parentId)
export const PostPublicResSchema = z.object({
  id: PositiveIntSchema,
  threadId: PositiveIntSchema,
  authorId: PositiveIntSchema,

  content: z.string(),
  parentId: z.coerce.number().int().positive().nullable(), // null = root
  accepted: z.boolean().default(false),

  isEdited: z.boolean().default(false),
  editedAt: DateCoerce.nullable(),
  isDelete: z.boolean().default(false),

  createdAt: DateCoerce,
  updatedAt: DateCoerce,

  // optional: helps FE build tree faster (server may include)
  path: z.array(PositiveIntSchema).optional(),

  // lightweight author embed for avatar/name
  author: z
    .object({
      id: PositiveIntSchema,
      fullname: z.string(),
      avatar: z.string().url().nullable().optional(),
    })
    .optional(),
})

// Thread (enough for list + header detail)
export const ThreadPublicResSchema = z.object({
  id: PositiveIntSchema,
  courseId: PositiveIntSchema,
  lessonId: PositiveIntSchema,
  instructorId: PositiveIntSchema,
  authorId: PositiveIntSchema,

  title: z.string().nullable(),
  status: QaStatusPublicSchema,
  isResolved: z.boolean(),
  acceptedPostId: z.coerce.number().int().positive().nullable().optional(),

  locked: z.boolean().default(false),
  postsCount: z.number().int().nonnegative().default(0),

  lastActivityAt: DateCoerce,
  createdAt: DateCoerce,
  updatedAt: DateCoerce,

  // lightweight embeds for UI
  lesson: z.object({ id: PositiveIntSchema, title: z.string() }).optional(),
  course: z.object({ id: PositiveIntSchema, title: z.string() }).optional(),
  author: z.object({ id: PositiveIntSchema, fullname: z.string() }).optional(),
  instructor: z.object({ id: PositiveIntSchema, fullname: z.string() }).optional(),
})

// List threads
export const ListThreadsResSchema = PaginationResBaseSchema.extend({
  items: z.array(ThreadPublicResSchema),
})

// List posts (flat)
export const ListPostsResSchema = PaginationResBaseSchema.extend({
  items: z.array(PostPublicResSchema),
})

// DTO CLASSES (split “client” / “seller” by controller import)
// Client DTOs
export class ClientCreateThreadInputDto extends createZodDto(ClientCreateThreadInputSchema) {}
export class ClientCreatePostInputDto extends createZodDto(ClientCreatePostInputSchema) {}
export class ClientEditPostInputDto extends createZodDto(ClientEditPostInputSchema) {}

export class ClientListThreadsQueryDto extends createZodDto(ListThreadsQuerySchema) {}
export class ClientListThreadsResDto extends createZodDto(ListThreadsResSchema) {}

export class ClientListPostsQueryDto extends createZodDto(PaginationQuerySchema) {}
export class ClientListPostsResDto extends createZodDto(ListPostsResSchema) {}

// Seller DTOs
export class SellerCreatePostInputDto extends createZodDto(SellerCreatePostInputSchema) {}
export class SellerAcceptAnswerInputDto extends createZodDto(SellerAcceptAnswerInputSchema) {}
export class SellerUpdateThreadStatusInputDto extends createZodDto(SellerUpdateThreadStatusInputSchema) {}
export class SellerLockThreadInputDto extends createZodDto(SellerLockThreadInputSchema) {}

export class SellerListThreadsQueryDto extends createZodDto(ListThreadsQuerySchema) {}
export class SellerListThreadsResDto extends createZodDto(ListThreadsResSchema) {}

export class SellerListPostsQueryDto extends createZodDto(PaginationQuerySchema) {}
export class SellerListPostsResDto extends createZodDto(ListPostsResSchema) {}

// TYPES
export type ClientCreateThreadInputType = z.infer<typeof ClientCreateThreadInputSchema>
export type ClientCreatePostInputType = z.infer<typeof ClientCreatePostInputSchema>
export type ClientEditPostInputType = z.infer<typeof ClientEditPostInputSchema>

export type SellerCreatePostInputType = z.infer<typeof SellerCreatePostInputSchema>
export type SellerAcceptAnswerInputType = z.infer<typeof SellerAcceptAnswerInputSchema>
export type SellerUpdateThreadStatusInputType = z.infer<typeof SellerUpdateThreadStatusInputSchema>
export type SellerLockThreadInputType = z.infer<typeof SellerLockThreadInputSchema>

export type ListThreadsQueryType = z.infer<typeof ListThreadsQuerySchema>
export type ListThreadsResType = z.infer<typeof ListThreadsResSchema>

export type ListPostsResType = z.infer<typeof ListPostsResSchema>
export type PostPublicResType = z.infer<typeof PostPublicResSchema>
export type ThreadPublicResType = z.infer<typeof ThreadPublicResSchema>

export type PaginationQueryType = z.infer<typeof PaginationQuerySchema>
export type PaginationResBaseType = z.infer<typeof PaginationResBaseSchema>

export type QaStatusPublicType_ = QaStatusPublicType
