import { Module } from '@nestjs/common'
import { CategoryService } from './category.service'
import { CategoryController } from './category.controller'
import { CategoryRepository } from './category.repo'
import { CategorySearchService } from './category.search.service'
import { SearchModule } from '../search/search.module'

@Module({
  imports: [SearchModule],
  controllers: [CategoryController],
  providers: [CategoryService, CategoryRepository, CategorySearchService],
})
export class CategoryModule {}