import { HttpException, Injectable, Logger } from '@nestjs/common'
import { CategoryResponseType, CategoryType, CreateCategoryBodyType, UpdateCategoryBodyType } from './category.model'
import {
  AtLeastOneFieldMustBeProvidedCategoryException,
  CategoryAlreadyExistsException,
  CategoryNotFoundException,
  InternalCreateCategoryErrorException,
  InternalDeleteCategoryErrorException,
  InternalUpdateCategoryErrorException,
} from './category.error'
import { CategoryRepository } from './category.repo'
import { CategorySearchService } from './category.search.service'

@Injectable()
export class CategoryService {
  private readonly logger = new Logger(CategoryService.name)
  constructor(
    private readonly categoryRepository: CategoryRepository,
    private readonly categorySearchService: CategorySearchService,
  ) {}

  /**
   * Create a new category.
   * - Requires a unique `name` (throws `CategoryAlreadyExistsException` if duplicated).
   * - `description` and `parentCategoryId` are optional.
   * - The category will be linked with the `createdById`.
   *
   * @param data - Category creation payload
   * @param userId - ID of the user creating the category
   * @returns The created category object
   * @throws CategoryAlreadyExistsException if name already exists
   * @throws InternalCreateCategoryErrorException for unexpected errors
   */
  async createCategory(data: CreateCategoryBodyType, userId: number): Promise<CategoryResponseType> {
    try {
      const existing = await this.categoryRepository.findByName(data.name)
      if (existing) throw CategoryAlreadyExistsException
      const create = await this.categoryRepository.create(data, userId)
      await this.categorySearchService.indexCategory(create)
      return create
    } catch (error) {
      if (error instanceof HttpException) throw error
      throw InternalCreateCategoryErrorException
    }
  }

  /**
   * Update an existing category by ID.
   * - Requires at least one field (`name`, `description`, `parentCategoryId`).
   * - Validates that the category exists and is not deleted.
   * - Prevents duplicate names across categories.
   *
   * @param id - Category ID to update
   * @param data - Category update payload
   * @param userId - ID of the user performing the update
   * @returns The updated category object
   * @throws AtLeastOneFieldMustBeProvidedCategoryException if body is empty
   * @throws CategoryAlreadyExistsException if `name` already exists
   * @throws CategoryNotFoundException if category does not exist
   * @throws InternalUpdateCategoryErrorException for unexpected errors
   */
  async updateCategory(id: number, data: UpdateCategoryBodyType, userId: number): Promise<CategoryResponseType> {
    if (Object.keys(data).length === 0) throw AtLeastOneFieldMustBeProvidedCategoryException
    try {
      if (data.name) {
        const existing = await this.categoryRepository.findByName(data.name)
        if (existing) throw CategoryAlreadyExistsException
      }
      const updated = await this.categoryRepository.update(id, data, userId)
      await this.categorySearchService.indexCategory(updated)
      return updated
    } catch (error) {
      if (error instanceof HttpException) throw error
      throw InternalUpdateCategoryErrorException
    }
  }

  /**
   * Soft delete a category by ID.
   * - Marks the category as deleted by setting `deletedAt`.
   * - Does not permanently remove the record from the database.
   *
   * @param id - Category ID to delete
   * @returns A success message with the category ID
   * @throws CategoryNotFoundException if category does not exist
   * @throws InternalDeleteCategoryErrorException for unexpected errors
   */
  async deleteCategory(id: number) {
    try {
      await this.categoryRepository.findById(id)
      await this.categoryRepository.softDelete(id)
      await this.categorySearchService.removeCategory(id)
      return { message: `Category ${id} deleted successfully` }
    } catch (error) {
      if (error instanceof HttpException) throw error
      throw InternalDeleteCategoryErrorException
    }
  }

  /**
   * Retrieve details of a single category by ID.
   * - Throws an exception if the category does not exist or is deleted.
   *
   * @param id - Category ID to retrieve
   * @returns The category object
   * @throws CategoryNotFoundException if category does not exist
   */
  async findOne(id: number) {
    return this.categoryRepository.findById(id)
  }

  /**
   * Get a paginated list of categories.
   * - Excludes soft-deleted categories by default.
   *
   * @param skip - Number of records to skip (for pagination)
   * @param take - Number of records to take (for pagination)
   * @returns A list of categories with pagination metadata
   */
  async listCategories(options: {skip?: number, take?: number, text?: string}) {
    const keyword = options.text?.trim()
    if (keyword) {
      return this.categorySearchService.searchCategory(keyword, options.skip, options.take)
    }
    return this.categoryRepository.listCategories(options.skip, options.take)
  }
}
