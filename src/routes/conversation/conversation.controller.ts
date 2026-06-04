import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  Query,
  HttpStatus,
  HttpCode,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common'
import { ConversationService } from './conversation.service'
import { Auth } from 'src/shared/decorator/auth.decorator'
import { AuthTypes } from 'src/shared/constants/auth.constant'
import { ZodSerializerDto } from 'nestjs-zod'
import {
  ConversationResDTO,
  CreateConversationDTO,
  ListMessagesFilterDTO,
  ListMessagesQueryDTO,
  MessageResDTO,
  ReactionDTO,
  SendMessageDTO,
  UpdateConversationDTO,
  PendingMemberResDTO,
} from './dto/conversation.dto'
import { ActiveUser } from 'src/shared/decorator/active-user.decorator'
import { parseSkipTake } from 'src/shared/utils/pagination.util'
import { HttpStatusCode } from 'src/shared/swagger/swagger.interface'
import { RESPONSE_MESSAGES } from 'src/shared/constants/swagger.constant'
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiBody,
  ApiConsumes,
  ApiProperty,
} from '@nestjs/swagger'
import { ApiStandardResponses } from 'src/shared/decorator/api-standard-response'
import { FileInterceptor } from '@nestjs/platform-express'
import { CloudinaryService } from 'src/shared/services/cloudinary.service'
import z from 'zod'
import { multerPdfOptions } from 'src/shared/utils/multer.util'

/**
 * Simple DTO used to describe the response of upload endpoints.
 */
class UploadUrlResDTO {
  @ApiProperty({
    example: 'https://res.cloudinary.com/<cloud_name>/image/upload/v1730859650/chat-uploads/abc.png',
    description: 'Public HTTPS URL returned from Cloudinary for uploaded file',
  })
  url: string
}

@ApiTags('Conversation')
@Controller('conversations')
export class ConversationController {
  constructor(
    private readonly conversationService: ConversationService,
    private readonly cloudinary: CloudinaryService,
  ) {}

