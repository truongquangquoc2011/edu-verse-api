import { CourseStatus } from '@prisma/client'
import { ERROR_MESSAGE } from 'src/shared/constants/error-message.constant'
import { PaginationQuerySchema, PaginationResBaseSchema } from 'src/shared/models/pagination.model'
import { z } from 'zod'

const COURSE_ERR = ERROR_MESSAGE.VALIDATION.COURSE

// Base schema
const BaseIdSchema = z.object({
  id: z.number(),
})

const BaseTimestampSchema = z.object({
  createdAt: z.date(),
  updatedAt: z.date(),
})

export const CourseStatusEnum = z.nativeEnum(CourseStatus)

export const CreateCourseSchema = z
  .object({
    title: z
      .string({
        required_error: COURSE_ERR.TITLE_REQUIRED,
        invalid_type_error: COURSE_ERR.TITLE_REQUIRED,
      })
      .min(1, { message: COURSE_ERR.TITLE_EMPTY })
      .max(255, { message: COURSE_ERR.TITLE_MAX }),

    description: z.string({ invalid_type_error: COURSE_ERR.DESCRIPTION_INVALID }).optional(),

    thumbnail: z
      .string({ invalid_type_error: COURSE_ERR.THUMBNAIL_INVALID })
      .url({ message: COURSE_ERR.THUMBNAIL_INVALID })
      .optional(),

    videoUrl: z
      .string({ invalid_type_error: COURSE_ERR.VIDEO_URL_INVALID })
      .url({ message: COURSE_ERR.VIDEO_URL_INVALID })
      .optional(),

    categoryId: z
      .number({ invalid_type_error: COURSE_ERR.CATEGORY_ID_INVALID })
      .int({ message: COURSE_ERR.CATEGORY_ID_INVALID })
      .optional(),

    price: z.coerce
      .number({ invalid_type_error: COURSE_ERR.PRICE_INVALID })
      .nonnegative({ message: COURSE_ERR.PRICE_NONNEGATIVE }),

    hashtagIds: z
      .array(
        z
          .number({
            invalid_type_error: COURSE_ERR.HASHTAG_IDS_INVALID,
          })
          .int({ message: COURSE_ERR.HASHTAG_IDS_INVALID }),
        {
          invalid_type_error: COURSE_ERR.HASHTAG_IDS_INVALID,
        },
      )
      .optional(),

    isFree: z.boolean({ invalid_type_error: COURSE_ERR.ISFREE_INVALID }).optional(),
    isFeatured: z.boolean({ invalid_type_error: COURSE_ERR.ISFEATURED_INVALID }).optional(),
    isPreorder: z.boolean({ invalid_type_error: COURSE_ERR.ISPREORDER_INVALID }).optional(),

    previewDescription: z.string({ invalid_type_error: COURSE_ERR.PREVIEW_DESCRIPTION_INVALID }).optional(),
  })
  .strict()

export const CreateCourseResSchema = BaseIdSchema.extend({
  status: z.string(),
})

export const UpdateCourseSchema = CreateCourseSchema.partial().strict()

export const UpdateCourseResSchema = BaseIdSchema.extend({
  status: z.string(),
  updatedAt: z.date(),
})

// ADD: Response detail for a course
export const GetCourseResSchema = BaseIdSchema.extend({
  title: z.string().min(1).describe('Course title'),
  description: z.string().nullable().optional().describe('Optional course description'),
  thumbnail: z.string().url().nullable().optional().describe('Optional thumbnail URL'),
  videoUrl: z.string().url().nullable().optional().describe('Optional course video URL'),
  categoryId: z.number().int().positive().nullable().optional().describe('Optional category ID'),
  price: z.number().min(0).describe('Course price (must be non-negative)'),
  isFree: z.boolean().describe('Is the course free?'),
  isFeatured: z.boolean().describe('Is the course featured?'),
  isPreorder: z.boolean().describe('Is the course available for preorder?'),
  hasPreview: z.boolean().describe('Does the course have a preview?'),
  previewDescription: z.string().nullable().optional().describe('Optional preview description'),
  status: CourseStatusEnum.describe('Course status enum'),
}).merge(BaseTimestampSchema)

// ADD: Query + Response for list
export const ListCourseQuerySchema = PaginationQuerySchema.extend({
  status: CourseStatusEnum.optional(),
  categoryId: z.coerce.number().int().positive().optional(),
  text: z.string().optional(),
})

export const ListCourseResSchema = PaginationResBaseSchema.extend({
  items: z.array(GetCourseResSchema),
})

// ADD: update status
export const UpdateCourseStatusSchema = z.object({
  status: CourseStatusEnum.describe('New status to update'),
})

export const UpdateCourseStatusResSchema = BaseIdSchema.extend({
  status: CourseStatusEnum.describe('Updated status'),
  updatedAt: z.date().describe('Update timestamp'),
})

