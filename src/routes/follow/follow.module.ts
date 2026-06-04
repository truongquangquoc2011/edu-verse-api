import { Module } from '@nestjs/common';
import { FollowService } from './follow.service';
import { FollowController } from './follow.controller';
import { FollowRepository } from './follow.repo';

@Module({
  controllers: [FollowController],
  providers: [FollowService, FollowRepository],
})
export class FollowModule {}
