import { Module } from '@nestjs/common'
import { ConversationController } from './conversation.controller'
import { ConversationService } from './conversation.service'
import { ConversationRepository } from './conversation.repo'
import { ConversationGateway } from './conversation.gateway'
import { JwtModule } from '@nestjs/jwt'
import { envConfig } from 'src/shared/config'
import { CloudinaryService } from 'src/shared/services/cloudinary.service'

@Module({
  imports: [
    JwtModule.register({
      secret: envConfig.accessTokenSecret,
      signOptions: { expiresIn: envConfig.accessTokenExpiration },
    }),
  ],
  controllers: [ConversationController],
  providers: [ConversationService, ConversationRepository, ConversationGateway, CloudinaryService],
  exports: [ConversationService],
})
export class ConversationModule {}
