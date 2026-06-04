import { Prisma } from '@prisma/client'

export const COURSE_DETAIL_SELECT = {
  id: true,
  title: true,
  description: true,
  thumbnail: true,
  videoUrl: true,
  categoryId: true,
  price: true,
  isFree: true,
  isFeatured: true,
  isPreorder: true,
  hasPreview: true,
  previewDescription: true,
  status: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.CourseSelect

export const COURSE_STATUS = {
  APPROVED: 'Approved',
} as const

export const COURSE_PUBLIC_DETAIL_SELECT = {
  id: true,
  title: true,
  description: true,
  thumbnail: true,
  videoUrl: true,
  price: true,
  isFree: true,
  isFeatured: true,
  isPreorder: true,
  hasPreview: true,
  previewDescription: true,
  status: true,
  createdAt: true,
  updatedAt: true,
  category: {
    select: {
      id: true,
      name: true,
    },
  },
  createdBy: {
    select: {
      id: true,
      fullname: true,
      avatar: true,
    },
  },
} as const

