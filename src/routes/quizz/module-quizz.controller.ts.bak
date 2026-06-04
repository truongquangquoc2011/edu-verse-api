import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query } from '@nestjs/common'
import { ZodSerializerDto } from 'nestjs-zod'
import { Auth } from 'src/shared/decorator/auth.decorator'
import { ActiveUser } from 'src/shared/decorator/active-user.decorator'
import { AuthTypes, ConditionGuard } from 'src/shared/constants/auth.constant'
import { MessageResDTO } from 'src/shared/dto/response.dto'
import { QuizzService } from './quizz.service'
import {
  // Quiz (module-level)
  CreateQuizDTO,
  CreateQuizResDTO,
  UpdateQuizDTO,
  UpdateQuizResDTO,
  ListQuizQueryDTO,
  ListQuizResDTO,

  // Path params (module-level, no lessonId)
  ModuleQuizPathParamsDTO, // { courseId, moduleId }
  ModuleQuizIdPathParamsDTO, // { courseId, moduleId, quizId }

  // Questions
  QuizQuestionResDTO,
  CreateQuizQuestionDTO,
  ListQuizQuestionResDTO,
  ListQuizQuestionQueryDTO,
  UpdateQuizQuestionDTO,
  ReorderQuizQuestionDTO,
  ModuleQuizQuestionPathParamsDTO, // { courseId, moduleId, quizId, questionId? }

  // Options
  QuizAnswerOptionResDTO,
  CreateQuizAnswerOptionDTO,
  ListQuizAnswerOptionResDTO,
  ListQuizAnswerOptionQueryDTO,
  UpdateQuizAnswerOptionDTO,
  ReorderQuizAnswerOptionDTO,
  ModuleQuizOptionPathParamsDTO, // { courseId, moduleId, quizId, questionId, optionId? }
} from './dto/quizz.dto'
import { QuizContext } from './quizz.repo'

/**
 * Controller for module-level quizzes.
 * Base route: /courses/:courseId/builder/modules/:moduleId/quizzes
 * (No lessonId in the path; parent is the module.)
 */
@Auth([AuthTypes.BEARER, AuthTypes.APIKey], { condition: ConditionGuard.OR })
@Controller('courses/:courseId/builder/modules/:moduleId/quizzes')
export class ModuleQuizzController {
  constructor(private readonly service: QuizzService) {}

  // ================== QUIZZES (module parent) ==================

  /**
   * Creates a quiz under a module.
   *
   * - Requires Bearer/APIKey (OR).
   * - Returns 201 Created.
   * - Response serialized by `CreateQuizResDTO`.
   *
   * @param userId - Active user ID.
   * @param params - Path params `{ courseId, moduleId }`.
   * @param body - Quiz creation payload (`CreateQuizDTO`).
   * @returns The created quiz (`CreateQuizResDTO`).
   * @example await createQuiz(1, { courseId: 10, moduleId: 20 }, { title: 'Midterm' });
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ZodSerializerDto(CreateQuizResDTO)
  createQuiz(
    @ActiveUser('userId') userId: number,
    @Param() params: ModuleQuizPathParamsDTO,
    @Body() body: CreateQuizDTO,
  ) {
    const ctx: QuizContext = { userId, ...params }
    return this.service.createQuiz(ctx, body)
  }

  /**
   * Lists quizzes under a module with pagination.
   *
   * - Requires Bearer/APIKey (OR).
   * - Supports `skip`/`take`.
   * - Returns 200 OK.
   * - Response serialized by `ListQuizResDTO`.
   *
   * @param userId - Active user ID.
   * @param params - Path params `{ courseId, moduleId }`.
   * @param query - Pagination query (`ListQuizQueryDTO`).
   * @returns Paginated quizzes (`ListQuizResDTO`).
   * @example await listQuizzes(1, { courseId: 10, moduleId: 20 }, { skip: 0, take: 20 });
   */
  @Get()
  @HttpCode(HttpStatus.OK)
  @ZodSerializerDto(ListQuizResDTO)
  listQuizzes(
    @ActiveUser('userId') userId: number,
    @Param() params: ModuleQuizPathParamsDTO,
    @Query() query: ListQuizQueryDTO,
  ) {
    const ctx: QuizContext = { userId, ...params }
    return this.service.listQuizzes(ctx, query)
  }

