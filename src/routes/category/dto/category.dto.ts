import { createZodDto } from 'nestjs-zod'
import {
  CategoryPublicSchema,
  CreateCategoryBodySchema,
  GetCategoriesResponseSchema,
  ListCategoryFilterSchema,
  UpdateCategoryBodySchema,
} from '../category.model'

export class CreateCategoryDTO extends createZodDto(CreateCategoryBodySchema) {}
export class UpdateCategoryDTO extends createZodDto(UpdateCategoryBodySchema) {}
export class CategoryResDTO extends createZodDto(CategoryPublicSchema) {}
export class GetCategoriesResDTO extends createZodDto(GetCategoriesResponseSchema) {}
export class ListCategoryFilterDTO extends createZodDto(ListCategoryFilterSchema) {}
