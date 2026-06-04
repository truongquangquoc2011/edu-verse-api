import { Auth } from 'src/shared/decorator/auth.decorator'
import { Body, Controller, Get, HttpCode, HttpStatus, Param, ParseIntPipe, Patch, Post, Query } from '@nestjs/common'
import { ActiveUser } from 'src/shared/decorator/active-user.decorator'
import { AuthTypes, ConditionGuard } from 'src/shared/constants/auth.constant'
import { ZodSerializerDto } from 'nestjs-zod'
import { MessageResDTO } from 'src/shared/dto/response.dto'

import { QuizAttemptService } from './attempt.service'
import { AttemptContext } from './attempt.repo'

import {
  QuizAttemptPathParamsDTO,
  ListQuizAttemptQueryDTO,
  QuizAttemptResDTO,
  ListQuizAttemptResDTO,
  SaveQuizAnswerDTO,
  QuizAttemptQuestionsResDTO,
} from './dto/quizz.dto'

import { QuizAttemptResponseSchema, QuizAttemptQuestionsResSchema, SaveQuizAnswerInputSchema } from './quiz.model'
import { ApiBody, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger'
import { ApiStandardResponses } from 'src/shared/decorator/api-standard-response'
import { HttpStatusCode } from 'src/shared/swagger/swagger.interface'
import { RESPONSE_MESSAGES } from 'src/shared/constants/swagger.constant'
@ApiTags('Quiz Attempt')
@Auth([AuthTypes.BEARER, AuthTypes.APIKey], { condition: ConditionGuard.OR })
@Controller('course/:courseId/modules/:moduleId/lessons/:lessonId/quizzes/:quizId/attempts')
export class AttemptController {
  constructor(private readonly service: QuizAttemptService) {}

  /**
   * Starts a new quiz attempt.
   * @param userId - Active user ID.
   * @param params - Quiz path parameters.
   * @returns Created quiz attempt.
   * @example await startAttempt(1, { courseId: 1, moduleId: 2, lessonId: 3, quizId: 4 });
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Start quiz attempt',
    description: 'Starts a new quiz attempt for the current user. Requires authentication via Bearer or API Key.',
  })
  @ApiParam({ name: 'courseId', type: Number, required: true })
  @ApiParam({ name: 'moduleId', type: Number, required: true })
  @ApiParam({ name: 'lessonId', type: Number, required: true })
  @ApiParam({ name: 'quizId', type: Number, required: true })
  @ZodSerializerDto(QuizAttemptResDTO)
  @ApiStandardResponses(HttpStatusCode.CREATED, RESPONSE_MESSAGES.QUIZ_ATTEMPT.CREATED, QuizAttemptResDTO)
  startAttempt(@ActiveUser('userId') userId: number, @Param() params: QuizAttemptPathParamsDTO) {
    const ctx: AttemptContext = { userId, ...params }
    return this.service.startAttempt(ctx).then(QuizAttemptResponseSchema.parse)
  }

  /**
   * Lists attempts for a quiz.
   * @param userId - Active user ID.
   * @param params - Quiz path parameters.
   * @param query - Pagination/sort filters.
   * @returns Paginated attempts.
   * @example await listAttemptsByQuiz(1, { courseId: 1, moduleId: 2, lessonId: 3, quizId: 4 }, { skip: 0, take: 10 });
   */
  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'List quiz attempts',
    description: 'List all quiz attempts of a user for a specific quiz, with pagination and filters.',
  })
  @ApiParam({ name: 'quizId', type: Number })
  @ZodSerializerDto(ListQuizAttemptResDTO)
  @ApiStandardResponses(HttpStatusCode.OK, RESPONSE_MESSAGES.QUIZ_ATTEMPT.LIST, ListQuizAttemptResDTO)
  listAttemptsByQuiz(
    @ActiveUser('userId') userId: number,
    @Param() params: QuizAttemptPathParamsDTO,
    @Query() query: ListQuizAttemptQueryDTO,
  ) {
    const ctx: AttemptContext = { userId, ...params }
    return this.service.listAttemptsByQuiz(ctx, query)
  }

  /**
   * Gets a specific attempt detail.
   * @param userId - Active user ID.
   * @param params - Quiz path parameters.
   * @param attemptId - Attempt ID.
   * @returns Attempt detail.
   * @example await getOne(1, { courseId: 1, moduleId: 2, lessonId: 3, quizId: 4 }, 22);
   */
  @Get(':attemptId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get quiz attempt detail',
    description: 'Retrieve a specific quiz attempt by ID for the current user.',
  })
  @ApiParam({ name: 'attemptId', type: Number, description: 'Attempt ID' })
  @ZodSerializerDto(QuizAttemptResDTO)
  @ApiStandardResponses(HttpStatusCode.OK, RESPONSE_MESSAGES.QUIZ_ATTEMPT.DETAIL, QuizAttemptResDTO)
  getOne(
    @ActiveUser('userId') userId: number,
    @Param() params: QuizAttemptPathParamsDTO,
    @Param('attemptId', ParseIntPipe) attemptId: number,
  ) {
    const ctx: AttemptContext = { userId, ...params, attemptId }
    return this.service.getAttempt(ctx)
  }

  /**
   * Retrieves attempt questions with selected answers.
   * @param userId - Active user ID.
   * @param params - Quiz path parameters.
   * @param attemptId - Attempt ID.
   * @returns Questions plus user's selections.
   * @example await getQuestions(1, { courseId: 1, moduleId: 2, lessonId: 3, quizId: 4 }, 22);
   */
  @Get(':attemptId/questions')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get attempt questions',
    description: 'Retrieve all questions for a given attempt along with the user’s selected answers.',
  })
  @ApiParam({ name: 'attemptId', type: Number, description: 'Attempt ID' })
  @ZodSerializerDto(QuizAttemptQuestionsResDTO)
  @ApiStandardResponses(HttpStatusCode.OK, RESPONSE_MESSAGES.QUIZ_ATTEMPT.QUESTIONS, QuizAttemptQuestionsResDTO)
  async getQuestions(
    @ActiveUser('userId') userId: number,
    @Param() params: QuizAttemptPathParamsDTO,
    @Param('attemptId', ParseIntPipe) attemptId: number,
  ) {
    const ctx: AttemptContext = { userId, ...params, attemptId }
    const items = await this.service.getAttemptQuestions(ctx)
    return QuizAttemptQuestionsResSchema.parse({ items })
  }

  /**
   * Saves (upserts) an answer for a question within an attempt.
   * @param userId - Active user ID.
   * @param params - Quiz path parameters.
   * @param attemptId - Attempt ID.
   * @param body - Answer payload.
   * @returns Confirmation message.
   * @example await saveAnswer(1, { courseId: 1, moduleId: 2, lessonId: 3, quizId: 4 }, 22, { questionId: 5, answerOptionId: 12 });
   */
  @Patch(':attemptId/answers')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Save or update quiz answer',
    description: 'Upserts (saves or updates) an answer for a specific question within an active attempt.',
  })
  @ApiParam({ name: 'attemptId', type: Number, description: 'Attempt ID' })
  @ApiBody({ type: SaveQuizAnswerDTO })
  @ZodSerializerDto(MessageResDTO)
  @ApiStandardResponses(HttpStatusCode.OK, RESPONSE_MESSAGES.QUIZ_ATTEMPT.ANSWER_SAVED, MessageResDTO)
  async saveAnswer(
    @ActiveUser('userId') userId: number,
    @Param() params: QuizAttemptPathParamsDTO,
    @Param('attemptId', ParseIntPipe) attemptId: number,
    @Body() body: SaveQuizAnswerDTO,
  ) {
    const ctx: AttemptContext = { userId, ...params, attemptId }
    const payload = SaveQuizAnswerInputSchema.parse(body)
    await this.service.saveAnswer(ctx, payload)
    return { message: 'Answer saved' }
  }

  /**
   * Submits an attempt and calculates the score.
   * @param userId - Active user ID.
   * @param params - Quiz path parameters.
   * @param attemptId - Attempt ID.
   * @returns Submitted attempt with score.
   * @example await submit(1, { courseId: 1, moduleId: 2, lessonId: 3, quizId: 4 }, 22);
   */
  @Patch(':attemptId/submit')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Submit quiz attempt',
    description: 'Finalize and submit the quiz attempt. Calculates the score and returns result.',
  })
  @ApiParam({ name: 'attemptId', type: Number, description: 'Attempt ID' })
  @ZodSerializerDto(QuizAttemptResDTO)
  @ApiStandardResponses(HttpStatusCode.OK, RESPONSE_MESSAGES.QUIZ_ATTEMPT.SUBMITTED, QuizAttemptResDTO)
  submit(
    @ActiveUser('userId') userId: number,
    @Param() params: QuizAttemptPathParamsDTO,
    @Param('attemptId', ParseIntPipe) attemptId: number,
  ) {
    const ctx: AttemptContext = { userId, ...params, attemptId }
    return this.service.submitAttempt(ctx).then(QuizAttemptResponseSchema.parse)
  }
}
