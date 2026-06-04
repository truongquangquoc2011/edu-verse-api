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
import { ApiBody, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger'
import { ZodSerializerDto } from 'nestjs-zod'


import {
  CreateLessonNoteDTO,
  LessonNoteResDTO,
  ListLessonNotesQueryDTO,
  ListLessonNotesResDTO,
  PinLessonNoteDTO,
  UpdateLessonNoteDTO,
} from './dto/lesson-note.dto'

import { ActiveUser } from '../../shared/decorator/active-user.decorator'
import { Auth } from '../../shared/decorator/auth.decorator'
import { AuthTypes, ConditionGuard } from '../../shared/constants/auth.constant'
import { ApiStandardResponses } from '../../shared/decorator/api-standard-response'
import { HttpStatusCode } from '../../shared/swagger/swagger.interface'
import { RESPONSE_MESSAGES } from '../../shared/constants/swagger.constant'
import { MessageResDTO } from '../../shared/dto/response.dto'
import { LessonNoteService } from './lesson-note.service'

@ApiTags('Lesson Note')
@Controller()
export class LessonNoteController {
  constructor(private readonly service: LessonNoteService) {}

  /**
   * API endpoint to create a note for a lesson.
   *
   * - Requires authentication via Bearer token or API Key (OR condition).
   * - The authenticated user must have access to the target lesson.
   * - Each note is linked to a specific timestamp in the lesson video.
   * - Returns HTTP 201 (Created) on success.
   * - The response is serialized using `LessonNoteResDTO`.
   *
   * @param userId - ID of the authenticated user creating the note (injected via `@ActiveUser`)
   * @param lessonId - ID of the lesson where the note will be created
   * @param body - Lesson note creation payload validated by `CreateLessonNoteDTO`
   * @returns The created lesson note, typed as `LessonNoteResDTO`
   */
  @Auth([AuthTypes.BEARER, AuthTypes.APIKey], { condition: ConditionGuard.OR })
  @Post('lessons/:lessonId/notes')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create lesson note',
    description: 'Create a timestamped personal note for a lesson.',
  })
  @ApiParam({ name: 'lessonId', type: Number, description: 'Lesson ID' })
  @ApiBody({ type: CreateLessonNoteDTO })
  @ZodSerializerDto(LessonNoteResDTO)
  @ApiStandardResponses(HttpStatusCode.CREATED, RESPONSE_MESSAGES.LESSON_NOTE.CREATED, LessonNoteResDTO)
  createNote(
    @ActiveUser('userId') userId: number,
    @Param('lessonId', ParseIntPipe) lessonId: number,
    @Body() body: CreateLessonNoteDTO,
  ) {
    return this.service.createNote(userId, lessonId, body)
  }

  /**
   * API endpoint to list lesson notes of the authenticated user.
   *
   * - Requires authentication via Bearer token or API Key (OR condition).
   * - The authenticated user must have access to the target lesson.
   * - Returns only notes created by the current user.
   * - Notes are ordered by pinned status and timestamp.
   * - Supports pagination.
   * - The response is serialized using `ListLessonNotesResDTO`.
   *
   * @param userId - ID of the authenticated user requesting the note list
   * @param lessonId - ID of the lesson whose notes are being retrieved
   * @param query - Pagination query validated by `ListLessonNotesQueryDTO`
   * @returns Paginated lesson notes, typed as `ListLessonNotesResDTO`
   */
  @Auth([AuthTypes.BEARER, AuthTypes.APIKey], { condition: ConditionGuard.OR })
  @Get('lessons/:lessonId/notes')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'List lesson notes',
    description: 'Retrieve all personal notes of the authenticated user for a lesson.',
  })
  @ApiParam({ name: 'lessonId', type: Number, description: 'Lesson ID' })
  @ZodSerializerDto(ListLessonNotesResDTO)
  @ApiStandardResponses(HttpStatusCode.OK, RESPONSE_MESSAGES.LESSON_NOTE.LIST, ListLessonNotesResDTO)
  listNotes(
    @ActiveUser('userId') userId: number,
    @Param('lessonId', ParseIntPipe) lessonId: number,
    @Query() query: ListLessonNotesQueryDTO,
  ) {
    return this.service.listNotes(userId, lessonId, query)
  }

  /**
   * API endpoint to get detail of a lesson note.
   *
   * - Requires authentication via Bearer token or API Key (OR condition).
   * - Only the owner of the note can access it.
   * - Returns HTTP 200 (OK) on success.
   * - The response is serialized using `LessonNoteResDTO`.
   *
   * @param userId - ID of the authenticated user
   * @param noteId - ID of the lesson note
   * @returns Lesson note detail, typed as `LessonNoteResDTO`
   */
  @Auth([AuthTypes.BEARER, AuthTypes.APIKey], { condition: ConditionGuard.OR })
  @Get('notes/:noteId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get lesson note detail',
    description: 'Retrieve detail of a lesson note owned by the authenticated user.',
  })
  @ApiParam({ name: 'noteId', type: Number, description: 'Lesson note ID' })
  @ZodSerializerDto(LessonNoteResDTO)
  @ApiStandardResponses(HttpStatusCode.OK, RESPONSE_MESSAGES.LESSON_NOTE.DETAIL, LessonNoteResDTO)
  getNoteDetail(
    @ActiveUser('userId') userId: number,
    @Param('noteId', ParseIntPipe) noteId: number,
  ) {
    return this.service.getNoteDetail(userId, noteId)
  }

  /**
   * API endpoint to update an existing lesson note.
   *
   * - Requires authentication via Bearer token or API Key (OR condition).
   * - Only the owner of the note can update it.
   * - Allows updating content, timestamp, or pinned status.
   * - Returns HTTP 200 (OK) on success.
   * - The response is serialized using `LessonNoteResDTO`.
   *
   * @param userId - ID of the authenticated user updating the note
   * @param noteId - ID of the lesson note to update
   * @param body - Lesson note update payload validated by `UpdateLessonNoteDTO`
   * @returns Updated lesson note, typed as `LessonNoteResDTO`
   */
  @Auth([AuthTypes.BEARER, AuthTypes.APIKey], { condition: ConditionGuard.OR })
  @Patch('notes/:noteId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update lesson note',
    description: 'Update content, timestamp, or pinned status of a lesson note.',
  })
  @ApiParam({ name: 'noteId', type: Number, description: 'Lesson note ID' })
  @ApiBody({ type: UpdateLessonNoteDTO })
  @ZodSerializerDto(LessonNoteResDTO)
  @ApiStandardResponses(HttpStatusCode.OK, RESPONSE_MESSAGES.LESSON_NOTE.UPDATED, LessonNoteResDTO)
  updateNote(
    @ActiveUser('userId') userId: number,
    @Param('noteId', ParseIntPipe) noteId: number,
    @Body() body: UpdateLessonNoteDTO,
  ) {
    return this.service.updateNote(userId, noteId, body)
  }

  /**
   * API endpoint to pin or unpin a lesson note.
   *
   * - Requires authentication via Bearer token or API Key (OR condition).
   * - Only the owner of the note can modify the pinned status.
   * - Returns HTTP 200 (OK) on success.
   * - The response is serialized using `LessonNoteResDTO`.
   *
   * @param userId - ID of the authenticated user
   * @param noteId - ID of the lesson note
   * @param body - Pin payload validated by `PinLessonNoteDTO`
   * @returns Updated lesson note, typed as `LessonNoteResDTO`
   */
  @Auth([AuthTypes.BEARER, AuthTypes.APIKey], { condition: ConditionGuard.OR })
  @Patch('notes/:noteId/pin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Pin lesson note',
    description: 'Pin or unpin a lesson note.',
  })
  @ApiParam({ name: 'noteId', type: Number, description: 'Lesson note ID' })
  @ApiBody({ type: PinLessonNoteDTO })
  @ZodSerializerDto(LessonNoteResDTO)
  @ApiStandardResponses(HttpStatusCode.OK, RESPONSE_MESSAGES.LESSON_NOTE.PINNED, LessonNoteResDTO)
  pinNote(
    @ActiveUser('userId') userId: number,
    @Param('noteId', ParseIntPipe) noteId: number,
    @Body() body: PinLessonNoteDTO,
  ) {
    return this.service.pinNote(userId, noteId, body)
  }

  /**
   * API endpoint to soft delete a lesson note.
   *
   * - Requires authentication via Bearer token or API Key (OR condition).
   * - Only the owner of the note can delete it.
   * - Performs soft delete by marking the note as deleted.
   * - Returns HTTP 200 (OK) on success.
   *
   * @param userId - ID of the authenticated user deleting the note
   * @param noteId - ID of the lesson note to delete
   * @returns Confirmation message, typed as `MessageResDTO`
   */
  @Auth([AuthTypes.BEARER, AuthTypes.APIKey], { condition: ConditionGuard.OR })
  @Delete('notes/:noteId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Delete lesson note',
    description: 'Soft delete a lesson note owned by the authenticated user.',
  })
  @ApiParam({ name: 'noteId', type: Number, description: 'Lesson note ID' })
  @ZodSerializerDto(MessageResDTO)
  @ApiStandardResponses(HttpStatusCode.OK, RESPONSE_MESSAGES.LESSON_NOTE.DELETED, MessageResDTO)
  deleteNote(
    @ActiveUser('userId') userId: number,
    @Param('noteId', ParseIntPipe) noteId: number,
  ) {
    return this.service.deleteNote(userId, noteId)
  }
}