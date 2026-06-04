import { IsPublic } from './../../shared/decorator/auth.decorator'
import { Body, Delete, HttpCode, HttpStatus, Param, ParseIntPipe, Patch, Post, Get, Query, Put } from '@nestjs/common'
import { Controller } from '@nestjs/common'
import { ZodSerializerDto } from 'nestjs-zod'
import { CourseService } from './course.service'
import {
  CourseBuilderResDTO,
  CreateCourseDTO,
  CreateCourseResDTO,
  CourseStudyResDTO,
  GetCourseResDTO,
  ListCourseQueryDTO,
  ListCourseResDTO,
  ListEnrolledCourseQueryDTO,
  ListEnrolledCourseResDTO,
  UpdateCourseDTO,
  UpdateCourseResDTO,
  UpdateCourseStatusDTO,
  UpdateCourseStatusResDTO,
  PublicCourseDetailResDTO,
  PublicCourseListResDTO,
} from './dto/course.dto'
import { CreateCourseResType, UpdateCourseResType } from './course.model'
import { RequireAdminRole, RequireSellerRole } from 'src/shared/decorator/role.decorator'
import { ActiveUser } from 'src/shared/decorator/active-user.decorator'
import { Auth } from 'src/shared/decorator/auth.decorator'
import { AuthTypes, ConditionGuard } from 'src/shared/constants/auth.constant'
import { MessageResDTO } from 'src/shared/dto/response.dto'
import { ApiBody, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger'
import { ApiStandardResponses } from 'src/shared/decorator/api-standard-response'
import { HttpStatusCode } from 'src/shared/swagger/swagger.interface'
import { RESPONSE_MESSAGES } from 'src/shared/constants/swagger.constant'

@ApiTags('Course')
@Controller('course')
export class CourseController {
  constructor(private readonly courseService: CourseService) {}

  /**
   * API endpoint to create a new course.
   *
   * - Requires user authentication via Bearer token or API Key (OR condition).
   * - Access restricted to sellers only (`@RequireSellerRole` guard).
   * - Returns HTTP 201 (Created) on success.
   * - The response is serialized using `CreateCourseResDTO`.
   *
   * @param userId - ID of the authenticated user creating the course (injected via `@ActiveUser` decorator)
   * @param body - Course creation payload validated by `CreateCourseDTO`
   * @returns The newly created course data, typed as `CreateCourseResType`
   */

  @Auth([AuthTypes.BEARER, AuthTypes.APIKey], { condition: ConditionGuard.OR })
  @Post()
  @RequireSellerRole()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create course',
    description: 'Create a new course (seller only).',
  })
  @ApiBody({ type: CreateCourseDTO })
  @ZodSerializerDto(CreateCourseResDTO)
  @ApiStandardResponses(HttpStatusCode.CREATED, RESPONSE_MESSAGES.COURSE.CREATED, CreateCourseResDTO)
  createCourse(@ActiveUser('userId') userId: number, @Body() body: CreateCourseDTO): Promise<CreateCourseResType> {
    return this.courseService.createCourse(userId, body)
  }
  /**
   * API endpoint to update an existing course.
   *
   * - Requires user authentication via Bearer token or API Key (OR condition).
   * - Access restricted to sellers only (`@RequireSellerRole` guard).
   * - Returns HTTP 200 (OK) on success.
   * - The response is serialized using `UpdateCourseResDTO`.
   *
   * @param id - ID of the course to update (extracted from the URL parameter)
   * @param userId - ID of the authenticated user updating the course (injected via `@ActiveUser` decorator)
   * @param body - Course update payload validated by `UpdateCourseDTO`
   * @returns The updated course data, typed as `UpdateCourseResType`
   */
  @Auth([AuthTypes.BEARER, AuthTypes.APIKey], { condition: ConditionGuard.OR })
  @Patch(':id')
  @RequireSellerRole()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update course',
    description: 'Update an existing course by ID (seller only).',
  })
  @ApiParam({ name: 'id', type: Number, description: 'Course ID' })
  @ApiBody({ type: UpdateCourseDTO })
  @ZodSerializerDto(UpdateCourseResDTO)
  @ApiStandardResponses(HttpStatusCode.OK, RESPONSE_MESSAGES.COURSE.UPDATED, UpdateCourseResDTO)
  updateCourse(
    @Param('id', ParseIntPipe) id: number,
    @ActiveUser('userId') userId: number,
    @Body() body: UpdateCourseDTO,
  ): Promise<UpdateCourseResType> {
    return this.courseService.updateCourse(userId, id, body)
  }

  @Auth([AuthTypes.BEARER, AuthTypes.APIKey], { condition: ConditionGuard.OR })
  @RequireSellerRole()
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Delete course (soft)',
    description: 'Soft delete a course; sets deletedAt (seller only).',
  })
  @ApiParam({ name: 'id', type: Number, description: 'Course ID' })
  @ZodSerializerDto(MessageResDTO)
  @ApiStandardResponses(HttpStatusCode.OK, RESPONSE_MESSAGES.COURSE.DELETED, MessageResDTO)
  deleteCourse(
    @Param('id', ParseIntPipe) id: number,
    @ActiveUser('userId') userId: number,
  ): Promise<{ message: string }> {
    return this.courseService.deleteCourse(userId, id)
  }

  @Auth([AuthTypes.BEARER, AuthTypes.APIKey], { condition: ConditionGuard.OR })
  @RequireSellerRole()
  @Patch(':id/restore')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Restore course',
    description: 'Restore a previously soft-deleted course (seller only).',
  })
  @ApiParam({ name: 'id', type: Number, description: 'Course ID' })
  @ZodSerializerDto(MessageResDTO)
  @ApiStandardResponses(HttpStatusCode.OK, RESPONSE_MESSAGES.COURSE.RESTORED, MessageResDTO)
  restoreCourse(
    @Param('id', ParseIntPipe) id: number,
    @ActiveUser('userId') userId: number,
  ): Promise<{ message: string }> {
    return this.courseService.restoreCourse(userId, id)
  }
  /**
   * API endpoint to list publicly available courses.
   *
   * - No authentication required (`@IsPublic()` decorator).
   * - Returns only **Approved** and **non-deleted** courses.
   * - Supports pagination and optional filter by `categoryId`.
   * - Returns HTTP 200 (OK) on success.
   * - The response is serialized using `ListCourseResDTO`.
   *
   * @param query - Query parameters for pagination and filtering, validated by `ListCourseQueryDTO`
   * @returns Paginated list of approved courses accessible to the public
   */
  @IsPublic()
  @Get('public')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Public list courses',
    description: 'List approved courses with pagination and optional category filter. No auth required.',
  })
  // @ZodSerializerDto(PublicCourseListResDTO)
  @ApiStandardResponses(HttpStatusCode.OK, RESPONSE_MESSAGES.COURSE.LIST_PUBLIC, ListCourseResDTO)
  listPublic(@Query() query: ListCourseQueryDTO) {
    return this.courseService.listPublicCourses(query)
  }
  /**
   * Public API endpoint to fetch detailed information of an approved course.
   *
   * - No authentication required.
   * - Only returns course details if the course is **Approved** and **not deleted**.
   * - Intended for clients browsing course detail pages.
   *
   * @param id - ID of the course to fetch (extracted from the URL parameter)
   * @returns Detailed information of the approved course
   */
  @Get('public/:id')
  @IsPublic()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get public course detail',
    description: 'Fetch full details of an approved course for public clients. No auth required.',
  })
  @ApiParam({ name: 'id', type: Number, description: 'Course ID' })
  @ZodSerializerDto(PublicCourseDetailResDTO)
  @ApiStandardResponses(HttpStatusCode.OK, RESPONSE_MESSAGES.COURSE.DETAIL, PublicCourseDetailResDTO)
  getPublicCourseDetail(@Param('id', ParseIntPipe) id: number) {
    return this.courseService.getPublicCourseDetail(id)
  }
  /**
   * API endpoint to list courses the authenticated client is enrolled in.
   *
   * - Requires user authentication via Bearer token or API Key (OR condition).
   * - Intended for client/learner users.
   * - Includes course metadata and enrollment progress information.
   * - Supports pagination via `skip` and `take`.
   * - The response is serialized using `ListEnrolledCourseResDTO`.
   *
   * @param userId - ID of the authenticated user (injected via `@ActiveUser` decorator)
   * @param query - Pagination query params, validated by `ListEnrolledCourseQueryDTO`
   * @returns Paginated list of enrolled courses for the current user
   */
  @Auth([AuthTypes.BEARER, AuthTypes.APIKey], { condition: ConditionGuard.OR })
  @Get('enrolled')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'List enrolled courses (client)',
    description: 'List courses the authenticated client has enrolled in, with pagination and progress metadata.',
  })
  @ZodSerializerDto(ListEnrolledCourseResDTO)
  @ApiStandardResponses(HttpStatusCode.OK, RESPONSE_MESSAGES.COURSE.ENROLLED, ListEnrolledCourseResDTO)
  listEnrolledCourses(@ActiveUser('userId') userId: number, @Query() query: ListEnrolledCourseQueryDTO) {
    return this.courseService.listEnrolledCourses(userId, query)
  }
    /**
   * Get study info for an enrolled course (client).
   *
   * - Requires authentication.
   * - Response shape is identical to one item in /course/enrolled.
   */
  @Auth([AuthTypes.BEARER, AuthTypes.APIKey], { condition: ConditionGuard.OR })
  @Get(':id/study')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get enrolled course detail (client)',
    description: 'Get detail of a course the current user has enrolled in.',
  })
  @ApiParam({ name: 'id', type: Number, description: 'Course ID' })
  @ZodSerializerDto(CourseStudyResDTO)
  @ApiStandardResponses(HttpStatusCode.OK, RESPONSE_MESSAGES.COURSE.DETAIL, CourseStudyResDTO)
  getEnrolledCourseDetail(@Param('id', ParseIntPipe) id: number, @ActiveUser('userId') userId: number) {
    return this.courseService.getCourseStudyInfo(userId, id)
  }

  /**
   * API endpoint to fetch detailed information of a specific course.
   *
   * - Requires user authentication via Bearer token or API Key (OR condition).
   * - Access restricted to sellers only (`@RequireSellerRole` guard).
   * - Returns detailed metadata of the course (title, description, price, status, etc).
   * - The response is serialized using `GetCourseResDTO`.
   *
   * @param id - ID of the course to fetch (extracted from the URL parameter)
   * @param userId - ID of the authenticated user fetching the course (injected via `@ActiveUser` decorator)
   * @returns The course details
   */
  @Auth([AuthTypes.BEARER, AuthTypes.APIKey], { condition: ConditionGuard.OR })
  @RequireSellerRole()
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get course detail',
    description: 'Fetch detailed information of a course (seller only).',
  })
  @ApiParam({ name: 'id', type: Number, description: 'Course ID' })
  @ZodSerializerDto(GetCourseResDTO)
  @ApiStandardResponses(HttpStatusCode.OK, RESPONSE_MESSAGES.COURSE.DETAIL, GetCourseResDTO)
  getCourseById(@Param('id', ParseIntPipe) id: number, @ActiveUser('userId') userId: number) {
    return this.courseService.getCourseById(userId, id)
  }

  /**
   * API endpoint to list courses with pagination and optional filters.
   *
   * - Requires user authentication via Bearer token or API Key (OR condition).
   * - Access restricted to sellers only (`@RequireSellerRole` guard).
   * - Supports query params: skip, take, status, categoryId.
   * - Returns a paginated list of courses.
   * - The response is serialized using `ListCourseResDTO`.
   *
   * @param userId - ID of the authenticated user (injected via `@ActiveUser` decorator)
   * @param query - Query params for filtering and pagination (validated by `ListCourseQueryDTO`)
   * @returns Paginated list of courses
   */
  @Auth([AuthTypes.BEARER, AuthTypes.APIKey], { condition: ConditionGuard.OR })
  @RequireSellerRole()
  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'List courses',
    description: 'List courses with pagination and optional filters (seller only).',
  })
  @ZodSerializerDto(ListCourseResDTO)
  @ApiStandardResponses(HttpStatusCode.OK, RESPONSE_MESSAGES.COURSE.LIST, ListCourseResDTO)
  listCourses(@ActiveUser('userId') userId: number, @Query() query: ListCourseQueryDTO) {
    return this.courseService.listCourses(userId, query)
  }

  /**
   * API endpoint to retrieve builder metadata for a course.
   *
   * - Requires user authentication via Bearer token or API Key (OR condition).
   * - Access restricted to sellers only (`@RequireSellerRole` guard).
   * - Returns basic course info and counts of modules/lessons (not the full content).
   * - The response is serialized using `CourseBuilderResDTO`.
   *
   * @param id - ID of the course to build (extracted from the URL parameter)
   * @param userId - ID of the authenticated user (injected via `@ActiveUser` decorator)
   * @returns Builder metadata including course info, moduleCount, lessonCount
   */
  @Auth([AuthTypes.BEARER, AuthTypes.APIKey], { condition: ConditionGuard.OR })
  @RequireSellerRole()
  @Get(':id/builder')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get course builder metadata',
    description: 'Basic builder info with module/lesson counts (seller only).',
  })
  @ApiParam({ name: 'id', type: Number, description: 'Course ID' })
  @ZodSerializerDto(CourseBuilderResDTO)
  @ApiStandardResponses(HttpStatusCode.OK, RESPONSE_MESSAGES.COURSE.BUILDER, CourseBuilderResDTO)
  getCourseBuilder(@Param('id', ParseIntPipe) id: number, @ActiveUser('userId') userId: number) {
    return this.courseService.getCourseBuilder(userId, id)
  }

  /**
   * API endpoint to update the status of a course.
   *
   * - Requires user authentication via Bearer token or API Key (OR condition).
   * - Access restricted to admins only (`@RequireAdminRole` guard).
   * - Allows overriding course status manually (e.g., Approved, Rejected).
   * - The response is serialized using `UpdateCourseStatusResDTO`.
   *
   * @param id - ID of the course to update status for (extracted from the URL parameter)
   * @param userId - ID of the authenticated user performing the update (injected via `@ActiveUser` decorator)
   * @param body - Payload containing the new course status (validated by `UpdateCourseStatusDTO`)
   * @returns The updated course's ID, status, and updatedAt timestamp
   */
  @Auth([AuthTypes.BEARER, AuthTypes.APIKey], { condition: ConditionGuard.OR })
  @RequireAdminRole()
  @Patch(':id/status')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update course status',
    description: 'Manually update course status (admin only).',
  })
  @ApiParam({ name: 'id', type: Number, description: 'Course ID' })
  @ApiBody({ type: UpdateCourseStatusDTO })
  @ZodSerializerDto(UpdateCourseStatusResDTO)
  @ApiStandardResponses(HttpStatusCode.OK, RESPONSE_MESSAGES.COURSE.STATUS_UPDATED, UpdateCourseStatusResDTO)
  updateCourseStatus(
    @Param('id', ParseIntPipe) id: number,
    @ActiveUser('userId') userId: number,
    @Body() body: UpdateCourseStatusDTO,
  ) {
    return this.courseService.updateCourseStatus(userId, id, body)
  }
}
