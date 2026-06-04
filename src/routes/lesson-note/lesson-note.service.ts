import { Injectable } from '@nestjs/common'
import { LessonNoteRepository } from './lesson-note.repo'
import {
  CreateLessonNoteType,
  PinLessonNoteType,
  UpdateLessonNoteType,
  ListLessonNotesResType,
  LessonNoteResType,
} from './lesson-note.model'
import { PaginationQueryType } from '../../shared/models/pagination.model'

@Injectable()
export class LessonNoteService {
  constructor(private readonly repo: LessonNoteRepository) {}

  /**
   * Create a new lesson note for a specific lesson.
   *
   * - Delegates lesson access validation and database creation to repository layer.
   *
   * @param userId - ID of the authenticated user
   * @param lessonId - ID of the lesson
   * @param payload - Note creation payload
   * @returns The created lesson note
   */
  createNote(userId: number, lessonId: number, payload: CreateLessonNoteType): Promise<LessonNoteResType> {
    return this.repo.createNote(userId, lessonId, payload)
  }

  /**
   * List notes of the authenticated user in a lesson.
   *
   * - Delegates lesson access validation, pagination, and sorting to repository layer.
   *
   * @param userId - ID of the authenticated user
   * @param lessonId - ID of the lesson
   * @param query - Pagination query (`skip`, `take`)
   * @returns Paginated lesson notes
   */
  listNotes(userId: number, lessonId: number, query: PaginationQueryType): Promise<ListLessonNotesResType> {
    return this.repo.listNotes(userId, lessonId, query)
  }

  /**
   * Get detail of a specific lesson note.
   *
   * - Only the owner of the note can access it.
   *
   * @param userId - ID of the authenticated user
   * @param noteId - ID of the note
   * @returns Lesson note detail
   */
  getNoteDetail(userId: number, noteId: number): Promise<LessonNoteResType> {
    return this.repo.getNoteDetail(userId, noteId)
  }

  /**
   * Update an existing lesson note.
   *
   * - Only the owner of the note can update it.
   *
   * @param userId - ID of the authenticated user
   * @param noteId - ID of the note
   * @param payload - Update payload
   * @returns Updated lesson note
   */
  updateNote(userId: number, noteId: number, payload: UpdateLessonNoteType): Promise<LessonNoteResType> {
    return this.repo.updateNote(userId, noteId, payload)
  }

  /**
   * Pin or unpin an existing lesson note.
   *
   * - Only the owner of the note can modify its pinned status.
   *
   * @param userId - ID of the authenticated user
   * @param noteId - ID of the note
   * @param payload - Pinned status payload
   * @returns Updated lesson note
   */
  pinNote(userId: number, noteId: number, payload: PinLessonNoteType): Promise<LessonNoteResType> {
    return this.repo.pinNote(userId, noteId, payload)
  }

  /**
   * Soft delete a lesson note.
   *
   * - Only the owner of the note can delete it.
   *
   * @param userId - ID of the authenticated user
   * @param noteId - ID of the note
   * @returns Confirmation message
   */
  deleteNote(userId: number, noteId: number): Promise<{ message: string }> {
    return this.repo.softDeleteNote(userId, noteId)
  }
}