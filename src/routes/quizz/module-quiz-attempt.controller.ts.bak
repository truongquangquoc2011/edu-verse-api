import { Auth } from 'src/shared/decorator/auth.decorator'
import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post } from '@nestjs/common'
import { ActiveUser } from 'src/shared/decorator/active-user.decorator'
import { AuthTypes, ConditionGuard } from 'src/shared/constants/auth.constant'
import { ZodSerializerDto } from 'nestjs-zod'

import { QuizAttemptService } from './attempt.service'
import { AttemptContext } from './attempt.repo'

import {
  ModuleQuizAttemptPathParamsDTO,
  QuizAttemptFullResDTO,
  SubmitQuizAttemptDTO,
  SubmitQuizAttemptResDTO,
} from './dto/quizz.dto'

import {
  QuizAttemptFullResSchema,
  SubmitQuizAttemptInputSchema,
  SubmitQuizAttemptResSchema,
} from './quiz.model'

import { ApiBody, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger'
import { ApiStandardResponses } from 'src/shared/decorator/api-standard-response'
import { HttpStatusCode } from 'src/shared/swagger/swagger.interface'
import { RESPONSE_MESSAGES } from 'src/shared/constants/swagger.constant'

@ApiTags('Module Quiz Attempt')
@Auth([AuthTypes.BEARER, AuthTypes.APIKey], { condition: ConditionGuard.OR })
@Controller('course/:courseId/modules/:moduleId/quizzes/:quizId/attempt')
export class ModuleAttemptController {
  constructor(private readonly service: QuizAttemptService) {}

  /**
   * Returns full quiz structure for taking a module-level quiz.
   *
   * - Includes questions and options.
   * - Includes `isCorrect` so the client can compute/preview if needed.
   * - Attempt itself is not created here.
   *
   * @param userId - Active user ID.
   * @param params - Module-level quiz path parameters.
   * @returns Full quiz for attempt.
   * @example await getModuleQuizForAttempt(1, { courseId: 10, moduleId: 20, quizId: 5 });
   */
  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get module-level quiz for attempt',
    description:
      'Returns a full quiz (questions and options) for a module-level quiz so the user can attempt it in one shot.',
  })
  @ApiParam({ name: 'courseId', type: Number, required: true })
  @ApiParam({ name: 'moduleId', type: Number, required: true })
  @ApiParam({ name: 'quizId', type: Number, required: true })
  @ZodSerializerDto(QuizAttemptFullResDTO)
  @ApiStandardResponses(HttpStatusCode.OK, RESPONSE_MESSAGES.QUIZ_ATTEMPT.DETAIL, QuizAttemptFullResDTO)
  getModuleQuizForAttempt(
    @ActiveUser('userId') userId: number,
    @Param() params: ModuleQuizAttemptPathParamsDTO,
  ) {
    const ctx: AttemptContext = { userId, ...params }
    return this.service.getModuleQuizForAttempt(ctx).then(QuizAttemptFullResSchema.parse)
  }

  /**
   * Submits all answers for a module-level quiz in a single request.
   *
   * - Creates a new `QuizAttempt` row with final score and `completedAt`.
   * - Persists all `QuizUserAnswer` rows for the submitted answers.
   * - Returns attempt info plus statistics: `totalQuestions` and `correctCount`.
   *
   * @param userId - Active user ID.
   * @param params - Module-level quiz path parameters.
   * @param body - List of answers `{ answers: { questionId, answerOptionId }[] }`.
   * @returns Final scored attempt with stats.
   * @example
   * await submitModuleAttempt(
   *   1,
   *   { courseId: 10, moduleId: 20, quizId: 5 },
   *   { answers: [{ questionId: 1, answerOptionId: 2 }, { questionId: 2, answerOptionId: 4 }] },
   * );
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Submit module-level quiz attempt',
    description:
      'Submits all answers for a module-level quiz in a single request, computes score, and stores the attempt in DB.',
  })
  @ApiParam({ name: 'courseId', type: Number, required: true })
  @ApiParam({ name: 'moduleId', type: Number, required: true })
  @ApiParam({ name: 'quizId', type: Number, required: true })
  @ApiBody({ type: SubmitQuizAttemptDTO })
  @ZodSerializerDto(SubmitQuizAttemptResDTO)
  @ApiStandardResponses(HttpStatusCode.CREATED, RESPONSE_MESSAGES.QUIZ_ATTEMPT.SUBMITTED, SubmitQuizAttemptResDTO)
  async submitModuleAttempt(
    @ActiveUser('userId') userId: number,
    @Param() params: ModuleQuizAttemptPathParamsDTO,
    @Body() body: SubmitQuizAttemptDTO,
  ) {
    const ctx: AttemptContext = { userId, ...params }
    const payload = SubmitQuizAttemptInputSchema.parse(body)
    const result = await this.service.submitModuleAttempt(ctx, payload)
    return SubmitQuizAttemptResSchema.parse(result)
  }
}
