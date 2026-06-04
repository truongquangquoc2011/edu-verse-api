import { Auth } from 'src/shared/decorator/auth.decorator'
import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query } from '@nestjs/common'
import { QuizzService } from './quizz.service'
import { ActiveUser } from 'src/shared/decorator/active-user.decorator'
import {
  CreateQuizDTO,
  CreateQuizResDTO,
  UpdateQuizDTO,
  UpdateQuizResDTO,
  ListQuizQueryDTO,
  ListQuizResDTO,
  QuizPathParamsDTO,
  QuizQuestionResDTO,
  CreateQuizQuestionDTO,
  ListQuizQuestionResDTO,
  ListQuizQuestionQueryDTO,
  UpdateQuizQuestionDTO,
  ReorderQuizQuestionDTO,
  QuizQuestionPathParamsDTO,
  QuizAnswerOptionResDTO,
  CreateQuizAnswerOptionDTO,
  ListQuizAnswerOptionResDTO,
  ListQuizAnswerOptionQueryDTO,
  QuizOptionPathParamsDTO,
  UpdateQuizAnswerOptionDTO,
  ReorderQuizAnswerOptionDTO,
} from './dto/quizz.dto'
import { ZodSerializerDto } from 'nestjs-zod'
import { MessageResDTO } from 'src/shared/dto/response.dto'
import { AuthTypes, ConditionGuard } from 'src/shared/constants/auth.constant'
import { QuizContext } from './quizz.repo'
import { ApiStandardResponses } from 'src/shared/decorator/api-standard-response'
import { HttpStatusCode } from 'src/shared/swagger/swagger.interface'
import { ApiBody, ApiOperation, ApiTags, ApiParam } from '@nestjs/swagger'
import { RESPONSE_MESSAGES } from 'src/shared/constants/swagger.constant'

