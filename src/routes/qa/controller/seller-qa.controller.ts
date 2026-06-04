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

import { SellerQaService } from '../service/seller-qa.service'
import {
  SellerListThreadsQueryDto,
  SellerListThreadsResDto,
  SellerThreadPublicResDto,
  SellerListPostsQueryDto,
  SellerListPostsResDto,
  SellerPostPublicResDto,
  SellerAcceptAnswerInputDto,
  SellerUpdateThreadStatusInputDto,
  SellerLockThreadInputDto,
} from '../dto/seller-qa.dto'
import { ClientCreatePostInputDto } from '../dto/client-qa.dto'


@ApiTags('Q&A - Seller')
@Controller('qa/seller')
export class SellerQaController {
  constructor(private readonly service: SellerQaService) {}

  // ===== Threads =====

  /**
   * List threads under the seller's ownership.
   *
   * - Supports pagination, filtering, and sorting via query DTO.
   * - Returns paginated result in public thread shape.
   *
   * @param userId - Authenticated seller ID
   * @param query - Pagination/filter/sort parameters
   * @returns Paginated threads typed by `SellerListThreadsResDto`
   */
  @Auth([AuthTypes.BEARER, AuthTypes.APIKey], { condition: ConditionGuard.OR })
  @Get('threads')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List threads (seller)' })
  @ZodSerializerDto(SellerListThreadsResDto)
  @ApiStandardResponses(HttpStatusCode.OK, RESPONSE_MESSAGES.QA.DEFAULT.LIST, SellerListThreadsResDto)
  listThreads(@ActiveUser('userId') userId: number, @Query() query: SellerListThreadsQueryDto) {
    return this.service.listThreads(userId, query)
  }