  /**
   * Updates a module-level quiz.
   *
   * - Requires Bearer/APIKey (OR).
   * - Returns 200 OK.
   * - Response serialized by `UpdateQuizResDTO`.
   *
   * @param userId - Active user ID.
   * @param params - Path params `{ courseId, moduleId, quizId }`.
   * @param body - Update payload (`UpdateQuizDTO`).
   * @returns Updated quiz (`UpdateQuizResDTO`).
   * @example await updateQuiz(1, { courseId: 10, moduleId: 20, quizId: 5 }, { title: 'Final' });
   */
  @Patch(':quizId')
  @HttpCode(HttpStatus.OK)
  @ZodSerializerDto(UpdateQuizResDTO)
  updateQuiz(
    @ActiveUser('userId') userId: number,
    @Param() params: ModuleQuizIdPathParamsDTO,
    @Body() body: UpdateQuizDTO,
  ) {
    const ctx: QuizContext = { userId, ...params }
    return this.service.updateQuiz(ctx, body)
  }

  /**
   * Soft-deletes a module-level quiz.
   *
   * - Requires Bearer/APIKey (OR).
   * - Returns 200 OK with a message.
   * - Response serialized by `MessageResDTO`.
   *
   * @param userId - Active user ID.
   * @param params - Path params `{ courseId, moduleId, quizId }`.
   * @returns Confirmation message (`MessageResDTO`).
   * @example await deleteQuiz(1, { courseId: 10, moduleId: 20, quizId: 5 });
   */
  @Delete(':quizId')
  @HttpCode(HttpStatus.OK)
  @ZodSerializerDto(MessageResDTO)
  deleteQuiz(@ActiveUser('userId') userId: number, @Param() params: ModuleQuizIdPathParamsDTO) {
    const ctx: QuizContext = { userId, ...params }
    return this.service.deleteQuiz(ctx)
  }

  /**
   * Restores a soft-deleted quiz.
   *
   * - Requires Bearer/APIKey (OR).
   * - Returns 200 OK with a message.
   * - Response serialized by `MessageResDTO`.
   *
   * @param userId - Active user ID.
   * @param params - Path params `{ courseId, moduleId, quizId }`.
   * @returns Confirmation message (`MessageResDTO`).
   * @example await restoreQuiz(1, { courseId: 10, moduleId: 20, quizId: 5 });
   */
  @Patch(':quizId/restore')
  @HttpCode(HttpStatus.OK)
  @ZodSerializerDto(MessageResDTO)
  restoreQuiz(@ActiveUser('userId') userId: number, @Param() params: ModuleQuizIdPathParamsDTO) {
    const ctx: QuizContext = { userId, ...params }
    return this.service.restoreQuiz(ctx)
  }

  // ================== QUESTIONS ==================

  /**
   * Creates a question under a module-level quiz.
   *
   * - Requires Bearer/APIKey (OR).
   * - Returns 201 Created.
   * - Response serialized by `QuizQuestionResDTO`.
   *
   * @param userId - Active user ID.
   * @param params - Path params `{ courseId, moduleId, quizId }`.
   * @param body - Creation payload (`CreateQuizQuestionDTO`).
   * @returns Created question (`QuizQuestionResDTO`).
   * @example await createQuestion(1, { courseId: 10, moduleId: 20, quizId: 5 }, { content: 'Q1' });
   */
  @Post(':quizId/questions')
  @HttpCode(HttpStatus.CREATED)
  @ZodSerializerDto(QuizQuestionResDTO)
  createQuestion(
    @ActiveUser('userId') userId: number,
    @Param() params: ModuleQuizIdPathParamsDTO,
    @Body() body: CreateQuizQuestionDTO,
  ) {
    const ctx: QuizContext = { userId, ...params }
    return this.service.createQuestion(ctx, body)
  }

