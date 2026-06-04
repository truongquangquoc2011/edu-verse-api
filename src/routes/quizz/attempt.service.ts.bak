import { Injectable } from '@nestjs/common'
import { QuizAttemptRepository, AttemptContext } from './attempt.repo'
import {
  QuizAttemptResType,
  ListQuizAttemptResType,
  SaveQuizAnswerType,
  QuizAttemptQuestionsResType,
  QuizAttemptFullResType,
  SubmitQuizAttemptResType,
} from './quiz.model'
import { PaginationQueryType } from 'src/shared/models/pagination.model'

@Injectable()
export class QuizAttemptService {
  constructor(private readonly repo: QuizAttemptRepository) {}

  /**
   * Start a new attempt under a quiz.
   *
   * - Delegates to `QuizAttemptRepository.startAttempt`.
   * - Initializes score=0 and completedAt=null.
   *
   * @param ctx - Attempt context (userId, courseId, moduleId, lessonId, quizId)
   * @returns Created attempt (`QuizAttemptResType`)
   */
  startAttempt(ctx: AttemptContext): Promise<QuizAttemptResType> {
    return this.repo.startAttempt(ctx)
  }

  /**
   * Save (upsert) a single answer for a question within an attempt.
   *
   * - Delegates to `QuizAttemptRepository.saveAnswer`.
   * - Only allowed when attempt is not submitted.
   *
   * @param ctx - Attempt context (userId, attemptId)
   * @param payload - `{ questionId, answerOptionId }`
   * @returns Minimal info (e.g., created answer id)
   */
  saveAnswer(ctx: AttemptContext, payload: SaveQuizAnswerType): Promise<{ id: number }> {
    return this.repo.saveAnswer(ctx, payload)
  }

  /**
   * Submit an attempt and compute the final score.
   *
   * - Delegates to `QuizAttemptRepository.submitAttempt`.
   * - Score = correctCount / totalQuestions * 100 (2 decimals), clamp [0..100].
   *
   * @param ctx - Attempt context (userId, attemptId)
   * @returns Updated attempt (`QuizAttemptResType`)
   */
  submitAttempt(ctx: AttemptContext): Promise<QuizAttemptResType> {
    return this.repo.submitAttempt(ctx)
  }

  /**
   * Get details of my attempt.
   *
   * - Delegates to `QuizAttemptRepository.getAttempt`.
   *
   * @param ctx - Attempt context (userId, attemptId)
   * @returns Attempt detail (`QuizAttemptResType`)
   */
  getAttempt(ctx: AttemptContext): Promise<QuizAttemptResType> {
    return this.repo.getAttempt(ctx)
  }

  /**
   * List attempts of a quiz (for teacher/admin; enforce role in guards).
   *
   * - Delegates to `QuizAttemptRepository.listAttemptsByQuiz`.
   * - Supports pagination via `PaginationQueryType`.
   *
   * @param ctx - Attempt context (userId, courseId, moduleId, lessonId, quizId)
   * @param query - `{ skip, take }`
   * @returns Paginated attempts (`ListQuizAttemptResType`)
   */
  listAttemptsByQuiz(ctx: AttemptContext, query: PaginationQueryType): Promise<ListQuizAttemptResType> {
    return this.repo.listAttemptsByQuiz(ctx, query)
  }

  /**
   * (Optional) Get questions and currently selected answers for an attempt.
   *
   * - Delegates to `QuizAttemptRepository.getAttemptQuestions`.
   * - Does NOT expose which option is correct.
   *
   * @param ctx - Attempt context (userId, attemptId)
   * @returns Array of question view models ready for UI
   */
  getAttemptQuestions(ctx: AttemptContext): Promise<QuizAttemptQuestionsResType['items']> {
    return this.repo.getAttemptQuestions(ctx)
  }

  /**
   * Returns a full quiz structure (questions + options + correct flag)
   * for a module-level quiz attempt.
   *
   * Intended for:
   *   GET /courses/:courseId/modules/:moduleId/quizzes/:quizId/attempt
   *
   * @param ctx - Attempt context (userId, courseId, moduleId, quizId)
   * @returns Full quiz representation (`QuizAttemptFullResType`)
   */
  getModuleQuizForAttempt(ctx: AttemptContext): Promise<QuizAttemptFullResType> {
    return this.repo.getModuleQuizForAttempt(ctx)
  }

  /**
   * Submits all answers for a module-level quiz in a single request.
   *
   * - Delegates to `QuizAttemptRepository.submitModuleAttempt`.
   * - Creates a QuizAttempt and corresponding QuizUserAnswer rows.
   * - Computes final score in [0, 100] (2 decimals).
   *
   * Intended for:
   *   POST /courses/:courseId/modules/:moduleId/quizzes/:quizId/attempt
   *
   * @param ctx - Attempt context (userId, courseId, moduleId, quizId)
   * @param payload - `{ answers: Array<{ questionId, answerOptionId }> }`
   * @returns Attempt + statistics (`SubmitQuizAttemptResType`)
   */
  submitModuleAttempt(
    ctx: AttemptContext,
    payload: { answers: SaveQuizAnswerType[] },
  ): Promise<SubmitQuizAttemptResType> {
    return this.repo.submitModuleAttempt(ctx, payload)
  }

  /**
   * Get lesson quiz details for attempting.
   *
   * - Delegates quiz retrieval to the quiz repository.
   * - Returns quiz content including questions and answer options
   *   for the student to attempt.
   *
   * @param ctx - Attempt context containing user/course/lesson/quiz identifiers
   * @returns Quiz attempt data, typed as `QuizAttemptFullResType`
   */
  getLessonQuizForAttempt(ctx: AttemptContext): Promise<QuizAttemptFullResType> {
    return this.repo.getLessonQuizForAttempt(ctx)
  }

  /**
   * Submit a lesson quiz attempt.
   *
   * - Delegates quiz submission and scoring logic to the quiz repository.
   * - Persists the attempt result and user answers.
   *
   * @param ctx - Attempt context containing user/course/lesson/quiz identifiers
   * @param payload - Submitted quiz answers
   * @returns Quiz attempt result summary, typed as `SubmitQuizAttemptResType`
   */
  submitLessonAttempt(
    ctx: AttemptContext,
    payload: { answers: SaveQuizAnswerType[] },
  ): Promise<SubmitQuizAttemptResType> {
    return this.repo.submitLessonAttempt(ctx, payload)
  }
}
