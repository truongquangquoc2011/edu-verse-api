import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from 'src/shared/services/prisma.service'
import {
  ConversationResponseType,
  CreateConversationBodyType,
  MessageResponseType,
  SendMessageBodyType,
  UpdateConversationBodyType,
} from './conversation.model'
import { PAGINATION } from 'src/shared/constants/pagination.constant'
import {
  ConversationNotFoundException,
  MessageNotFoundException,
  UserMustFollowTeacherToChatException,
  UserNotInConversationException,
} from './conversation.error'
import { ConversationType, MessageType, ParticipantRole, Prisma } from '@prisma/client'
import { JoinRequestStatus } from 'src/shared/constants/conversation.constant'

const LIST_MESSAGES_SKIP = 0
const LIST_MESSAGES_TAKE = 20
const LIST_MEMBERS_SKIP = 0
const LIST_MEMBERS_TAKE = 50

export const CONVERSATION_DEFAULT_SELECT = {
  id: true,
  type: true,
  title: true,
  description: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
  createdById: true,
  updatedById: true,
} as const

export const PENDING_MEMBER_DEFAULT_SELECT = {
  id: true,
  fullname: true,
  email: true,
  avatar: true,
} as const

export const MESSAGE_DEFAULT_SELECT = {
  id: true,
  conversationId: true,
  senderId: true,
  content: true,
  messageType: true,
  attachments: true,
  replyToMessageId: true,
  editedAt: true,
  deletedAt: true,
  deletedById: true,
  sentAt: true,
} as const

const MEMBER_PUBLIC_SELECT = {
  userId: true,
  role: true,
  joinedAt: true,
  user: { select: { id: true, fullname: true, email: true, avatar: true } },
} as const

@Injectable()
export class ConversationRepository {
  constructor(private readonly prismaService: PrismaService) {}

  /**
   * Ensures that a user is a member of a conversation.
   * Throws `UserNotInConversationException` if not a participant.
   *
   * @param conversationId - ID of the conversation
   * @param userId - ID of the user
   * @throws UserNotInConversationException
   */
  async verifyMember(conversationId: number, userId: number): Promise<void> {
    const participant = await this.prismaService.conversationParticipant.findUnique({
      where: { conversationId_userId: { conversationId, userId } },
      select: { id: true },
    })
    if (!participant) {
      throw UserNotInConversationException
    }
  }

  /**
   * Creates a new conversation and adds all participants.
   *
   * @param data - Conversation creation payload
   * @param createdById - ID of the user creating the conversation
   * @returns Newly created conversation record
   */
  async createConversation(data: CreateConversationBodyType, createdById: number): Promise<ConversationResponseType> {
    const participantIds = new Set([...data.participantIds, createdById])
    return this.prismaService.$transaction(async (tx) => {
      return tx.conversation.create({
        data: {
          type: data.type,
          title: data.title ?? null,
          description: data.description ?? null,
          createdById,
          participants: {
            create: Array.from(participantIds).map((uid) => ({
              userId: uid,
              role: uid === createdById ? ParticipantRole.MODERATOR : ParticipantRole.MEMBER,
            })),
          },
        },
        select: CONVERSATION_DEFAULT_SELECT,
      })
    })
  }

  /**
   * Finds a conversation by its ID.
   * Throws `ConversationNotFoundException` if not found.
   *
   * @param id - ID of the conversation
   * @returns Conversation record
   * @throws ConversationNotFoundException
   */
  async findConversationById(id: number): Promise<ConversationResponseType> {
    const conversation = await this.prismaService.conversation.findUnique({
      where: { id },
      select: CONVERSATION_DEFAULT_SELECT,
    })
    if (!conversation) throw ConversationNotFoundException
    return conversation
  }

  /**
   * Updates an existing conversation with the provided data.
   *
   * @param id - ID of the conversation
   * @param data - Update payload
   * @param updatedById - ID of the user performing the update
   * @returns Updated conversation record
   */
  async updateConversation(id: number, data: UpdateConversationBodyType, updatedById: number) {
    await this.findConversationById(id)
    return this.prismaService.conversation.update({
      where: { id },
      data: { ...data, updatedById },
      select: CONVERSATION_DEFAULT_SELECT,
    })
  }

