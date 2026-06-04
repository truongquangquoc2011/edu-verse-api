import { Module } from '@nestjs/common'
import { FeedbackController } from './feedback.controller'
import { FeedbackService } from './feedback.service'
import { FeedbackRepository } from './feedback.repo'
import { EmailService } from 'src/shared/services/email.service'

@Module({
  controllers: [FeedbackController],
  providers: [FeedbackService, FeedbackRepository, EmailService],
})
export class FeedbackModule {}
