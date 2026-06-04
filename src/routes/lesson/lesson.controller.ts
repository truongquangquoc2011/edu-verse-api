import { Auth } from 'src/shared/decorator/auth.decorator'
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
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common'
import { LessonService } from './lesson.service'
import { ActiveUser } from 'src/shared/decorator/active-user.decorator'
import {
  AddVideoLinkDTO,
  CreateLessonDTO,
  CreateLessonResDTO,
  CreateLessonsDTO,
  ListLessonsQueryDTO,
  ListLessonsResDTO,
  UpdateLessonDTO,
  UpdateLessonResDTO,
} from './dto/lesson.dto'
import { ZodSerializerDto } from 'nestjs-zod'
import { MessageResDTO } from 'src/shared/dto/response.dto'
import { AuthTypes, ConditionGuard } from 'src/shared/constants/auth.constant'
import { FileInterceptor } from '@nestjs/platform-express'
import { NoFileProvidedException } from 'src/shared/constants/file-error.constant'
import { CloudinaryService } from 'src/shared/services/cloudinary.service'
import { PdfUploadInterceptor } from 'src/interceptors/pdf-upload.interceptor'
import { ApiStandardResponses } from 'src/shared/decorator/api-standard-response'
import { ApiBody, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger'
import { HttpStatusCode } from 'src/shared/swagger/swagger.interface'
import { RESPONSE_MESSAGES } from 'src/shared/constants/swagger.constant'

@ApiTags('Lesson')
@Controller('course/:courseId/builder/modules/:moduleId/lessons')
export class LessonController {
  constructor(
    private readonly service: LessonService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  /**
   * API endpoint to create one or multiple lessons in a module.
   *
   * - Requires authentication via Bearer token or API Key (OR condition).
   * - Access restricted to sellers only (`@RequireSellerRole` guard).
   * - Returns HTTP 201 (Created) on success.
   * - The response is serialized using `CreateLessonResDTO`.
   *
   * @param userId - ID of the authenticated user creating the lessons (injected via `@ActiveUser` decorator)
   * @param moduleId - ID of the module to which the lessons belong (from route parameter)
   * @param body - Lesson creation payload validated by `CreateLessonsDTO`
   * @returns The created lessons data, typed as `CreateLessonResDTO`
   */
  @Auth([AuthTypes.BEARER, AuthTypes.APIKey], { condition: ConditionGuard.OR })
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create lessons',
    description: 'Create one or multiple lessons in a module. Requires authentication via Bearer or API key.',
  })
  @ApiParam({ name: 'courseId', type: Number, description: 'Course ID' })
  @ApiParam({ name: 'moduleId', type: Number, description: 'Module ID' })
  @ApiBody({ type: CreateLessonsDTO })
  @ZodSerializerDto(CreateLessonResDTO)
  @ApiStandardResponses(HttpStatusCode.CREATED, RESPONSE_MESSAGES.LESSON.CREATED, CreateLessonResDTO)
  createLesson(
    @ActiveUser('userId') userId: number,
    @Param('moduleId', ParseIntPipe) moduleId: number,
    @Body() body: CreateLessonsDTO,
  ) {
    return this.service.createLessons(userId, moduleId, body.lessons)
  }

  /**
   * API endpoint to update an existing lesson.
   *
   * - Requires authentication via Bearer token or API Key (OR condition).
   * - Access restricted to sellers only.
   * - Returns HTTP 200 (OK) on success.
   * - The response is serialized using `UpdateLessonResDTO`.
   *
   * @param lessonId - ID of the lesson to update (from route parameter)
   * @param userId - ID of the authenticated user performing the update
   * @param body - Lesson update payload validated by `UpdateLessonDTO`
   * @returns The updated lesson data, typed as `UpdateLessonResDTO`
   */
  @Auth([AuthTypes.BEARER, AuthTypes.APIKey], { condition: ConditionGuard.OR })
  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update lesson',
    description: 'Update an existing lesson. Requires authentication. Sellers only.',
  })
  @ApiParam({ name: 'courseId', type: Number })
  @ApiParam({ name: 'moduleId', type: Number })
  @ApiParam({ name: 'id', type: Number, description: 'Lesson ID' })
  @ApiBody({ type: UpdateLessonDTO })
  @ZodSerializerDto(UpdateLessonResDTO)
  @ApiStandardResponses(HttpStatusCode.OK, RESPONSE_MESSAGES.LESSON.UPDATED, UpdateLessonResDTO)
  updateLesson(
    @Param('id', ParseIntPipe) lessonId: number,
    @ActiveUser('userId') userId: number,
    @Body() body: UpdateLessonDTO,
  ) {
    return this.service.updateLesson(userId, lessonId, body)
  }

  /**
   * API endpoint to soft delete a lesson.
   *
   * - Requires authentication via Bearer token or API Key (OR condition).
   * - Access restricted to sellers only.
   * - Returns HTTP 200 (OK) on success with a confirmation message.
   *
   * @param lessonId - ID of the lesson to delete (from route parameter)
   * @param userId - ID of the authenticated user performing the delete
   * @returns A message response confirming deletion
   */
  @Auth([AuthTypes.BEARER, AuthTypes.APIKey], { condition: ConditionGuard.OR })
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Delete lesson',
    description: 'Soft delete a lesson by ID. Requires authentication.',
  })
  @ApiParam({ name: 'id', type: Number })
  @ZodSerializerDto(MessageResDTO)
  @ApiStandardResponses(HttpStatusCode.OK, RESPONSE_MESSAGES.LESSON.DELETED, MessageResDTO)
  deleteLesson(@Param('id', ParseIntPipe) lessonId: number, @ActiveUser('userId') userId: number) {
    return this.service.deleteLesson(userId, lessonId)
  }

  /**
   * API endpoint to restore a previously deleted lesson.
   *
   * - Requires authentication via Bearer token or API Key (OR condition).
   * - Access restricted to sellers only.
   * - Returns HTTP 200 (OK) on success with a confirmation message.
   *
   * @param lessonId - ID of the lesson to restore (from route parameter)
   * @param userId - ID of the authenticated user performing the restore
   * @returns A message response confirming restoration
   */
  @Auth([AuthTypes.BEARER, AuthTypes.APIKey], { condition: ConditionGuard.OR })
  @Patch(':id/restore')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Restore deleted lesson',
    description: 'Restore a previously deleted lesson. Requires authentication.',
  })
  @ApiParam({ name: 'id', type: Number })
  @ZodSerializerDto(MessageResDTO)
  @ApiStandardResponses(HttpStatusCode.OK, RESPONSE_MESSAGES.LESSON.RESTORED, MessageResDTO)
  restoreLesson(@Param('id', ParseIntPipe) lessonId: number, @ActiveUser('userId') userId: number) {
    return this.service.restoreLesson(userId, lessonId)
  }

  /**
   * API endpoint to list lessons of a module with optional filters/pagination.
   *
   * - Requires authentication via Bearer token or API Key (OR condition).
   * - Access restricted to sellers only.
   * - Returns HTTP 200 (OK) on success.
   * - The response is serialized using `ListLessonsResDTO`.
   *
   * @param moduleId - ID of the module whose lessons are being retrieved
   * @param userId - ID of the authenticated user performing the query
   * @param query - Optional query parameters validated by `ListLessonsQueryDTO`
   * @returns A paginated list of lessons, typed as `ListLessonsResDTO`
   */
  @Auth([AuthTypes.BEARER, AuthTypes.APIKey], { condition: ConditionGuard.OR })
  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'List lessons',
    description: 'List lessons under a specific module, with optional filters or pagination.',
  })
  @ApiParam({ name: 'moduleId', type: Number })
  @ZodSerializerDto(ListLessonsResDTO)
  @ApiStandardResponses(HttpStatusCode.OK, RESPONSE_MESSAGES.LESSON.LIST, ListLessonsResDTO)
  listLessons(
    @Param('moduleId', ParseIntPipe) moduleId: number,
    @ActiveUser('userId') userId: number,
    @Query() query: ListLessonsQueryDTO,
  ) {
    return this.service.listLessons(userId, moduleId, query)
  }

  /**
   * API endpoint to add or update the video link for a specific lesson.
   *
   * - Requires authentication via Bearer token or API Key (OR condition).
   * - Returns HTTP 200 (OK) on success.
   * - The response is serialized using `UpdateLessonResDTO`.
   *
   * @param lessonId - ID of the lesson being updated
   * @param userId - ID of the authenticated user performing the update
   * @param body - Payload containing the new video link, validated by `AddVideoLinkDTO`
   * @returns The updated lesson, typed as `UpdateLessonResDTO`
   */
  @Auth([AuthTypes.BEARER, AuthTypes.APIKey], { condition: ConditionGuard.OR })
  @Patch(':id/video')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Add or update lesson video link',
    description: 'Attach or update a video link for a specific lesson.',
  })
  @ApiParam({ name: 'id', type: Number, description: 'Lesson ID' })
  @ApiBody({ type: AddVideoLinkDTO })
  @ZodSerializerDto(UpdateLessonResDTO)
  @ApiStandardResponses(HttpStatusCode.OK, RESPONSE_MESSAGES.LESSON.VIDEO_ADDED, UpdateLessonResDTO)
  addVideoLink(
    @Param('id', ParseIntPipe) lessonId: number,
    @ActiveUser('userId') userId: number,
    @Body() body: AddVideoLinkDTO,
  ) {
    return this.service.addVideoLink(userId, lessonId, body)
  }

  /**
   * API endpoint to upload and attach a PDF document to a lesson.
   *
   * - Requires authentication via Bearer token or API Key (OR condition).
   * - Accepts a PDF file via multipart/form-data under the field name `file`.
   * - The file is uploaded to Cloudinary with `resource_type: raw`.
   * - Returns HTTP 200 (OK) on success.
   *
   * @param lessonId - ID of the lesson the PDF will be attached to
   * @param userId - ID of the authenticated user performing the upload
   * @param file - The uploaded PDF file (throws `NoFileProvidedException` if missing)
   * @returns An object containing a confirmation message and the updated `documentUrl`
   */
  @Auth([AuthTypes.BEARER, AuthTypes.APIKey], { condition: ConditionGuard.OR })
  @Post(':id/pdf')
  @UseInterceptors(PdfUploadInterceptor)
  @ApiOperation({
    summary: 'Upload PDF for lesson',
    description: 'Upload and attach a PDF document to a lesson. Requires authentication.',
  })
  @ApiParam({ name: 'id', type: Number, description: 'Lesson ID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'PDF file to upload',
        },
      },
      required: ['file'],
    },
  })
  @HttpCode(HttpStatus.OK)
  @ApiStandardResponses(HttpStatusCode.OK, RESPONSE_MESSAGES.LESSON.PDF_UPLOADED, UpdateLessonResDTO)
  async uploadPdf(
    @Param('id', ParseIntPipe) lessonId: number,
    @ActiveUser('userId') userId: number,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw NoFileProvidedException
    }

    const pdfUrl = await this.cloudinaryService.uploadPdf(file)
    return this.service.updateLessonPdf(userId, lessonId, pdfUrl)
  }
}
