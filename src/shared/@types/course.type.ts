import { CourseStatus } from '@prisma/client'

export type CourseBasicInfo = {
  id: number
  status: CourseStatus
  isDelete: boolean
  deletedAt: Date | null
}
