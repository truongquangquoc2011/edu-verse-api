import z from 'zod'
import { ConversationType, MessageType, ParticipantRole } from '@prisma/client'

const CONTENT_MAX = 4000
const PARTICIPANTS_MIN = 1

const RequiredStringSchema = z
  .string()
  .min(1, { message: 'Field is required and must be at least 1 character' })
  .max(CONTENT_MAX, { message: `Field must be at most ${CONTENT_MAX} characters` })
  .refine((val) => val.trim().length > 0, { message: 'Field cannot be only whitespace' })

export const ConversationSchema = z.object({
  id: z.number().int(),
  type: z.nativeEnum(ConversationType),
  title: z.string().nullable(),
  description: z.string().nullable(),
  isActive: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
  createdById: z.number().nullable(),
  updatedById: z.number().nullable(),
})

export const CreateConversationBodySchema = z.object({
  type: z.nativeEnum(ConversationType),
  title: RequiredStringSchema.optional(),
  description: RequiredStringSchema.optional(),
  participantIds: z
    .array(z.number().int())
    .min(PARTICIPANTS_MIN, { message: `At least ${PARTICIPANTS_MIN} participant required` }),
})

export const UpdateConversationBodySchema = z
  .object({
    title: z.string().optional(),
    description: z.string().optional(),
    isActive: z.boolean().optional(),
  })
  .partial()
  .refine((d) => Object.keys(d).length > 0, { message: 'At least one field must be provided for update' })

export const MessageSchema = z.object({
  id: z.number().int(),
  conversationId: z.number().int(),
  senderId: z.number().int().nullable(),
  content: z.string().optional().nullable(),
  messageType: z.nativeEnum(MessageType),
  attachments: z.any().optional(),
  replyToMessageId: z.number().int().nullable(),
  editedAt: z.date().nullable(),
  deletedAt: z.date().nullable(),
  deletedById: z.number().nullable(),
  sentAt: z.date(),
})

export const SendMessageBodySchema = z
  .object({
    content: z.string().max(CONTENT_MAX).optional(),
    messageType: z.nativeEnum(MessageType).default(MessageType.TEXT),
    replyToMessageId: z.number().int().optional(),
    attachments: z.array(z.object({ url: z.string().url() })).optional(),
  })
  .superRefine((data, ctx) => {
    const isMedia = data.messageType === MessageType.IMAGE || data.messageType === MessageType.FILE

    if (isMedia) {
      if (!data.attachments || data.attachments.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['attachments'],
          message: 'attachments is required for IMAGE/FILE messages',
        })
      }

      if (typeof data.content === 'string' && data.content.trim().length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['content'],
          message: 'content cannot be only whitespace',
        })
      }
      return
    }

    if (!data.content || data.content.trim().length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['content'],
        message: 'content is required for TEXT messages',
      })
    }
  })

export const ListMessagesQuerySchema = z.object({
  skip: z.coerce.number().int().nonnegative().optional(),
  take: z.coerce.number().int().positive().optional(),
})

export const MarkReadBodySchema = z.object({
  messageId: z.number().int(),
})

export const ReactionBodySchema = z.object({
  emoji: z.string().min(1),
})

export const PendingMemberResSchema = z.object({
  id: z.number(),
  userId: z.number(),
  joinedAt: z.string(),
  user: z.object({
    id: z.number(),
    fullName: z.string(),
    email: z.string().email(),
    avatar: z.string().url().nullable(),
  }),
})

export const ListMessagesFilterSchema = z.object({
  skip: z.coerce.number().int().nonnegative().default(0).optional(),
  take: z.coerce.number().int().positive().max(100).default(20).optional(),
  senderId: z.coerce.number().int().nonnegative().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  text: z.string().min(1).optional(),
  type: z.enum([MessageType.FILE, MessageType.IMAGE]).optional(),
})

export const PendingMemberListResSchema = z.object({
  total: z.number(),
  items: z.array(PendingMemberResSchema),
})

export type ConversationResponseType = z.infer<typeof ConversationSchema>
export type CreateConversationBodyType = z.infer<typeof CreateConversationBodySchema>
export type UpdateConversationBodyType = z.infer<typeof UpdateConversationBodySchema>

export type MessageResponseType = z.infer<typeof MessageSchema>
export type SendMessageBodyType = z.infer<typeof SendMessageBodySchema>
