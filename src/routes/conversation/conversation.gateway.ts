import { ThrottlerGuard } from '@nestjs/throttler'
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayInit,
} from '@nestjs/websockets'
import { Server, Socket } from 'socket.io'
import { ConversationService } from './conversation.service'
import { JwtService } from '@nestjs/jwt'
import { socketAuth } from './socket-auth.middleware'
import { forwardRef, Inject, UseGuards } from '@nestjs/common'
import {
  MessageType,
  MessageTypeValue,
  ReactionAction,
  ReactionActionValue,
} from 'src/shared/constants/conversation.constant'
import { ConfigService } from '@nestjs/config'

/**
 * WebSocket gateway responsible for handling real-time chat features,
 * including joining conversations, sending messages, marking messages as read,
 * and reacting/unreacting to messages.
 *
 * Namespace: `/chat`
 */
@WebSocketGateway({ cors: { origin: '*' }, namespace: '/chat' })
export class ConversationGateway implements OnGatewayInit {
  /** Socket.IO server instance */
  @WebSocketServer() io: Server
  constructor(
    /** Inject the conversation service using forwardRef to avoid circular dependency */
    @Inject(forwardRef(() => ConversationService))
    private readonly conversationService: ConversationService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  /**
   * Called once the gateway is initialized.
   * Attaches the socket authentication middleware to verify tokens
   * before allowing clients to connect.
   *
   * @param server - The initialized Socket.IO server instance
   */
  afterInit(server: Server) {
    server.use(socketAuth(this.jwt, this.config))
  }

  async handleDisconnect(socket: Socket) {
    const userId = socket.data?.userId
    if (!userId) return

    for (const room of socket.rooms) {
      if (room === socket.id) continue
      if (room.startsWith('conv-')) {
        this.io.to(room).emit('userLeft', { userId })
      }
    }
  }

  /**
   * Event: `joinConversation`
   *
   * Allows a connected client to join a specific chat room.
   * The user must be a valid participant of the conversation.
   * Once joined, a `userJoined` event is broadcasted to all users in the room.
   *
   * @param body.conversationId - The ID of the conversation to join
   * @param socket - The connected socket instance
   */
  // @UseGuards(ThrottlerGuard)
  @SubscribeMessage('joinConversation')
  async join(@MessageBody() body: { conversationId: number }, @ConnectedSocket() socket: Socket) {
    try {
      const userId = socket.data.userId
      await this.conversationService.ensureMember(body.conversationId, userId)
      socket.join(`conv-${body.conversationId}`)
      this.io.to(`conv-${body.conversationId}`).emit('userJoined', { userId })
    } catch (error) {
      socket.emit('error', { message: error.message })
    }
  }

  /**
   * Event: `sendMessage`
   *
   * Allows a user to send a new message via WebSocket.
   * Although supported, the recommended approach is to use REST API for message creation
   * (for persistence) and then broadcast the event through the socket.
   *
   * @param body.conversationId - The ID of the conversation
   * @param body.content - The content of the message
   * @param body.messageType - The type of message (TEXT, IMAGE, FILE, etc.)
   * @param socket - The connected socket instance
   * @returns The created message record
   */
  // @UseGuards(ThrottlerGuard)
  @SubscribeMessage('sendMessage')
  async send(
    @MessageBody() body: { conversationId: number; content: string; messageType?: MessageTypeValue },
    @ConnectedSocket() socket: Socket,
  ) {
    try {
      const userId = socket.data.userId
      const msg = await this.conversationService.sendMessage(body.conversationId, userId, {
        content: body.content,
        messageType: body.messageType ?? MessageType.TEXT,
      })
      //this.io.to(`conv-${body.conversationId}`).emit('newMessage', msg)
      return msg
    } catch (error) {
       console.error('sendMessage error:', error);
      socket.emit('error', { message: error.message })
    }
  }

  /**
   * Event: `readMessage`
   *
   * Marks a message as read by the connected user.
   * The ConversationService will handle persistence and emit a
   * `messageRead` event to notify other participants.
   *
   * @param body.messageId - The ID of the message being read
   * @param socket - The connected socket instance
   * @returns The created MessageRead record
   */
  // @UseGuards(ThrottlerGuard)
  @SubscribeMessage('readMessage')
  async read(@MessageBody() body: { messageId: number }, @ConnectedSocket() socket: Socket) {
    try {
      const userId = socket.data.userId
      const readRecord = await this.conversationService.markRead(body.messageId, userId)
      const conversationId = readRecord.message.conversationId
      this.io.to(`conv-${conversationId}`).emit('messageRead', { messageId: body.messageId, userId })
      return readRecord
    } catch (error) {
      socket.emit('error', { message: error.message })
    }
  }

  /**
   * Event: `reaction`
   *
   * Handles adding or removing reactions on a message.
   * The event payload must specify the message ID, emoji, and reaction type.
   *
   * @param body.messageId - The ID of the message
   * @param body.emoji - The emoji used for the reaction
   * @param body.type - The action type ('add' or 'remove')
   * @param socket - The connected socket instance
   * @returns The created or removed reaction record
   */
  // @UseGuards(ThrottlerGuard)
  @SubscribeMessage('reaction')
  async reaction(
    @MessageBody() body: { messageId: number; emoji: string; type: ReactionActionValue },
    @ConnectedSocket() socket: Socket,
  ) {
    try {
      const userId = socket.data.userId
      let reactionRecord
      if (body.type === ReactionAction.ADD) {
        reactionRecord = await this.conversationService.react(body.messageId, userId, body.emoji)
      } else {
        reactionRecord = await this.conversationService.unreact(body.messageId, userId, body.emoji)
      }
      // this.io.to(`conv-${reactionRecord.conversationId}`).emit('reactionUpdated', reactionRecord)
      return reactionRecord
    } catch (error) {
      socket.emit('error', { message: error.message })
    }
  }
}
