import { Injectable } from '@nestjs/common'
import { PrismaService } from 'src/shared/services/prisma.service'
import { CreateHashtagBodyType, HashtagResponseType, UpdateHashtagBodyType } from './hashtag.model'
import { HashtagAlreadyExistsException, HashtagNotFoundException } from './hashtag.error'
import { PAGINATION } from 'src/shared/constants/pagination.constant'
import { Prisma } from '@prisma/client'

export const HASHTAG_DEFAULT_SELECT = {
  id: true,
  name: true,
  normalizedName: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
} as const

@Injectable()
export class HashtagRepository {
  constructor(private readonly prismaService: PrismaService) {}

  private async checkHashtagExists(id: number) {
    const hashtag = await this.prismaService.hashtag.findUnique({
      where: { id, deletedAt: null },
      select: { id: true },
    })
    if (!hashtag) throw HashtagNotFoundException
  }

  async create(data: CreateHashtagBodyType, userId: number): Promise<HashtagResponseType> {
    const normalizedName = data.name.toLowerCase().trim()
    const nameHashtagExist = await this.findByNormalizedName(data.name)
    return this.prismaService.hashtag.create({
      data: {
        name: data.name,
        normalizedName,
        createdById: userId,
      },
    })
  }

  async findByNormalizedName(normalizedName: string): Promise<HashtagResponseType | null> {
    return this.prismaService.hashtag.findFirst({
      where: { normalizedName, deletedAt: null },
    })
  }

  async findById(id: number): Promise<HashtagResponseType> {
    const hashtag = await this.prismaService.hashtag.findFirst({
      where: { id, deletedAt: null },
    })
    if (!hashtag) throw HashtagNotFoundException
    return hashtag
  }

  async update(id: number, data: UpdateHashtagBodyType, userId: number): Promise<HashtagResponseType> {
    await this.checkHashtagExists(id)
    const updateData: Partial<Prisma.HashtagUncheckedUpdateInput> = { ...data }
    if (data.name) updateData.normalizedName = data.name.toLowerCase().trim()
    return this.prismaService.hashtag.update({
      where: { id },
      data: { ...updateData, updatedById: userId },
    })
  }

  async softDelete(id: number) {
    await this.checkHashtagExists(id)
    return this.prismaService.hashtag.update({
      where: { id },
      data: { deletedAt: new Date(), isDelete: true },
    })
  }

  async listHashtags(skip: number = PAGINATION.DEFAULT_SKIP, take: number = PAGINATION.DEFAULT_TAKE) {
    const [data, total] = await this.prismaService.$transaction([
      this.prismaService.hashtag.findMany({
        where: { deletedAt: null },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        select: HASHTAG_DEFAULT_SELECT,
      }),
      this.prismaService.hashtag.count({ where: { deletedAt: null } }),
    ])

    return {
      data,
      pagination: {
        page: Math.floor(skip / take) + 1,
        limit: take,
        total,
        totalPages: Math.ceil(total / take),
      },
    }
  }
}