@ApiTags('Quiz Builder')
@Controller('course/:courseId/builder/modules/:moduleId/lessons/:lessonId/quizzes')
export class QuizzController {
  constructor(private readonly service: QuizzService) {}
  // use context để gom param tránh DRy
  /**
   * API endpoint to create a quiz for a given lesson.
   *
   * - Requires authentication via Bearer token or API Key (OR condition).
   * - Returns HTTP 201 (Created) on success.
   * - The response is serialized using `CreateQuizResDTO`.
   *
   * @param userId - ID of the authenticated user creating the quiz
   * @param params - Path parameters including `courseId`, `moduleId`, `lessonId`
   * @param body - Quiz creation payload validated by `CreateQuizDTO`
   * @returns The created quiz, typed as `CreateQuizResDTO`
   */
  @Auth([AuthTypes.BEARER, AuthTypes.APIKey], { condition: ConditionGuard.OR })
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create quiz',
    description: 'Creates a new quiz within a lesson for the course builder.',
  })
  @ApiParam({ name: 'courseId', type: Number })
  @ApiParam({ name: 'moduleId', type: Number })
  @ApiParam({ name: 'lessonId', type: Number })
  @ApiBody({ type: CreateQuizDTO })
  @ZodSerializerDto(CreateQuizResDTO)
  @ApiStandardResponses(HttpStatusCode.CREATED, RESPONSE_MESSAGES.QUIZ.CREATED, CreateQuizResDTO)
  createQuiz(@ActiveUser('userId') userId: number, @Param() params: QuizPathParamsDTO, @Body() body: CreateQuizDTO) {
    const ctx: QuizContext = { userId, ...params }
    return this.service.createQuiz(ctx, body)
  }

  /**
   * API endpoint to update an existing quiz.
   *
   * - Requires authentication via Bearer token or API Key (OR condition).
   * - Returns HTTP 200 (OK) on success.
   * - The response is serialized using `UpdateQuizResDTO`.
   *
   * @param userId - ID of the authenticated user updating the quiz
   * @param params - Path parameters including `courseId`, `moduleId`, `lessonId`, `quizId`
   * @param body - Quiz update payload validated by `UpdateQuizDTO`
   * @returns The updated quiz, typed as `UpdateQuizResDTO`
   */
  @Auth([AuthTypes.BEARER, AuthTypes.APIKey], { condition: ConditionGuard.OR })
  @Patch(':quizId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update quiz', description: 'Update an existing quiz by ID.' })
  @ApiParam({ name: 'quizId', type: Number })
  @ApiBody({ type: UpdateQuizDTO })
  @ZodSerializerDto(UpdateQuizResDTO)
  @ApiStandardResponses(HttpStatusCode.OK, RESPONSE_MESSAGES.QUIZ.UPDATED, UpdateQuizResDTO)
  updateQuiz(@ActiveUser('userId') userId: number, @Param() params: QuizPathParamsDTO, @Body() body: UpdateQuizDTO) {
    const ctx: QuizContext = { userId, ...params }
    return this.service.updateQuiz(ctx, body)
  }

  /**
   * API endpoint to soft delete a quiz.
   *
   * - Requires authentication via Bearer token or API Key (OR condition).
   * - Performs a soft delete by setting `deletedAt` instead of removing from DB.
   * - Returns HTTP 200 (OK) on success with a confirmation message.
   *
   * @param userId - ID of the authenticated user deleting the quiz
   * @param params - Path parameters including `courseId`, `moduleId`, `lessonId`, `quizId`
   * @returns A confirmation message, typed as `MessageResDTO`
   */
  @Auth([AuthTypes.BEARER, AuthTypes.APIKey], { condition: ConditionGuard.OR })
  @Delete(':quizId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete quiz', description: 'Soft deletes a quiz.' })
  @ZodSerializerDto(MessageResDTO)
  @ApiStandardResponses(HttpStatusCode.OK, RESPONSE_MESSAGES.QUIZ.DELETED, MessageResDTO)
  deleteQuiz(@ActiveUser('userId') userId: number, @Param() params: QuizPathParamsDTO) {
    const ctx: QuizContext = { userId, ...params }
    return this.service.deleteQuiz(ctx)
  }

  /**
   * API endpoint to restore a soft-deleted quiz.
   *
   * - Requires authentication via Bearer token or API Key (OR condition).
   * - Restores quiz by setting `deletedAt` to null.
   * - Returns HTTP 200 (OK) on success with a confirmation message.
   *
   * @param userId - ID of the authenticated user restoring the quiz
   * @param params - Path parameters including `courseId`, `moduleId`, `lessonId`, `quizId`
   * @returns A confirmation message, typed as `MessageResDTO`
   */
  @Auth([AuthTypes.BEARER, AuthTypes.APIKey], { condition: ConditionGuard.OR })
  @Patch(':quizId/restore')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Restore quiz', description: 'Restores a soft-deleted quiz.' })
  @ZodSerializerDto(MessageResDTO)
  @ApiStandardResponses(HttpStatusCode.OK, RESPONSE_MESSAGES.QUIZ.RESTORED, MessageResDTO)
  restoreQuiz(@ActiveUser('userId') userId: number, @Param() params: QuizPathParamsDTO) {
    const ctx: QuizContext = { userId, ...params }
    return this.service.restoreQuiz(ctx)
  }

  /**
   * API endpoint to list quizzes of a lesson with pagination.
   *
   * - Requires authentication via Bearer token or API Key (OR condition).
   * - Supports `skip`/`take` pagination via query parameters.
   * - Returns HTTP 200 (OK) on success.
   * - The response is serialized using `ListQuizResDTO`.
   *
   * @param userId - ID of the authenticated user fetching quizzes
   * @param params - Path parameters including `courseId`, `moduleId`, `lessonId`
   * @param query - Pagination query validated by `ListQuizQueryDTO`
   * @returns A paginated list of quizzes, typed as `ListQuizResDTO`
   */
  @Auth([AuthTypes.BEARER, AuthTypes.APIKey], { condition: ConditionGuard.OR })
  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'List quizzes',
    description: 'Lists quizzes of a specific lesson with pagination.',
  })
  @ZodSerializerDto(ListQuizResDTO)
  @ApiStandardResponses(HttpStatusCode.OK, RESPONSE_MESSAGES.QUIZ.LISTED, ListQuizResDTO)
  listQuizzes(
    @ActiveUser('userId') userId: number,
    @Param() params: QuizPathParamsDTO,
    @Query() query: ListQuizQueryDTO,
  ) {
    const ctx: QuizContext = { userId, ...params }
    return this.service.listQuizzes(ctx, query) // before return this.service.listQuizzes(userId, courseId, moduleId, lessonId, query)
  }

  // ================== QUIZ QUESTIONS ==================

  /**
   * API endpoint to create a new question for a quiz.
   *
   * - Requires authentication via Bearer token or API Key (OR condition).
   * - Validates request body using `CreateQuizQuestionDTO`.
   * - Returns HTTP 201 (Created) on success.
   * - The response is serialized using `QuizQuestionResDTO`.
   *
   * @param userId - ID of the authenticated user creating the question
   * @param params - Path parameters including `courseId`, `moduleId`, `lessonId`, `quizId`
   * @param body - Quiz question creation payload validated by `CreateQuizQuestionDTO`
   * @returns The created quiz question, typed as `QuizQuestionResDTO`
   */
  @Auth([AuthTypes.BEARER, AuthTypes.APIKey], { condition: ConditionGuard.OR })
  @Post(':quizId/questions')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create quiz question' })
  @ApiBody({ type: CreateQuizQuestionDTO })
  @ZodSerializerDto(QuizQuestionResDTO)
  @ApiStandardResponses(HttpStatusCode.CREATED, RESPONSE_MESSAGES.QUIZ.QUESTION_CREATED, QuizQuestionResDTO)
  createQuestion(
    @ActiveUser('userId') userId: number,
    @Param() params: QuizPathParamsDTO,
    @Body() body: CreateQuizQuestionDTO,
  ) {
    const ctx: QuizContext = { userId, ...params }
    return this.service.createQuestion(ctx, body)
  }

  /**
   * API endpoint to list all questions of a quiz with pagination.
   *
   * - Requires authentication via Bearer token or API Key (OR condition).
   * - Supports `skip`/`take` pagination via query parameters.
   * - Returns HTTP 200 (OK) on success.
   * - The response is serialized using `ListQuizQuestionResDTO`.
   *
   * @param userId - ID of the authenticated user fetching quiz questions
   * @param params - Path parameters including `courseId`, `moduleId`, `lessonId`, `quizId`
   * @param query - Pagination query validated by `ListQuizQuestionQueryDTO`
   * @returns A paginated list of quiz questions, typed as `ListQuizQuestionResDTO`
   */
  @Auth([AuthTypes.BEARER, AuthTypes.APIKey], { condition: ConditionGuard.OR })
  @Get(':quizId/questions')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List quiz questions' })
  @ZodSerializerDto(ListQuizQuestionResDTO)
  @ApiStandardResponses(HttpStatusCode.OK, RESPONSE_MESSAGES.QUIZ.QUESTION_LISTED, ListQuizQuestionResDTO)
  listQuestions(
    @ActiveUser('userId') userId: number,
    @Param() params: QuizPathParamsDTO,
    @Query() query: ListQuizQuestionQueryDTO,
  ) {
    const ctx: QuizContext = { userId, ...params }
    return this.service.listQuestions(ctx, query)
  }

  /**
   * API endpoint to update a quiz question.
   *
   * - Requires authentication via Bearer token or API Key (OR condition).
   * - Validates request body using `UpdateQuizQuestionDTO`.
   * - Returns HTTP 200 (OK) on success.
   * - The response is serialized using `QuizQuestionResDTO`.
   *
   * @param userId - ID of the authenticated user updating the question
   * @param params - Path parameters including `courseId`, `moduleId`, `lessonId`, `quizId`, `questionId`
   * @param body - Quiz question update payload validated by `UpdateQuizQuestionDTO`
   * @returns The updated quiz question, typed as `QuizQuestionResDTO`
   */
  @Auth([AuthTypes.BEARER, AuthTypes.APIKey], { condition: ConditionGuard.OR })
  @Patch(':quizId/questions/:questionId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update quiz question' })
  @ApiBody({ type: UpdateQuizQuestionDTO })
  @ZodSerializerDto(QuizQuestionResDTO)
  @ApiStandardResponses(HttpStatusCode.OK, RESPONSE_MESSAGES.QUIZ.QUESTION_UPDATED, QuizQuestionResDTO)
  updateQuestion(
    @ActiveUser('userId') userId: number,
    @Param() params: QuizQuestionPathParamsDTO,
    @Body() body: UpdateQuizQuestionDTO,
  ) {
    const ctx: QuizContext = { userId, ...params }
    return this.service.updateQuestion(ctx, body)
  }

  /**
   * API endpoint to reorder a quiz question within a quiz.
   *
   * - Requires authentication via Bearer token or API Key (OR condition).
   * - Validates request body using `ReorderQuizQuestionDTO`.
   * - Returns HTTP 200 (OK) on success.
   * - The response is serialized using `QuizQuestionResDTO`.
   *
   * @param userId - ID of the authenticated user reordering the question
   * @param params - Path parameters including `courseId`, `moduleId`, `lessonId`, `quizId`, `questionId`
   * @param body - Reorder payload containing new order, validated by `ReorderQuizQuestionDTO`
   * @returns The reordered quiz question, typed as `QuizQuestionResDTO`
   */
  @Auth([AuthTypes.BEARER, AuthTypes.APIKey], { condition: ConditionGuard.OR })
  @Patch(':quizId/questions/:questionId/reorder')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reorder quiz question' })
  @ApiBody({ type: ReorderQuizQuestionDTO })
  @ZodSerializerDto(QuizQuestionResDTO)
  @ApiStandardResponses(HttpStatusCode.OK, RESPONSE_MESSAGES.QUIZ.QUESTION_REORDERED, QuizQuestionResDTO)
  reorderQuestion(
    @ActiveUser('userId') userId: number,
    @Param() params: QuizQuestionPathParamsDTO,
    @Body() body: ReorderQuizQuestionDTO,
  ) {
    const ctx: QuizContext = { userId, ...params }
    return this.service.reorderQuestion(ctx, body)
  }

  /**
   * API endpoint to soft delete a quiz question.
   *
   * - Requires authentication via Bearer token or API Key (OR condition).
   * - Performs a soft delete by setting `deletedAt` instead of removing from DB.
   * - Returns HTTP 200 (OK) on success with a confirmation message.
   * - The response is serialized using `MessageResDTO`.
   *
   * @param userId - ID of the authenticated user deleting the question
   * @param params - Path parameters including `courseId`, `moduleId`, `lessonId`, `quizId`, `questionId`
   * @returns A confirmation message, typed as `MessageResDTO`
   */
  @Auth([AuthTypes.BEARER, AuthTypes.APIKey], { condition: ConditionGuard.OR })
  @Delete(':quizId/questions/:questionId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete quiz question' })
  @ZodSerializerDto(MessageResDTO)
  @ApiStandardResponses(HttpStatusCode.OK, RESPONSE_MESSAGES.QUIZ.QUESTION_DELETED, MessageResDTO)
  deleteQuestion(@ActiveUser('userId') userId: number, @Param() params: QuizPathParamsDTO) {
    const ctx: QuizContext = { userId, ...params }
    return this.service.deleteQuestion(ctx)
  }

  /**
   * API endpoint to restore a soft-deleted quiz question.
   *
   * - Requires authentication via Bearer token or API Key (OR condition).
   * - Restores a question by setting `deletedAt` to null.
   * - Returns HTTP 200 (OK) on success with a confirmation message.
   * - The response is serialized using `MessageResDTO`.
   *
   * @param userId - ID of the authenticated user restoring the question
   * @param params - Path parameters including `courseId`, `moduleId`, `lessonId`, `quizId`, `questionId`
   * @returns A confirmation message, typed as `MessageResDTO`
   */
  @Auth([AuthTypes.BEARER, AuthTypes.APIKey], { condition: ConditionGuard.OR })
  @Patch(':quizId/questions/:questionId/restore')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Restore quiz question' })
  @ZodSerializerDto(MessageResDTO)
  @ApiStandardResponses(HttpStatusCode.OK, RESPONSE_MESSAGES.QUIZ.QUESTION_RESTORED, MessageResDTO)
  restoreQuestion(@ActiveUser('userId') userId: number, @Param() params: QuizPathParamsDTO) {
    const ctx: QuizContext = { userId, ...params }
    return this.service.restoreQuestion(ctx)
  }

  //QUIZ ANSWER OPTIONS

  /**
   * API endpoint to create a new answer option for a quiz question.
   *
   * - Requires authentication via Bearer token or API Key (OR condition).
   * - Validates request body using `CreateQuizAnswerOptionDTO`.
   * - Returns HTTP 201 (Created) on success.
   * - The response is serialized using `QuizAnswerOptionResDTO`.
   *
   * @param userId - ID of the authenticated user creating the option
   * @param params - Path parameters including `quizId` and `questionId`
   * @param body - Creation payload validated by `CreateQuizAnswerOptionDTO`
   * @returns The created quiz answer option, typed as `QuizAnswerOptionResDTO`
   */
  @Auth([AuthTypes.BEARER, AuthTypes.APIKey], { condition: ConditionGuard.OR })
  @Post(':quizId/questions/:questionId/options')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create answer option' })
  @ApiBody({ type: CreateQuizAnswerOptionDTO })
  @ZodSerializerDto(QuizAnswerOptionResDTO)
  @ApiStandardResponses(HttpStatusCode.CREATED, RESPONSE_MESSAGES.QUIZ.OPTION_CREATED, QuizAnswerOptionResDTO)
  createOption(
    @ActiveUser('userId') userId: number,
    @Param() params: QuizQuestionPathParamsDTO,
    @Body() body: CreateQuizAnswerOptionDTO,
  ) {
    const ctx: QuizContext = { userId, ...params }
    return this.service.createOption(ctx, body)
  }

  /**
   * API endpoint to list all answer options for a quiz question.
   *
   * - Requires authentication via Bearer token or API Key (OR condition).
   * - Supports pagination and query validation via `ListQuizAnswerOptionQueryDTO`.
   * - Returns HTTP 200 (OK) on success.
   * - The response is serialized using `ListQuizAnswerOptionResDTO`.
   *
   * @param userId - ID of the authenticated user listing the options
   * @param params - Path parameters including `quizId` and `questionId`
   * @param query - Query parameters for pagination (`skip`, `take`)
   * @returns Paginated list of quiz answer options, typed as `ListQuizAnswerOptionResDTO`
   */
  @Auth([AuthTypes.BEARER, AuthTypes.APIKey], { condition: ConditionGuard.OR })
  @Get(':quizId/questions/:questionId/options')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List answer options' })
  @ZodSerializerDto(ListQuizAnswerOptionResDTO)
  @ApiStandardResponses(HttpStatusCode.OK, RESPONSE_MESSAGES.QUIZ.OPTION_LISTED, ListQuizAnswerOptionResDTO)
  listOptions(
    @ActiveUser('userId') userId: number,
    @Param() params: QuizQuestionPathParamsDTO,
    @Query() query: ListQuizAnswerOptionQueryDTO,
  ) {
    const ctx: QuizContext = { userId, ...params }
    return this.service.listOptions(ctx, query)
  }

  /**
   * API endpoint to update an existing answer option.
   *
   * - Requires authentication via Bearer token or API Key (OR condition).
   * - Validates request body using `UpdateQuizAnswerOptionDTO`.
   * - Returns HTTP 200 (OK) on success.
   * - The response is serialized using `QuizAnswerOptionResDTO`.
   *
   * @param userId - ID of the authenticated user updating the option
   * @param params - Path parameters including `quizId`, `questionId`, and `optionId`
   * @param body - Update payload validated by `UpdateQuizAnswerOptionDTO`
   * @returns The updated quiz answer option, typed as `QuizAnswerOptionResDTO`
   */
  @Auth([AuthTypes.BEARER, AuthTypes.APIKey], { condition: ConditionGuard.OR })
  @Patch(':quizId/questions/:questionId/options/:optionId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update answer option' })
  @ApiBody({ type: UpdateQuizAnswerOptionDTO })
  @ZodSerializerDto(QuizAnswerOptionResDTO)
  @ApiStandardResponses(HttpStatusCode.OK, RESPONSE_MESSAGES.QUIZ.OPTION_UPDATED, QuizAnswerOptionResDTO)
  updateOption(
    @ActiveUser('userId') userId: number,
    @Param() params: QuizOptionPathParamsDTO,
    @Body() body: UpdateQuizAnswerOptionDTO,
  ) {
    const ctx: QuizContext = { userId, ...params }
    return this.service.updateOption(ctx, body)
  }

  /**
   * API endpoint to reorder an answer option within a quiz question.
   *
   * - Requires authentication via Bearer token or API Key (OR condition).
   * - Validates request body using `ReorderQuizAnswerOptionDTO`.
   * - Returns HTTP 200 (OK) on success.
   * - The response is serialized using `QuizAnswerOptionResDTO`.
   *
   * @param userId - ID of the authenticated user reordering the option
   * @param params - Path parameters including `quizId`, `questionId`, and `optionId`
   * @param body - Reorder payload validated by `ReorderQuizAnswerOptionDTO`
   * @returns The reordered quiz answer option, typed as `QuizAnswerOptionResDTO`
   */
  @Auth([AuthTypes.BEARER, AuthTypes.APIKey], { condition: ConditionGuard.OR })
  @Patch(':quizId/questions/:questionId/options/:optionId/reorder')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reorder answer option' })
  @ApiBody({ type: ReorderQuizAnswerOptionDTO })
  @ZodSerializerDto(QuizAnswerOptionResDTO)
  @ApiStandardResponses(HttpStatusCode.OK, RESPONSE_MESSAGES.QUIZ.OPTION_REORDERED, QuizAnswerOptionResDTO)
  reorderOption(
    @ActiveUser('userId') userId: number,
    @Param() params: QuizOptionPathParamsDTO,
    @Body() body: ReorderQuizAnswerOptionDTO,
  ) {
    const ctx: QuizContext = { userId, ...params }
    return this.service.reorderOption(ctx, body)
  }

  /**
   * API endpoint to soft delete a quiz answer option.
   *
   * - Requires authentication via Bearer token or API Key (OR condition).
   * - Returns HTTP 200 (OK) on success.
   * - The response is serialized using `MessageResDTO`.
   *
   * @param userId - ID of the authenticated user deleting the option
   * @param params - Path parameters including `quizId`, `questionId`, and `optionId`
   * @returns A success message, typed as `MessageResDTO`
   */
  @Auth([AuthTypes.BEARER, AuthTypes.APIKey], { condition: ConditionGuard.OR })
  @Delete(':quizId/questions/:questionId/options/:optionId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete answer option' })
  @ZodSerializerDto(MessageResDTO)
  @ApiStandardResponses(HttpStatusCode.OK, RESPONSE_MESSAGES.QUIZ.OPTION_DELETED, MessageResDTO)
  deleteOption(@ActiveUser('userId') userId: number, @Param() params: QuizOptionPathParamsDTO) {
    const ctx: QuizContext = { userId, ...params }
    return this.service.deleteOption(ctx)
  }

  /**
   * API endpoint to restore a previously soft-deleted quiz answer option.
   *
   * - Requires authentication via Bearer token or API Key (OR condition).
   * - Returns HTTP 200 (OK) on success.
   * - The response is serialized using `MessageResDTO`.
   *
   * @param userId - ID of the authenticated user restoring the option
   * @param params - Path parameters including `quizId`, `questionId`, and `optionId`
   * @returns A success message, typed as `MessageResDTO`
   */
  @Auth([AuthTypes.BEARER, AuthTypes.APIKey], { condition: ConditionGuard.OR })
  @Patch(':quizId/questions/:questionId/options/:optionId/restore')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Restore answer option' })
  @ZodSerializerDto(MessageResDTO)
  @ApiStandardResponses(HttpStatusCode.OK, RESPONSE_MESSAGES.QUIZ.OPTION_RESTORED, MessageResDTO)
  restoreOption(@ActiveUser('userId') userId: number, @Param() params: QuizOptionPathParamsDTO) {
    const ctx: QuizContext = { userId, ...params }
    return this.service.restoreOption(ctx)
  }
}
