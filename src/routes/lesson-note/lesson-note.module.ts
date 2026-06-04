import { Module } from '@nestjs/common'
import { LessonNoteService } from './lesson-note.service'
import { LessonNoteController } from './lesson-note.controller'
import { LessonNoteRepository } from './lesson-note.repo'

@Module({
  controllers: [LessonNoteController],
  providers: [LessonNoteService, LessonNoteRepository],
})
export class LessonNoteModule {}