// ADD: Builder summary
export const BuilderModuleSchema = BaseIdSchema.extend({
  title: z.string().min(1).describe('Module title'),
  chapterOrder: z.number().int().nonnegative().describe('Order of the chapter'),
})

export const BuilderLessonSchema = BaseIdSchema.extend({
  title: z.string().min(1).describe('Lesson title'),
  videoUrl: z.string().url().nullable().optional().describe('Optional video URL'),
  documentUrl: z.string().url().nullable().optional().describe('Optional document URL'),
  lessonOrder: z.number().int().nonnegative().describe('Order of the lesson'),
  isPreviewable: z.boolean().describe('Can this lesson be previewed?'),
  chapterId: z.number().int().positive().describe('Associated chapter ID'),
})

export const CourseBuilderResSchema = z.object({
  course: GetCourseResSchema.describe('Detailed course info'),
  moduleCount: z.number().int().nonnegative().describe('Number of modules'),
  lessonCount: z.number().int().nonnegative().describe('Number of lessons'),
})

/**
 * CLIENT: Enrolled course list (for "My courses" page)
 */

// teacher info (mapped Course.createdBy to User)
export const EnrolledCourseTeacherSchema = z.object({
  id: z.number().describe('Teacher / creator user id'),
  name: z.string().describe('Teacher name'),
  avatar: z.string().nullable().describe('Teacher avatar URL'),
})

// category info
export const EnrolledCourseCategorySchema = z.object({
  id: z.number().describe('Category id'),
  name: z.string().describe('Category name'),
})

// enrollment progress info for a course of user
export const EnrollmentProgressSchema = z.object({
  status: z.string().describe('Enrollment status enum'),
  progress: z.number().int().min(0).max(100).describe('Progress percent (0-100)'),
  completedLessonCount: z.number().int().nonnegative().describe('Number of completed lessons'),
  totalLessons: z.number().int().nonnegative().describe('Total lessons in this course'),
  enrolledAt: z.date().nullable().describe('When the user enrolled into this course'),
})

// a item in list courses enrollment
export const EnrolledCourseItemSchema = z.object({
  id: z.number(),
  title: z.string(),
  description: z.string().nullable(),
  thumbnail: z.string().nullable(),
  category: EnrolledCourseCategorySchema.nullable(),
  teacher: EnrolledCourseTeacherSchema.nullable(),
  enrollment: EnrollmentProgressSchema,
})

export const PublicCourseDetailSchema = GetCourseResSchema.omit({
  categoryId: true,
}).extend({
  category: EnrolledCourseCategorySchema.nullable(),
  teacher: EnrolledCourseTeacherSchema.nullable(),
})

// Query pagination for list enrolled course
export const ListEnrolledCourseQuerySchema = PaginationQuerySchema

// Response list enrolled course (pagination)
export const ListEnrolledCourseResSchema = PaginationResBaseSchema.extend({
  items: z.array(EnrolledCourseItemSchema),
})
export const PublicCourseListResSchema = PaginationResBaseSchema.extend({
  items: z.array(PublicCourseDetailSchema),
})
export const CourseStudyResSchema = EnrolledCourseItemSchema
// ==== Types ====
export type CreateCourseType = z.infer<typeof CreateCourseSchema>
export type CreateCourseResType = z.infer<typeof CreateCourseResSchema>
export type UpdateCourseType = z.infer<typeof UpdateCourseSchema>
export type UpdateCourseResType = z.infer<typeof UpdateCourseResSchema>
export type GetCourseResType = z.infer<typeof GetCourseResSchema>
export type ListCourseQueryType = z.infer<typeof ListCourseQuerySchema>
export type ListCourseResType = z.infer<typeof ListCourseResSchema>
export type UpdateCourseStatusType = z.infer<typeof UpdateCourseStatusSchema>
export type UpdateCourseStatusResType = z.infer<typeof UpdateCourseStatusResSchema>
export type CourseBuilderResType = z.infer<typeof CourseBuilderResSchema>

// client types
export type EnrolledCourseTeacherType = z.infer<typeof EnrolledCourseTeacherSchema>
export type EnrolledCourseCategoryType = z.infer<typeof EnrolledCourseCategorySchema>
export type EnrollmentProgressType = z.infer<typeof EnrollmentProgressSchema>
export type EnrolledCourseItemType = z.infer<typeof EnrolledCourseItemSchema>
export type ListEnrolledCourseQueryType = z.infer<typeof ListEnrolledCourseQuerySchema>
export type ListEnrolledCourseResType = z.infer<typeof ListEnrolledCourseResSchema>
export type CourseStudyResType = z.infer<typeof CourseStudyResSchema>
export type PublicCourseDetailType = z.infer<typeof PublicCourseDetailSchema>
export type PublicCourseListResType = z.infer<typeof PublicCourseListResSchema>
