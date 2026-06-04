import { Module } from '@nestjs/common';
import { LessonService } from './lesson.service';
import { LessonController } from './lesson.controller';
import { LessonRepository } from './lesson.repo';
import { CloudinaryService } from 'src/shared/services/cloudinary.service';
import { LessonStudyController } from './lesson.study.controller';

@Module({
  controllers: [LessonController,LessonStudyController],
  providers: [LessonService,LessonRepository,CloudinaryService],
})
export class LessonModule {}
