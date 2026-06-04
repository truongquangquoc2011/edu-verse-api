import { forwardRef, HttpException, Inject, Injectable } from '@nestjs/common'
import {
  ConversationResponseType,
  CreateConversationBodyType,
  SendMessageBodyType,
  UpdateConversationBodyType,
} from './conversation.model'
import {
  AtLeastOneFieldMustBeProvidedConversationException,
  DirectConversationMustUseTeacherEndpointException,
  InternalCreateConversationErrorException,
  InternalCreateMessageErrorException,
  InternalUpdateConversationErrorException,
  UserMustFollowTeacherToChatException,
} from './conversation.error'
import { ConversationRepository } from './conversation.repo'
import { ConversationGateway } from './conversation.gateway'
import { ConversationType, MessageType } from '@prisma/client'
import { JoinRequestStatus } from 'src/shared/constants/conversation.constant'

@Injectable()
export class ConversationService {
  constructor(
    private readonly conservationRepository: ConversationRepository,
    @Inject(forwardRef(() => ConversationGateway))
    private readonly conversationGateway: ConversationGateway,
  ) {}

  /**
   * Ensures that a user is a valid participant of the conversation.
   * Throws an exception if the user is not a member.
   *
   * @param conversationId - The conversation ID
   * @param userId - The user ID
   */
  async ensureMember(conversationId: number, userId: number) {
    return this.conservationRepository.verifyMember(conversationId, userId)
  }

  /**
   * Creates a new conversation.
   *
   * This includes inserting the conversation record,
   * adding all participants, and assigning the creator as the moderator.
   *
   * @param body - The request payload (type, participants, etc.)
   * @param userId - The ID of the user creating the conversation
   * @returns The created conversation
   * @throws InternalCreateConversationErrorException on unexpected error
   */
  async createConversation(body: CreateConversationBodyType, userId: number): Promise<ConversationResponseType> {
    try {
      return await this.conservationRepository.createConversation(body, userId)
    } catch (e) {
      if (e instanceof HttpException) throw e
      throw InternalCreateConversationErrorException
    }
  }

  /**
   * Updates an existing conversation's details.
   *
   * At least one field must be provided in the request body.
   *
   * @param id - The conversation ID
   * @param body - Fields to update (e.g., title, description, isActive)
   * @param userId - The user performing the update
   * @returns The updated conversation
   * @throws AtLeastOneFieldMustBeProvidedConversationException if body is empty
   * @throws InternalUpdateConversationErrorException on unexpected error
   */
  async updateConversation(id: number, body: UpdateConversationBodyType, userId: number) {
    if (Object.keys(body).length === 0) throw AtLeastOneFieldMustBeProvidedConversationException
    try {
      return await this.conservationRepository.updateConversation(id, body, userId)
    } catch (e) {
      if (e instanceof HttpException) throw e
      throw InternalUpdateConversationErrorException
    }
  }

  /**
   * Lists all conversations for a specific user with pagination.
   *
   * @param userId - The user's ID
   * @param skip - Pagination offset
   * @param take - Number of records to fetch
   * @returns Paginated list of conversations
   */
  async listConversations(userId: number, skip: number, take: number) {
    return this.conservationRepository.listConversations(userId, skip, take)
  }

  /**
   * Handles the logic for a user leaving a conversation.
   *
   * @param conversationId - The unique ID of the conversation to leave.
   * @param userId - The ID of the authenticated user who is leaving the conversation.
   * @returns The result object from the repository, including:
   *  - `conversationId`: ID of the conversation.
   *  - `leftBy`: ID of the user who left.
   *  - `hidden`: Whether the conversation was soft-hidden (for DIRECT) or removed (for GROUP).
   *  - `remaining`: (For group chats) number of participants remaining after the user leaves.
   */
  async leaveConversation(conversationId: number, userId: number) {
    const res = await this.conservationRepository.leaveConversation(conversationId, userId)
    this.conversationGateway.io.to(`conv-${conversationId}`).emit('memberLeft', {
      conversationId,
      userId,
      remaining: res.remaining,
    })
    return res
  }

  /**
   * Sends a message in a conversation.
   *
   * After creating the message in the database,
   * the service emits a `messageCreated` event to all members of the conversation.
   *
   * @param conversationId - The ID of the conversation
   * @param userId - The ID of the sender
   * @param body - Message content and metadata
   * @returns The created message
   * @throws InternalCreateMessageErrorException on unexpected error
   */
  async sendMessage(conversationId: number, userId: number, body: SendMessageBodyType) {
    try {
      const msg = await this.conservationRepository.sendMessage(conversationId, userId, body)
      this.conversationGateway.io.to(`conv-${conversationId}`).emit('messageCreated', msg)
      return msg
    } catch (e) {
      if (e instanceof HttpException) throw e
      throw InternalCreateMessageErrorException
    }
  }

