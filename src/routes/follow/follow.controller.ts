import { Controller, Post, Param, HttpCode, HttpStatus, Delete, Put, Query, Get } from '@nestjs/common'
import { FollowService } from './follow.service'
import {
  FollowersListResDTO,
  FollowingListResDTO,
  FollowResDTO,
  PaginationQueryDTO,
  TeacherIdParamDTO,
  UnfollowResDTO,
  UserIdParamDTO,
} from './dto/follow.dto'
import { Auth } from 'src/shared/decorator/auth.decorator'
import { AuthTypes } from 'src/shared/constants/auth.constant'
import { ZodSerializerDto } from 'nestjs-zod'
import { ActiveUser } from 'src/shared/decorator/active-user.decorator'
import { ApiOperation, ApiParam, ApiTags, ApiQuery } from '@nestjs/swagger'
import { ApiStandardResponses } from 'src/shared/decorator/api-standard-response'
import { HttpStatusCode } from 'src/shared/swagger/swagger.interface'
import { RESPONSE_MESSAGES } from 'src/shared/constants/swagger.constant'

@ApiTags('Follow')
@Controller('teachers')
export class FollowController {
  constructor(private readonly followService: FollowService) {}

  /**
   * Current user (from Bearer token) follows teacher `:teacherId`.
   * - Idempotent: calling multiple times returns success without duplicating records.
   * - No request body; parameter is in the URL path.
   * @param params.teacherId Target teacher ID (positive integer).
   * @param userId Extracted from access token (`@ActiveUser('userId')`).
   * @returns `FollowResDTO` — `{ success: true, followerId }` where `followerId` is the Follower record ID.
   */
  @Auth([AuthTypes.BEARER])
  @Post('/:teacherId/follow')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Follow teacher [DEPRECATED]',
    description:
      'Current authenticated user follows a teacher by ID. Idempotent — calling multiple times will not create duplicates.',
  })
  @ApiParam({ name: 'teacherId', type: Number, description: 'Teacher ID to follow' })
  @ZodSerializerDto(FollowResDTO)
  @ApiStandardResponses(HttpStatusCode.OK, RESPONSE_MESSAGES.FOLLOW.FOLLOWED, FollowResDTO)
  async follow(@Param() params: TeacherIdParamDTO, @ActiveUser('userId') userId: number) {
    return this.followService.followTeacher(params.teacherId, userId)
  }

  /**
   * Current user unfollows teacher `:teacherId`.
   * - Idempotent: if already unfollowed, still returns `{ success: true }`.
   * - No request body; parameter is in the URL path.
   * @param params.teacherId Target teacher ID.
   * @param userId Extracted from access token.
   * @returns `UnfollowResDTO` — `{ success: true }`.
   */
  @Auth([AuthTypes.BEARER])
  @Put('/:teacherId/unfollow')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Unfollow teacher [DEPRECATED]',
    description: 'Unfollow a teacher by ID. Idempotent — returns success even if already unfollowed.',
  })
  @ApiParam({ name: 'teacherId', type: Number, description: 'Teacher ID to unfollow' })
  @ZodSerializerDto(UnfollowResDTO)
  @ApiStandardResponses(HttpStatusCode.OK, RESPONSE_MESSAGES.FOLLOW.UNFOLLOWED, UnfollowResDTO)
  async unfollow(@Param() params: TeacherIdParamDTO, @ActiveUser('userId') userId: number) {
    return this.followService.unfollowTeacher(params.teacherId, userId)
  }

  /**
   * List **followers of a teacher** (users who follow this teacher), with pagination.
   * - Sort: `createdAt DESC` (newest first).
   * - Each item contains basic follower.user info (id, fullname, username, avatar).
   * @param params.teacherId The teacher whose followers to list.
   * @param queryParam `PaginationQueryDTO` with `page` (default 1) and `limit` (default 20, max 100).
   * @returns `FollowersListResDTO` — `{ items, total, page, limit }`.
   */
  @Auth([AuthTypes.BEARER])
  @Get('/:teacherId/followers')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'List teacher followers [DEPRECATED]',
    description: 'Get paginated list of users who follow this teacher. Sorted by creation date (DESC).',
  })
  @ApiParam({ name: 'teacherId', type: Number, description: 'Teacher ID' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Page size (default 20, max 100)' })
  @ZodSerializerDto(FollowersListResDTO)
  @ApiStandardResponses(HttpStatusCode.OK, RESPONSE_MESSAGES.FOLLOW.FOLLOWERS_LIST, FollowersListResDTO)
  async followersList(@Param() params: TeacherIdParamDTO, @Query() queryParam: PaginationQueryDTO) {
    return await this.followService.followersList(params.teacherId, queryParam)
  }

  /**
   * List **who this teacher is following** (i.e., the set of teachers followed by this teacher’s user),
   * with pagination. Internally: resolve `teacher.userId` then query `Follower.where.userId = teacher.userId`.
   * - Sort: `createdAt DESC`.
   * - Each item contains the followed `teacher` info (id, specialization, followersCount) and its `user` (id, fullname, avatar).
   * @param params.teacherId The teacher whose following list to show.
   * @param queryParam `PaginationQueryDTO` with `page` and `limit`.
   * @returns `FollowingListResDTO` — `{ items, total, page, limit }`.
   */
  @Auth([AuthTypes.BEARER])
  @Get('/:teacherId/following')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'List teacher following [DEPRECATED]',
    description: 'Get paginated list of other teachers that this teacher is following. Sorted by creation date (DESC).',
  })
  @ApiParam({ name: 'teacherId', type: Number, description: 'Teacher ID' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Page size (default 20, max 100)' })
  @ZodSerializerDto(FollowingListResDTO)
  @ApiStandardResponses(HttpStatusCode.OK, RESPONSE_MESSAGES.FOLLOW.FOLLOWING_LIST, FollowingListResDTO)
  async followingList(@Param() params: TeacherIdParamDTO, @Query() queryParam: PaginationQueryDTO) {
    return await this.followService.followingList(params.teacherId, queryParam)
  }

  /**
   * Current authenticated user follows a teacher by the teacher's **userId**.
   *
   * @param params.userId  Target teacher's userId (path param).
   * @param userId         Current authenticated user's id (from access token).
   * @returns FollowResDTO
   * `{ success: true, followerId }`
   */
  @Auth([AuthTypes.BEARER])
  @Post('/user/:userId/follow')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Follow teacher by userId',
    description: 'Current authenticated user follows a teacher by the teacher’s userId. Idempotent.',
  })
  @ApiParam({ name: 'userId', type: Number, description: 'Teacher userId to follow' })
  @ZodSerializerDto(FollowResDTO)
  @ApiStandardResponses(HttpStatusCode.OK, RESPONSE_MESSAGES.FOLLOW.FOLLOWED, FollowResDTO)
  async followByUserId(@Param() params: UserIdParamDTO, @ActiveUser('userId') userId: number) {
    return this.followService.followTeacherByUserId(params.userId, userId)
  }

  /**
   * Current authenticated user unfollows a teacher by the teacher's **userId**.
   *
   * @param params.userId  Target teacher's userId.
   * @param userId         Current authenticated user's id.
   * @returns UnfollowResDTO
   * `{ success: true }`
   */
  @Auth([AuthTypes.BEARER])
  @Put('/user/:userId/unfollow')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Unfollow teacher by userId',
    description: 'Unfollow a teacher by the teacher’s userId. Idempotent.',
  })
  @ApiParam({ name: 'userId', type: Number, description: 'Teacher userId to unfollow' })
  @ZodSerializerDto(UnfollowResDTO)
  @ApiStandardResponses(HttpStatusCode.OK, RESPONSE_MESSAGES.FOLLOW.UNFOLLOWED, UnfollowResDTO)
  async unfollowByUserId(@Param() params: UserIdParamDTO, @ActiveUser('userId') userId: number) {
    return this.followService.unfollowTeacherByUserId(params.userId, userId)
  }

  /**
   * Get a paginated list of users who follow a teacher,
   * where the teacher is resolved by **userId**.
   *
   * @param params.userId   Teacher's userId.
   * @param queryParam      Pagination params `{ page, limit }`.
   * @returns FollowersListResDTO
   * `{ items, total, page, limit }`
   */
  @Auth([AuthTypes.BEARER])
  @Get('/user/:userId/followers')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'List teacher followers by userId',
    description: 'Get paginated list of users who follow this teacher (teacher resolved by userId).',
  })
  @ApiParam({ name: 'userId', type: Number, description: 'Teacher userId' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Page size (default 20, max 100)' })
  @ZodSerializerDto(FollowersListResDTO)
  @ApiStandardResponses(HttpStatusCode.OK, RESPONSE_MESSAGES.FOLLOW.FOLLOWERS_LIST, FollowersListResDTO)
  async followersListByUserId(@Param() params: UserIdParamDTO, @Query() queryParam: PaginationQueryDTO) {
    return this.followService.followersListByUserId(params.userId, queryParam)
  }

  /**
   * Get a paginated list of teachers that this teacher is following,
   * where the teacher is resolved by **userId**.
   *
   * @param params.userId   Teacher's userId.
   * @param queryParam      Pagination params `{ page, limit }`.
   * @returns FollowingListResDTO
   * `{ items, total, page, limit }`
   */
  @Auth([AuthTypes.BEARER])
  @Get('/user/:userId/following')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'List teacher following by userId',
    description: 'Get paginated list of teachers that this teacher is following (teacher resolved by userId).',
  })
  @ApiParam({ name: 'userId', type: Number, description: 'Teacher userId' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Page size (default 20, max 100)' })
  @ZodSerializerDto(FollowingListResDTO)
  @ApiStandardResponses(HttpStatusCode.OK, RESPONSE_MESSAGES.FOLLOW.FOLLOWING_LIST, FollowingListResDTO)
  async followingListByUserId(@Param() params: UserIdParamDTO, @Query() queryParam: PaginationQueryDTO) {
    return this.followService.followingListByUserId(params.userId, queryParam)
  }
}
