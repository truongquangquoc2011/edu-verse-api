import { Body, Controller, Get, HttpCode, HttpStatus, Param, ParseIntPipe, Post, Query } from '@nestjs/common'
import { ApiBody, ApiOperation, ApiParam, ApiTags, ApiProperty } from '@nestjs/swagger'
import { IsPublic } from 'src/shared/decorator/auth.decorator'
import { ActiveUser } from 'src/shared/decorator/active-user.decorator'
import { Auth } from 'src/shared/decorator/auth.decorator'
import { AuthTypes, ConditionGuard } from 'src/shared/constants/auth.constant'
import { ChatbotService } from './chatbot.service'

class ChatbotChatBodyDTO {
  @ApiProperty({ example: 'tôi muốn học python để đi làm' })
  message: string
}

@ApiTags('Chatbot')
@Controller('chatbot')
export class ChatbotController {
  constructor(private readonly chatbotService: ChatbotService) {}

  @Auth([AuthTypes.BEARER, AuthTypes.APIKey], { condition: ConditionGuard.OR })
  @Post('start')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Start chatbot conversation' })
  start(@ActiveUser('userId') userId: number) {
    return this.chatbotService.start(userId)
  }

  @Auth([AuthTypes.BEARER, AuthTypes.APIKey], { condition: ConditionGuard.OR })
  @Get(':conversationId/messages')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List messages in a conversation' })
  @ApiParam({ name: 'conversationId', type: Number })
  listMessages(
    @Param('conversationId', ParseIntPipe) conversationId: number,
    @ActiveUser('userId') userId: number,
    @Query('take') take?: string,
    @Query('before') before?: string,
  ) {
    return this.chatbotService.listMessages(conversationId, userId, Number(take || 20), before)
  }

  @Auth([AuthTypes.BEARER, AuthTypes.APIKey], { condition: ConditionGuard.OR })
  @Post(':conversationId/chat')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Chat within a conversation (uses history + DB smart search)' })
  @ApiParam({ name: 'conversationId', type: Number })
  @ApiBody({ type: ChatbotChatBodyDTO })
  chat(
    @Param('conversationId', ParseIntPipe) conversationId: number,
    @ActiveUser('userId') userId: number,
    @Body() body: ChatbotChatBodyDTO,
  ) {
    return this.chatbotService.chat(conversationId, userId, body.message)
  }

  @Auth([AuthTypes.BEARER, AuthTypes.APIKey], { condition: ConditionGuard.OR })
  @Get('conversations')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List chatbot conversations (history list)' })
  listConversations(
    @ActiveUser('userId') userId: number,
    @Query('take') take?: string,
    @Query('cursor') cursor?: string,
  ) {
    return this.chatbotService.listConversations(
      userId,
      Math.min(Number(take || 20), 50),
      cursor ? Number(cursor) : undefined,
    )
  }
}
