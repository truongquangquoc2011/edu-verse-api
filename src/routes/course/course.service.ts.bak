import { BadRequestException, Injectable } from '@nestjs/common'
import { CourseRepository } from './course.repo'
import {
  CreateCourseType,
  CreateCourseResType,
  UpdateCourseType,
  UpdateCourseResType,
  GetCourseResType,
  ListCourseQueryType,
  ListCourseResType,
  CourseBuilderResType,
  UpdateCourseStatusType,
  UpdateCourseStatusResType,
  ListEnrolledCourseQueryType,
  ListEnrolledCourseResType,
  CourseStudyResType,
  PublicCourseDetailType,
} from './course.model'
import { ERROR_MESSAGE } from 'src/shared/constants/error-message.constant'
import { MESSAGES } from 'src/shared/constants/succes-message.constant'
import { CourseSearchService } from './course.search.service'
@Injectable()
export class CourseService {
  constructor(
    private readonly courseRepository: CourseRepository,
    private readonly courseSearchService: CourseSearchService,
  ) {}
  /**
   * Validates business rules before creating a course.
   * - Ensures the user has no more than 5 draft courses.
   * - Checks if the course title is unique for the user.
   *
   * @param userId - ID of the user creating the course
   * @param title - Title of the course to validate
   * @throws BadRequestException if validation fails
   */
  private async validateBusinessRules(userId: number, title: string): Promise<void> {
    const draftCount = await this.courseRepository.countDraftCoursesByUser(userId)
    if (draftCount >= 5) {
      throw new BadRequestException(ERROR_MESSAGE.COURSE.DRAFT_LIMIT_REACHED)
    }

    const titleExists = await this.courseRepository.isTitleTaken(title, userId)
    if (titleExists) {
      throw new BadRequestException(ERROR_MESSAGE.COURSE.TITLE_ALREADY_EXISTS)
    }
  }
  /**
   * Creates a new course for the authenticated user.
   *
   * @param userId - The ID of the authenticated user.
   * @param body - The course creation payload including title, description, categoryId, hashtagIds, etc.
   * @returns The newly created course's ID and status.
   *
   * @throws {BadRequestException} If:
   * - The user has exceeded the draft course limit.
   * - The course title already exists for this user.
   * - The provided category or hashtag IDs are invalid.
   */
  async createCourse(userId: number, body: CreateCourseType): Promise<CreateCourseResType> {
    // Validate business rules before creating the course
    await this.validateBusinessRules(userId, body.title)
    const created = await this.courseRepository.createCourse(userId, body)

    const full = await this.courseRepository.findCourseForIndex(created.id)
    if (full) await this.courseSearchService.indexCourse(this.toCourseIndexDoc(full))

    return created
  }
  /**
   * Updates an existing course.
   *
   * @param userId - ID of the user updating the course
   * @param courseId - ID of the course to update
   * @param body - Course update payload including title, description, categoryId, hashtagIds, etc.
   * @returns The updated course data.
   *
   * @throws {BadRequestException} If:
   * - The provided category or hashtag IDs are invalid.
   */
  async updateCourse(userId: number, courseId: number, body: UpdateCourseType): Promise<UpdateCourseResType> {
    const updated = await this.courseRepository.updateCourse(courseId, userId, body)
    const full = await this.courseRepository.findCourseForIndex(updated.id)
    if (full) await this.courseSearchService.indexCourse(this.toCourseIndexDoc(full))
    return updated
  }

  /**
   * Soft-delete a course owned by the given user.
   *
   * @param userId - ID of the user performing the delete.
   * @param courseId - ID of the course to soft delete.
   * @returns An object containing a success message.
   *
   * @throws CourseAlreadyDeletedException - If the course is not found, not owned by the user, or already deleted.
   */
  async deleteCourse(userId: number, courseId: number) {
    await this.courseRepository.softDeleteCourse(courseId, userId)
    await this.courseSearchService.removeCourse(courseId)
    return { message: MESSAGES.COURSE.DELETED }
  }

  /**
   * Restore a previously soft-deleted course owned by the given user.
   *
   * @param userId - ID of the user performing the restore.
   * @param courseId - ID of the course to restore.
   * @returns An object containing a success message.
   *
   * @throws BadRequestException - If the course is not found, not owned by the user, or not deleted.
   */
  async restoreCourse(userId: number, courseId: number): Promise<{ message: string }> {
    await this.courseRepository.restoreCourse(courseId, userId)
    return { message: MESSAGES.COURSE.RESTORED }
  }

  /**
   * Retrieves detailed information for a specific course.
   *
   * @param userId - ID of the authenticated user
   * @param courseId - ID of the course to fetch
   * @returns The course details object
   *
   * @throws BadRequestException - If the course is not found or not owned by the user
   */
  async getCourseById(userId: number, courseId: number): Promise<GetCourseResType> {
    return this.courseRepository.getCourseDetail(userId, courseId)
  }

