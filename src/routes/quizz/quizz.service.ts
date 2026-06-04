import { Injectable } from '@nestjs/common'
import { QuizzRepository, QuizContext } from './quizz.repo'
import {
  CreateQuizType,
  UpdateQuizType,
  QuizResType,
  ListQuizResType,
  CreateQuizQuestionType,
  QuizQuestionResType,
  UpdateQuizQuestionType,
  ReorderQuizQuestionType,
  ListQuizQuestionResType,
  CreateQuizAnswerOptionType,
  QuizAnswerOptionResType,
  ListQuizAnswerOptionResType,
  UpdateQuizAnswerOptionType,
  ReorderQuizAnswerOptionType,
} from './quiz.model'
import { PaginationQueryType } from 'src/shared/models/pagination.model'

@Injectable()
export class QuizzService {
  constructor(private readonly repo: QuizzRepository) {}

  /**
   * Create a new quiz under a lesson.
   *
   * - Delegates logic to `QuizzRepository.createQuiz`.
   * - Validates ownership and inserts the new quiz.
   *
   * @param ctx - Quiz context (userId, courseId, moduleId, lessonId)
   * @param payload - Quiz creation payload (`CreateQuizType`)
   * @returns The created quiz entity, typed as `QuizResType`
   */
  createQuiz(ctx: QuizContext, payload: CreateQuizType): Promise<QuizResType> {
    return this.repo.createQuiz(ctx, payload)
  }

  /**
   * Update an existing quiz.
   *
   * - Delegates to `QuizzRepository.updateQuiz`.
   *
   * @param ctx - Quiz context (userId, courseId, moduleId, lessonId, quizId)
   * @param payload - Quiz update payload (`UpdateQuizType`)
   * @returns The updated quiz entity, typed as `QuizResType`
   */
  updateQuiz(ctx: QuizContext, payload: UpdateQuizType): Promise<QuizResType> {
    return this.repo.updateQuiz(ctx, payload)
  }

  /**
   * Soft delete a quiz.
   *
   * - Delegates to `QuizzRepository.softDeleteQuiz`.
   *
   * @param ctx - Quiz context (userId, courseId, moduleId, lessonId, quizId)
   * @returns Confirmation message object
   */
  deleteQuiz(ctx: QuizContext): Promise<{ message: string }> {
    return this.repo.softDeleteQuiz(ctx)
  }

  /**
   * Restore a soft-deleted quiz.
   *
   * - Delegates to `QuizzRepository.restoreQuiz`.
   *
   * @param ctx - Quiz context (userId, courseId, moduleId, lessonId, quizId)
   * @returns Confirmation message object
   */
  restoreQuiz(ctx: QuizContext): Promise<{ message: string }> {
    return this.repo.restoreQuiz(ctx)
  }

  /**
   * List quizzes of a lesson with pagination.
   *
   * - Delegates to `QuizzRepository.listQuizzes`.
   *
   * @param ctx - Quiz context (userId, courseId, moduleId, lessonId)
   * @param query - Pagination params (`skip`, `take`)
   * @returns Paginated quizzes, typed as `ListQuizResType`
   */
  listQuizzes(ctx: QuizContext, query: PaginationQueryType): Promise<ListQuizResType> {
    return this.repo.listQuizzes(ctx, query) // before return this.repo.listQuizzes(userId, courseId, moduleId, lessonId, query)
  }
  // QUIZ QUESTIONS

  /**
   * Create a new quiz question under a quiz.
   *
   * - Delegates to `QuizzRepository.createQuestion`.
   * - Automatically sets `questionOrder` based on existing questions.
   *
   * @param ctx - Quiz context (userId, courseId, moduleId, lessonId, quizId)
   * @param payload - Question creation payload (`CreateQuizQuestionType`)
   * @returns The created quiz question entity, typed as `QuizQuestionResType`
   */
  createQuestion(ctx: QuizContext, payload: CreateQuizQuestionType): Promise<QuizQuestionResType> {
    return this.repo.createQuestion(ctx, payload)
  }

  /**
   * Update an existing quiz question.
   *
   * - Delegates to `QuizzRepository.updateQuestion`.
   * - Updates fields such as `content` or `explanation`.
   *
   * @param ctx - Quiz context (userId, courseId, moduleId, lessonId, quizId, questionId)
   * @param payload - Question update payload (`UpdateQuizQuestionType`)
   * @returns The updated quiz question entity, typed as `QuizQuestionResType`
   */
  updateQuestion(ctx: QuizContext, payload: UpdateQuizQuestionType): Promise<QuizQuestionResType> {
    return this.repo.updateQuestion(ctx, payload)
  }

  /**
   * Soft delete a quiz question.
   *
   * - Delegates to `QuizzRepository.deleteQuestion`.
   * - Marks `deletedAt` instead of permanently removing.
   *
   * @param ctx - Quiz context (userId, courseId, moduleId, lessonId, quizId, questionId)
   * @returns Confirmation message object
   */
  deleteQuestion(ctx: QuizContext): Promise<{ message: string }> {
    return this.repo.deleteQuestion(ctx)
  }

  /**
   * Restore a soft-deleted quiz question.
   *
   * - Delegates to `QuizzRepository.restoreQuestion`.
   * - Sets `deletedAt` to null.
   *
   * @param ctx - Quiz context (userId, courseId, moduleId, lessonId, quizId, questionId)
   * @returns Confirmation message object
   */
  restoreQuestion(ctx: QuizContext): Promise<{ message: string }> {
    return this.repo.restoreQuestion(ctx)
  }

