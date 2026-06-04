import { Injectable } from '@nestjs/common'
import { PrismaService } from 'src/shared/services/prisma.service'
import { CreateCategoryBodyType, CategoryResponseType, UpdateCategoryBodyType } from './category.model'
import { CategoryNotFoundException } from './category.error'
import { PAGINATION } from 'src/shared/constants/pagination.constant'
export const CATEGORY_DEFAULT_SELECT = {
  id: true,
  name: true,
  description: true,
  parentCategoryId: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
} as const

@Injectable()
export class CategoryRepository {
  constructor(private readonly prismaService: PrismaService) {}

  private async checkCategoryExists(id: number): Promise<void> {
    const category = await this.prismaService.category.findUnique({
      where: { id, deletedAt: null },
      select: { id: true },
    })
    if (!category) {
      throw CategoryNotFoundException
    }
  }

  /**
   * Create a new category record in the database.
   *
   * @param data - Category creation payload
   * @param createdById - ID of the user creating the category
   * @returns The created category object
   */
  async create(data: CreateCategoryBodyType, createdById: number): Promise<CategoryResponseType> {
    return this.prismaService.category.create({
      data: { ...data, createdById },
    })
  }

  /**
   * Find a category by its unique name.
   * - Excludes logically deleted categories (`deletedAt IS NULL`).
   *
   * @param name - Category name
   * @returns The category if found, otherwise null
   */
  async findByName(name: string): Promise<CategoryResponseType | null> {
    return this.prismaService.category.findFirst({
      where: { name, deletedAt: null },
    })
  }

  /**
   * Find a category by its ID.
   * - Throws `CategoryNotFoundException` if not found or deleted.
   *
   * @param id - Category ID
   * @returns The category if found
   * @throws CategoryNotFoundException if category does not exist
   */
  async findById(id: number): Promise<CategoryResponseType | null> {
    const category = await this.prismaService.category.findFirst({
      where: { id, deletedAt: null },
    })
    if (!category) throw CategoryNotFoundException
    return category
  }

  /**
   * Update an existing category by ID.
   * - Ensures the category exists before updating.
   * - Tracks the `updatedById` user.
   *
   * @param id - Category ID
   * @param data - Category update payload
   * @param updatedById - ID of the user performing the update
   * @returns The updated category object
   */
  async update(id: number, data: UpdateCategoryBodyType, updatedById: number): Promise<CategoryResponseType> {
    await this.checkCategoryExists(id)
    return this.prismaService.category.update({
      where: { id },
      data: { ...data, updatedById },
    })
  }

  /**
   * Soft delete a category.
   * - Marks it as deleted by setting `deletedAt`.
   * - Does not permanently remove the record.
   *
   * @param id - Category ID
   * @returns The updated category object (soft deleted)
   */
  async softDelete(id: number) {
    await this.findById(id)
    return this.prismaService.category.update({
      where: { id },
      data: { deletedAt: new Date() },
    })
  }

  /**
   * Get a paginated list of categories.
   * - Excludes soft-deleted categories (`deletedAt IS NULL`).
   * - Returns both the data and pagination metadata.
   *
   * @param skip - Number of records to skip (default from pagination constant)
   * @param take - Number of records to take (default from pagination constant)
   * @returns An object containing categories and pagination info
   */
  async listCategories(skip: number = PAGINATION.DEFAULT_SKIP, take: number = PAGINATION.DEFAULT_TAKE) {
    const [data, total] = await this.prismaService.$transaction([
      this.prismaService.category.findMany({
        where: { deletedAt: null },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        select: CATEGORY_DEFAULT_SELECT,
      }),
      this.prismaService.category.count({
        where: { deletedAt: null },
      }),
    ])

    return {
      data,
      pagination: {
        page: Math.floor(skip / take) + 1,
        limit: take,
        total,
        totalPages: Math.ceil(total / take),
      },
    }
  }
}
