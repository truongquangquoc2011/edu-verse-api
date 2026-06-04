import { Module } from '@nestjs/common'
import { CourseService } from './course.service'
import { CourseController } from './course.controller'
import { CourseRepository } from './course.repo'
import { SearchModule } from '../search/search.module'
import { CourseSearchService } from './course.search.service'

@Module({
  imports: [SearchModule],
  controllers: [CourseController],
  providers: [CourseService, CourseRepository, CourseSearchService],
})
export class CourseModule {}
