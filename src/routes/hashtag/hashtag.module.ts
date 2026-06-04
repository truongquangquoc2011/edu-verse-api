import { Module } from '@nestjs/common';
import { HashtagService } from './hashtag.service';
import { HashtagController } from './hashtag.controller';
import { PrismaService } from 'src/shared/services/prisma.service';
import { HashtagRepository } from './hashtag.repo';

@Module({
  controllers: [HashtagController],
  providers: [HashtagService, PrismaService, HashtagRepository],
})
export class HashtagModule {}