  /**
   * Retrieves messages from a conversation with pagination.
   *
   * @param conversationId - The conversation ID
   * @param userId - The requesting user's ID
   * @param skip - Pagination offset
   * @param take - Number of messages per page
   * @returns Paginated list of messages
   */
  async listMessages(conversationId: number, userId: number, skip: number, take: number) {
    return this.conservationRepository.listMessages(conversationId, userId, skip, take)
  }

  /**
   * Marks a message as read by a specific user.
   *
   * After updating the read status in the database,
   * a `messageRead` event is broadcast to all participants
   * of the conversation to update their UIs in real-time.
   *
   * @param messageId - The message ID
   * @param userId - The user marking it as read
   * @returns The MessageRead record
   */
  async markRead(messageId: number, userId: number) {
    const r = await this.conservationRepository.markRead(messageId, userId)
    const m = await this.conservationRepository.findMessageById(messageId)
    this.conversationGateway.io.to(`conv-${m.conversationId}`).emit('messageRead', {
      messageId,
      userId,
      readAt: r.readAt,
    })
    return r
  }

  /**
   * Adds a reaction (emoji) to a message.
   *
   * After updating the database,
   * the service emits a `reactionAdded` event to the conversation room.
   *
   * @param messageId - The message ID
   * @param userId - The user adding the reaction
   * @param emoji - The emoji (e.g., 👍, ❤️)
   * @returns The created or updated reaction record
   */
  async react(messageId: number, userId: number, emoji: string) {
    const r = await this.conservationRepository.react(messageId, userId, emoji)
    const m = await this.conservationRepository.findMessageById(messageId)
    this.conversationGateway.io.to(`conv-${m.conversationId}`).emit('reactionAdded', { messageId, userId, emoji })
    return r
  }

  /**
   * Removes a reaction from a message.
   *
   * After deleting the reaction record,
   * the service emits a `reactionRemoved` event to the conversation room.
   *
   * @param messageId - The message ID
   * @param userId - The user removing the reaction
   * @param emoji - The emoji to remove
   * @returns The delete result from the repository
   */
  async unreact(messageId: number, userId: number, emoji: string) {
    const r = await this.conservationRepository.unreact(messageId, userId, emoji)
    const m = await this.conservationRepository.findMessageById(messageId)
    this.conversationGateway.io.to(`conv-${m.conversationId}`).emit('reactionRemoved', { messageId, userId, emoji })
    return r
  }

  /**
   * Search messages within a specific conversation using various filters.
   *
   * @param conversationId - The ID of the conversation to search messages in.
   * @param userId - The ID of the current user (must be a participant in the conversation).
   * @param options - Optional search and pagination filters:
   *  - skip, take: Pagination parameters.
   *  - senderId: Filter messages by sender.
   *  - dateFrom, dateTo: Filter messages sent within a specific date range.
   *  - text: Search messages containing a specific keyword (case-insensitive).
   *  - type: Filter by message type (e.g., TEXT, IMAGE, FILE).
   *  - onlyWithAttachments: If true, returns only messages that contain media or files.
   *
   * @returns A paginated list of messages that match the given filters, including metadata (page, total, etc.).
   */
  async searchMessages(
    conversationId: number,
    userId: number,
    options: {
      skip?: number
      take?: number
      senderId?: number
      dateFrom?: string
      dateTo?: string
      text?: string
      type?: MessageType
      onlyWithAttachments?: boolean
    },
  ) {
    return this.conservationRepository.searchMessages(conversationId, userId, options)
  }

  /**
   * Retrieve a paginated list of members in a specific conversation.
   *
   * @param conversationId - The unique ID of the conversation.
   * @param userId - The ID of the authenticated user making the request.
   * @param skip - Number of records to skip for pagination.
   * @param take - Number of records to retrieve per page.
   * @returns A paginated list of participants (including user info and role).
   */
  async listMembers(conversationId: number, userId: number, skip: number, take: number) {
    return this.conservationRepository.listMembers(conversationId, userId, skip, take)
  }

  /**
   * Pin a specific message within a conversation.
   *
   * @param messageId - The ID of the message to be pinned.
   * @param userId - The ID of the user performing the pin action.
   * @returns The created pin record, including pinnedAt timestamp and pinnedBy user.
   */
  async pinMessage(messageId: number, userId: number) {
    const pin = await this.conservationRepository.pinMessage(messageId, userId)
    this.conversationGateway.io
      .to(`conv-${pin.message.conversationId}`)
      .emit('messagePinned', { messageId: pin.messageId, pinnedAt: pin.pinnedAt, pinnedById: pin.pinnedById })
    return pin
  }