  /**
   * Lists questions of a module-level quiz with pagination.
   *
   * - Requires Bearer/APIKey (OR).
   * - Supports `skip`/`take`.
   * - Returns 200 OK.
   * - Response serialized by `ListQuizQuestionResDTO`.
   *
   * @param userId - Active user ID.
   * @param params - Path params `{ courseId, moduleId, quizId }`.
   * @param query - Pagination query (`ListQuizQuestionQueryDTO`).
   * @returns Paginated questions (`ListQuizQuestionResDTO`).
   * @example await listQuestions(1, { courseId: 10, moduleId: 20, quizId: 5 }, { skip: 0, take: 10 });
   */
  @Get(':quizId/questions')
  @HttpCode(HttpStatus.OK)
  @ZodSerializerDto(ListQuizQuestionResDTO)
  listQuestions(
    @ActiveUser('userId') userId: number,
    @Param() params: ModuleQuizIdPathParamsDTO,
    @Query() query: ListQuizQuestionQueryDTO,
  ) {
    const ctx: QuizContext = { userId, ...params }
    return this.service.listQuestions(ctx, query)
  }

  /**
   * Updates a quiz question.
   *
   * - Requires Bearer/APIKey (OR).
   * - Returns 200 OK.
   * - Response serialized by `QuizQuestionResDTO`.
   *
   * @param userId - Active user ID.
   * @param params - Path params `{ courseId, moduleId, quizId, questionId }`.
   * @param body - Update payload (`UpdateQuizQuestionDTO`).
   * @returns Updated question (`QuizQuestionResDTO`).
   * @example await updateQuestion(1, { courseId: 10, moduleId: 20, quizId: 5, questionId: 7 }, { content: 'Q1*' });
   */
  @Patch(':quizId/questions/:questionId')
  @HttpCode(HttpStatus.OK)
  @ZodSerializerDto(QuizQuestionResDTO)
  updateQuestion(
    @ActiveUser('userId') userId: number,
    @Param() params: ModuleQuizQuestionPathParamsDTO,
    @Body() body: UpdateQuizQuestionDTO,
  ) {
    const ctx: QuizContext = { userId, ...params }
    return this.service.updateQuestion(ctx, body)
  }

  /**
   * Reorders a quiz question within a quiz.
   *
   * - Requires Bearer/APIKey (OR).
   * - Returns 200 OK.
   * - Response serialized by `QuizQuestionResDTO`.
   *
   * @param userId - Active user ID.
   * @param params - Path params `{ courseId, moduleId, quizId, questionId }`.
   * @param body - Reorder payload (`ReorderQuizQuestionDTO`).
   * @returns Reordered question (`QuizQuestionResDTO`).
   * @example await reorderQuestion(1, { courseId: 10, moduleId: 20, quizId: 5, questionId: 7 }, { order: 2 });
   */
  @Patch(':quizId/questions/:questionId/reorder')
  @HttpCode(HttpStatus.OK)
  @ZodSerializerDto(QuizQuestionResDTO)
  reorderQuestion(
    @ActiveUser('userId') userId: number,
    @Param() params: ModuleQuizQuestionPathParamsDTO,
    @Body() body: ReorderQuizQuestionDTO,
  ) {
    const ctx: QuizContext = { userId, ...params }
    return this.service.reorderQuestion(ctx, body)
  }

