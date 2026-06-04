import { Injectable, Logger } from '@nestjs/common'
import { SearchService } from '../search/search.service'
import { CourseStatus } from '@prisma/client'

const COURSE_INDEX = 'courses'

export type CourseSearchHit = {
  id: number
}

export type CourseIndexDoc = {
  id: number
  title: string
  description?: string | null
  previewDescription?: string | null
  thumbnail?: string | null

  categoryId?: number | null
  categoryName?: string | null

  teacherId?: number | null
  teacherName?: string | null
  teacherSpecialization?: string | null

  status: CourseStatus
  createdAt: Date
  updatedAt: Date
}

@Injectable()
export class CourseSearchService {
  private readonly logger = new Logger(CourseSearchService.name)

  constructor(private readonly search: SearchService) {}

  async indexCourse(doc: CourseIndexDoc) {
    try {
      await this.search.indexDoc(COURSE_INDEX, String(doc.id), doc)
    } catch (err: any) {
      this.logger.error(`Failed to index course ${doc.id}: ${err?.message}`)
    }
  }

  async removeCourse(id: number) {
    try {
      await this.search.deleteDoc(COURSE_INDEX, String(id))
    } catch (err: any) {
      this.logger.warn(`Failed to delete course ${id} from ES: ${err?.message}`)
    }
  }

  async searchPublicCourses(params: { text: string; skip?: number; take?: number; categoryId?: number }) {
    const { text, skip = 0, take = 10, categoryId } = params

    const filter: any[] = [{ term: { status: CourseStatus.Approved } }]
    if (categoryId) filter.push({ term: { categoryId } })

    return this.search.search<CourseSearchHit>({
      index: COURSE_INDEX,
      q: text,
      fields: [
        'title^4',
        'description^2',
        'previewDescription',
        'categoryName^2',
        'teacherName^2',
        'teacherSpecialization',
      ],
      skip,
      take,
      filter,
    })
  }
}
