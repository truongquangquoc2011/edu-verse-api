import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  Query,
  HttpStatus,
  HttpCode,
} from '@nestjs/common'
import { CategoryService } from './category.service'
import { Auth, IsPublic } from 'src/shared/decorator/auth.decorator'
import { AuthTypes } from 'src/shared/constants/auth.constant'
import { ZodSerializerDto } from 'nestjs-zod'
import {
  CategoryResDTO,
  CreateCategoryDTO,
  GetCategoriesResDTO,
  ListCategoryFilterDTO,
  UpdateCategoryDTO,
} from './dto/category.dto'
import { ActiveUser } from 'src/shared/decorator/active-user.decorator'
import { parseSkipTake } from 'src/shared/utils/pagination.util'
import { ApiTags, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiBody } from '@nestjs/swagger'
import { ApiStandardResponses } from 'src/shared/decorator/api-standard-response'
import { HttpStatusCode } from 'src/shared/swagger/swagger.interface'
import { RESPONSE_MESSAGES } from 'src/shared/constants/swagger.constant'

@ApiTags('Category')
@Controller('category')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  /**
   * Create a new category.
   * - Requires a unique `name`.
   * - `description` and `parentCategoryId` are optional.
   * - If `parentCategoryId` is provided, the parent category must exist.
   *
   * @param body - Category creation payload
   * @param userId - ID of the currently active user (creator)
   * @returns The created category object
   */
  @Post()
  @Auth([AuthTypes.BEARER])
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create category', description: 'Create a new category.' })
  @ApiBody({ type: CreateCategoryDTO })
  @ZodSerializerDto(CategoryResDTO)
  @ApiStandardResponses(HttpStatusCode.CREATED, RESPONSE_MESSAGES.CATEGORY.CREATED, CategoryResDTO)
  async create(@Body() body: CreateCategoryDTO, @ActiveUser('userId') userId: number) {
    return this.categoryService.createCategory(body, userId)
  }

  /**
   * Update an existing category by ID.
   * - At least one field (`name`, `description`, `parentCategoryId`) must be provided.
   * - Throws an exception if the category does not exist or is deleted.
   * - Prevents duplicate `name` across categories.
   *
   * @param id - Category ID to update
   * @param body - Category update payload
   * @param userId - ID of the currently active user (updater)
   * @returns The updated category object
   */
  @Patch(':id')
  @Auth([AuthTypes.BEARER])
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update category', description: 'Update an existing category by ID.' })
  @ApiParam({ name: 'id', type: Number, description: 'Category ID' })
  @ApiBody({ type: UpdateCategoryDTO })
  @ZodSerializerDto(CategoryResDTO)
  @ApiStandardResponses(HttpStatusCode.OK, RESPONSE_MESSAGES.CATEGORY.UPDATED, CategoryResDTO)
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateCategoryDTO,
    @ActiveUser('userId') userId: number,
  ) {
    return this.categoryService.updateCategory(id, body, userId)
  }

  /**
   * Soft delete a category by ID.
   * - Marks the category as deleted and sets `deletedAt`.
   * - Does not permanently remove the record from the database.
   *
   * @param id - Category ID to delete
   * @returns A success message
   */
  @Delete(':id')
  @Auth([AuthTypes.BEARER])
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Delete category (soft)',
    description: 'Marks the category as deleted and sets `deletedAt` (not a hard delete).',
  })
  @ApiParam({ name: 'id', type: Number, description: 'Category ID' })
  @ApiStandardResponses(HttpStatusCode.OK, RESPONSE_MESSAGES.CATEGORY.DELETED)
  async delete(@Param('id', ParseIntPipe) id: number) {
    return this.categoryService.deleteCategory(id)
  }

  /**
   * Get a paginated list of categories.
   * - Supports optional `skip` and `take` query params for pagination.
   * - Returns both the data and pagination metadata.
   *
   * @param userId - ID of the current user (may be used for filtering if needed)
   * @param skip - Number of records to skip
   * @param take - Number of records to take
   * @returns Paginated list of categories
   */
  @Get()
  @IsPublic()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'List categories (paginated)',
    description:
      'Supports `skip` & `take` for pagination. If `text` is provided, search by name/description using Elasticsearch.',
  })
  @ApiQuery({ name: 'text', required: false, type: String, description: 'Search keyword' })
  @ApiQuery({ name: 'skip', required: false, type: Number, description: 'Records to skip' })
  @ApiQuery({ name: 'take', required: false, type: Number, description: 'Records to take' })
  @ApiStandardResponses(HttpStatusCode.OK, RESPONSE_MESSAGES.CATEGORY.LIST, GetCategoriesResDTO)
  async listCategories(@Query('text') text?: string, @Query('skip') skip?: string, @Query('take') take?: string) {
    const parsedSkip = skip ? Number(skip) : undefined
    const parsedTake = take ? Number(take) : undefined

    const res = await this.categoryService.listCategories({
      text,
      skip: parsedSkip,
      take: parsedTake,
    })
    return res
  }

  /**
   * Retrieve details of a single category by ID.
   * - Throws an exception if the category is not found or deleted.
   *
   * @param id - Category ID to retrieve
   * @returns The category object
   */
  @Get(':id')
  @Auth([AuthTypes.BEARER])
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get category detail', description: 'Get one category by ID.' })
  @ApiParam({ name: 'id', type: Number, description: 'Category ID' })
  @ZodSerializerDto(CategoryResDTO)
  @ApiStandardResponses(HttpStatusCode.OK, RESPONSE_MESSAGES.CATEGORY.DETAIL, CategoryResDTO)
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.categoryService.findOne(id)
  }
}
