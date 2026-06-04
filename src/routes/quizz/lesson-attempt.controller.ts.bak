import { Auth } from 'src/shared/decorator/auth.decorator'
import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post } from '@nestjs/common'
import { ActiveUser } from 'src/shared/decorator/active-user.decorator'
import { AuthTypes, ConditionGuard } from 'src/shared/constants/auth.constant'
import { ZodSerializerDto } from 'nestjs-zod'

import { QuizAttemptService } from './attempt.service'
import { AttemptContext } from './attempt.repo'

import {
  LessonQuizAttemptPathParamsDTO,
  QuizAttemptFullResDTO,
  SubmitQuizAttemptDTO,
  SubmitQuizAttemptResDTO,
} from './dto/quizz.dto'

import { QuizAttemptFullResSchema, SubmitQuizAttemptInputSchema, SubmitQuizAttemptResSchema } from './quiz.model'

import { ApiBody, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger'
import { ApiStandardResponses } from 'src/shared/decorator/api-standard-response'
import { HttpStatusCode } from 'src/shared/swagger/swagger.interface'
import { RESPONSE_MESSAGES } from 'src/shared/constants/swagger.constant'

@ApiTags('Lesson Quiz Attempt')
@Auth([AuthTypes.BEARER, AuthTypes.APIKey], { condition: ConditionGuard.OR })
@Controller('courses/:courseId/lessons/:lessonId/quizzes/:quizId/attempt')
export class LessonAttemptController {
  constructor(private readonly service: QuizAttemptService) {}

  /**
   * Get lesson-level quiz for attempt.
   *
   * - Validates authentication and user context.
   * - Builds an `AttemptContext` from path parameters and active user.
   * - Returns full quiz data including questions and answer options.
   * - Response is validated and serialized using Zod schema.
   *
   * @param userId - ID of the authenticated user
   * @param params - Path parameters containing `courseId`, `lessonId`, and `quizId`
   * @returns Full quiz attempt data, typed as `QuizAttemptFullResDTO`
   */
  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get lesson-level quiz for attempt',
    description: 'Returns a full quiz (questions and options) for a lesson-level quiz attempt.',
  })
  @ApiParam({ name: 'courseId', type: Number, required: true })
  @ApiParam({ name: 'lessonId', type: Number, required: true })
  @ApiParam({ name: 'quizId', type: Number, required: true })
  @ZodSerializerDto(QuizAttemptFullResDTO)
  @ApiStandardResponses(HttpStatusCode.OK, RESPONSE_MESSAGES.QUIZ_ATTEMPT.DETAIL, QuizAttemptFullResDTO)
  getLessonQuizForAttempt(@ActiveUser('userId') userId: number, @Param() params: LessonQuizAttemptPathParamsDTO) {
    const ctx: AttemptContext = { userId, ...params }
    return this.service.getLessonQuizForAttempt(ctx).then(QuizAttemptFullResSchema.parse)
  }

  /**
   * Submit lesson-level quiz attempt.
   *
   * - Validates authentication and user context.
   * - Builds an `AttemptContext` from path parameters and active user.
   * - Validates request body using Zod input schema.
   * - Submits quiz answers, calculates score, and persists the attempt.
   * - Response is validated and serialized using Zod schema.
   *
   * @param userId - ID of the authenticated user
   * @param params - Path parameters containing `courseId`, `lessonId`, and `quizId`
   * @param body - Submitted quiz answers
   * @returns Quiz attempt result, typed as `SubmitQuizAttemptResDTO`
   */

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Submit lesson-level quiz attempt',
    description: 'Submits all answers for a lesson-level quiz, computes score, and stores the attempt in DB.',
  })
  @ApiParam({ name: 'courseId', type: Number, required: true })
  @ApiParam({ name: 'lessonId', type: Number, required: true })
  @ApiParam({ name: 'quizId', type: Number, required: true })
  @ApiBody({ type: SubmitQuizAttemptDTO })
  @ZodSerializerDto(SubmitQuizAttemptResDTO)
  @ApiStandardResponses(HttpStatusCode.CREATED, RESPONSE_MESSAGES.QUIZ_ATTEMPT.SUBMITTED, SubmitQuizAttemptResDTO)
  async submitLessonAttempt(
    @ActiveUser('userId') userId: number,
    @Param() params: LessonQuizAttemptPathParamsDTO,
    @Body() body: SubmitQuizAttemptDTO,
  ) {
    const ctx: AttemptContext = { userId, ...params }
    const payload = SubmitQuizAttemptInputSchema.parse(body)
    const result = await this.service.submitLessonAttempt(ctx, payload)
    return SubmitQuizAttemptResSchema.parse(result)
  }
}
