import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { PrismaService } from 'src/shared/services/prisma.service'

import { ChatbotController } from './chatbot.controller'
import { ChatbotRepository } from './chatbot.repo'
import { ChatbotService } from './chatbot.service'

@Module({
  imports: [ConfigModule],
  controllers: [ChatbotController],
  providers: [ChatbotService, ChatbotRepository, PrismaService],
})
export class ChatbotModule {}
