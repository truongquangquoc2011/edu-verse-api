import { createZodDto } from 'nestjs-zod'
import {
  ConversationSchema,
  CreateConversationBodySchema,
  ListMessagesQuerySchema,
  MessageSchema,
  ReactionBodySchema,
  SendMessageBodySchema,
  UpdateConversationBodySchema,
  ListMessagesFilterSchema,
  PendingMemberResSchema,
  PendingMemberListResSchema,
} from '../conversation.model'

export class CreateConversationDTO extends createZodDto(CreateConversationBodySchema) {}
export class UpdateConversationDTO extends createZodDto(UpdateConversationBodySchema) {}

export class ConversationResDTO extends createZodDto(ConversationSchema) {}
export class MessageResDTO extends createZodDto(MessageSchema) {}

export class SendMessageDTO extends createZodDto(SendMessageBodySchema) {}
export class ReactionDTO extends createZodDto(ReactionBodySchema) {}
export class ListMessagesQueryDTO extends createZodDto(ListMessagesQuerySchema) {}
export class ListMessagesFilterDTO extends createZodDto(ListMessagesFilterSchema) {}
export class PendingMemberResDTO extends createZodDto(PendingMemberListResSchema) {}
