import { Test, TestingModule } from '@nestjs/testing'
import { LessonService } from 'src/routes/lesson/lesson.service'
import { LessonRepository } from 'src/routes/lesson/lesson.repo'

describe('LessonService', () => {
  let service: LessonService
  let repo: jest.Mocked<LessonRepository>

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LessonService,
        {
          provide: LessonRepository,
          useValue: {
            createLessons: jest.fn(),
            updateLesson: jest.fn(),
            softDeleteLesson: jest.fn(),
            restoreLesson: jest.fn(),
            listLessons: jest.fn(),
          },
        },
      ],
    }).compile()

    service = module.get<LessonService>(LessonService)
    repo = module.get(LessonRepository)
  })

  // ---------- CREATE ----------
  describe('createLessons', () => {
    it('should call repo.createLessons with correct args', async () => {
      repo.createLessons.mockResolvedValue([{ id: 1, title: 'L1' }] as any)

      const result = await service.createLessons(1, 2, [{ title: 'L1' }] as any)

      expect(repo.createLessons).toHaveBeenCalledWith(1, 2, [{ title: 'L1' }])
      expect(result[0].title).toBe('L1')
    })

    it('should return lessons from repo', async () => {
      const lessons = [{ id: 1, title: 'L1' }]
      repo.createLessons.mockResolvedValue(lessons as any)

      const result = await service.createLessons(1, 2, lessons as any)
      expect(result).toEqual(lessons)
    })

    it('should bubble up error from repo', async () => {
      repo.createLessons.mockRejectedValue(new Error('create fail'))

      await expect(service.createLessons(1, 2, [{ title: 'L1' }] as any)).rejects.toThrow('create fail')
    })

    it('should handle empty payload', async () => {
      repo.createLessons.mockResolvedValue([])

      const result = await service.createLessons(1, 2, [] as any)
      expect(result).toEqual([])
    })

    it('should support multiple lessons', async () => {
      repo.createLessons.mockResolvedValue([
        { id: 1, title: 'L1' },
        { id: 2, title: 'L2' },
      ] as any)

      const result = await service.createLessons(1, 2, [{ title: 'L1' }, { title: 'L2' }] as any)
      expect(result).toHaveLength(2)
    })
  })

  // ---------- UPDATE ----------
  describe('updateLesson', () => {
    it('should call repo.updateLesson with correct args', async () => {
      repo.updateLesson.mockResolvedValue({ id: 1, title: 'Updated' } as any)

      const result = await service.updateLesson(1, 1, { title: 'Updated' } as any)

      expect(repo.updateLesson).toHaveBeenCalledWith(1, 1, { title: 'Updated' })
      expect(result.title).toBe('Updated')
    })

    it('should return updated lesson', async () => {
      repo.updateLesson.mockResolvedValue({ id: 1, title: 'Updated' } as any)

      const result = await service.updateLesson(1, 1, { title: 'Updated' } as any)
      expect(result).toEqual({ id: 1, title: 'Updated' })
    })

    it('should bubble up error from repo', async () => {
      repo.updateLesson.mockRejectedValue(new Error('update fail'))

      await expect(service.updateLesson(1, 1, { title: 'X' } as any)).rejects.toThrow('update fail')
    })

    it('should handle partial update', async () => {
      repo.updateLesson.mockResolvedValue({ id: 1, videoUrl: 'vid.mp4' } as any)

      const result = await service.updateLesson(1, 1, { videoUrl: 'vid.mp4' } as any)
      expect(result.videoUrl).toBe('vid.mp4')
    })

    it('should call repo with userId', async () => {
      repo.updateLesson.mockResolvedValue({ id: 1 } as any)

      await service.updateLesson(99, 5, { title: 'Check' } as any)
      expect(repo.updateLesson).toHaveBeenCalledWith(99, 5, { title: 'Check' })
    })
  })

  // ---------- SOFT DELETE ----------
  describe('softDeleteLesson', () => {
    it('should call repo.softDeleteLesson with correct args', async () => {
      repo.softDeleteLesson.mockResolvedValue({ message: 'deleted' })

      const result = await service.deleteLesson(1, 1)
      expect(repo.softDeleteLesson).toHaveBeenCalledWith(1, 1)
      expect(result.message).toBe('deleted')
    })

    it('should return success message', async () => {
      repo.softDeleteLesson.mockResolvedValue({ message: 'deleted' })

      const result = await service.deleteLesson(1, 1)
      expect(result).toEqual({ message: 'deleted' })
    })

    it('should bubble up error from repo', async () => {
      repo.softDeleteLesson.mockRejectedValue(new Error('delete fail'))

      await expect(service.deleteLesson(1, 1)).rejects.toThrow('delete fail')
    })

    it('should handle non-existing lesson gracefully', async () => {
      repo.softDeleteLesson.mockResolvedValue({ message: 'deleted' })

      const result = await service.deleteLesson(1, 999)
      expect(result.message).toBe('deleted')
    })

    it('should call repo with userId', async () => {
      repo.softDeleteLesson.mockResolvedValue({ message: 'deleted' })

      await service.deleteLesson(77, 10)
      expect(repo.softDeleteLesson).toHaveBeenCalledWith(77, 10)
    })
  })

  // ---------- RESTORE ----------
  describe('restoreLesson', () => {
    it('should call repo.restoreLesson with correct args', async () => {
      repo.restoreLesson.mockResolvedValue({ message: 'restored' })

      const result = await service.restoreLesson(1, 1)
      expect(repo.restoreLesson).toHaveBeenCalledWith(1, 1)
      expect(result.message).toBe('restored')
    })

    it('should return success message', async () => {
      repo.restoreLesson.mockResolvedValue({ message: 'restored' })

      const result = await service.restoreLesson(1, 1)
      expect(result).toEqual({ message: 'restored' })
    })

    it('should bubble up error from repo', async () => {
      repo.restoreLesson.mockRejectedValue(new Error('restore fail'))

      await expect(service.restoreLesson(1, 1)).rejects.toThrow('restore fail')
    })

    it('should handle non-existing lesson gracefully', async () => {
      repo.restoreLesson.mockResolvedValue({ message: 'restored' })

      const result = await service.restoreLesson(1, 999)
      expect(result.message).toBe('restored')
    })

    it('should call repo with userId', async () => {
      repo.restoreLesson.mockResolvedValue({ message: 'restored' })

      await service.restoreLesson(77, 10)
      expect(repo.restoreLesson).toHaveBeenCalledWith(77, 10)
    })
  })

  // ---------- LIST ----------
  describe('listLessons', () => {
    it('should call repo.listLessons with correct args', async () => {
      repo.listLessons.mockResolvedValue({ items: [], total: 0, skip: 0, take: 10 })

      await service.listLessons(1, 2, { skip: 0, take: 10 })
      expect(repo.listLessons).toHaveBeenCalledWith(1, 2, { skip: 0, take: 10 })
    })

    it('should return lessons from repo', async () => {
      const data = { items: [{ id: 1 }], total: 1, skip: 0, take: 10 }
      repo.listLessons.mockResolvedValue(data as any)

      const result = await service.listLessons(1, 2, { skip: 0, take: 10 })
      expect(result).toEqual(data)
    })

    it('should bubble up error from repo', async () => {
      repo.listLessons.mockRejectedValue(new Error('list fail'))

      await expect(service.listLessons(1, 2, { skip: 0, take: 10 })).rejects.toThrow('list fail')
    })

    it('should handle empty list', async () => {
      repo.listLessons.mockResolvedValue({ items: [], total: 0, skip: 0, take: 10 })

      const result = await service.listLessons(1, 2, { skip: 0, take: 10 })
      expect(result.items).toHaveLength(0)
    })

    it('should return paginated lessons', async () => {
      const data = {
        items: [
          { id: 1, lessonOrder: 1 },
          { id: 2, lessonOrder: 2 },
        ],
        total: 2,
        skip: 0,
        take: 2,
      }
      repo.listLessons.mockResolvedValue(data as any)

      const result = await service.listLessons(1, 2, { skip: 0, take: 2 })
      expect(result.items).toHaveLength(2)
      expect(result.total).toBe(2)
    })
  })
})
