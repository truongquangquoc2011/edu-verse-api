import { Injectable } from '@nestjs/common'
import { LessonRepository } from './lesson.repo'
import {
  CreateLessonType,
  CreateLessonResType,
  UpdateLessonType,
  LessonResType,
  ListLessonsResType,
  AddVideoLinkType,
  ListLessonsStudyResType,
  LessonStudyDetailType,
  ListLessonQuizQueryType,
  ListLessonQuizResType,
} from './lesson.model'
import { PaginationQueryType } from 'src/shared/models/pagination.model'
import { CloudinaryService } from 'src/shared/services/cloudinary.service'

@Injectable()
export class LessonService {
  constructor(
    private readonly repo: LessonRepository,
    private readonly cloudinary: CloudinaryService,
  ) {}

  /**
   * Create one or multiple lessons in a module.
   *
   * - Delegates logic to `LessonRepository.createLessons`.
   * - Handles validation and ordering of lessons internally at repository layer.
   *
   * @param userId - ID of the authenticated user creating lessons
   * @param moduleId - ID of the module where lessons will be created
   * @param payloads - Array of lesson creation payloads (`CreateLessonType[]`)
   * @returns Array of created lessons, typed as `CreateLessonResType[]`
   */
  createLessons(userId: number, moduleId: number, payloads: CreateLessonType[]): Promise<CreateLessonResType[]> {
    return this.repo.createLessons(userId, moduleId, payloads)
  }

  /**
   * Update an existing lesson.
   *
   * - Delegates to `LessonRepository.updateLesson`.
   *
   * @param userId - ID of the authenticated user updating the lesson
   * @param lessonId - ID of the lesson to update
   * @param payload - Lesson update payload (`UpdateLessonType`)
   * @returns Updated lesson, typed as `LessonResType`
   */
  updateLesson(userId: number, lessonId: number, payload: UpdateLessonType): Promise<LessonResType> {
    return this.repo.updateLesson(userId, lessonId, payload)
  }

  /**
   * Soft delete a lesson (sets `deletedAt` instead of removing).
   *
   * - Delegates to `LessonRepository.softDeleteLesson`.
   *
   * @param userId - ID of the authenticated user deleting the lesson
   * @param lessonId - ID of the lesson to delete
   * @returns Confirmation message
   */
  deleteLesson(userId: number, lessonId: number): Promise<{ message: string }> {
    return this.repo.softDeleteLesson(userId, lessonId)
  }

  /**
   * Restore a previously soft-deleted lesson.
   *
   * - Delegates to `LessonRepository.restoreLesson`.
   *
   * @param userId - ID of the authenticated user restoring the lesson
   * @param lessonId - ID of the lesson to restore
   * @returns Confirmation message
   */
  restoreLesson(userId: number, lessonId: number): Promise<{ message: string }> {
    return this.repo.restoreLesson(userId, lessonId)
  }

  /**
   * List lessons of a module with pagination.
   *
   * - Delegates to `LessonRepository.listLessons`.
   *
   * @param userId - ID of the authenticated user fetching lessons
   * @param moduleId - ID of the module whose lessons are being listed
   * @param query - Pagination parameters (`skip`, `take`)
   * @returns Paginated list of lessons, typed as `ListLessonsResType`
   */
  listLessons(userId: number, moduleId: number, query: PaginationQueryType): Promise<ListLessonsResType> {
    return this.repo.listLessons(userId, moduleId, query)
  }

  /**
   * Add or update the video link for a lesson.
   *
   * - Delegates to `LessonRepository.updateLesson`.
   *
   * @param userId - ID of the authenticated user updating the lesson
   * @param lessonId - ID of the lesson to update
   * @param payload - Payload containing the new video link (`AddVideoLinkType`)
   * @returns The updated lesson entity from the repository
   */
  addVideoLink(userId: number, lessonId: number, payload: AddVideoLinkType) {
    return this.repo.updateLesson(userId, lessonId, payload)
  }

  /**
   * Update the PDF document URL of a lesson.
   *
   * - Delegates to `LessonRepository.updateLesson`.
   *
   * @param userId - ID of the authenticated user updating the lesson
   * @param lessonId - ID of the lesson to update
   * @param pdfUrl - Cloudinary URL of the uploaded PDF
   * @returns An object containing a confirmation message and the updated `documentUrl`
   */
  async updateLessonPdf(userId: number, lessonId: number, pdfUrl: string) {
    const updated = await this.repo.updateLesson(userId, lessonId, { documentUrl: pdfUrl })
    return {
      message: 'Lesson PDF updated successfully',
      documentUrl: updated.documentUrl,
    }
  }

  /**
   * List lessons for client study view.
   *
   * - Ensures the user is enrolled in the parent course of the module.
   * - Returns lessons plus `isCompleted` flag for each item.
   *
   * @param userId - ID of the authenticated learner
   * @param moduleId - ID of the module to fetch lessons from
   * @param query - Pagination parameters (`skip`, `take`)
   * @returns Paginated study list with completion info
   */
  listLessonsForStudy(userId: number, moduleId: number, query: PaginationQueryType): Promise<ListLessonsStudyResType> {
    return this.repo.listLessonsForStudy(userId, moduleId, query)
  }

  /**
   * Get detailed lesson info for the study page.
   *
   * - Ensures the user is enrolled in the course that owns this lesson.
   * - Returns lesson data, completion status and basic course/module context.
   *
   * @param userId - ID of the authenticated learner
   * @param lessonId - ID of the lesson to fetch
   * @returns Lesson study detail payload
   */
  getLessonDetailForStudy(userId: number, lessonId: number): Promise<LessonStudyDetailType> {
    return this.repo.getLessonDetailForStudy(userId, lessonId)
  }
  /**
   * List quizzes of a lesson for study.
   *
   * - Delegates quiz retrieval to the quiz repository.
   * - Returns paginated quizzes along with the user's latest quiz result (if available).
   *
   * @param userId - ID of the authenticated user
   * @param lessonId - ID of the lesson
   * @param query - Pagination parameters (`skip`, `take`)
   * @returns Paginated lesson quizzes, typed as `ListLessonQuizResType`
   */
  async listLessonQuizzesForStudy(
    userId: number,
    lessonId: number,
    query: ListLessonQuizQueryType,
  ): Promise<ListLessonQuizResType> {
    return this.repo.listQuizzesForLessonStudy(userId, lessonId, query)
  }
}
