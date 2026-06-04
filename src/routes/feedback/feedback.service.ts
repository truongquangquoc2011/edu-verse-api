import { HttpException, Injectable, Logger } from '@nestjs/common'
import { CreateFeedbackBodyType, GetAdminFeedbackQueryType, FeedbackResponseType } from './feedback.model'
import { InternalCreateFeedbackErrorException, InternalDeleteFeedbackErrorException } from './feedback.error'
import { FeedbackRepository } from './feedback.repo'
import { EmailService } from 'src/shared/services/email.service'
import { PrismaService } from 'src/shared/services/prisma.service'
import { FeedbackType } from 'src/shared/constants/feedback.constant'

@Injectable()
export class FeedbackService {
  private readonly logger = new Logger(FeedbackService.name)

  constructor(
    private readonly repo: FeedbackRepository,
    private readonly email: EmailService,
    private readonly prisma: PrismaService,
  ) {}

  async createFeedback(data: CreateFeedbackBodyType, userId: number): Promise<FeedbackResponseType> {
    try {
      const created = await this.repo.create(data, userId)

      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { email: true, fullname: true, username: true },
      })

      if (user?.email) {
        this.email
          .sendFeedbackReceivedEmail({
            to: user.email,
            username: user.fullname ?? user.username ?? 'You',
            title: data.title,
          })
          .catch((err) => this.logger.warn(`Send feedback receipt email failed: ${err?.message || err}`))
      }

      return created
    } catch (e) {
      if (e instanceof HttpException) throw e
      throw InternalCreateFeedbackErrorException
    }
  }

  async getFeedbackDetail(id: number) {
    return this.repo.findById(id)
  }

  async deleteFeedback(id: number, userId: number) {
    try {
      await this.repo.softDelete(id, userId)
      return { message: `Feedback ${id} deleted successfully` }
    } catch (e) {
      if (e instanceof HttpException) throw e
      throw InternalDeleteFeedbackErrorException
    }
  }

  async getAdminFeedbacks(query: GetAdminFeedbackQueryType, skip: number, take: number) {
    return this.repo.listForAdmin(query, skip, take)
  }
}
