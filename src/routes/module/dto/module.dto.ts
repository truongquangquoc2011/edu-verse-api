import { createZodDto } from 'nestjs-zod'
import {
  CreateModuleSchema,
  CreateModuleResSchema,
  UpdateModuleSchema,
  UpdateModuleResSchema,
  ListModulesResSchema,
  ListModulesQuerySchema,
  ModuleStudyItemSchema,
  ListModuleStudyResSchema,
  ListModuleStudyQuerySchema,
  ModuleQuizItemSchema,
  ListModuleQuizResSchema,
  ListModuleQuizQuerySchema,
} from '../module.model'

export class CreateModuleDTO extends createZodDto(CreateModuleSchema) {}
export class CreateModuleResDTO extends createZodDto(CreateModuleResSchema) {}

export class UpdateModuleDTO extends createZodDto(UpdateModuleSchema) {}
export class UpdateModuleResDTO extends createZodDto(UpdateModuleResSchema) {}

export class ListModulesResDTO extends createZodDto(ListModulesResSchema) {}
export class ListModulesQueryDTO extends createZodDto(ListModulesQuerySchema) {}

// CLIENT: DTOs for study module listing
export class ModuleStudyItemDTO extends createZodDto(ModuleStudyItemSchema) {}
export class ListModuleStudyResDTO extends createZodDto(ListModuleStudyResSchema) {}
export class ListModuleStudyQueryDTO extends createZodDto(ListModuleStudyQuerySchema) {}

// CLIENT: DTOs for quiz list inside a module
export class ModuleQuizItemDTO extends createZodDto(ModuleQuizItemSchema) {}
export class ListModuleQuizResDTO extends createZodDto(ListModuleQuizResSchema) {}
export class ListModuleQuizQueryDTO extends createZodDto(ListModuleQuizQuerySchema) {}