  /**
   * Soft-deletes a quiz question.
   *
   * - Requires Bearer/APIKey (OR).
   * - Returns 200 OK with a message.
   * - Response serialized by `MessageResDTO`.
   *
   * @param userId - Active user ID.
   * @param params - Path params `{ courseId, moduleId, quizId, questionId }`.
   * @returns Confirmation message (`MessageResDTO`).
   * @example await deleteQuestion(1, { courseId: 10, moduleId: 20, quizId: 5, questionId: 7 });
   */
  @Delete(':quizId/questions/:questionId')
  @HttpCode(HttpStatus.OK)
  @ZodSerializerDto(MessageResDTO)
  deleteQuestion(@ActiveUser('userId') userId: number, @Param() params: ModuleQuizQuestionPathParamsDTO) {
    const ctx: QuizContext = { userId, ...params }
    return this.service.deleteQuestion(ctx)
  }

  /**
   * Restores a soft-deleted quiz question.
   *
   * - Requires Bearer/APIKey (OR).
   * - Returns 200 OK with a message.
   * - Response serialized by `MessageResDTO`.
   *
   * @param userId - Active user ID.
   * @param params - Path params `{ courseId, moduleId, quizId, questionId }`.
   * @returns Confirmation message (`MessageResDTO`).
   * @example await restoreQuestion(1, { courseId: 10, moduleId: 20, quizId: 5, questionId: 7 });
   */
  @Patch(':quizId/questions/:questionId/restore')
  @HttpCode(HttpStatus.OK)
  @ZodSerializerDto(MessageResDTO)
  restoreQuestion(@ActiveUser('userId') userId: number, @Param() params: ModuleQuizQuestionPathParamsDTO) {
    const ctx: QuizContext = { userId, ...params }
    return this.service.restoreQuestion(ctx)
  }

  // ================== ANSWER OPTIONS ==================

  /**
   * Creates an answer option for a question.
   *
   * - Requires Bearer/APIKey (OR).
   * - Returns 201 Created.
   * - Response serialized by `QuizAnswerOptionResDTO`.
   *
   * @param userId - Active user ID.
   * @param params - Path params `{ courseId, moduleId, quizId, questionId }`.
   * @param body - Creation payload (`CreateQuizAnswerOptionDTO`).
   * @returns Created option (`QuizAnswerOptionResDTO`).
   * @example await createOption(1, { courseId: 10, moduleId: 20, quizId: 5, questionId: 7 }, { content: 'A' });
   */
  @Post(':quizId/questions/:questionId/options')
  @HttpCode(HttpStatus.CREATED)
  @ZodSerializerDto(QuizAnswerOptionResDTO)
  createOption(
    @ActiveUser('userId') userId: number,
    @Param() params: ModuleQuizQuestionPathParamsDTO,
    @Body() body: CreateQuizAnswerOptionDTO,
  ) {
    const ctx: QuizContext = { userId, ...params }
    return this.service.createOption(ctx, body)
  }

  /**
   * Lists answer options of a question with pagination.
   *
   * - Requires Bearer/APIKey (OR).
   * - Supports `skip`/`take`.
   * - Returns 200 OK.
   * - Response serialized by `ListQuizAnswerOptionResDTO`.
   *
   * @param userId - Active user ID.
   * @param params - Path params `{ courseId, moduleId, quizId, questionId }`.
   * @param query - Pagination query (`ListQuizAnswerOptionQueryDTO`).
   * @returns Paginated options (`ListQuizAnswerOptionResDTO`).
   * @example await listOptions(1, { courseId: 10, moduleId: 20, quizId: 5, questionId: 7 }, { skip: 0, take: 10 });
   */
  @Get(':quizId/questions/:questionId/options')
  @HttpCode(HttpStatus.OK)
  @ZodSerializerDto(ListQuizAnswerOptionResDTO)
  listOptions(
    @ActiveUser('userId') userId: number,
    @Param() params: ModuleQuizQuestionPathParamsDTO,
    @Query() query: ListQuizAnswerOptionQueryDTO,
  ) {
    const ctx: QuizContext = { userId, ...params }
    return this.service.listOptions(ctx, query)
  }

