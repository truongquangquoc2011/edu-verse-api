import { createZodDto } from 'nestjs-zod'
import {
  ChatbotStartResSchema,
  ChatbotListMessagesQuerySchema,
  ChatbotListMessagesResSchema,
  ChatbotSendBodySchema,
  ChatbotSendResSchema,
} from '../chatbot.model'

export class ChatbotStartResDTO extends createZodDto(ChatbotStartResSchema) {}
export class ChatbotListMessagesQueryDTO extends createZodDto(ChatbotListMessagesQuerySchema) {}
export class ChatbotListMessagesResDTO extends createZodDto(ChatbotListMessagesResSchema) {}
export class ChatbotSendBodyDTO extends createZodDto(ChatbotSendBodySchema) {}
export class ChatbotSendResDTO extends createZodDto(ChatbotSendResSchema) {}
