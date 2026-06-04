import { z } from 'zod'
import { PaginationQuerySchema, PaginationResBaseSchema } from '../../shared/models/pagination.model'

/**
 * Schema for creating a new lesson note.
 *
 * - `content` is required and limited to 2000 characters.
 * - `timestampSec` represents the video timestamp in seconds.
 */
export const CreateLessonNoteSchema = z
  .object({
    content: z.string().min(1).max(2000),
    timestampSec: z.coerce.number().int().nonnegative(),
  })
  .strict()

/**
 * Schema for updating an existing lesson note.
 *
 * - Allows updating note content.
 * - Allows updating timestamp.
 * - Allows updating pinned status.
 */
export const UpdateLessonNoteSchema = z
  .object({
    content: z.string().min(1).max(2000).optional(),
    timestampSec: z.coerce.number().int().nonnegative().optional(),
    isPinned: z.boolean().optional(),
  })
  .strict()

/**
 * Public response schema for a lesson note.
 */
export const LessonNoteResSchema = z.object({
  id: z.number(),
  userId: z.number(),
  courseId: z.number(),
  lessonId: z.number(),
  content: z.string(),
  timestampSec: z.number(),
  isPinned: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
})

/**
 * Pagination query schema for listing lesson notes.
 */
export const ListLessonNotesQuerySchema = PaginationQuerySchema

/**
 * Paginated response schema for lesson note listing.
 */
export const ListLessonNotesResSchema = PaginationResBaseSchema.extend({
  items: z.array(LessonNoteResSchema),
})

/**
 * Schema for pinning or unpinning a lesson note.
 */
export const PinLessonNoteSchema = z
  .object({
    isPinned: z.boolean(),
  })
  .strict()

export type CreateLessonNoteType = z.infer<typeof CreateLessonNoteSchema>
export type UpdateLessonNoteType = z.infer<typeof UpdateLessonNoteSchema>
export type LessonNoteResType = z.infer<typeof LessonNoteResSchema>
export type ListLessonNotesQueryType = z.infer<typeof ListLessonNotesQuerySchema>
export type ListLessonNotesResType = z.infer<typeof ListLessonNotesResSchema>
export type PinLessonNoteType = z.infer<typeof PinLessonNoteSchema>