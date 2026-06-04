import { Controller, Get, HttpCode, HttpStatus, Param, ParseIntPipe, Query } from '@nestjs/common'
import { ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger'
import { ZodSerializerDto } from 'nestjs-zod'

import { LessonService } from './lesson.service'
import { Auth } from 'src/shared/decorator/auth.decorator'
import { ActiveUser } from 'src/shared/decorator/active-user.decorator'
import { AuthTypes, ConditionGuard } from 'src/shared/constants/auth.constant'

import { ListLessonsStudyQueryDTO, ListLessonsStudyResDTO, LessonStudyDetailDTO } from './dto/lesson.dto'
import { ApiStandardResponses } from 'src/shared/decorator/api-standard-response'
import { HttpStatusCode } from 'src/shared/swagger/swagger.interface'
import { RESPONSE_MESSAGES } from 'src/shared/constants/swagger.constant'
import { ListLessonQuizQueryDTO, ListLessonQuizResDTO } from './dto/lesson.dto'
@ApiTags('Lesson - Study')
@Controller('study')
export class LessonStudyController {
  constructor(private readonly lessonService: LessonService) {}

  /**
   * Get paginated lessons of a module for the study page.
   *
   * - Requires authenticated user (Bearer/API key).
   * - User must be enrolled in the course that owns this module (checked in repository).
   *
   * @param courseId - ID of the course (from route)
   * @param moduleId - ID of the module (from route)
   * @param userId - ID of the authenticated learner
   * @param query - Pagination params (skip, take)
   */
  @Auth([AuthTypes.BEARER, AuthTypes.APIKey], { condition: ConditionGuard.OR })
  @Get('modules/:moduleId/lessons')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Study - List lessons in module',
    description: 'Return lessons of a module for the study page, including completion status of each lesson.',
  })
  @ApiParam({ name: 'courseId', type: Number, description: 'Course ID' })
  @ApiParam({ name: 'moduleId', type: Number, description: 'Module ID' })
  @ZodSerializerDto(ListLessonsStudyResDTO)
  @ApiStandardResponses(HttpStatusCode.OK, RESPONSE_MESSAGES.LESSON.LIST, ListLessonsStudyResDTO)
  listLessonsForStudy(
    @Param('moduleId', ParseIntPipe) moduleId: number,
    @ActiveUser('userId') userId: number,
    @Query() query: ListLessonsStudyQueryDTO,
  ) {
    return this.lessonService.listLessonsForStudy(userId, moduleId, query)
  }

  /**
   * Get detailed lesson info for the study page.
   *
   * - Requires authenticated user (Bearer/API key).
   * - User must be enrolled in the course that owns this lesson.
   *
   * @param courseId - ID of the course (from route, for RESTful path)
   * @param lessonId - ID of the lesson to fetch
   */
  @Auth([AuthTypes.BEARER, AuthTypes.APIKey], { condition: ConditionGuard.OR })
  @Get('lessons/:lessonId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Study - Get lesson detail',
    description: 'Return lesson detail for the study page, including completion status and basic metadata.',
  })
  @ApiParam({ name: 'lessonId', type: Number, description: 'Lesson ID' })
  @ZodSerializerDto(LessonStudyDetailDTO)
  @ApiStandardResponses(HttpStatusCode.OK, RESPONSE_MESSAGES.SUCCESS.RETRIEVED, LessonStudyDetailDTO)
  getLessonDetailForStudy(@Param('lessonId', ParseIntPipe) lessonId: number, @ActiveUser('userId') userId: number) {
    return this.lessonService.getLessonDetailForStudy(userId, lessonId)
  }

  /**
   * - Requires authentication via **Bearer token** or **API Key**.
   * - Student must be enrolled in the course containing the lesson.
   * - Returns only published and non-deleted quizzes.
   * - Supports pagination via query parameters.
   * - Each quiz may include the student's latest quiz attempt (if available).
   *
   * @param lessonId - ID of the lesson (from route parameter)
   * @param userId - ID of the authenticated user
   * @param query - Pagination parameters (`skip`, `take`)
   * @returns Paginated quizzes of the lesson for study view
   */
  @Auth([AuthTypes.BEARER, AuthTypes.APIKey], { condition: ConditionGuard.OR })
  @Get('lessons/:lessonId/quizzes')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Study - List quizzes of a lesson',
    description: 'Return quizzes of a lesson for the study page. Student must be enrolled in the course.',
  })
  @ApiParam({ name: 'lessonId', type: Number, description: 'Lesson ID' })
  @ZodSerializerDto(ListLessonQuizResDTO)
  @ApiStandardResponses(HttpStatusCode.OK, RESPONSE_MESSAGES.QUIZ.LIST, ListLessonQuizResDTO)
  listLessonQuizzesForStudy(
    @Param('lessonId', ParseIntPipe) lessonId: number,
    @ActiveUser('userId') userId: number,
    @Query() query: ListLessonQuizQueryDTO,
  ) {
    return this.lessonService.listLessonQuizzesForStudy(userId, lessonId, query)
  }
}