  /**
   * Unpin a previously pinned message from a conversation.
   *
   * @param messageId - The ID of the pinned message to unpin.
   * @param userId - The ID of the user performing the unpin action.
   * @returns The result of the unpin operation (e.g., deleted pin record or status).
   */
  async unpinMessage(messageId: number, userId: number) {
    const m = await this.conservationRepository.findMessageById(messageId)
    const res = await this.conservationRepository.unpinMessage(messageId, userId)
    this.conversationGateway.io.to(`conv-${m.conversationId}`).emit('messageUnpinned', { messageId })
    return res
  }

  /**
   * Retrieve a paginated list of pinned messages within a conversation.
   *
   * @param conversationId - The ID of the conversation.
   * @param userId - The ID of the current user; must be a participant in the conversation.
   * @param skip - Number of records to skip (for pagination).
   * @param take - Number of records to return (for pagination).
   * @returns A paginated list of pinned messages, including metadata and message details.
   */
  async listPinnedMessages(conversationId: number, userId: number, skip: number, take: number) {
    return this.conservationRepository.listPinnedMessages(conversationId, userId, skip, take)
  }

  /**
   * Invite a user into a GROUP conversation.
   * - MODERATOR: adds immediately (approved = true)
   * - MEMBER: creates a pending request (approved = false)
   */
  async inviteMember(conversationId: number, inviterId: number, targetUserId: number) {
    try {
      const res = await this.conservationRepository.inviteMember(conversationId, inviterId, targetUserId)

      if (res.approved) {
        this.conversationGateway.io.to(`conv-${conversationId}`).emit('memberInvited', {
          conversationId,
          invitedBy: inviterId,
          userId: targetUserId,
          approved: true,
        })

        this.conversationGateway.io.to(`user-${targetUserId}`).emit('memberInvited', {
          conversationId,
          invitedBy: inviterId,
          userId: targetUserId,
          approved: true,
        })
      } else {
        const payload = {
          conversationId,
          requesterId: inviterId,
          invitedUserId: targetUserId,
          status: JoinRequestStatus.PENDING,
        }

        this.conversationGateway.io.to(`conv-${conversationId}`).emit('joinRequestCreated', payload)
        this.conversationGateway.io.to(`user-${targetUserId}`).emit('joinRequestCreated', payload)
      }
      return res
    } catch (e) {
      if (e instanceof HttpException) throw e
      throw InternalCreateConversationErrorException
    }
  }

  async approveJoinRequest(requestId: number, moderatorId: number, approve: boolean) {
    const res = await this.conservationRepository.approveJoinRequest(requestId, moderatorId, approve)
    this.conversationGateway.io.to(`conv-${res.conversationId}`).emit('joinRequestUpdated', {
      conversationId: res.conversationId,
      requestId,
      status: res.status,
      actedBy: moderatorId,
    })

    if (res.status === JoinRequestStatus.APPROVED) {
      this.conversationGateway.io.to(`conv-${res.conversationId}`).emit('memberJoined', {
        conversationId: res.conversationId,
        userId: res.invitedUserId,
        via: 'approval',
      })
    }
    return res
  }

  async kickMember(conversationId: number, moderatorId: number, targetUserId: number) {
    const res = await this.conservationRepository.kickMember(conversationId, moderatorId, targetUserId)
    this.conversationGateway.io.to(`conv-${conversationId}`).emit('memberKicked', {
      conversationId,
      removedUserId: targetUserId,
      actedBy: moderatorId,
    })
    return res
  }

  async getOrCreateDirectWithTeacher(userId: number, teacherId: number) {
    await this.conservationRepository.assertUserFollowsTeacher(userId, teacherId)

    const teacherUserId = await this.conservationRepository.getTeacherUserId(teacherId)
    if (!teacherUserId) throw UserMustFollowTeacherToChatException

    const existing = await this.conservationRepository.findDirectBetweenUsers(userId, teacherUserId)

    if (existing) {
      await this.conservationRepository.unhideParticipant(existing.id, userId)
      return existing
    }

    return this.createConversation({ type: ConversationType.DIRECT, participantIds: [teacherUserId] }, userId)
  }

  async getOrCreateDirectWithTeacherUserId(userId: number, teacherUserId: number) {
    const teacherId = await this.conservationRepository.getTeacherIdByUserId(teacherUserId)
    if (!teacherId) throw UserMustFollowTeacherToChatException

    await this.conservationRepository.assertUserFollowsTeacher(userId, teacherId)

    const existing = await this.conservationRepository.findDirectBetweenUsers(userId, teacherUserId)
    if (existing) {
      await this.conservationRepository.unhideParticipant(existing.id, userId)
      return existing
    }
    return this.createConversation({ type: ConversationType.DIRECT, participantIds: [teacherUserId] }, userId)
  }

  async listPendingMembers(conversationId: number, userId: number, skip: number, take: number) {
    return this.conservationRepository.listPendingMembers(conversationId, userId, skip, take)
  }
}