  /**
   * Retrieves a paginated list of conversations the user participates in.
   *
   * @param userId - ID of the user
   * @param skip - Pagination offset (default: PAGINATION.DEFAULT_SKIP)
   * @param take - Number of items per page (default: PAGINATION.DEFAULT_TAKE)
   * @returns Paginated list of conversations with metadata
   */
  async listConversations(
    userId: number,
    skip: number = PAGINATION.DEFAULT_SKIP,
    take: number = PAGINATION.DEFAULT_TAKE,
  ) {
    const [data, total] = await this.prismaService.$transaction([
      this.prismaService.conversation.findMany({
        where: {
          participants: {
            some: {
              userId,
              OR: [{ hiddenAt: null }, { hiddenAt: { equals: null } }],
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        select: CONVERSATION_DEFAULT_SELECT,
      }),
      this.prismaService.conversationParticipant.count({
        where: { userId, hiddenAt: null },
      }),
    ])
    return {
      data,
      pagination: {
        page: Math.floor(skip / take) + 1,
        limit: take,
        total,
        totalPages: Math.ceil(total / take),
      },
    }
  }

  /**
   * Allows a user to leave a specific conversation.
   *
   * @param conversationId - The unique ID of the conversation the user wants to leave.
   * @param userId - The ID of the user who is leaving the conversation.
   * @returns An object containing the leave result, including:
   *  - `conversationId`: The ID of the conversation.
   *  - `leftBy`: The ID of the user who left.
   *  - `hidden`: Boolean indicating if the conversation was soft-hidden (for DIRECT).
   *  - `remaining`: (Optional) The number of participants remaining (for GROUP conversations).
   */
  async leaveConversation(conversationId: number, userId: number) {
    await this.verifyMember(conversationId, userId)

    return this.prismaService.$transaction(async (tx) => {
      const conv = await tx.conversation.findUnique({
        where: { id: conversationId },
        select: {
          id: true,
          type: true,
          isActive: true,
          participants: { select: { userId: true } },
        },
      })

      if (!conv) throw ConversationNotFoundException

      if (conv.type === ConversationType.DIRECT) {
        await tx.conversationParticipant.update({
          where: { conversationId_userId: { conversationId, userId } },
          data: { hiddenAt: new Date() },
        })
        return { conversationId, leftBy: userId, hidden: true }
      }

      await tx.conversationParticipant.delete({
        where: { conversationId_userId: { conversationId, userId } },
      })

      const remaining = await tx.conversationParticipant.count({
        where: { conversationId },
      })

      if (remaining <= 0) {
        await tx.conversation.update({
          where: { id: conversationId },
          data: { isActive: false },
        })
      }

      return { conversationId, leftBy: userId, hidden: false, remaining }
    })
  }

  /**
   * Creates and sends a message within a conversation.
   *
   * @param conversationId - ID of the conversation
   * @param userId - ID of the sender
   * @param body - Message content and metadata
   * @returns Newly created message record
   */
  async sendMessage(conversationId: number, userId: number, body: SendMessageBodyType): Promise<MessageResponseType> {
    await this.verifyMember(conversationId, userId)
    return this.prismaService.message.create({
      data: {
        conversationId,
        senderId: userId,
        content: body.content ?? '',
        messageType: body.messageType,
        replyToMessageId: body.replyToMessageId ?? null,
        attachments: body.attachments ?? undefined,
      },
      select: MESSAGE_DEFAULT_SELECT,
    })
  }

  /**
   * Retrieves messages from a conversation with pagination.
   *
   * @param conversationId - ID of the conversation
   * @param userId - ID of the requesting user
   * @param skip - Pagination offset
   * @param take - Number of messages per page
   * @returns Paginated list of messages
   */
  async listMessages(conversationId: number, userId: number, skip: number = 0, take: number = 10) {
    await this.verifyMember(conversationId, userId)

    const participant = await this.prismaService.conversationParticipant.findUnique({
      where: { conversationId_userId: { conversationId, userId } },
      select: { hiddenAt: true },
    })

    const where: Prisma.MessageWhereInput = { conversationId, deletedAt: null }
    if (participant?.hiddenAt) {
      where.sentAt = { gte: participant.hiddenAt }
    }
    const [data, total] = await Promise.all([
      this.prismaService.message.findMany({
        where,
        orderBy: { sentAt: 'desc' },
        skip,
        take,
        select: MESSAGE_DEFAULT_SELECT,
      }),
      this.prismaService.message.count({ where }),
    ])
    return {
      data,
      pagination: {
        page: Math.floor(skip / take) + 1,
        limit: take,
        total,
        totalPages: Math.ceil(total / take),
      },
    }
  }

  /**
   * Finds a message by its ID.
   * Throws `MessageNotFoundException` if the message does not exist.
   *
   * @param id - ID of the message
   * @returns Message record
   * @throws MessageNotFoundException
   */
  async findMessageById(id: number) {
    const mess = await this.prismaService.message.findUnique({ where: { id }, select: MESSAGE_DEFAULT_SELECT })
    if (!mess) throw MessageNotFoundException
    return mess
  }

  /**
   * Marks a message as read by the user.
   * Creates or updates a MessageRead record.
   *
   * @param messageId - ID of the message
   * @param userId - ID of the user
   * @returns The upserted MessageRead record
   */
  async markRead(messageId: number, userId: number) {
    const msg = await this.findMessageById(messageId)
    await this.verifyMember(msg.conversationId, userId)
    return this.prismaService.messageRead.upsert({
      where: { messageId_userId: { messageId, userId } },
      create: { messageId, userId },
      update: { readAt: new Date() },
      include: {
        message: {
          select: { conversationId: true },
        },
      },
    })
  }

  /**
   * Adds a reaction to a message.
   * Creates or updates a MessageReaction record.
   *
   * @param messageId - ID of the message
   * @param userId - ID of the user
   * @param emoji - Emoji string (e.g. '❤️', '👍')
   * @returns The upserted MessageReaction record
   */
  async react(messageId: number, userId: number, emoji: string) {
    const msg = await this.findMessageById(messageId)
    await this.verifyMember(msg.conversationId, userId)
    return this.prismaService.messageReaction.upsert({
      where: { messageId_userId_emoji: { messageId, userId, emoji } },
      create: { messageId, userId, emoji },
      update: {},
    })
  }

  /**
   * Removes a reaction from a message.
   *
   * @param messageId - ID of the message
   * @param userId - ID of the user
   * @param emoji - Emoji string to remove
   * @returns The result of the deleteMany operation
   */
  async unreact(messageId: number, userId: number, emoji: string) {
    const msg = await this.findMessageById(messageId)
    await this.verifyMember(msg.conversationId, userId)
    return this.prismaService.messageReaction.deleteMany({
      where: { messageId, userId, emoji },
    })
  }

  private buildMessageSearchWhere(
    conversationId: number,
    options: {
      senderId?: number
      dateFrom?: string
      dateTo?: string
      text?: string
      type?: MessageType
      onlyWithAttachments?: boolean
    },
  ): Prisma.MessageWhereInput {
    const where: Prisma.MessageWhereInput = { conversationId, deletedAt: null }
    if (options.senderId !== undefined) where.senderId = options.senderId
    if (options.type) where.messageType = options.type
    if (options.dateFrom || options.dateTo) {
      where.sentAt = {}
      if (options.dateFrom) where.sentAt.gte = new Date(options.dateFrom)
      if (options.dateTo) where.sentAt.lte = new Date(options.dateTo)
    }
    if (options.text) where.content = { contains: options.text, mode: 'insensitive' }
    if (options.onlyWithAttachments) where.attachments = { not: Prisma.DbNull }
    return where
  }

  /**
   * Search messages within a specific conversation using flexible filters and pagination.
   *
   * @param conversationId - The ID of the conversation to search messages in.
   * @param userId - The ID of the current user; must be a member of the conversation.
   * @param options - Optional search filters and pagination parameters:
   *  - skip, take: Pagination parameters (default values are applied if not provided).
   *  - senderId: Filter messages sent by a specific user.
   *  - dateFrom, dateTo: Filter messages within a date range.
   *  - text: Search messages containing a specific keyword (case-insensitive).
   *  - type: Filter by message type (e.g., TEXT, IMAGE, FILE).
   *  - onlyWithAttachments: When true (default), returns only messages that include media or file attachments.
   *
   * @returns A paginated list of messages matching the given filters, with pagination metadata (page, limit, total, totalPages).
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
    } = {},
  ) {
    await this.verifyMember(conversationId, userId)
    const skip = options.skip ?? LIST_MESSAGES_SKIP
    const take = options.take ?? LIST_MESSAGES_TAKE
    const where = this.buildMessageSearchWhere(conversationId, options)
    const [data, total] = await Promise.all([
      this.prismaService.message.findMany({
        where,
        orderBy: { sentAt: 'desc' },
        skip,
        take,
        select: MESSAGE_DEFAULT_SELECT,
      }),
      this.prismaService.message.count({ where }),
    ])
    return {
      data,
      pagination: {
        page: Math.floor(skip / take) + 1,
        limit: take,
        total,
        totalPages: Math.ceil(total / take),
      },
    }
  }

  /**
   * Retrieve a paginated list of all participants in a given conversation.
   *
   * @param conversationId - The ID of the conversation whose members will be listed.
   * @param userId - The ID of the authenticated user requesting the data (must be a member of the conversation).
   * @param skip - The number of records to skip for pagination (default: 0).
   * @param take - The maximum number of records to return per page (default: 50).
   *
   * @returns An object containing:
   *  - `data`: Array of participants with user info (id, fullname, email, avatar) and role.
   *  - `pagination`: Metadata with page number, limit, total count, and total pages.
   */
  async listMembers(conversationId: number, userId: number, skip = LIST_MEMBERS_SKIP, take = LIST_MEMBERS_TAKE) {
    await this.verifyMember(conversationId, userId)
    skip = skip ?? LIST_MEMBERS_SKIP
    take = take ?? LIST_MEMBERS_TAKE
    const [data, total] = await Promise.all([
      this.prismaService.conversationParticipant.findMany({
        where: { conversationId },
        orderBy: { joinedAt: 'asc' },
        skip,
        take,
        select: MEMBER_PUBLIC_SELECT,
      }),
      this.prismaService.conversationParticipant.count({ where: { conversationId } }),
    ])
    return {
      data,
      pagination: {
        page: Math.floor(skip / take) + 1,
        limit: take,
        total,
        totalPages: Math.ceil(total / take),
      },
    }
  }

  /**
   * Pin a specific message in a conversation.
   *
   * @param messageId - The ID of the message to be pinned.
   * @param userId - The ID of the user performing the pin action.
   * @returns The pinned message record, including metadata and related message details.
   */
  async pinMessage(messageId: number, userId: number) {
    const msg = await this.findMessageById(messageId)
    await this.verifyMember(msg.conversationId, userId)

    const pin = await this.prismaService.messagePin.upsert({
      where: { messageId },
      create: { messageId, pinnedById: userId },
      update: {},
      include: {
        message: { select: { conversationId: true, senderId: true, content: true, sentAt: true } },
      },
    })
    return pin
  }

  /**
   * Unpin a specific message in a conversation.
   *
   * @param messageId - The ID of the message to unpin.
   * @param userId - The ID of the user performing the unpin action.
   * @returns An object confirming successful unpinning, including `{ messageId, unpinned: true }`.
   */
  async unpinMessage(messageId: number, userId: number) {
    const msg = await this.findMessageById(messageId)
    await this.verifyMember(msg.conversationId, userId)

    await this.prismaService.messagePin.deleteMany({ where: { messageId } })
    return { messageId, unpinned: true }
  }

  /**
   * Retrieve a paginated list of pinned messages within a conversation.
   *
   * @param conversationId - The ID of the conversation to retrieve pinned messages from.
   * @param userId - The ID of the current user (must be a conversation participant).
   * @param skip - Number of records to skip (default: 0).
   * @param take - Number of records to fetch per page (default: 20).
   * @returns A paginated object containing pinned messages and pagination metadata.
   */
  async listPinnedMessages(conversationId: number, userId: number, skip = 0, take = 20) {
    await this.verifyMember(conversationId, userId)

    const where: Prisma.MessagePinWhereInput = {
      message: { conversationId, deletedAt: null },
    }

    const [pins, total] = await Promise.all([
      this.prismaService.messagePin.findMany({
        where,
        orderBy: { pinnedAt: 'desc' },
        skip,
        take,
        include: {
          message: { select: MESSAGE_DEFAULT_SELECT },
        },
      }),
      this.prismaService.messagePin.count({ where }),
    ])

    return {
      data: pins.map((p) => ({
        pinnedAt: p.pinnedAt,
        pinnedById: p.pinnedById,
        ...p.message,
      })),
      pagination: {
        page: Math.floor(skip / take) + 1,
        limit: take,
        total,
        totalPages: Math.ceil(total / take),
      },
    }
  }

  async inviteMember(conversationId: number, inviterId: number, targetUserId: number) {
    await this.verifyMember(conversationId, inviterId)

    const targetUser = await this.prismaService.user.findUnique({
      where: { id: targetUserId },
      select: { id: true },
    })
    if (!targetUser) {
      throw new BadRequestException('Target user not found')
    }
    const existing = await this.prismaService.conversationParticipant.findUnique({
      where: { conversationId_userId: { conversationId, userId: targetUserId } },
    })
    if (existing) throw new BadRequestException('User already member')

    const inviter = await this.prismaService.conversationParticipant.findUnique({
      where: { conversationId_userId: { conversationId, userId: inviterId } },
      select: { role: true },
    })
    if (!inviter) throw UserNotInConversationException

    if (inviter.role === ParticipantRole.MODERATOR) {
      const upserted = await this.prismaService.conversationParticipant.upsert({
        where: { conversationId_userId: { conversationId, userId: targetUserId } },
        create: { conversationId, userId: targetUserId, role: ParticipantRole.MEMBER },
        update: { updatedAt: new Date() },
      })

      return {
        conversationId,
        invitedBy: inviterId,
        userId: targetUserId,
        approved: true,
      }
    }
    const pending = await this.prismaService.conversationJoinRequest.findFirst({
      where: { conversationId, invitedUserId: targetUserId, status: JoinRequestStatus.PENDING },
      select: { id: true },
    })
    if (pending) {
      return { conversationId, invitedBy: inviterId, userId: targetUserId, approved: false }
    }

    await this.prismaService.conversationJoinRequest.create({
      data: {
        conversationId,
        requesterId: inviterId,
        invitedUserId: targetUserId,
        status: JoinRequestStatus.PENDING,
      },
    })

    return { conversationId, invitedBy: inviterId, userId: targetUserId, approved: false }
  }

  async approveJoinRequest(requestId: number, moderatorId: number, approve: boolean) {
    const request = await this.prismaService.conversationJoinRequest.findUnique({
      where: { id: requestId },
    })
    if (!request) throw new NotFoundException('Join request not found')

    const mod = await this.prismaService.conversationParticipant.findUnique({
      where: { conversationId_userId: { conversationId: request.conversationId, userId: moderatorId } },
      select: { role: true },
    })
    if (!mod || mod.role !== ParticipantRole.MODERATOR)
      throw new ForbiddenException('Only moderators can approve requests')

    const status = approve ? JoinRequestStatus.APPROVED : JoinRequestStatus.REJECTED
    await this.prismaService.conversationJoinRequest.update({
      where: { id: requestId },
      data: { status },
    })

    if (approve) {
      await this.prismaService.conversationParticipant.create({
        data: { conversationId: request.conversationId, userId: request.invitedUserId },
      })
    }

    return { requestId, status, conversationId: request.conversationId, invitedUserId: request.invitedUserId }
  }

  async kickMember(conversationId: number, moderatorId: number, targetUserId: number) {
    const mod = await this.prismaService.conversationParticipant.findUnique({
      where: { conversationId_userId: { conversationId, userId: moderatorId } },
      select: { role: true },
    })

    if (!mod || mod.role !== ParticipantRole.MODERATOR)
      throw new ForbiddenException('Only moderators can remove members')

    await this.prismaService.conversationParticipant.delete({
      where: { conversationId_userId: { conversationId, userId: targetUserId } },
    })

    return { conversationId, removedUserId: targetUserId }
  }

  async assertUserFollowsTeacher(userId: number, teacherId: number) {
    const follow = await this.prismaService.follower.findFirst({
      where: {
        userId,
        teacherId,
        deletedAt: null,
        teacher: { deletedAt: null },
      },
      select: { id: true },
    })

    if (!follow) throw UserMustFollowTeacherToChatException
  }

  async getTeacherUserId(teacherId: number): Promise<number | null> {
    const teacher = await this.prismaService.teacher.findFirst({
      where: { id: teacherId, deletedAt: null },
      select: { userId: true },
    })

    return teacher?.userId ?? null
  }

  async findDirectBetweenUsers(userAId: number, userBId: number) {
    return this.prismaService.conversation.findFirst({
      where: {
        type: ConversationType.DIRECT,
        participants: { some: { userId: userAId } },
        AND: [
          { participants: { some: { userId: userBId } } },
          { participants: { every: { userId: { in: [userAId, userBId] } } } },
        ],
      },
      select: CONVERSATION_DEFAULT_SELECT,
    })
  }

  async unhideParticipant(conversationId: number, userId: number) {
    return this.prismaService.conversationParticipant.update({
      where: { conversationId_userId: { conversationId, userId } },
      data: { hiddenAt: null, updatedAt: new Date() },
      select: { conversationId: true, userId: true, hiddenAt: true },
    })
  }

  /**
   * Only this method can create DIRECT (teacher chat)
   * participants are 2 users: (userId, teacherUserId)
   */
  async createDirectConversationForTeacher(userId: number, teacherUserId: number): Promise<ConversationResponseType> {
    const participantIds = new Set([userId, teacherUserId])

    return this.prismaService.conversation.create({
      data: {
        type: ConversationType.DIRECT,
        title: null,
        description: null,
        createdById: userId,
        participants: {
          create: Array.from(participantIds).map((uid) => ({
            userId: uid,
            role: uid === userId ? ParticipantRole.MODERATOR : ParticipantRole.MEMBER,
          })),
        },
      },
      select: CONVERSATION_DEFAULT_SELECT,
    })
  }

  async listPendingMembers(conversationId: number, moderatorId: number, skip = 0, take = 20) {
    const moderator = await this.prismaService.conversationParticipant.findFirst({
      where: {
        conversationId,
        userId: moderatorId,
        role: ParticipantRole.MODERATOR,
        leftAt: null,
      },
      select: { id: true },
    })

    if (!moderator) {
      throw UserNotInConversationException
    }

    const where = {
      conversationId,
      status: JoinRequestStatus.PENDING,
    }

    const [total, items] = await this.prismaService.$transaction([
      this.prismaService.conversationJoinRequest.count({ where }),
      this.prismaService.conversationJoinRequest.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'asc' },
        select: {
          id: true,
          requesterId: true,
          invitedUserId: true,
          createdAt: true,
          requester: {
            select: PENDING_MEMBER_DEFAULT_SELECT,
          },
          invitedUser: {
            select: PENDING_MEMBER_DEFAULT_SELECT,
          },
        },
      }),
    ])

    return {
      total,
      items,
    }
  }

  async getTeacherIdByUserId(teacherUserId: number): Promise<number | null> {
    const teacher = await this.prismaService.teacher.findFirst({
      where: { userId: teacherUserId, deletedAt: null },
      select: { id: true },
    })
    return teacher?.id ?? null
  }
}
