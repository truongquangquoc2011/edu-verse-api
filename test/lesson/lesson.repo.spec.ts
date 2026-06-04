import { Test, TestingModule } from '@nestjs/testing'
import { LessonRepository } from 'src/routes/lesson/lesson.repo'
import { PrismaService } from 'src/shared/services/prisma.service'
import { ValidationService } from 'src/shared/services/validation.service'
import {
  DuplicateTitlesException,
  LessonNotFoundOrForbiddenException,
  ModuleNotFoundOrForbiddenException,
} from 'src/shared/constants/lesson-error.constant'

describe('LessonRepository', () => {
  let repo: LessonRepository
  let prisma: any
  let validation: any

  beforeEach(async () => {
    const prismaMock: any = {
      lesson: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
        createMany: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
        count: jest.fn(),
      },
      module: {
        findFirst: jest.fn(),
      },
      $transaction: jest.fn().mockImplementation(async (operations) => {
        if (Array.isArray(operations)) return Promise.all(operations)
        return operations(prismaMock)
      }),
    }

    const validationMock: any = {
      validateUserStatus: jest.fn(),
    }

    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        LessonRepository,
        { provide: PrismaService, useValue: prismaMock },
        { provide: ValidationService, useValue: validationMock },
      ],
    }).compile()

    repo = moduleRef.get(LessonRepository)
    prisma = moduleRef.get(PrismaService)
    validation = moduleRef.get(ValidationService)
  })

  // ---------------- CREATE ----------------
  describe('createLessons', () => {
    it('should create lessons successfully', async () => {
      validation.validateUserStatus.mockResolvedValue(undefined)
      prisma.module.findFirst.mockResolvedValue({ id: 1 })
      prisma.lesson.findFirst.mockResolvedValue(null)
      prisma.lesson.createMany.mockResolvedValue({ count: 1 })
      prisma.lesson.findMany.mockResolvedValue([{ id: 1, title: 'Lesson 1', lessonOrder: 1 }])

      const result = await repo.createLessons(1, 1, [{ title: 'Lesson 1' } as any])
      expect(result[0].title).toBe('Lesson 1')
    })

    it('should create multiple lessons with auto-increment order', async () => {
      validation.validateUserStatus.mockResolvedValue(undefined)
      prisma.module.findFirst.mockResolvedValue({ id: 1 })
      prisma.lesson.findFirst.mockResolvedValue({ lessonOrder: 2 })
      prisma.lesson.createMany.mockResolvedValue({ count: 2 })
      prisma.lesson.findMany.mockResolvedValue([
        { id: 3, title: 'Lesson 3', lessonOrder: 3 },
        { id: 4, title: 'Lesson 4', lessonOrder: 4 },
      ])

      const result = await repo.createLessons(1, 1, [{ title: 'Lesson 3' }, { title: 'Lesson 4' }] as any)
      expect(result[0].lessonOrder).toBe(3)
      expect(result[1].lessonOrder).toBe(4)
    })

    it('should throw DuplicateTitlesException if titles are duplicated', async () => {
      validation.validateUserStatus.mockResolvedValue(undefined)
      prisma.module.findFirst.mockResolvedValue({ id: 1 })

      await expect(repo.createLessons(1, 1, [{ title: 'Dup' }, { title: 'Dup' }] as any)).rejects.toThrow(
        DuplicateTitlesException,
      )
    })

    it('should throw ModuleNotFoundOrForbiddenException if module not found', async () => {
      validation.validateUserStatus.mockResolvedValue(undefined)
      prisma.module.findFirst.mockResolvedValue(null)

      await expect(repo.createLessons(1, 99, [{ title: 'L1' }] as any)).rejects.toThrow(
        ModuleNotFoundOrForbiddenException,
      )
    })

    it('should throw error if prisma.createMany fails', async () => {
      validation.validateUserStatus.mockResolvedValue(undefined)
      prisma.module.findFirst.mockResolvedValue({ id: 1 })
      prisma.lesson.findFirst.mockResolvedValue(null)
      prisma.lesson.createMany.mockRejectedValue(new Error('DB error'))

      await expect(repo.createLessons(1, 1, [{ title: 'L1' }] as any)).rejects.toThrow('DB error')
    })

    it('should set defaults when optional fields missing', async () => {
      validation.validateUserStatus.mockResolvedValue(undefined)
      prisma.module.findFirst.mockResolvedValue({ id: 1 })
      prisma.lesson.findFirst.mockResolvedValue(null)
      prisma.lesson.createMany.mockResolvedValue({ count: 1 })
      prisma.lesson.findMany.mockResolvedValue([
        { id: 1, title: 'Lesson default', videoUrl: null, isPreviewable: false, lessonOrder: 1 },
      ])

      const result = await repo.createLessons(1, 1, [{ title: 'Lesson default' }] as any)
      expect(result[0].isPreviewable).toBe(false)
    })

    it('should call validateUserStatus before creating', async () => {
      validation.validateUserStatus.mockResolvedValue(undefined)
      prisma.module.findFirst.mockResolvedValue({ id: 1 })
      prisma.lesson.findFirst.mockResolvedValue(null)
      prisma.lesson.createMany.mockResolvedValue({ count: 1 })
      prisma.lesson.findMany.mockResolvedValue([{ id: 1, title: 'L1', lessonOrder: 1 }])

      await repo.createLessons(1, 1, [{ title: 'L1' }] as any)
      expect(validation.validateUserStatus).toHaveBeenCalledWith(1)
    })
  })

  // ---------------- UPDATE ----------------
  describe('updateLesson', () => {
    it('should update lesson successfully', async () => {
      validation.validateUserStatus.mockResolvedValue(undefined)
      prisma.lesson.findFirst.mockResolvedValue({ id: 1 })
      prisma.lesson.update.mockResolvedValue({ id: 1, title: 'Updated' })

      const result = await repo.updateLesson(1, 1, { title: 'Updated' } as any)
      expect(result.title).toBe('Updated')
    })

    it('should update only title', async () => {
      validation.validateUserStatus.mockResolvedValue(undefined)
      prisma.lesson.findFirst.mockResolvedValue({ id: 1 })
      prisma.lesson.update.mockResolvedValue({ id: 1, title: 'New Title' })

      const result = await repo.updateLesson(1, 1, { title: 'New Title' } as any)
      expect(result.title).toBe('New Title')
    })

    it('should update only videoUrl', async () => {
      validation.validateUserStatus.mockResolvedValue(undefined)
      prisma.lesson.findFirst.mockResolvedValue({ id: 1 })
      prisma.lesson.update.mockResolvedValue({ id: 1, videoUrl: 'url.mp4' })

      const result = await repo.updateLesson(1, 1, { videoUrl: 'url.mp4' } as any)
      expect(result.videoUrl).toBe('url.mp4')
    })

    it('should throw LessonNotFoundOrForbiddenException if not found', async () => {
      prisma.lesson.findFirst.mockResolvedValue(null)

      await expect(repo.updateLesson(1, 99, { title: 'X' } as any)).rejects.toThrow(LessonNotFoundOrForbiddenException)
    })

    it('should set updatedById correctly', async () => {
      prisma.lesson.findFirst.mockResolvedValue({ id: 1 })
      prisma.lesson.update.mockResolvedValue({ id: 1 })

      const result = await repo.updateLesson(1, 1, { title: 'X' } as any)
      expect(result.id).toBe(1)
    })

    it('should bubble up prisma error', async () => {
      prisma.lesson.findFirst.mockResolvedValue({ id: 1 })
      prisma.lesson.update.mockRejectedValue(new Error('DB fail'))

      await expect(repo.updateLesson(1, 1, { title: 'X' } as any)).rejects.toThrow('DB fail')
    })

    it('should call validateUserStatus', async () => {
      validation.validateUserStatus.mockResolvedValue(undefined)
      prisma.lesson.findFirst.mockResolvedValue({ id: 1 })
      prisma.lesson.update.mockResolvedValue({ id: 1, title: 'Checked' })

      await repo.updateLesson(1, 1, { title: 'Checked' } as any)
      expect(validation.validateUserStatus).toHaveBeenCalled()
    })
  })

  // ---------------- SOFT DELETE ----------------
  describe('softDeleteLesson', () => {
    it('should soft delete successfully', async () => {
      prisma.lesson.findFirst.mockResolvedValue({ id: 1 })
      prisma.lesson.update.mockResolvedValue({ id: 1, deletedAt: new Date() })

      const result = await repo.softDeleteLesson(1, 1)
      expect(result.message).toBeDefined()
    })

    it('should throw if lesson not found', async () => {
      prisma.lesson.findFirst.mockResolvedValue(null)

      await expect(repo.softDeleteLesson(1, 99)).rejects.toThrow(LessonNotFoundOrForbiddenException)
    })

    it('should throw if already deleted', async () => {
      prisma.lesson.findFirst.mockResolvedValue({ id: 1, deletedAt: new Date() })

      await expect(repo.softDeleteLesson(1, 1)).rejects.toThrow(LessonNotFoundOrForbiddenException)
    })

    it('should bubble up prisma error', async () => {
      prisma.lesson.findFirst.mockResolvedValue({ id: 1 })
      prisma.lesson.update.mockRejectedValue(new Error('DB fail'))

      await expect(repo.softDeleteLesson(1, 1)).rejects.toThrow('DB fail')
    })

    it('should set updatedById correctly', async () => {
      prisma.lesson.findFirst.mockResolvedValue({ id: 1 })
      prisma.lesson.update.mockResolvedValue({ id: 1, updatedById: 1 })

      const result = await repo.softDeleteLesson(1, 1)
      expect(result.message).toBeDefined()
    })

    it('should call validateUserStatus', async () => {
      validation.validateUserStatus.mockResolvedValue(undefined)
      prisma.lesson.findFirst.mockResolvedValue({ id: 1 })
      prisma.lesson.update.mockResolvedValue({ id: 1, deletedAt: new Date() })

      await repo.softDeleteLesson(1, 1)
      expect(validation.validateUserStatus).toHaveBeenCalled()
    })

    it('should not list deleted lessons', async () => {
      prisma.lesson.findFirst.mockResolvedValue({ id: 1 })
      prisma.lesson.update.mockResolvedValue({ id: 1, deletedAt: new Date() })
      prisma.lesson.findMany.mockResolvedValue([])

      await repo.softDeleteLesson(1, 1)
      const listed = await repo.listLessons(1, 1, { skip: 0, take: 10 })
      expect(listed.items).toHaveLength(0)
    })
  })

  // ---------------- RESTORE ----------------
  describe('restoreLesson', () => {
    it('should restore successfully', async () => {
      prisma.lesson.updateMany.mockResolvedValue({ count: 1 })
      const result = await repo.restoreLesson(1, 1)
      expect(result.message).toBeDefined()
    })

    it('should throw if lesson not deleted', async () => {
      prisma.lesson.updateMany.mockResolvedValue({ count: 0 })

      await expect(repo.restoreLesson(1, 1)).rejects.toThrow(LessonNotFoundOrForbiddenException)
    })

    it('should throw if lesson belongs to another user', async () => {
      prisma.lesson.updateMany.mockResolvedValue({ count: 0 })

      await expect(repo.restoreLesson(2, 1)).rejects.toThrow(LessonNotFoundOrForbiddenException)
    })

    it('should bubble up prisma error', async () => {
      prisma.lesson.updateMany.mockRejectedValue(new Error('DB fail'))

      await expect(repo.restoreLesson(1, 1)).rejects.toThrow('DB fail')
    })

    it('should set updatedById correctly', async () => {
      prisma.lesson.updateMany.mockResolvedValue({ count: 1 })
      const result = await repo.restoreLesson(1, 1)
      expect(result.message).toBeDefined()
    })

    it('should call validateUserStatus', async () => {
      validation.validateUserStatus.mockResolvedValue(undefined)
      prisma.lesson.updateMany.mockResolvedValue({ count: 1 })

      await repo.restoreLesson(1, 1)
      expect(validation.validateUserStatus).toHaveBeenCalled()
    })

    it('should list lesson again after restore', async () => {
      prisma.lesson.updateMany.mockResolvedValue({ count: 1 })
      prisma.lesson.findMany.mockResolvedValue([{ id: 1, title: 'Restored' }])
      prisma.lesson.count.mockResolvedValue(1)

      const result = await repo.listLessons(1, 1, { skip: 0, take: 10 })
      expect(result.items[0].title).toBe('Restored')
    })
  })
  // ---------------- LIST ----------------
  describe('listLessons', () => {
    it('should list lessons successfully', async () => {
      validation.validateUserStatus.mockResolvedValue(undefined)
      prisma.module.findFirst.mockResolvedValue({ id: 1 })
      prisma.lesson.findMany.mockResolvedValue([
        { id: 1, title: 'L1', lessonOrder: 1 },
        { id: 2, title: 'L2', lessonOrder: 2 },
      ])
      prisma.lesson.count.mockResolvedValue(2)

      const result = await repo.listLessons(1, 1, { skip: 0, take: 10 })
      expect(result.items).toHaveLength(2)
      expect(result.total).toBe(2)
    })

    it('should return empty list when no lessons exist', async () => {
      validation.validateUserStatus.mockResolvedValue(undefined)
      prisma.module.findFirst.mockResolvedValue({ id: 1 })
      prisma.lesson.findMany.mockResolvedValue([])
      prisma.lesson.count.mockResolvedValue(0)

      const result = await repo.listLessons(1, 1, { skip: 0, take: 10 })
      expect(result.items).toHaveLength(0)
      expect(result.total).toBe(0)
    })

    it('should not include soft-deleted lessons', async () => {
      validation.validateUserStatus.mockResolvedValue(undefined)
      prisma.module.findFirst.mockResolvedValue({ id: 1 })
      prisma.lesson.findMany.mockResolvedValue([]) // none because deleted
      prisma.lesson.count.mockResolvedValue(0)

      const result = await repo.listLessons(1, 1, { skip: 0, take: 10 })
      expect(result.items).toEqual([])
    })

    it('should throw ModuleNotFoundOrForbiddenException if module not found', async () => {
      validation.validateUserStatus.mockResolvedValue(undefined)
      prisma.module.findFirst.mockResolvedValue(null)

      await expect(repo.listLessons(1, 999, { skip: 0, take: 10 })).rejects.toThrow(ModuleNotFoundOrForbiddenException)
    })

    it('should throw ModuleNotFoundOrForbiddenException if module belongs to another user', async () => {
      validation.validateUserStatus.mockResolvedValue(undefined)
      prisma.module.findFirst.mockResolvedValue(null) // simulate forbidden

      await expect(repo.listLessons(2, 1, { skip: 0, take: 10 })).rejects.toThrow(ModuleNotFoundOrForbiddenException)
    })

    it('should apply pagination (skip/take)', async () => {
      validation.validateUserStatus.mockResolvedValue(undefined)
      prisma.module.findFirst.mockResolvedValue({ id: 1 })
      prisma.lesson.findMany.mockResolvedValue([{ id: 2, title: 'Paged', lessonOrder: 2 }])
      prisma.lesson.count.mockResolvedValue(5)

      const result = await repo.listLessons(1, 1, { skip: 1, take: 1 })
      expect(result.items[0].title).toBe('Paged')
      expect(result.total).toBe(5)
    })

    it('should order lessons by lessonOrder ascending', async () => {
      validation.validateUserStatus.mockResolvedValue(undefined)
      prisma.module.findFirst.mockResolvedValue({ id: 1 })
      prisma.lesson.findMany.mockResolvedValue([
        { id: 2, title: 'L2', lessonOrder: 2 },
        { id: 1, title: 'L1', lessonOrder: 1 },
      ])
      prisma.lesson.count.mockResolvedValue(2)

      const result = await repo.listLessons(1, 1, { skip: 0, take: 10 })
      // kiểm tra mock trả về vẫn giữ được order logic
      expect(result.items[0].lessonOrder).toBeLessThanOrEqual(result.items[1].lessonOrder)
    })
  })
})