  /**
   * Create a new conversation (either private or group).
   *
   * @route POST /conversations
   * @body CreateConversationDTO - Contains type (PRIVATE/GROUP), title, description, and participantIds.
   * @auth Requires a valid bearer access token.
   * @returns ConversationResDTO - The newly created conversation.
   */
  @Post()
  @Auth([AuthTypes.BEARER])
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create conversation',
    description: 'Create a new conversation (private or group) with participants.',
  })
  @ApiBody({ type: CreateConversationDTO })
  @ZodSerializerDto(ConversationResDTO)
  @ApiStandardResponses(HttpStatusCode.CREATED, RESPONSE_MESSAGES.CONVERSATION.CREATED, ConversationResDTO)
  create(@Body() body: CreateConversationDTO, @ActiveUser('userId') userId: number) {
    return this.conversationService.createConversation(body, userId)
  }

  /**
   * Update conversation information such as title, description, or active state.
   *
   * @route PATCH /conversations/:id
   * @param id - The ID of the conversation.
   * @body UpdateConversationDTO - Fields to be updated.
   * @auth Requires a valid bearer access token.
   * @returns ConversationResDTO - The updated conversation information.
   */
  @Patch(':id')
  @Auth([AuthTypes.BEARER])
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update conversation',
    description: 'Update conversation title, description, or status.',
  })
  @ApiParam({ name: 'id', type: Number, description: 'Conversation ID' })
  @ApiBody({ type: UpdateConversationDTO })
  @ZodSerializerDto(ConversationResDTO)
  @ApiStandardResponses(HttpStatusCode.OK, RESPONSE_MESSAGES.CONVERSATION.UPDATED, ConversationResDTO)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateConversationDTO,
    @ActiveUser('userId') userId: number,
  ) {
    return this.conversationService.updateConversation(id, body, userId)
  }

  /**
   * Retrieve all conversations the authenticated user participates in.
   *
   * @route GET /conversations
   * @query skip, take - Pagination parameters.
   * @auth Requires a valid bearer access token.
   * @returns A paginated list of conversations.
   */
  @Get()
  @Auth([AuthTypes.BEARER])
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'List conversations',
    description: 'Retrieve all conversations the user participates in.',
  })
  @ApiQuery({ name: 'skip', required: false, type: Number, description: 'Records to skip' })
  @ApiQuery({ name: 'take', required: false, type: Number, description: 'Records to take' })
  @ApiStandardResponses(HttpStatusCode.OK, RESPONSE_MESSAGES.CONVERSATION.LIST, ConversationResDTO)
  listConversations(@ActiveUser('userId') userId: number, @Query('skip') skip?: string, @Query('take') take?: string) {
    const { skip: s, take: t } = parseSkipTake(skip, take)
    return this.conversationService.listConversations(userId, s, t)
  }

  /**
   * Allows the authenticated user to leave a specific conversation.
   *
   * @route POST /conversations/:id/leave
   * @param id - The unique ID of the conversation to leave.
   * @auth Requires a valid bearer token (AuthTypes.BEARER).
   * @returns
   * - For **GROUP** conversations: removes the user as a participant.
   * - For **DIRECT** (1-on-1) conversations: the conversation is *soft-hidden* for the user (not deleted).
   */
  @Post(':id/leave')
  @Auth([AuthTypes.BEARER])
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Leave a conversation',
    description:
      'Remove the current user from the conversation. For DIRECT (1-1), policy can deactivate when no one remains.',
  })
  @ApiParam({ name: 'id', type: Number, description: 'Conversation ID' })
  async leave(@Param('id', ParseIntPipe) id: number, @ActiveUser('userId') userId: number) {
    return this.conversationService.leaveConversation(id, userId)
  }

  /**
   * Send a new message in a specific conversation.
   *
   * @route POST /conversations/:id/messages
   * @param id - The ID of the conversation.
   * @body SendMessageDTO - Message content and messageType (TEXT, IMAGE, FILE, etc.).
   * @auth Requires a valid bearer access token.
   * @returns MessageResDTO - The created message.
   */
  @Post(':id/messages')
  @Auth([AuthTypes.BEARER])
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Send message',
    description: 'Send a message inside a specific conversation.',
  })
  @ApiParam({ name: 'id', type: Number, description: 'Conversation ID' })
  @ApiBody({ type: SendMessageDTO })
  @ApiStandardResponses(HttpStatusCode.CREATED, RESPONSE_MESSAGES.CONVERSATION.MESSAGE_SENT, MessageResDTO)
  @ZodSerializerDto(MessageResDTO)
  sendMessage(
    @Param('id', ParseIntPipe) conversationId: number,
    @Body() body: SendMessageDTO,
    @ActiveUser('userId') userId: number,
  ) {
    return this.conversationService.sendMessage(conversationId, userId, body)
  }

  /**
   * Retrieve all messages within a specific conversation.
   *
   * @route GET /conversations/:conversationId/messages
   * @param conversationId - The ID of the conversation.
   * @query skip, take - Pagination parameters.
   * @auth Requires a valid bearer access token.
   * @returns A paginated list of messages from the conversation.
   */
  @Get(':conversationId/messages')
  @Auth([AuthTypes.BEARER])
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'List messages',
    description: 'Retrieve paginated messages in a specific conversation.',
  })
  @ApiParam({ name: 'conversationId', type: Number, description: 'Conversation ID' })
  @ApiQuery({ name: 'skip', required: false, type: Number, description: 'Records to skip' })
  @ApiQuery({ name: 'take', required: false, type: Number, description: 'Records to take' })
  @ApiStandardResponses(HttpStatusCode.OK, RESPONSE_MESSAGES.CONVERSATION.MESSAGES_LIST, MessageResDTO)
  listMessages(
    @Param('conversationId', ParseIntPipe) conversationId: number,
    @ActiveUser('userId') userId: number,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ) {
    const { skip: s, take: t } = parseSkipTake(skip, take)
    return this.conversationService.listMessages(conversationId, userId, s, t)
  }

  /**
   * Add a reaction (emoji) to a message.
   *
   * @route POST /conversations/messages/:messageId/reactions
   * @param messageId - The ID of the message.
   * @body ReactionDTO - Contains the emoji to react with (e.g., 👍, ❤️, 🔥).
   * @auth Requires a valid bearer access token.
   * @returns Information about the added reaction.
   */
  @Post('messages/:messageId/reactions')
  @Auth([AuthTypes.BEARER])
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Add reaction',
    description: 'Add a reaction (emoji) to a specific message.',
  })
  @ApiParam({ name: 'messageId', type: Number, description: 'Message ID' })
  @ApiBody({ type: ReactionDTO })
  @ApiStandardResponses(HttpStatusCode.OK, RESPONSE_MESSAGES.CONVERSATION.REACTED)
  react(
    @Param('messageId', ParseIntPipe) messageId: number,
    @Body() body: ReactionDTO,
    @ActiveUser('userId') userId: number,
  ) {
    return this.conversationService.react(messageId, userId, body.emoji)
  }

  /**
   * Remove a previously added reaction from a message.
   *
   * @route DELETE /conversations/messages/:messageId/reactions
   * @param messageId - The ID of the message.
   * @body ReactionDTO - The emoji to remove.
   * @auth Requires a valid bearer access token.
   * @returns Confirmation that the reaction has been removed.
   */
  @Delete('messages/:messageId/reactions')
  @Auth([AuthTypes.BEARER])
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Remove reaction',
    description: 'Remove a previously added reaction from a message.',
  })
  @ApiParam({ name: 'messageId', type: Number, description: 'Message ID' })
  @ApiBody({ type: ReactionDTO })
  @ApiStandardResponses(HttpStatusCode.OK, RESPONSE_MESSAGES.CONVERSATION.UNREACTED)
  unreact(
    @Param('messageId', ParseIntPipe) messageId: number,
    @Body() body: ReactionDTO,
    @ActiveUser('userId') userId: number,
  ) {
    return this.conversationService.unreact(messageId, userId, body.emoji)
  }

  /**
   * Mark a message as read by the current user.
   *
   * @route POST /conversations/messages/:messageId/read
   * @param messageId - The ID of the message.
   * @auth Requires a valid bearer access token.
   * @returns The message read record (messageId, userId, readAt).
   */
  @Post('messages/:messageId/read')
  @Auth([AuthTypes.BEARER])
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Mark message as read',
    description: 'Mark a message as read by the authenticated user.',
  })
  @ApiParam({ name: 'messageId', type: Number, description: 'Message ID' })
  @ApiStandardResponses(HttpStatusCode.OK, RESPONSE_MESSAGES.CONVERSATION.MARK_READ)
  async markRead(@Param('messageId', ParseIntPipe) messageId: number, @ActiveUser('userId') userId: number) {
    return this.conversationService.markRead(messageId, userId)
  }

  /**
   * Upload an image to Cloudinary and return its public URL.
   *
   * @route POST /conversations/upload/image
   * @auth Requires a valid bearer access token.
   * @payload multipart/form-data with field "file" (binary). Only image types should be provided.
   * @returns { url: string } - The Cloudinary secure_url for the uploaded image.
   *
   * Notes:
   * - This endpoint expects an image file (e.g., jpeg/png/webp).
   * - The file is processed and optimized (resize/rotate/compress) before upload in CloudinaryService.
   */
  @Post('upload/image')
  @Auth([AuthTypes.BEARER])
  @UseInterceptors(FileInterceptor('file'))
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Upload image',
    description:
      'Upload an image (multipart/form-data) to Cloudinary and return its public `secure_url`. ' +
      'Field name: **file**. Supported: common image types (e.g., JPEG/PNG/WEBP).',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Form data with a single image file in the "file" field.',
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
      },
      required: ['file'],
    },
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Image uploaded successfully',
    type: UploadUrlResDTO,
  })
  async uploadImage(@UploadedFile() file: Express.Multer.File) {
    const url = await this.cloudinary.uploadImage(file)
    return { url }
  }

  /**
   * Upload a PDF (or other raw docs if your service supports) to Cloudinary and return its public URL.
   *
   * @route POST /conversations/upload/pdf
   * @auth Requires a valid bearer access token.
   * @payload multipart/form-data with field "file" (binary). Default implementation accepts only PDF.
   * @returns { url: string } - The Cloudinary secure_url for the uploaded document.
   *
   * Notes:
   * - By default, CloudinaryService.uploadPdf currently validates and allows PDF only.
   * - If you want to accept DOC/DOCX/PPT/PPTX, change the interceptor/service to use resource_type="raw"
   *   and extend allowed MIME types & extensions accordingly.
   */
  @Post('upload/pdf')
  @Auth([AuthTypes.BEARER])
  @UseInterceptors(FileInterceptor('file', multerPdfOptions))
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Upload PDF document',
    description:
      'Upload a PDF file (multipart/form-data) to Cloudinary and return its public `secure_url`. ' +
      'Field name: **file**. Default: only **application/pdf** is accepted by the service.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Form data with a single PDF file in the "file" field.',
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
      },
      required: ['file'],
    },
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'PDF uploaded successfully',
    type: UploadUrlResDTO,
  })
  async uploadPdf(@UploadedFile() file: Express.Multer.File) {
    const url = await this.cloudinary.uploadPdf(file)
    return { url }
  }

  /**
   * Retrieve media or file messages from a specific conversation.
   *
   * @route GET /conversations/:conversationId/media
   * @param conversationId - The ID of the conversation to fetch media from.
   * @query senderId - (Optional) Filter messages by sender ID.
   * @query dateFrom, dateTo - (Optional) Filter messages sent within a date range.
   * @query text - (Optional) Search messages by content text.
   * @query type - (Optional) Filter by message type (e.g., IMAGE, FILE).
   * @query skip, take - (Optional) Pagination parameters.
   * @auth Requires a valid bearer access token. The user must be a participant of the conversation.
   * @returns A paginated list of messages that contain attachments (media/files) matching the filters.
   */
  @Get(':conversationId/media')
  @Auth([AuthTypes.BEARER])
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'List media / search messages in a conversation',
    description:
      'Return media/file according to conversation; supports filters: senderId, dateFrom, dateTo, text, type (IMAGE|FILE), skip, take',
  })
  async listMedia(
    @Param('conversationId', ParseIntPipe) conversationId: number,
    @Query() query: ListMessagesFilterDTO,
    @ActiveUser('userId') userId: number,
  ) {
    const { skip, take, senderId, dateFrom, dateTo, text, type } = query

    const res = await this.conversationService.searchMessages(conversationId, userId, {
      skip,
      take,
      senderId,
      dateFrom,
      dateTo,
      text,
      type,
      onlyWithAttachments: true, // media endpoint
    })

    return res
  }

  /**
   * Retrieve all members participating in a specific conversation.
   *
   * @route GET /conversations/:conversationId/members
   * @param conversationId - The ID of the conversation.
   * @query skip, take - Optional pagination parameters.
   * @auth Requires a valid bearer access token. The caller must be a participant of the conversation.
   * @returns A paginated list of members (userId, role, joinedAt, and user profile if available).
   */
  @Get(':conversationId/members')
  @Auth([AuthTypes.BEARER])
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List members in a conversation' })
  @ApiQuery({ name: 'skip', required: false, type: Number })
  @ApiQuery({ name: 'take', required: false, type: Number })
  async listMembers(
    @Param('conversationId', ParseIntPipe) conversationId: number,
    @ActiveUser('userId') userId: number,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ) {
    const { skip: s, take: t } = parseSkipTake(skip, take)
    return this.conversationService.listMembers(conversationId, userId, s, t)
  }

  /**
   * Pin a specific message in a conversation.
   *
   * @route POST /conversations/messages/:messageId/pin
   * @param messageId - The ID of the message to pin.
   * @auth Requires a valid bearer access token. The user must be a member of the conversation.
   * @returns The pinned message information or confirmation result.
   */
  @Post('messages/:messageId/pin')
  @Auth([AuthTypes.BEARER])
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Pin a message' })
  async pin(@Param('messageId', ParseIntPipe) messageId: number, @ActiveUser('userId') userId: number) {
    return this.conversationService.pinMessage(messageId, userId)
  }

  /**
   * Unpin a previously pinned message.
   *
   * @route DELETE /conversations/messages/:messageId/pin
   * @param messageId - The ID of the pinned message to unpin.
   * @auth Requires a valid bearer access token. The user must be a member of the conversation.
   * @returns Confirmation that the message has been successfully unpinned.
   */
  @Delete('messages/:messageId/pin')
  @Auth([AuthTypes.BEARER])
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Unpin a message' })
  async unpin(@Param('messageId', ParseIntPipe) messageId: number, @ActiveUser('userId') userId: number) {
    return this.conversationService.unpinMessage(messageId, userId)
  }

  /**
   * Retrieve a paginated list of pinned messages within a specific conversation.
   *
   * @route GET /conversations/:conversationId/pins
   * @param conversationId - The ID of the conversation.
   * @query skip, take - Optional pagination parameters.
   * @auth Requires a valid bearer access token. The user must be a participant of the conversation.
   * @returns A paginated list of pinned messages, sorted by pin time or message time.
   */
  @Get(':conversationId/pins')
  @Auth([AuthTypes.BEARER])
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List pinned messages in a conversation' })
  @ApiQuery({ name: 'skip', required: false, type: Number })
  @ApiQuery({ name: 'take', required: false, type: Number })
  async listPins(
    @Param('conversationId', ParseIntPipe) conversationId: number,
    @ActiveUser('userId') userId: number,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ) {
    const { skip: s, take: t } = parseSkipTake(skip, take)
    return this.conversationService.listPinnedMessages(conversationId, userId, s, t)
  }

  /**
   * Invite a user into a GROUP conversation.
   *
   * Policy:
   * - MODERATOR: the target user is added immediately (no approval needed).
   * - MEMBER: creates a pending join request that must be approved by a MODERATOR.
   *
   * @route POST /conversations/:id/members/invite
   * @param id - Conversation ID (must be a GROUP conversation).
   * @body { userId: number } - The ID of the user to invite.
   * @auth Requires a valid bearer token. The inviter must be a participant.
   * @returns An object describing the result:
   *  - `{ conversationId, invitedBy, userId, approved: boolean }`
   */
  @Post(':id/members/invite')
  @Auth([AuthTypes.BEARER])
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Invite a user to a GROUP conversation',
    description:
      'If the inviter is a MODERATOR, the user joins immediately. If the inviter is a MEMBER, a pending join request is created and must be approved by a MODERATOR.',
  })
  @ApiParam({ name: 'id', type: Number, description: 'Conversation ID (GROUP only)' })
  @ApiBody({
    description: 'Payload to invite a user by ID.',
    schema: {
      type: 'object',
      required: ['userId'],
      properties: {
        userId: { type: 'number', example: 77, description: 'ID of the user to invite' },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Invitation created. If inviter is MODERATOR, the user is added immediately.',
    schema: {
      type: 'object',
      properties: {
        conversationId: { type: 'number', example: 42 },
        invitedBy: { type: 'number', example: 12 },
        userId: { type: 'number', example: 77 },
        approved: { type: 'boolean', example: true },
      },
    },
  })
  async inviteMember(
    @Param('id', ParseIntPipe) conversationId: number,
    @ActiveUser('userId') inviterId: number,
    @Body() body: { userId: number },
  ) {
    return this.conversationService.inviteMember(conversationId, inviterId, body.userId)
  }

  /**
   * Approve or reject a pending join request (MODERATOR only).
   *
   * @route POST /conversations/requests/:requestId/approve
   * @param requestId - The ID of the pending join request.
   * @body { approve: boolean } - Whether to approve (true) or reject (false) the request.
   * @auth Requires a valid bearer token. The caller must be MODERATOR of the conversation.
   * @returns An object describing the result:
   *  - When approved: `{ requestId, status: 'APPROVED', conversationId, invitedUserId }`
   *  - When rejected: `{ requestId, status: 'REJECTED', conversationId, invitedUserId }`
   */
  @Post('requests/:requestId/approve')
  @Auth([AuthTypes.BEARER])
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Approve/reject a join request (MODERATOR only)',
    description:
      'Moderators can approve or reject pending join requests. On approval, the invited user will be added to the conversation.',
  })
  @ApiParam({ name: 'requestId', type: Number, description: 'Join request ID' })
  @ApiBody({
    description: 'Approval payload',
    schema: {
      type: 'object',
      required: ['approve'],
      properties: {
        approve: { type: 'boolean', example: true, description: 'Approve (true) or reject (false)' },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Join request processed',
    schema: {
      type: 'object',
      properties: {
        requestId: { type: 'number', example: 5 },
        status: { type: 'string', enum: ['APPROVED', 'REJECTED'], example: 'APPROVED' },
        conversationId: { type: 'number', example: 42 },
        invitedUserId: { type: 'number', example: 77 },
      },
    },
  })
  async approveJoinRequest(
    @Param('requestId', ParseIntPipe) requestId: number,
    @ActiveUser('userId') moderatorId: number,
    @Body() body: { approve: boolean },
  ) {
    return this.conversationService.approveJoinRequest(requestId, moderatorId, body.approve)
  }

  /**
   * Remove (kick) a member from a GROUP conversation (MODERATOR only).
   *
   * @route DELETE /conversations/:id/members/:targetUserId
   * @param id - Conversation ID.
   * @param targetUserId - The ID of the member to remove.
   * @auth Requires a valid bearer token. The caller must be MODERATOR of the conversation.
   * @returns A confirmation object: `{ conversationId, removedUserId }`
   */
  @Delete(':id/members/:targetUserId')
  @Auth([AuthTypes.BEARER])
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Kick a member from a GROUP conversation (MODERATOR only)',
    description:
      'Moderators can remove any member from the conversation. Emits a realtime event so clients can update their UI.',
  })
  @ApiParam({ name: 'id', type: Number, description: 'Conversation ID' })
  @ApiParam({ name: 'targetUserId', type: Number, description: 'User ID of the member to remove' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Member removed successfully',
    schema: {
      type: 'object',
      properties: {
        conversationId: { type: 'number', example: 42 },
        removedUserId: { type: 'number', example: 77 },
      },
    },
  })
  async kickMember(
    @Param('id', ParseIntPipe) conversationId: number,
    @Param('targetUserId', ParseIntPipe) targetUserId: number,
    @ActiveUser('userId') moderatorId: number,
  ) {
    return this.conversationService.kickMember(conversationId, moderatorId, targetUserId)
  }

  @Post('direct/teacher/:teacherId')
  @Auth([AuthTypes.BEARER])
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Open chat with teacher (follow required) [DEPRECATED]' })
  @ApiParam({ name: 'teacherId', type: Number })
  @ZodSerializerDto(ConversationResDTO)
  openDirectWithTeacher(@Param('teacherId', ParseIntPipe) teacherId: number, @ActiveUser('userId') userId: number) {
    return this.conversationService.getOrCreateDirectWithTeacher(userId, teacherId)
  }

  @Post('direct/teacher-user/:teacherUserId')
  @Auth([AuthTypes.BEARER])
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Open chat with teacher (follow required)' })
  @ApiParam({ name: 'teacherUserId', type: Number })
  @ZodSerializerDto(ConversationResDTO)
  openDirectWithTeacherUser(
    @Param('teacherUserId', ParseIntPipe) teacherUserId: number,
    @ActiveUser('userId') userId: number,
  ) {
    return this.conversationService.getOrCreateDirectWithTeacherUserId(userId, teacherUserId)
  }

  @Get(':id/pending-members')
  @Auth([AuthTypes.BEARER])
  @ApiOperation({ summary: 'List pending members (MODERATOR only)' })
  listPendingMembers(
    @Param('id', ParseIntPipe) conversationId: number,
    @ActiveUser('userId') userId: number,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ) {
    const { skip: s, take: t } = parseSkipTake(skip, take)
    return this.conversationService.listPendingMembers(conversationId, userId, s, t)
  }
}
