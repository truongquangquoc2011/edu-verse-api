import { BadRequestException, Injectable } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { PrismaService } from '../../shared/services/prisma.service'
import { ValidationService } from '../../shared/services/validation.service'
import { PaginationQueryType } from '../../shared/models/pagination.model'
import {
  CreateLessonNoteType,
  LessonNoteResType,
  ListLessonNotesResType,
  PinLessonNoteType,
  UpdateLessonNoteType,
} from './lesson-note.model'
import { DuplicateLessonNoteTimestampException } from '../../shared/constants/lesson-note-error.constant'

@Injectable()
export class LessonNoteRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly validation: ValidationService,
  ) {}
  /**
   * Ensure the user does not already have another active note
   * at the same timestamp within the same lesson.
   *
   * @param userId - ID of the authenticated user
   * @param lessonId - ID of the lesson
   * @param timestampSec - Video timestamp in seconds
   * @param excludeNoteId - Optional note ID to exclude when updating
   */
  private async ensureUniqueTimestampPerLesson(
    userId: number,
    lessonId: number,
    timestampSec: number,
    excludeNoteId?: number,
  ): Promise<void> {
    const existing = await this.prisma.lessonNote.findFirst({
      where: {
        userId,
        lessonId,
        timestampSec,
        isDelete: false,
        deletedAt: null,
        ...(excludeNoteId ? { id: { not: excludeNoteId } } : {}),
      },
      select: { id: true },
    })

    if (existing) {
      throw DuplicateLessonNoteTimestampException
    }
  }
  /**
   * Ensure that the authenticated user can access the target lesson.
   *
   * - Validates user status first.
   * - Ensures the lesson exists and is not deleted.
   * - Ensures the parent module exists and is not deleted.
   * - Ensures the parent course exists and is not deleted.
   * - Ensures the user is enrolled in the parent course.
   *
   * @param userId - ID of the authenticated user
   * @param lessonId - ID of the lesson
   * @returns Minimal lesson information including parent course ID
   * @throws BadRequestException if the lesson is inaccessible
   */
  private async ensureUserCanAccessLesson(
    userId: number,
    lessonId: number,
  ): Promise<{
    id: number
    module: {
      courseId: number
    }
  }> {
    await this.validation.validateUserStatus(userId)

    const lesson = await this.prisma.lesson.findFirst({
      where: {
        id: lessonId,
        deletedAt: null,
        module: {
          isDelete: false,
          course: {
            isDelete: false,
            enrollments: {
              some: {
                userId,
                isDelete: false,
              },
            },
          },
        },
      },
      select: {
        id: true,
        module: {
          select: {
            courseId: true,
          },
        },
      },
    })

    if (!lesson) {
      throw new BadRequestException('Lesson not accessible')
    }

    return lesson
  }

  /**
   * Ensure that the target note exists and belongs to the authenticated user.
   *
   * - Note must not be soft-deleted.
   *
   * @param userId - ID of the authenticated user
   * @param noteId - ID of the note
   * @returns The matched lesson note
   * @throws BadRequestException if the note does not exist or does not belong to the user
   */
  private async ensureNoteOwnership(userId: number, noteId: number): Promise<LessonNoteResType> {
    await this.validation.validateUserStatus(userId)

    const note = await this.prisma.lessonNote.findFirst({
      where: {
        id: noteId,
        userId,
        isDelete: false,
        deletedAt: null,
      },
      select: {
        id: true,
        userId: true,
        courseId: true,
        lessonId: true,
        content: true,
        timestampSec: true,
        isPinned: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    if (!note) {
      throw new BadRequestException('Note not found')
    }

    return note
  }

  /**
   * Create a new lesson note.
   *
   * - Ensures the user can access the lesson.
   * - Automatically derives `courseId` from the lesson's parent module.
   * - Stores the current user as creator.
   *
   * @param userId - ID of the authenticated user
   * @param lessonId - ID of the lesson
   * @param payload - Note creation payload
   * @returns The created lesson note
   */
  async createNote(userId: number, lessonId: number, payload: CreateLessonNoteType): Promise<LessonNoteResType> {
    const lesson = await this.ensureUserCanAccessLesson(userId, lessonId)
    await this.ensureUniqueTimestampPerLesson(userId, lessonId, payload.timestampSec)

    return this.prisma.lessonNote.create({
      data: {
        userId,
        lessonId,
        courseId: lesson.module.courseId,
        content: payload.content,
        timestampSec: payload.timestampSec,
        createdById: userId,
      },
      select: {
        id: true,
        userId: true,
        courseId: true,
        lessonId: true,
        content: true,
        timestampSec: true,
        isPinned: true,
        createdAt: true,
        updatedAt: true,
      },
    })
  }

  /**
   * List lesson notes of the authenticated user within a lesson.
   *
   * - Ensures the user can access the lesson.
   * - Only returns notes created by the current user.
   * - Excludes soft-deleted notes.
   * - Orders notes by pinned status first, then by timestamp ascending.
   * - Supports pagination through `skip` and `take`.
   *
   * @param userId - ID of the authenticated user
   * @param lessonId - ID of the lesson
   * @param query - Pagination query
   * @returns Paginated lesson note list
   */
  async listNotes(userId: number, lessonId: number, query: PaginationQueryType): Promise<ListLessonNotesResType> {
    await this.ensureUserCanAccessLesson(userId, lessonId)

    const where: Prisma.LessonNoteWhereInput = {
      userId,
      lessonId,
      isDelete: false,
      deletedAt: null,
    }

    const [items, total] = await Promise.all([
      this.prisma.lessonNote.findMany({
        where,
        select: {
          id: true,
          userId: true,
          courseId: true,
          lessonId: true,
          content: true,
          timestampSec: true,
          isPinned: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: [{ isPinned: 'desc' }, { timestampSec: 'asc' }],
        skip: query.skip,
        take: query.take,
      }),
      this.prisma.lessonNote.count({ where }),
    ])

    return {
      items,
      total,
      skip: query.skip,
      take: query.take,
    }
  }

  /**
   * Get detail of a lesson note.
   *
   * - Ensures note ownership.
   *
   * @param userId - ID of the authenticated user
   * @param noteId - ID of the note
   * @returns Lesson note detail
   */
  async getNoteDetail(userId: number, noteId: number): Promise<LessonNoteResType> {
    return this.ensureNoteOwnership(userId, noteId)
  }

  /**
   * Update a lesson note.
   *
   * - Ensures note ownership before updating.
   * - Stores the current user as updater.
   *
   * @param userId - ID of the authenticated user
   * @param noteId - ID of the note
   * @param payload - Update payload
   * @returns Updated lesson note
   */
  async updateNote(userId: number, noteId: number, payload: UpdateLessonNoteType): Promise<LessonNoteResType> {
    await this.ensureNoteOwnership(userId, noteId)
    
    return this.prisma.lessonNote.update({
      where: { id: noteId },
      data: {
        ...payload,
        updatedById: userId,
      },
      select: {
        id: true,
        userId: true,
        courseId: true,
        lessonId: true,
        content: true,
        timestampSec: true,
        isPinned: true,
        createdAt: true,
        updatedAt: true,
      },
    })
  }

  /**
   * Pin or unpin a lesson note.
   *
   * - Ensures note ownership before updating pinned status.
   * - Stores the current user as updater.
   *
   * @param userId - ID of the authenticated user
   * @param noteId - ID of the note
   * @param payload - Pinned status payload
   * @returns Updated lesson note
   */
  async pinNote(userId: number, noteId: number, payload: PinLessonNoteType): Promise<LessonNoteResType> {
    await this.ensureNoteOwnership(userId, noteId)

    return this.prisma.lessonNote.update({
      where: { id: noteId },
      data: {
        isPinned: payload.isPinned,
        updatedById: userId,
      },
      select: {
        id: true,
        userId: true,
        courseId: true,
        lessonId: true,
        content: true,
        timestampSec: true,
        isPinned: true,
        createdAt: true,
        updatedAt: true,
      },
    })
  }

  /**
   * Soft delete a lesson note.
   *
   * - Ensures note ownership before deletion.
   * - Sets `isDelete = true` and `deletedAt`.
   *
   * @param userId - ID of the authenticated user
   * @param noteId - ID of the note
   * @returns Confirmation message
   */
  async softDeleteNote(userId: number, noteId: number): Promise<{ message: string }> {
    await this.ensureNoteOwnership(userId, noteId)

    await this.prisma.lessonNote.update({
      where: { id: noteId },
      data: {
        isDelete: true,
        deletedAt: new Date(),
        updatedById: userId,
      },
    })

    return { message: 'Lesson note deleted successfully' }
  }
}
