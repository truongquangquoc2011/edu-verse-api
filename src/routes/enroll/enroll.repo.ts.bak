import { Injectable } from '@nestjs/common'
import { PrismaService } from 'src/shared/services/prisma.service'

@Injectable()
export class EnrollRepository {
  constructor(private readonly prismaService: PrismaService) {}

  /**
   * Fetch minimal user info required for an enrollment request.
   * @param userId - The user's primary key
   * @returns A user object with the selected fields, or `null` if not found
   */
  findUserForEnroll(userId: number) {
    return this.prismaService.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, fullname: true, status: true },
    })
  }

  /**
   * Fetch minimal course info required to validate enroll eligibility.
   * @param courseId - The course's primary key
   * @returns A course object with the selected fields, or `null` if not found
   */
  findCourseForEnroll(courseId: number) {
    return this.prismaService.course.findUnique({
      where: { id: courseId },
      select: {
        id: true,
        title: true,
        isDelete: true,
        status: true,
      },
    })
  }

  /**
   * Check if an active (non-deleted) enrollment already exists for a user/course pair.
   * @param userId - The user's id
   * @param courseId - The course's id
   * @returns The enrollment `{ id }` if found, otherwise `null`
   */
  findEnrollment(userId: number, courseId: number) {
    return this.prismaService.enrollment.findFirst({
      where: { userId, courseId, isDelete: false },
      select: { id: true },
    })
  }

  /**
   * Create a new enrollment for the given user & course.
   * @param userId - The user's id
   * @param courseId - The course's id
   * @returns The created enrollment `{ id }`
   */
  async createEnrollment(userId: number, courseId: number) {
    return this.prismaService.enrollment.create({
      data: {
        userId,
        courseId,
        progress: 0,
        completedLessonCount: 0,
        enrolledAt: new Date(),
        createdById: userId,
      },
      select: { id: true },
    })
  }
}
