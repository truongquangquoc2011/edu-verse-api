import { Injectable } from '@nestjs/common'
import { PrismaService } from 'src/shared/services/prisma.service'
import { PAGINATION } from 'src/shared/constants/pagination.constant'
import { CreateFeedbackBodyType, FeedbackResponseType, GetAdminFeedbackQueryType } from './feedback.model'
import { FeedbackNotFoundException } from './feedback.error'
import { FeedbackStatus, FeedbackType } from 'src/shared/constants/feedback.constant'
import { Prisma } from '@prisma/client'

export const FEEDBACK_DEFAULT_SELECT = {
  id: true,
  userId: true,
  courseId: true,
  title: true,
  content: true,
  feedbackType: true,
  status: true,
  createdAt: true,
  updatedAt: true,
} as const

@Injectable()
export class FeedbackRepository {
  constructor(private readonly prisma: PrismaService) {}

  private async checkFeedbackExists(id: number): Promise<void> {
    const find = await this.prisma.feedback.findFirst({
      where: { id, deletedAt: null },
      select: { id: true },
    })
    if (!find) throw FeedbackNotFoundException
  }

  /**
   * Creates a new feedback.
   * @param data - Validated input.
   * @param userId - User ID.
   * @returns Created feedback.
   * @example await create({ title: 'Issue', content: 'Bug' }, 1);
   */
  async create(data: CreateFeedbackBodyType, userId: number): Promise<FeedbackResponseType> {
    return this.prisma.feedback.create({
      data: {
        userId,
        title: data.title,
        content: data.content,
        feedbackType: data.feedbackType ?? FeedbackType.General,
        courseId: data.courseId ?? null,
        createdById: userId,
      },
      select: FEEDBACK_DEFAULT_SELECT,
    })
  }

  /**
   * Finds feedback by ID.
   * @param id - Feedback ID.
   * @returns Feedback.
   * @throws FeedbackNotFoundException if not found.
   */
  async findById(id: number): Promise<FeedbackResponseType> {
    const feedback = await this.prisma.feedback.findUnique({
      where: { id, deletedAt: null },
      select: FEEDBACK_DEFAULT_SELECT,
    })
    if (!feedback) throw FeedbackNotFoundException
    return feedback
  }

  async softDelete(id: number, userId: number) {
    await this.checkFeedbackExists(id)
    return this.prisma.feedback.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        updatedById: userId,
      },
      select: FEEDBACK_DEFAULT_SELECT,
    })
  }

  /**
   * Lists feedbacks for admin with filters and pagination.
   * @param q - Query filters.
   * @param skip - Skip records.
   * @param take - Take records.
   * @returns Paginated result.
   */
  async listForAdmin(
    q: GetAdminFeedbackQueryType,
    skip: number = PAGINATION.DEFAULT_SKIP,
    take: number = PAGINATION.DEFAULT_TAKE,
  ) {
    const where: Prisma.FeedbackWhereInput = {
      deletedAt: null,
      ...(q.status && { status: q.status }),
      ...(q.feedbackType && { feedbackType: q.feedbackType }),
      ...(q.userId && { userId: q.userId }),
      ...(q.courseId && { courseId: q.courseId }),
    }

    const [data, total] = await Promise.all([
      this.prisma.feedback.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        select: FEEDBACK_DEFAULT_SELECT,
      }),
      this.prisma.feedback.count({ where }),
    ])

    return {
      data,
      pagination: {
        page: Math.floor(skip / take) + 1,
        limit: take,
        total,
        totalPages: Math.ceil(total / take),
      },
    }
  }
}