  /**
   * Get a single seller-owned thread by ID.
   *
   * @param userId - Authenticated seller ID
   * @param threadId - Thread identifier (path param)
   * @returns Thread typed by `SellerThreadPublicResDto`
   */
  @Auth([AuthTypes.BEARER, AuthTypes.APIKey], { condition: ConditionGuard.OR })
  @Get('threads/:threadId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get thread detail (seller)' })
  @ApiParam({ name: 'threadId', type: Number })
  @ZodSerializerDto(SellerThreadPublicResDto)
  @ApiStandardResponses(HttpStatusCode.OK, RESPONSE_MESSAGES.QA.DEFAULT.DETAIL, SellerThreadPublicResDto)
  getThread(@ActiveUser('userId') userId: number, @Param('threadId', ParseIntPipe) threadId: number) {
    return this.service.getThread(userId, threadId)
  }

  /**
   * Update the status of a seller-owned thread.
   *
   * - Typical transitions: PENDING ⇄ RESOLVED
   * - May disconnect `acceptedPost` when switching back to PENDING (handled in service).
   *
   * @param userId - Authenticated seller ID
   * @param threadId - Thread identifier (path param)
   * @param body - Status update payload
   * @returns Updated thread typed by `SellerThreadPublicResDto`
   */
  @Auth([AuthTypes.BEARER, AuthTypes.APIKey], { condition: ConditionGuard.OR })
  @Patch('threads/:threadId/status')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update thread status (seller)' })
  @ApiParam({ name: 'threadId', type: Number })
  @ApiBody({ type: SellerUpdateThreadStatusInputDto })
  @ZodSerializerDto(SellerThreadPublicResDto)
  @ApiStandardResponses(HttpStatusCode.OK, RESPONSE_MESSAGES.QA.DEFAULT.UPDATED, SellerThreadPublicResDto)
  updateStatus(
    @ActiveUser('userId') userId: number,
    @Param('threadId', ParseIntPipe) threadId: number,
    @Body() body: SellerUpdateThreadStatusInputDto,
  ) {
    return this.service.updateStatus(userId, threadId, body)
  }

  /**
   * Lock or unlock a seller-owned thread.
   *
   * - When locked, posting is disabled for both sides (enforced in repo/service).
   *
   * @param userId - Authenticated seller ID
   * @param threadId - Thread identifier (path param)
   * @param body - Lock payload `{ locked: boolean }`
   * @returns Updated thread typed by `SellerThreadPublicResDto`
   */
  @Auth([AuthTypes.BEARER, AuthTypes.APIKey], { condition: ConditionGuard.OR })
  @Patch('threads/:threadId/lock')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Lock/Unlock thread (seller)' })
  @ApiParam({ name: 'threadId', type: Number })
  @ApiBody({ type: SellerLockThreadInputDto })
  @ZodSerializerDto(SellerThreadPublicResDto)
  @ApiStandardResponses(HttpStatusCode.OK, RESPONSE_MESSAGES.QA.DEFAULT.UPDATED, SellerThreadPublicResDto)
  lockThread(
    @ActiveUser('userId') userId: number,
    @Param('threadId', ParseIntPipe) threadId: number,
    @Body() body: SellerLockThreadInputDto,
  ) {
    return this.service.lockThread(userId, threadId, body)
  }

  /**
   * Soft-delete a seller-owned thread.
   *
   * - Marks thread as deleted (soft delete), does not remove records physically.
   *
   * @param userId - Authenticated seller ID
   * @param threadId - Thread identifier (path param)
   * @returns Standard success message payload
   */
  @Auth([AuthTypes.BEARER, AuthTypes.APIKey], { condition: ConditionGuard.OR })
  @Delete('threads/:threadId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Soft delete thread (seller)' })
  @ApiParam({ name: 'threadId', type: Number })
  @ApiStandardResponses(HttpStatusCode.OK, RESPONSE_MESSAGES.QA.DEFAULT.DELETED)
  softDeleteThread(@ActiveUser('userId') userId: number, @Param('threadId', ParseIntPipe) threadId: number) {
    return this.service.softDeleteThread(userId, threadId)
  }

  // ===== Posts =====

  /**
   * List posts in a seller-owned thread.
   *
   * - Supports pagination (page, pageSize).
   * - Returns posts in conversation order (ascending by createdAt).
   *
   * @param userId - Authenticated seller ID
   * @param threadId - Thread identifier (path param)
   * @param query - Pagination parameters
   * @returns Paginated posts typed by `SellerListPostsResDto`
   */
  @Auth([AuthTypes.BEARER, AuthTypes.APIKey], { condition: ConditionGuard.OR })
  @Get('threads/:threadId/posts')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List posts in thread (seller)' })
  @ApiParam({ name: 'threadId', type: Number })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'pageSize', required: false, type: Number })
  @ZodSerializerDto(SellerListPostsResDto)
  @ApiStandardResponses(HttpStatusCode.OK, RESPONSE_MESSAGES.QA.DEFAULT.LIST, SellerListPostsResDto)
  listPosts(
    @ActiveUser('userId') userId: number,
    @Param('threadId', ParseIntPipe) threadId: number,
    @Query() query: SellerListPostsQueryDto,
  ) {
    return this.service.listPosts(userId, threadId, query.page, query.pageSize)
  }

  /**
   * Seller replies / creates a post in a thread.
   *
   * - Route `threadId` always overrides body.threadId to prevent mismatch.
   * - Service handles lock state & parentId validation.
   *
   * @param userId - Authenticated seller ID
   * @param threadId - Thread identifier (path param)
   * @param body - Post creation payload (same DTO as client)
   * @returns Created post typed by `SellerPostPublicResDto`
   */
  @Auth([AuthTypes.BEARER, AuthTypes.APIKey], { condition: ConditionGuard.OR })
  @Post('threads/:threadId/posts')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Reply / create post (seller)' })
  @ApiParam({ name: 'threadId', type: Number })
  @ApiBody({ type: ClientCreatePostInputDto })
  @ZodSerializerDto(SellerPostPublicResDto)
  @ApiStandardResponses(HttpStatusCode.CREATED, RESPONSE_MESSAGES.QA.DEFAULT.CREATED, SellerPostPublicResDto)
  createPost(
    @ActiveUser('userId') userId: number,
    @Param('threadId', ParseIntPipe) threadId: number,
    @Body() body: ClientCreatePostInputDto,
  ) {
    // Ensure route threadId takes precedence over body.threadId for consistency
    return this.service.createPost(userId, { ...body, threadId })
  }

  /**
   * Accept an answer for a thread (mark a post as accepted).
   *
   * - Validates the post belongs to the same thread.
   * - Sets thread to RESOLVED & connects acceptedPost (handled in service).
   *
   * @param userId - Authenticated seller ID
   * @param threadId - Thread identifier (path param)
   * @param body - Accept payload containing `postId`
   * @returns Updated thread typed by `SellerThreadPublicResDto`
   */
  @Auth([AuthTypes.BEARER, AuthTypes.APIKey], { condition: ConditionGuard.OR })
  @Post('threads/:threadId/accept')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Accept an answer (seller)' })
  @ApiParam({ name: 'threadId', type: Number })
  @ApiBody({ type: SellerAcceptAnswerInputDto })
  @ZodSerializerDto(SellerThreadPublicResDto)
  @ApiStandardResponses(HttpStatusCode.OK, RESPONSE_MESSAGES.QA.DEFAULT.UPDATED, SellerThreadPublicResDto)
  acceptAnswer(
    @ActiveUser('userId') userId: number,
    @Param('threadId', ParseIntPipe) threadId: number,
    @Body() body: SellerAcceptAnswerInputDto,
  ) {
    return this.service.acceptAnswer(userId, threadId, body)
  }

  /**
   * Unaccept the current answer for a thread.
   *
   * - Disconnects `acceptedPost`, sets status back to PENDING (handled in service).
   *
   * @param userId - Authenticated seller ID
   * @param threadId - Thread identifier (path param)
   * @returns Updated thread typed by `SellerThreadPublicResDto`
   */
  @Auth([AuthTypes.BEARER, AuthTypes.APIKey], { condition: ConditionGuard.OR })
  @Post('threads/:threadId/unaccept')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Unaccept the current answer (seller)' })
  @ApiParam({ name: 'threadId', type: Number })
  @ZodSerializerDto(SellerThreadPublicResDto)
  @ApiStandardResponses(HttpStatusCode.OK, RESPONSE_MESSAGES.QA.DEFAULT.UPDATED, SellerThreadPublicResDto)
  unacceptAnswer(@ActiveUser('userId') userId: number, @Param('threadId', ParseIntPipe) threadId: number) {
    return this.service.unacceptAnswer(userId, threadId)
  }
}
