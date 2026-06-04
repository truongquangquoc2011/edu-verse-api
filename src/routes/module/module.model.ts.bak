import { z } from 'zod'
import { ERROR_MESSAGE } from 'src/shared/constants/error-message.constant'
import { PaginationQuerySchema, PaginationResBaseSchema } from 'src/shared/models/pagination.model'

const MODULE_ERR = ERROR_MESSAGE.VALIDATION.MODULE

export const CreateModuleSchema = z.object({
  title: z
    .string({
      required_error: MODULE_ERR.TITLE_REQUIRED,
      invalid_type_error: MODULE_ERR.TITLE_INVALID,
    })
    .min(1, { message: MODULE_ERR.TITLE_EMPTY })
    .max(255, { message: MODULE_ERR.TITLE_MAX }),

  description: z
      .string({ invalid_type_error: MODULE_ERR.DESCRIPTION_INVALID })
      .nullable()
      .optional(),

  chapterOrder: z.coerce
    .number({ invalid_type_error: MODULE_ERR.CHAPTER_ORDER_INVALID })
    .int()
    .nonnegative()
    .optional(),
}).strict()

export const CreateModuleResSchema = z.object({
  id: z.number(),
  courseId: z.number(),
  title: z.string(),
  description: z.string().nullable(),
  chapterOrder: z.number(),
  createdAt: z.date(),
  updatedAt: z.date(),
})
export const ModuleQuizResultSchema = z.object({
  score: z.number(),
  submitted_at: z.date().nullable(), 
})
export const UpdateModuleSchema = CreateModuleSchema.partial().strict()
export const UpdateModuleResSchema = CreateModuleResSchema

export const ListModulesResSchema = PaginationResBaseSchema.extend({
  items: z.array(CreateModuleResSchema),
})

export const ListModulesQuerySchema = PaginationQuerySchema

/**
 * CLIENT: Module list for study page.
 * Used when the learner is inside a course and needs to see modules
 * with basic info and progress (lessonCount, completedLessonCount).
 */
export const ModuleStudyItemSchema = z.object({
  id: z.number(),
  title: z.string(),
  description: z.string().nullable(),
  chapterOrder: z.number().int(),
  lessonCount: z.number().int().nonnegative().describe('Total lessons in this module'),
  completedLessonCount: z
    .number()
    .int()
    .nonnegative()
    .describe('Number of completed lessons in this module for current user'),
})

// Query for listing modules in study context (still using generic pagination)
export const ListModuleStudyQuerySchema = PaginationQuerySchema

// Response for listing modules in study context
export const ListModuleStudyResSchema = PaginationResBaseSchema.extend({
  items: z.array(ModuleStudyItemSchema),
})


export const ModuleQuizItemSchema = z.object({
  id: z.number(),
  title: z.string(),
  description: z.string().nullable(),
  status: z.string().describe('Quiz status (e.g. Draft, Published, ...)'),
  quiz_result: ModuleQuizResultSchema.nullable().optional(),
})

export const ListModuleQuizQuerySchema = PaginationQuerySchema

export const ListModuleQuizResSchema = PaginationResBaseSchema.extend({
  items: z.array(ModuleQuizItemSchema),
})


export type CreateModuleType = z.infer<typeof CreateModuleSchema>
export type CreateModuleResType = z.infer<typeof CreateModuleResSchema>
export type UpdateModuleType = z.infer<typeof UpdateModuleSchema>
export type UpdateModuleResType = z.infer<typeof UpdateModuleResSchema>
export type ModuleResType = z.infer<typeof CreateModuleResSchema>
export type ListModulesResType = z.infer<typeof ListModulesResSchema>

export type ModuleStudyItemType = z.infer<typeof ModuleStudyItemSchema>
export type ListModuleStudyQueryType = z.infer<typeof ListModuleStudyQuerySchema>
export type ListModuleStudyResType = z.infer<typeof ListModuleStudyResSchema>

export type ModuleQuizItemType = z.infer<typeof ModuleQuizItemSchema>
export type ListModuleQuizQueryType = z.infer<typeof ListModuleQuizQuerySchema>
export type ListModuleQuizResType = z.infer<typeof ListModuleQuizResSchema>
export type ModuleQuizResultType = z.infer<typeof ModuleQuizResultSchema>;