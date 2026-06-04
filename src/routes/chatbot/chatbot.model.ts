import { z } from 'zod'
import { PaginationQuerySchema, PaginationResBaseSchema } from 'src/shared/models/pagination.model'

/**
 * Start conversation
 */
export const ChatbotStartResSchema = z.object({
  conversationId: z.number(),
  welcomeMessage: z.object({
    id: z.number(),
    content: z.string(),
    sentAt: z.date(),
  }),
})

/**
 * List messages (cursor by sentAt)
 */
export const ChatbotListMessagesQuerySchema = PaginationQuerySchema.extend({
  take: z.coerce.number().int().min(1).max(50).default(20),
  before: z.string().datetime().optional(),
})
export const RecommendedCourseSchema = z.object({
  id: z.number(),
  title: z.string(),
  thumbnail: z.string().nullable().optional(),
  isFree: z.boolean(),
  price: z.number(),
  rating: z.number(),
  category: z.string().nullable().optional(),
  teacher: z.string().nullable().optional(),
  isFeatured: z.boolean(),
})

export const ChatbotMessageItemSchema = z.object({
  id: z.number(),
  senderId: z.number().nullable(),
  content: z.string(),
  sentAt: z.date(),
  recommendedCourses: z.array(RecommendedCourseSchema).optional(), // ✅ thêm
})

export const ChatbotListMessagesResSchema = PaginationResBaseSchema.extend({
  items: z.array(ChatbotMessageItemSchema),
  nextBefore: z.string().datetime().nullable(),
})

/**
 * Send message
 */
export const ChatbotSendBodySchema = z.object({
  content: z.string().min(1),
})



export const ChatbotSendResSchema = z.object({
  userMessage: ChatbotMessageItemSchema,
  botMessage: ChatbotMessageItemSchema,
  recommendedCourses: z.array(RecommendedCourseSchema),
})

/**
 * Types
 */
export type ChatbotStartResType = z.infer<typeof ChatbotStartResSchema>
export type ChatbotListMessagesQueryType = z.infer<typeof ChatbotListMessagesQuerySchema>
export type ChatbotListMessagesResType = z.infer<typeof ChatbotListMessagesResSchema>
export type ChatbotSendBodyType = z.infer<typeof ChatbotSendBodySchema>
export type ChatbotSendResType = z.infer<typeof ChatbotSendResSchema>
export type ChatbotMessageItemType = z.infer<typeof ChatbotMessageItemSchema>
export type RecommendedCourseType = z.infer<typeof RecommendedCourseSchema>
