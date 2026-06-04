import { BadRequestException, Injectable } from '@nestjs/common'
import { PrismaService } from 'src/shared/services/prisma.service'
import { CourseStatus, Prisma } from '@prisma/client'
import {
  CreateCourseType,
  CreateCourseResType,
  UpdateCourseType,
  UpdateCourseResType,
  GetCourseResType,
  UpdateCourseStatusResType,
  UpdateCourseStatusType,
  ListCourseQueryType,
  ListCourseResType,
  CourseBuilderResType,
  ListEnrolledCourseQueryType,
  ListEnrolledCourseResType,
  EnrolledCourseItemType,
  CourseStudyResType,
  PublicCourseDetailType,
} from './course.model'
import { ID_SELECT } from 'src/shared/constants/auth.constant'
import { ERROR_MESSAGE } from 'src/shared/constants/error-message.constant'
import {
  buildCourseData,
  buildUpdateCourseData,
  countLessons,
  countModules,
  diagnoseCourseFailure,
  formatCourse,
  getCoursePublicRaw,
  getCourseRaw,
} from 'src/shared/helper/course.helper'
import { ValidationService } from 'src/shared/services/validation.service'
import { CourseBasicInfo } from 'src/shared/@types/course.type'
import { COURSE_BASIC_SELECT } from 'src/shared/constants/constants'
import { COURSE_DETAIL_SELECT, COURSE_PUBLIC_DETAIL_SELECT } from 'src/shared/constants/course-field.constant'
import { toNumber } from 'src/shared/utils/decimal.util'
import { CourseNotFoundOrForbiddenException } from 'src/shared/constants/course-error.constant'
const idSelect = { id: true }
@Injectable()
export class CourseRepository {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly validation: ValidationService,
  ) {}

  private async validateActorForCourseMutation(userId: number): Promise<void> {
    await this.validation.validateUserStatus(userId)
  }
  /**
   * Validates course input data (user status, category, hashtags).
   * @param userId - ID of the user.
   * @param body - Course creation or update data.
   * @throws BadRequestException if validation fails.
   */
  private async validateCourseInput(userId: number, body: CreateCourseType | UpdateCourseType): Promise<void> {
    if (!body || Object.keys(body).length === 0) {
      throw new BadRequestException('Course data cannot be empty')
    }

    await this.validation.validateUserStatus(userId)

    const { categoryId, hashtagIds = [], title } = body

    if (categoryId && !(await this.checkCategoryExists(categoryId))) {
      throw new BadRequestException(ERROR_MESSAGE.VALIDATION.CATEGORY.NOT_FOUND)
    }

    if (hashtagIds.length > 0) {
      const missingHashtags = await this.findMissingHashtagIds(hashtagIds)
      if (missingHashtags.length > 0) {
        throw new BadRequestException(ERROR_MESSAGE.VALIDATION.HASHTAG.NOT_FOUND)
      }
    }

    if (title && (await this.isTitleTaken(title, userId))) {
      throw new BadRequestException(ERROR_MESSAGE.COURSE.TITLE_ALREADY_EXISTS)
    }
  }

  /**
   * Count how many draft (pending) courses a user currently has.
   *
   * @param userId - ID of the user
   * @returns The number of draft courses created by the user
   */
  async countDraftCoursesByUser(userId: number, status: CourseStatus = CourseStatus.Pending): Promise<number> {
    return this.prismaService.course.count({
      where: { createdById: userId, status },
    })
  }

  /**
   * Check whether a given course title has already been used by the same user.
   *
   * @param title - The course title to check
   * @param userId - ID of the user creating the course
   * @returns `true` if the title is already taken, otherwise `false`
   */
  async isTitleTaken(title: string, userId: number): Promise<boolean> {
    const course = await this.prismaService.course.findFirst({
      where: { title, createdById: userId },
      select: idSelect,
    })
    return !!course
  }

  /**
   * Verifies if a category exists by ID.
   * @param categoryId - ID of the category.
   * @returns True if the category exists, false otherwise.
   */
  async checkCategoryExists(categoryId: number): Promise<boolean> {
    const category = await this.prismaService.category.findUnique({
      where: { id: categoryId },
      select: idSelect,
    })
    return !!category
  }

  /**
   * Given a list of hashtag IDs, returns the ones that are missing from the database.
   *
   * @param hashtagIds - Array of hashtag IDs to check
   * @returns Array of hashtag IDs that do not exist in the database
   */
  async findMissingHashtagIds(hashtagIds: number[]): Promise<number[]> {
    const found = await this.prismaService.hashtag.findMany({
      where: { id: { in: hashtagIds } },
      select: ID_SELECT,
    })

    const foundIds = new Set(found.map((h) => h.id))
    return hashtagIds.filter((id) => !foundIds.has(id))
  }

  /**
   * Builds the base where clause for enrolled courses of a given user.
   * Does not filter by course status so that blacklisted or non-approved courses
   * still appear if the user has already purchased them.
   *
   * @param userId - ID of the authenticated user
   */
  private buildEnrolledCoursesWhere(userId: number): Prisma.EnrollmentWhereInput {
    return {
      userId,
      isDelete: false,
      course: {
        isDelete: false,
      },
    }
  }

  /**
   * Computes the total number of lessons per course for a given list of course IDs.
   *
   * @param courseIds - Array of course IDs
   * @returns A map of courseId -> totalLessons
   */
  private async getTotalLessonsMapByCourse(courseIds: number[]): Promise<Map<number, number>> {
    if (!courseIds.length) {
      return new Map<number, number>()
    }

    const lessonRows = await this.prismaService.lesson.findMany({
      where: {
        isDelete: false,
        module: {
          courseId: { in: courseIds },
          isDelete: false,
        },
      },
      select: {
        module: {
          select: {
            courseId: true,
          },
        },
      },
    })

    const totalLessonsMap = new Map<number, number>()
    for (const row of lessonRows) {
      const courseId = row.module.courseId
      totalLessonsMap.set(courseId, (totalLessonsMap.get(courseId) ?? 0) + 1)
    }

    return totalLessonsMap
  }

  /**
   * Maps an Course detail record (with related Course, Category, and createdBy user)
   * to the CourseItemType shape expected by the response schema.
   */
  private mapPublicCourseDetail(course: {
    id: number
    title: string
    description: string | null
    thumbnail: string | null
    videoUrl: string | null
    price: any
    isFree: boolean
    isFeatured: boolean
    isPreorder: boolean
    hasPreview: boolean
    previewDescription: string | null
    status: CourseStatus
    createdAt: Date
    updatedAt: Date
    category: { id: number; name: string } | null
    createdBy: { id: number; fullname: string; avatar: string | null } | null
  }): PublicCourseDetailType {
    return {
      id: course.id,
      title: course.title,
      description: course.description,
      thumbnail: course.thumbnail,
      videoUrl: course.videoUrl,
      category: course.category
        ? {
            id: course.category.id,
            name: course.category.name,
          }
        : null,
      teacher: course.createdBy
        ? {
            id: course.createdBy.id,
            name: course.createdBy.fullname,
            avatar: course.createdBy.avatar,
          }
        : null,

      price: toNumber(course.price),
      isFree: course.isFree,
      isFeatured: course.isFeatured,
      isPreorder: course.isPreorder,
      hasPreview: course.hasPreview,
      previewDescription: course.previewDescription,
      status: course.status,
      createdAt: course.createdAt,
      updatedAt: course.updatedAt,
    }
  }

  /**
   * Maps an Enrollment record (with related Course, Category, and createdBy user)
   * to the EnrolledCourseItemType shape expected by the response schema.
   *
   * @param enrollment - The enrollment record including related course data
   * @param totalLessonsMap - Map of courseId -> totalLessons
   */
  private mapEnrollmentToEnrolledItem(
    enrollment: Prisma.EnrollmentGetPayload<{
      include: {
        course: {
          select: {
            id: true
            title: true
            description: true
            thumbnail: true
            category: {
              select: {
                id: true
                name: true
              }
            }
            createdBy: {
              select: {
                id: true
                fullname: true
                avatar: true
              }
            }
          }
        }
      }
    }>,
    totalLessonsMap: Map<number, number>,
  ): EnrolledCourseItemType {
    const course = enrollment.course
    const category = course.category
    const creator = course.createdBy

    return {
      id: course.id,
      title: course.title,
      description: course.description,
      thumbnail: course.thumbnail,
      category: category
        ? {
            id: category.id,
            name: category.name,
          }
        : null,
      teacher: creator
        ? {
            id: creator.id,
            name: creator.fullname, // adjust if your User model uses a different field for display name
            avatar: creator.avatar,
          }
        : null,
      enrollment: {
        status: enrollment.status,
        progress: enrollment.progress,
        completedLessonCount: enrollment.completedLessonCount,
        totalLessons: totalLessonsMap.get(course.id) ?? 0,
        enrolledAt: enrollment.enrolledAt,
      },
    }
  }

  /**
   * Creates a new course with validated category and hashtags.
   * @param userId - ID of the user creating the course.
   * @param body - Course creation data.
   * @returns Created course's ID and status.
   * @throws BadRequestException if validation fails.
   */
  async createCourse(userId: number, body: CreateCourseType): Promise<CreateCourseResType> {
    await this.validateCourseInput(userId, body)
    const { hashtagIds = [], categoryId, ...rest } = body

    const data = buildCourseData(userId, rest, categoryId, hashtagIds)

    return this.prismaService.course.create({
      data,
      select: { id: true, status: true },
    })
  }
  /**
   * Finds a course by ID and verifies ownership.
   * @param courseId - ID of the course.
   * @param userId - ID of the user.
   * @returns Course object or null if not found or not owned.
   */
  async findCourseByIdAndOwner(courseId: number, userId: number): Promise<any> {
    return this.prismaService.course.findFirst({
      where: { id: courseId, createdById: userId },
      select: { id: true, status: true, createdById: true },
    })
  }
  /**
   * Update an existing course with new data.
   *
   * Validates that the category and hashtags exist before updating.
   *
   * @param courseId - ID of the course to update
   * @param userId - ID of the user updating the course
   * @param body - The course update payload
   * @returns Object containing the updated course's ID, status, and updatedAt timestamp
   *
   * @throws BadRequestException if category or hashtags are invalid
   */
  async updateCourse(courseId: number, userId: number, body: UpdateCourseType): Promise<UpdateCourseResType> {
    const course = await this.findCourseByIdAndOwner(courseId, userId)
    if (!course) {
      throw new BadRequestException(ERROR_MESSAGE.COURSE.NOT_FOUND_OR_FORBIDDEN)
    }
    // Validate user status
    await this.validateCourseInput(userId, body)
    const { hashtagIds = [], categoryId, ...rest } = body

    const data = buildUpdateCourseData(userId, rest, categoryId, hashtagIds)

    return this.prismaService.course.update({
      where: { id: courseId },
      data,
      select: { id: true, status: true, updatedAt: true },
    })
  }
  /**
   * Finds an active (not soft-deleted) course by ID and owner.
   * @param courseId - The ID of the course
   * @param userId - The ID of the user who owns the course
   * @returns The course basic info
   * @throws NotFoundException if the course is not found or not active
   * @example
   * await findCourseByIdAndOwnerActive(1, 100);
   */
  async findCourseByIdAndOwnerActive(courseId: number, userId: number): Promise<CourseBasicInfo | null> {
    return this.prismaService.course.findFirst({
      where: { id: courseId, createdById: userId, isDelete: false },
      select: COURSE_BASIC_SELECT,
    })
  }

  /**
   * Soft-deletes a course by marking it as deleted and setting deletedAt.
   * @param courseId - The ID of the course
   * @param userId - The ID of the user who owns the course
   * @returns The updated course basic info
   * @throws NotFoundException if the course is not found or already deleted
   * @throws UnauthorizedException if the user is not allowed to mutate the course
   * @example
   * await softDeleteCourse(1, 100);
   */
  async softDeleteCourse(courseId: number, userId: number): Promise<CourseBasicInfo> {
    // Ensure user is active & allowed to mutate course
    await this.validateActorForCourseMutation(userId)

    return this.prismaService.$transaction(async (tx) => {
      // Update only if course matches all conditions
      const updated = await tx.course.updateMany({
        where: { id: courseId, createdById: userId, isDelete: false, status: CourseStatus.Pending },
        data: { isDelete: true, deletedAt: new Date(), status: CourseStatus.Pending },
      })

      // If no rows updated → diagnose reason and throw a specific exception
      if (updated.count === 0) {
        await diagnoseCourseFailure(tx, courseId, userId, 'softDelete')
      }

      // Return the updated course basic info
      return tx.course.findUniqueOrThrow({ where: { id: courseId }, select: COURSE_BASIC_SELECT })
    })
  }

  /**
   * Restores a soft-deleted course by clearing isDelete and deletedAt.
   * @param courseId - The ID of the course
   * @param userId - The ID of the user who owns the course
   * @returns The restored course basic info
   * @throws NotFoundException if the course is not found or not soft-deleted
   * @throws UnauthorizedException if the user is not allowed to mutate the course
   */
  async restoreCourse(courseId: number, userId: number): Promise<CourseBasicInfo> {
    // Ensure user is active & allowed to mutate course
    await this.validateActorForCourseMutation(userId)

    return this.prismaService.$transaction(async (tx) => {
      // Update only if course is soft-deleted
      const updated = await tx.course.updateMany({
        where: { id: courseId, createdById: userId, isDelete: true },
        data: { isDelete: false, deletedAt: null },
      })

      if (updated.count === 0) {
        await diagnoseCourseFailure(tx, courseId, userId, 'restore')
      }
      // Return the restored course basic info
      return tx.course.findUniqueOrThrow({
        where: { id: courseId },
        select: COURSE_BASIC_SELECT,
      })
    })
  }

  /**
   * Retrieves detailed information for a specific course owned by the user.
   *
   * @param userId - ID of the authenticated user
   * @param courseId - ID of the course to fetch
   * @returns The course details including metadata (price converted to number)
   *
   * @throws BadRequestException - If the course is not found or not owned by the user
   */
  async getCourseDetail(userId: number, courseId: number): Promise<GetCourseResType> {
    // Ensure user is active & allowed to mutate course
    await this.validateActorForCourseMutation(userId)

    // get course raw and format price
    const course = await getCourseRaw(userId, courseId)

    if (!course) {
      throw new BadRequestException(ERROR_MESSAGE.COURSE.NOT_FOUND_OR_FORBIDDEN)
    }
    return formatCourse(course)
  }

  /**
   * Retrieves a paginated list of courses owned by the user.
   *
   * @param userId - ID of the authenticated user
   * @param query - Pagination and filter query params (status, categoryId, skip, take)
   * @returns Paginated list of courses with metadata (items, total, skip, take)
   */
  async listCourses(userId: number, query: ListCourseQueryType): Promise<ListCourseResType> {
    await this.validateActorForCourseMutation(userId)

    // Build where dynamically for flexibility
    const where = {
      createdById: userId,
      isDelete: false,
      ...(query.status && { status: query.status as CourseStatus }),
      ...(query.categoryId && { categoryId: query.categoryId }),
    }

    const [courses, total] = await this.prismaService.$transaction([
      this.prismaService.course.findMany({
        where,
        select: COURSE_DETAIL_SELECT,
        orderBy: { createdAt: 'desc' },
        skip: query.skip,
        take: query.take,
      }),
      this.prismaService.course.count({ where }),
    ])

    return {
      items: courses.map(formatCourse), // format for each element
      total,
      skip: query.skip,
      take: query.take,
    }
  }

  /**
   * Updates the status of a course owned by the user.
   * - Typically used by admin to override course status.
   * - Seller should use publishCourse for publishing validation.
   *
   * @param userId - ID of the authenticated user
   * @param courseId - ID of the course to update
   * @param body - Payload containing the new status
   * @returns The updated course's ID, status, and updatedAt timestamp
   *
   * @throws BadRequestException - If the course is not found or not owned by the user
   */
  async updateCourseStatus(
    userId: number,
    courseId: number,
    body: UpdateCourseStatusType,
  ): Promise<UpdateCourseStatusResType> {
    await this.validation.validateUserStatus(userId)

    try {
      return await this.prismaService.course.update({
        where: { id: courseId, createdById: userId, isDelete: false },
        data: { status: body.status },
        select: { id: true, status: true, updatedAt: true },
      })
    } catch {
      throw CourseNotFoundOrForbiddenException
    }
  }

  /**
   * Retrieves builder metadata for a course.
   * - Returns only course basic info, moduleCount, and lessonCount.
   * - Does not include actual modules or lessons (handled separately).
   *
   * @param userId - ID of the authenticated user
   * @param courseId - ID of the course
   * @returns An object containing course info, moduleCount, and lessonCount
   *
   * @throws BadRequestException - If the course is not found or not owned by the user
   */
  async getCourseBuilder(userId: number, courseId: number): Promise<CourseBuilderResType> {
    await this.validation.validateUserStatus(userId)

    const course = await getCourseRaw(userId, courseId)
    if (!course) {
      throw new BadRequestException(ERROR_MESSAGE.COURSE.NOT_FOUND_OR_FORBIDDEN)
    }

    // count module and lesson
    const [moduleCount, lessonCount] = await this.prismaService.$transaction([
      countModules(courseId),
      countLessons(courseId),
    ])

    return {
      course: formatCourse(course),
      moduleCount,
      lessonCount,
    }
  }
  /**
   * Public list: anyone can see Approved courses (not deleted).
   * - Forces status = Approved
   * - Supports pagination and categoryId filter (optional)
   * - Reuses existing ListCourseResType
   */
  async listPublicCourses(query: ListCourseQueryType): Promise<{
    items: PublicCourseDetailType[]
    total: number
    skip: number
    take: number
  }> {
    const where: Prisma.CourseWhereInput = {
      isDelete: false,
      status: CourseStatus.Approved,
      ...(query.categoryId && { categoryId: query.categoryId }),
    }

    const [courses, total] = await this.prismaService.$transaction([
      this.prismaService.course.findMany({
        where,
        select: COURSE_PUBLIC_DETAIL_SELECT,
        orderBy: { createdAt: 'desc' },
        skip: query.skip,
        take: query.take,
      }),
      this.prismaService.course.count({ where }),
    ])

    return {
      items: courses.map((course) => this.mapPublicCourseDetail(course)),
      total,
      skip: query.skip,
      take: query.take,
    }
  }

  /**
   * Retrieves detailed information of a course visible to the public.
   * - Only returns if the course is Approved and not deleted.
   * - Converts price and other numeric fields properly.
   *
   * @param courseId - ID of the course to fetch
   * @returns Detailed course object formatted for client
   *
   * @throws BadRequestException - If course not found or not approved
   */
  async getPublicCourseDetail(courseId: number): Promise<PublicCourseDetailType> {
    const course = await this.prismaService.course.findFirst({
      where: {
        id: courseId,
        isDelete: false,
        status: CourseStatus.Approved,
      },
      select: COURSE_PUBLIC_DETAIL_SELECT,
    })

    if (!course) {
      throw new BadRequestException(ERROR_MESSAGE.COURSE.NOT_FOUND_OR_FORBIDDEN)
    }

    return this.mapPublicCourseDetail(course)
  }

  /**
   * Retrieves a paginated list of courses the user is enrolled in.
   *
   * - Based on Enrollment records for the current user.
   * - Includes courses regardless of their status (e.g., blacklisted),
   *   as long as the course is not soft-deleted.
   * - Returns course metadata (title, description, thumbnail, category, teacher)
   *   and enrollment progress information (status, progress, completedLessonCount, totalLessons, enrolledAt).
   *
   * @param userId - ID of the authenticated user
   * @param query - Pagination parameters (skip, take)
   * @returns Paginated list of enrolled courses with progress metadata
   */
  async listEnrolledCourses(userId: number, query: ListEnrolledCourseQueryType): Promise<ListEnrolledCourseResType> {
    await this.validation.validateUserStatus(userId)

    const { skip, take } = query
    const where = this.buildEnrolledCoursesWhere(userId)

    const [enrollments, total] = await this.prismaService.$transaction([
      this.prismaService.enrollment.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        include: {
          course: {
            select: {
              id: true,
              title: true,
              description: true,
              thumbnail: true,
              category: {
                select: {
                  id: true,
                  name: true,
                },
              },
              createdBy: {
                select: {
                  id: true,
                  fullname: true,
                  avatar: true,
                },
              },
            },
          },
        },
      }),
      this.prismaService.enrollment.count({ where }),
    ])

    if (!enrollments.length) {
      return {
        items: [],
        total,
        skip,
        take,
      }
    }

    const courseIds = enrollments.map((e) => e.courseId)
    const totalLessonsMap = await this.getTotalLessonsMapByCourse(courseIds)

    const items = enrollments.map((enrollment) => this.mapEnrollmentToEnrolledItem(enrollment, totalLessonsMap))

    return {
      items,
      total,
      skip,
      take,
    }
  }

  /**
   * Retrieves a single enrolled course for study view.
   * - Same shape as one item in enrolled course list.
   * - Ensures the user is enrolled in the course.
   */
  async getCourseStudyInfo(userId: number, courseId: number): Promise<CourseStudyResType> {
    await this.validation.validateUserStatus(userId)

    const enrollment = await this.prismaService.enrollment.findFirst({
      where: {
        userId,
        courseId,
        isDelete: false,
        course: {
          isDelete: false,
        },
      },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            description: true,
            thumbnail: true,
            category: {
              select: {
                id: true,
                name: true,
              },
            },
            createdBy: {
              select: {
                id: true,
                fullname: true,
                avatar: true,
              },
            },
          },
        },
      },
    })

    if (!enrollment || !enrollment.course) {
      throw new BadRequestException(ERROR_MESSAGE.COURSE.NOT_FOUND_OR_FORBIDDEN)
    }

    // use logic total lesson
    const totalLessonsMap = await this.getTotalLessonsMapByCourse([courseId])

    return this.mapEnrollmentToEnrolledItem(enrollment, totalLessonsMap)
  }

  async findCourseForIndex(courseId: number) {
    return this.prismaService.course.findUnique({
      where: { id: courseId },
      select: {
        id: true,
        title: true,
        description: true,
        previewDescription: true,
        thumbnail: true,
        categoryId: true,
        teacherId: true,
        status: true,
        createdAt: true,
        updatedAt: true,

        category: { select: { name: true } },
        teacher: {
          select: {
            specialization: true,
            user: { select: { fullname: true } },
          },
        },
      },
    })
  }

  async listPublicCoursesByIds(ids: number[]) {
    if (ids.length === 0) return []

    const courses = await this.prismaService.course.findMany({
      where: {
        id: { in: ids },
        status: CourseStatus.Approved,
      },
      select: {
        id: true,
        title: true,
        description: true,
        previewDescription: true,
        price: true,
        isFree: true,
        isFeatured: true,
        isPreorder: true,
        rating: true,
        thumbnail: true,
        status: true,
        createdAt: true,
        updatedAt: true,

        category: { select: { id: true, name: true } },
        teacher: {
          select: {
            id: true,
            user: { select: { fullname: true } },
          },
        },
      },
    })

    const map = new Map(courses.map((c) => [c.id, c]))

    return ids.map((id) => map.get(id)).filter(Boolean)
  }
}
