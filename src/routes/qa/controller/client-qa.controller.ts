import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common'
import { ZodSerializerDto } from 'nestjs-zod'
import { Auth } from 'src/shared/decorator/auth.decorator'
import { ActiveUser } from 'src/shared/decorator/active-user.decorator'
import { AuthTypes, ConditionGuard } from 'src/shared/constants/auth.constant'
import { ApiBody, ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger'
import { ApiStandardResponses } from 'src/shared/decorator/api-standard-response'
import { HttpStatusCode } from 'src/shared/swagger/swagger.interface'
import { RESPONSE_MESSAGES } from 'src/shared/constants/swagger.constant'

import { ClientQaService } from '../service/client-qa.service'
import {
  ClientCreateThreadInputDto,
  ClientCreatePostInputDto,
  ClientEditPostInputDto,
  ClientListThreadsQueryDto,
  ClientListThreadsResDto,
  ClientListPostsQueryDto,
  ClientListPostsResDto,
  ClientThreadPublicResDto,
  ClientPostPublicResDto,
} from '../dto/client-qa.dto'


@ApiTags('Q&A - Client')
@Controller('qa/client')
export class ClientQaController {
  constructor(private readonly service: ClientQaService) {}

  // ===== Threads =====

  /**
   * Create a new thread for the authenticated client.
   *
   * - Validates request with Zod DTO.
   * - Returns the created thread in public shape.
   *
   * @param userId - ID of the active user (client)
   * @param body - Thread creation payload
   * @returns Newly created thread typed by `ClientThreadPublicResDto`
   */
  @Auth([AuthTypes.BEARER, AuthTypes.APIKey], { condition: ConditionGuard.OR })
  @Post('threads')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create thread (client)' })
  @ApiBody({ type: ClientCreateThreadInputDto })
  @ZodSerializerDto(ClientThreadPublicResDto)
  @ApiStandardResponses(HttpStatusCode.CREATED, RESPONSE_MESSAGES.QA.DEFAULT.CREATED, ClientThreadPublicResDto)
  createThread(@ActiveUser('userId') userId: number, @Body() body: ClientCreateThreadInputDto) {
    return this.service.createThread(userId, body)
  }

  /**
   * List threads the client can access (enrolled courses).
   *
   * - Supports pagination, filtering, and sorting via query DTO.
   * - Returns a paginated list of threads in public shape.
   *
   * @param userId - ID of the active user (client)
   * @param query - Pagination/filter/sort parameters
   * @returns Paginated thread list typed by `ClientListThreadsResDto`
   */
  @Auth([AuthTypes.BEARER, AuthTypes.APIKey], { condition: ConditionGuard.OR })
  @Get('threads')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List threads (client)' })
  @ZodSerializerDto(ClientListThreadsResDto)
  @ApiStandardResponses(HttpStatusCode.OK, RESPONSE_MESSAGES.QA.DEFAULT.LIST, ClientListThreadsResDto)
  listThreads(@ActiveUser('userId') userId: number, @Query() query: ClientListThreadsQueryDto) {
    return this.service.listThreads(userId, query)
  }

  /**
   * Get details of a single thread accessible by the client.
   *
   * @param userId - ID of the active user (client)
   * @param threadId - Thread identifier (path param)
   * @returns Thread in public shape typed by `ClientThreadPublicResDto`
   */
  @Auth([AuthTypes.BEARER, AuthTypes.APIKey], { condition: ConditionGuard.OR })
  @Get('threads/:threadId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get thread detail (client)' })
  @ApiParam({ name: 'threadId', type: Number })
  @ZodSerializerDto(ClientThreadPublicResDto)
  @ApiStandardResponses(HttpStatusCode.OK, RESPONSE_MESSAGES.QA.DEFAULT.DETAIL, ClientThreadPublicResDto)
  getThread(@ActiveUser('userId') userId: number, @Param('threadId', ParseIntPipe) threadId: number) {
    return this.service.getThread(userId, threadId)
  }

  // ===== Posts =====

  /**
   * List posts within a thread for the authenticated client.
   *
   * - Accepts optional pagination (page, pageSize).
   * - Returns posts ordered for conversation rendering.
   *
   * @param userId - ID of the active user (client)
   * @param threadId - Thread identifier (path param)
   * @param query - Pagination parameters
   * @returns Paginated posts typed by `ClientListPostsResDto`
   */
  @Auth([AuthTypes.BEARER, AuthTypes.APIKey], { condition: ConditionGuard.OR })
  @Get('threads/:threadId/posts')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List posts in thread (client)' })
  @ApiParam({ name: 'threadId', type: Number })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'pageSize', required: false, type: Number })
  @ZodSerializerDto(ClientListPostsResDto)
  @ApiStandardResponses(HttpStatusCode.OK, RESPONSE_MESSAGES.QA.DEFAULT.LIST, ClientListPostsResDto)
  listPosts(
    @ActiveUser('userId') userId: number,
    @Param('threadId', ParseIntPipe) threadId: number,
    @Query() query: ClientListPostsQueryDto,
  ) {
    return this.service.listPosts(userId, threadId, query.page, query.pageSize)
  }

  /**
   * Create a new post (reply) inside a thread for the client.
   *
   * - Ensures the route `threadId` overrides any body value to avoid inconsistencies.
   * - Returns the created post in public shape.
   *
   * @param userId - ID of the active user (client)
   * @param threadId - Thread identifier (from route)
   * @param body - Post creation payload
   * @returns Newly created post typed by `ClientPostPublicResDto`
   */
  @Auth([AuthTypes.BEARER, AuthTypes.APIKey], { condition: ConditionGuard.OR })
  @Post('threads/:threadId/posts')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create post / reply (client)' })
  @ApiParam({ name: 'threadId', type: Number })
  @ApiBody({ type: ClientCreatePostInputDto })
  @ZodSerializerDto(ClientPostPublicResDto)
  @ApiStandardResponses(HttpStatusCode.CREATED, RESPONSE_MESSAGES.QA.DEFAULT.CREATED, ClientPostPublicResDto)
  createPost(
    @ActiveUser('userId') userId: number,
    @Param('threadId', ParseIntPipe) threadId: number,
    @Body() body: ClientCreatePostInputDto,
  ) {
    // Ensure the threadId from route takes precedence over body.threadId
    return this.service.createPost(userId, { ...body, threadId })
  }

  /**
   * Edit the client's own post content.
   *
   * - Only the author can edit.
   * - Returns the updated post in public shape.
   *
   * @param userId - ID of the active user (client)
   * @param postId - Post identifier (path param)
   * @param body - Post edit payload
   * @returns Updated post typed by `ClientPostPublicResDto`
   */
  @Auth([AuthTypes.BEARER, AuthTypes.APIKey], { condition: ConditionGuard.OR })
  @Patch('posts/:postId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Edit own post (client)' })
  @ApiParam({ name: 'postId', type: Number })
  @ZodSerializerDto(ClientPostPublicResDto)
  @ApiStandardResponses(HttpStatusCode.OK, RESPONSE_MESSAGES.QA.DEFAULT.UPDATED, ClientPostPublicResDto)
  editPost(
    @ActiveUser('userId') userId: number,
    @Param('postId', ParseIntPipe) postId: number,
    @Body() body: ClientEditPostInputDto,
  ) {
    return this.service.editPost(userId, postId, body)
  }

  /**
   * Soft delete the client's own post.
   *
   * - Prevents deleting the accepted answer (handled in service).
   * - Returns standardized success message payload.
   *
   * @param userId - ID of the active user (client)
   * @param postId - Post identifier (path param)
   * @returns Standard success response (message key)
   */
  @Auth([AuthTypes.BEARER, AuthTypes.APIKey], { condition: ConditionGuard.OR })
  @Delete('posts/:postId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete own post (client)' })
  @ApiParam({ name: 'postId', type: Number })
  @ZodSerializerDto(ClientPostPublicResDto)
  @ApiStandardResponses(HttpStatusCode.OK, RESPONSE_MESSAGES.QA.DEFAULT.DELETED)
  deletePost(@ActiveUser('userId') userId: number, @Param('postId', ParseIntPipe) postId: number) {
    return this.service.deletePost(userId, postId)
  }
}
