import { Injectable, Logger } from '@nestjs/common'
import { SearchService, SearchResult } from '../search/search.service'
import { CategoryResponseType } from './category.model'

const CATEGORY_INDEX = 'categories_v1'

@Injectable()
export class CategorySearchService {
  private readonly logger = new Logger(CategorySearchService.name)

  constructor(private readonly search: SearchService) {}

  async indexCategory(category: CategoryResponseType) {
    try {
      await this.search.indexDoc(CATEGORY_INDEX, String(category.id), {
        id: category.id,
        name: category.name,
        description: category.description,
        parentCategoryId: category.parentCategoryId,
        createdAt: category.createdAt,
        updatedAt: category.updatedAt,
      })
    } catch (err) {
      this.logger.error(`Failed to index category ${category.id}: ${err?.message}`)
    }
  }

  async removeCategory(id: number) {
    try {
      await this.search.deleteDoc(CATEGORY_INDEX, String(id))
    } catch (err) {
      this.logger.warn(`Failed to delete category ${id} from ES: ${err?.message}`)
    }
  }

  async searchCategory(q: string, skip = 0, take = 10): Promise<SearchResult<CategoryResponseType>> {
    return this.search.search<CategoryResponseType>({
      index: CATEGORY_INDEX,
      q,
      fields: ['name^3', 'description'],
      skip,
      take,
    })
  }
}
