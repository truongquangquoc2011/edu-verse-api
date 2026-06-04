import { HttpException, Injectable } from '@nestjs/common'
import {
  CourseNotFoundException,
  InternalCreateEnrollmentException,
  UserInactiveException,
  UserNotFoundException,
} from './enroll.error'
import { UserStatus } from 'src/shared/constants/auth.constant'
import { EmailService } from 'src/shared/services/email.service'
import { EnrollRepository } from './enroll.repo'
import { envConfig } from 'src/shared/config'
import { EnrollmentType } from './enroll.model'

type EnrollSource = 'purchase' | 'manual' | 'free'

@Injectable()
export class EnrollService {
  constructor(
    private readonly enrollRepository: EnrollRepository,
    private readonly emailService: EmailService,
  ) {}

  /**
   * Create an enrollment for a user in a course and send a confirmation email.
   * @param userId   - ID of the requester (enrollee)
   * @param courseId - ID of the target course
   * @param source   - Enrollment source: `"purchase" | "manual" | "free"` (defaults to `"purchase"`)
   * @returns Promise resolving to:
   * - `{ success: true, alreadyEnrolled: true }` if the user is already enrolled (no-op), or
   * - `{ success: true, enrollmentId: number }` after creating a new enrollment.
   * @throws UserNotFoundException              - When the user does not exist
   * @throws UserInactiveException              - When the user status is `INACTIVE`
   * @throws CourseNotFoundException            - When the course does not exist or is soft-deleted
   * @throws InternalCreateEnrollmentException  - For any unexpected errors during create/email steps
   */
  async createAndNotify(userId: number, courseId: number, source: EnrollSource = 'purchase') : Promise<EnrollmentType>{
    try {
      const user = await this.enrollRepository.findUserForEnroll(userId)
      if (!user) throw UserNotFoundException
      if (user.status === UserStatus.INACTIVE) throw UserInactiveException

      const course = await this.enrollRepository.findCourseForEnroll(courseId)
      if (!course || course.isDelete) throw CourseNotFoundException

      const existed = await this.enrollRepository.findEnrollment(userId, courseId)
      if (existed) {
        return { success: true as const, alreadyEnrolled: true as const }
      }

      const created = await this.enrollRepository.createEnrollment(userId, courseId)

      await this.emailService.sendEnrollSuccessEmail({
        to: user.email!,
        username: user.fullname!,
        courseTitle: course.title!,
        startUrl: `${envConfig.startUrl || ''}/courses/${course.id}`,
        source,
      })

      return { success: true as const, enrollmentId: created.id }
    } catch (error) {
      if (error instanceof HttpException) throw error
      throw InternalCreateEnrollmentException
    }
  }
}