  /**
   * Retrieves a paginated list of courses owned by the user.
   *
   * @param userId - ID of the authenticated user
   * @param query - Pagination and filter query params (status, category, skip, take)
   * @returns A paginated list of courses including metadata (total, skip, take)
   */
  async listCourses(userId: number, query: ListCourseQueryType): Promise<ListCourseResType> {
    return this.courseRepository.listCourses(userId, query)
  }

  /**
   * Retrieves course metadata for builder view.
   * - Does not return full modules or lessons
   * - Includes moduleCount and lessonCount only
   *
   * @param userId - ID of the authenticated user
   * @param courseId - ID of the course
   * @returns Builder response including course info and counts
   *
   * @throws BadRequestException - If the course is not found or not owned by the user
   */
  async getCourseBuilder(userId: number, courseId: number): Promise<CourseBuilderResType> {
    return this.courseRepository.getCourseBuilder(userId, courseId)
  }

  /**
   * Updates the status of a course owned by ADMIN.
   * - Typically used by admin to override status
   * - Seller should use `publishCourse` instead
   *
   * @param userId - ID of the authenticated user
   * @param courseId - ID of the course to update
   * @param body - Payload containing the new status
   * @returns The updated course ID, status, and updatedAt timestamp
   *
   * @throws BadRequestException - If the course is not found or not owned by the user
   */
  async updateCourseStatus(
    userId: number,
    courseId: number,
    body: UpdateCourseStatusType,
  ): Promise<UpdateCourseStatusResType> {
    const updated = await this.courseRepository.updateCourseStatus(userId, courseId, body)
    const full = await this.courseRepository.findCourseForIndex(updated.id)
    if (full) await this.courseSearchService.indexCourse(this.toCourseIndexDoc(full))
    return updated
  }

  /**
   * Retrieves a public, paginated list of courses (no authentication required).
   *
   * - Only returns courses that are **Approved** and **not deleted**.
   * - Supports pagination using `skip` and `take`.
   * - Supports optional filter by `categoryId`.
   * - Intended for public course browsing (no user context required).
   *
   * @param query - Query parameters for pagination and filtering (`skip`, `take`, `categoryId`).
   * @returns A paginated list of approved, publicly visible courses with metadata (`items`, `total`, `skip`, `take`).
   *
   */
  async listPublicCourses(query: ListCourseQueryType) {
    const keyword = query.text?.trim()
    const skip = query.skip ?? 0
    const take = query.take ?? 10

    if (keyword) {
      const es = await this.courseSearchService.searchPublicCourses({
        text: keyword,
        skip,
        take,
        categoryId: query.categoryId,
      })

      const ids = es.data.map((d) => d.id)

      const items = await this.courseRepository.listPublicCoursesByIds(ids)

      return {
        skip,
        take,
        total: es.pagination.total,
        items,
      }
    }

    return this.courseRepository.listPublicCourses(query)
  }

  private toCourseIndexDoc(c: any) {
    return {
      id: c.id,
      title: c.title,
      description: c.description,
      previewDescription: c.previewDescription,
      thumbnail: c.thumbnail,

      categoryId: c.categoryId,
      categoryName: c.category?.name ?? null,

      teacherId: c.teacherId,
      teacherName: c.teacher?.user?.fullname ?? null,
      teacherSpecialization: c.teacher?.specialization ?? null,

      status: c.status,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    }
  }

  /**
   * Retrieves detailed information for a single public course (Approved only).
   *
   * - Does not require authentication.
   * - Only returns if the course is **Approved** and **not deleted**.
   *
   * @param courseId - ID of the course to fetch
   * @returns Detailed course information for public display
   *
   * @throws BadRequestException - If the course is not found or not approved
   */
  async getPublicCourseDetail(courseId: number): Promise<PublicCourseDetailType> {
    return this.courseRepository.getPublicCourseDetail(courseId)
  }
  /**
   * Retrieves a paginated list of courses the user is enrolled in (client view).
   *
   * - Based on Enrollment records for the current user.
   * - Includes courses regardless of their status (e.g., blacklisted),
   *   as long as the course itself is not soft-deleted.
   * - Returns course metadata and enrollment progress information.
   *
   * @param userId - ID of the authenticated user
   * @param query - Pagination parameters (skip, take)
   * @returns A paginated list of enrolled courses with progress metadata
   */
  async listEnrolledCourses(userId: number, query: ListEnrolledCourseQueryType): Promise<ListEnrolledCourseResType> {
    return this.courseRepository.listEnrolledCourses(userId, query)
  }

  /**
   * Get study info for a single enrolled course.
   * Response shape is the same as one item in /course/enrolled.
   */
  getCourseStudyInfo(userId: number, courseId: number): Promise<CourseStudyResType> {
    return this.courseRepository.getCourseStudyInfo(userId, courseId)
  }
}