  /**
   * List quiz questions of a quiz with pagination.
   *
   * - Delegates to `QuizzRepository.listQuestions`.
   * - Orders by `questionOrder`.
   *
   * @param ctx - Quiz context (userId, courseId, moduleId, lessonId, quizId)
   * @param query - Pagination params (`skip`, `take`)
   * @returns Paginated quiz questions, typed as `ListQuizQuestionResType`
   */
  listQuestions(ctx: QuizContext, query: PaginationQueryType): Promise<ListQuizQuestionResType> {
    return this.repo.listQuestions(ctx, query)
  }

  /**
   * Reorder a quiz question in its quiz.
   *
   * - Delegates to `QuizzRepository.reorderQuestion`.
   * - Updates `questionOrder`.
   *
   * @param ctx - Quiz context (userId, courseId, moduleId, lessonId, quizId, questionId)
   * @param payload - Reorder payload (`ReorderQuizQuestionType`)
   * @returns The updated quiz question with new order
   */
  reorderQuestion(ctx: QuizContext, payload: ReorderQuizQuestionType): Promise<QuizQuestionResType> {
    return this.repo.reorderQuestion(ctx, payload)
  }
  // AnswerOption 

  /**
   * Create a new answer option under a quiz question.
   *
   * - Delegates to `QuizzRepository.createOption`.
   * - Shifts existing options if needed to avoid duplicate order.
   * - Enforces single-choice rule if `isCorrect` is true.
   *
   * @param ctx - Quiz context (userId, courseId, moduleId, lessonId, quizId, questionId)
   * @param dto - Creation payload (`CreateQuizAnswerOptionType`)
   * @returns The created quiz answer option
   * @throws QuizQuestionNotFoundOrForbiddenException if the parent question doesn't exist
   * @throws QuizAnswerOptionNotFoundOrForbiddenException on DB constraint violation
   */
  createOption(ctx: QuizContext, dto: CreateQuizAnswerOptionType): Promise<QuizAnswerOptionResType> {
    return this.repo.createOption(ctx, dto)
  }

  /**
   * List all answer options for a quiz question.
   *
   * - Delegates to `QuizzRepository.listOptions`.
   * - Supports pagination and sorts by `optionOrder`.
   *
   * @param ctx - Quiz context (userId, courseId, moduleId, lessonId, quizId, questionId)
   * @param query - Pagination payload (`PaginationQueryType`)
   * @returns Paginated list of quiz answer options
   * @throws QuizQuestionNotFoundOrForbiddenException if the parent question doesn't exist
   */
  listOptions(ctx: QuizContext, query: PaginationQueryType): Promise<ListQuizAnswerOptionResType> {
    return this.repo.listOptions(ctx, query)
  }

  /**
   * Update an existing answer option.
   *
   * - Delegates to `QuizzRepository.updateOption`.
   * - Supports partial updates (content, isCorrect).
   * - Enforces single-choice rule if `isCorrect` set to true.
   *
   * @param ctx - Quiz context (userId, courseId, moduleId, lessonId, quizId, questionId, optionId)
   * @param dto - Update payload (`UpdateQuizAnswerOptionType`)
   * @returns The updated quiz answer option
   * @throws QuizAnswerOptionNotFoundOrForbiddenException if the option doesn't exist
   */
  updateOption(ctx: QuizContext, dto: UpdateQuizAnswerOptionType): Promise<QuizAnswerOptionResType> {
    return this.repo.updateOption(ctx, dto)
  }

  /**
 * Reorder a quiz answer option within its question.
 *
 * - Delegates to `QuizzRepository.reorderOption`.
 * - Updates `optionOrder`, swapping if target position is occupied.
 *
 * @param ctx - Quiz context (userId, courseId, moduleId, lessonId, quizId, questionId, optionId)
 * @param dto - Reorder payload (`ReorderQuizAnswerOptionType`)
 * @returns The updated quiz answer option with new order
 * @throws QuizAnswerOptionNotFoundOrForbiddenException if the option doesn't exist
 */
  reorderOption(ctx: QuizContext, dto: ReorderQuizAnswerOptionType): Promise<QuizAnswerOptionResType> {
    return this.repo.reorderOption(ctx, dto)
  }

  /**
 * Soft delete a quiz answer option.
 *
 * - Delegates to `QuizzRepository.deleteOption`.
 * - Marks `deletedAt` timestamp instead of hard deleting.
 *
 * @param ctx - Quiz context (userId, courseId, moduleId, lessonId, quizId, questionId, optionId)
 * @returns A success message after deletion
 * @throws QuizAnswerOptionNotFoundOrForbiddenException if the option doesn't exist
 */
  deleteOption(ctx: QuizContext): Promise<{ message: string }> {
    return this.repo.deleteOption(ctx)
  }

  /**
 * Restore a previously soft-deleted quiz answer option.
 *
 * - Delegates to `QuizzRepository.restoreOption`.
 * - Clears the `deletedAt` field to make the option active again.
 *
 * @param ctx - Quiz context (userId, courseId, moduleId, lessonId, quizId, questionId, optionId)
 * @returns A success message after restoration
 * @throws QuizAnswerOptionNotFoundOrForbiddenException if the option doesn't exist or is not deleted
 */
  restoreOption(ctx: QuizContext): Promise<{ message: string }> {
    return this.repo.restoreOption(ctx)
  }
}