  /**
   * Updates an answer option.
   *
   * - Requires Bearer/APIKey (OR).
   * - Returns 200 OK.
   * - Response serialized by `QuizAnswerOptionResDTO`.
   *
   * @param userId - Active user ID.
   * @param params - Path params `{ courseId, moduleId, quizId, questionId, optionId }`.
   * @param body - Update payload (`UpdateQuizAnswerOptionDTO`).
   * @returns Updated option (`QuizAnswerOptionResDTO`).
   * @example await updateOption(1, { courseId: 10, moduleId: 20, quizId: 5, questionId: 7, optionId: 9 }, { content: 'A*' });
   */
  @Patch(':quizId/questions/:questionId/options/:optionId')
  @HttpCode(HttpStatus.OK)
  @ZodSerializerDto(QuizAnswerOptionResDTO)
  updateOption(
    @ActiveUser('userId') userId: number,
    @Param() params: ModuleQuizOptionPathParamsDTO,
    @Body() body: UpdateQuizAnswerOptionDTO,
  ) {
    const ctx: QuizContext = { userId, ...params }
    return this.service.updateOption(ctx, body)
  }

  /**
   * Reorders an answer option within a question.
   *
   * - Requires Bearer/APIKey (OR).
   * - Returns 200 OK.
   * - Response serialized by `QuizAnswerOptionResDTO`.
   *
   * @param userId - Active user ID.
   * @param params - Path params `{ courseId, moduleId, quizId, questionId, optionId }`.
   * @param body - Reorder payload (`ReorderQuizAnswerOptionDTO`).
   * @returns Reordered option (`QuizAnswerOptionResDTO`).
   * @example await reorderOption(1, { courseId: 10, moduleId: 20, quizId: 5, questionId: 7, optionId: 9 }, { order: 3 });
   */
  @Patch(':quizId/questions/:questionId/options/:optionId/reorder')
  @HttpCode(HttpStatus.OK)
  @ZodSerializerDto(QuizAnswerOptionResDTO)
  reorderOption(
    @ActiveUser('userId') userId: number,
    @Param() params: ModuleQuizOptionPathParamsDTO,
    @Body() body: ReorderQuizAnswerOptionDTO,
  ) {
    const ctx: QuizContext = { userId, ...params }
    return this.service.reorderOption(ctx, body)
  }

  /**
   * Soft-deletes an answer option.
   *
   * - Requires Bearer/APIKey (OR).
   * - Returns 200 OK with a message.
   * - Response serialized by `MessageResDTO`.
   *
   * @param userId - Active user ID.
   * @param params - Path params `{ courseId, moduleId, quizId, questionId, optionId }`.
   * @returns Confirmation message (`MessageResDTO`).
   * @example await deleteOption(1, { courseId: 10, moduleId: 20, quizId: 5, questionId: 7, optionId: 9 });
   */
  @Delete(':quizId/questions/:questionId/options/:optionId')
  @HttpCode(HttpStatus.OK)
  @ZodSerializerDto(MessageResDTO)
  deleteOption(@ActiveUser('userId') userId: number, @Param() params: ModuleQuizOptionPathParamsDTO) {
    const ctx: QuizContext = { userId, ...params }
    return this.service.deleteOption(ctx)
  }

  /**
   * Restores a soft-deleted answer option.
   *
   * - Requires Bearer/APIKey (OR).
   * - Returns 200 OK with a message.
   * - Response serialized by `MessageResDTO`.
   *
   * @param userId - Active user ID.
   * @param params - Path params `{ courseId, moduleId, quizId, questionId, optionId }`.
   * @returns Confirmation message (`MessageResDTO`).
   * @example await restoreOption(1, { courseId: 10, moduleId: 20, quizId: 5, questionId: 7, optionId: 9 });
   */
  @Patch(':quizId/questions/:questionId/options/:optionId/restore')
  @HttpCode(HttpStatus.OK)
  @ZodSerializerDto(MessageResDTO)
  restoreOption(@ActiveUser('userId') userId: number, @Param() params: ModuleQuizOptionPathParamsDTO) {
    const ctx: QuizContext = { userId, ...params }
    return this.service.restoreOption(ctx)
  }
}
