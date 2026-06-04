import { BadRequestException, Injectable } from '@nestjs/common'
import { PrismaService } from 'src/shared/services/prisma.service'
import { PublicProfileResType, TeacherListQueryType, TeacherListResType, TeacherPublicItem } from './user.model'

import { PUBLIC_PROFILE_FIELDS, PublicField } from 'src/shared/constants/user.constant'
import { UserStatus } from 'src/shared/constants/auth.constant'
import { RoleName } from 'src/shared/constants/role.constant'
import { UserNotFoundException } from './user.error'

@Injectable()
export class UserRepository {
  constructor(private readonly prismaService: PrismaService) {}

  /**
   * Get select fields from config
   * @private
   */
  private getPublicSelectFields(): readonly PublicField[] {
    return PUBLIC_PROFILE_FIELDS
  }

  async findPublicProfile(userId: number): Promise<PublicProfileResType | null> {
    const selectFields = this.getPublicSelectFields()

    const user = await this.prismaService.user.findUnique({
      where: { id: userId, deletedAt: null },
      select: {
        ...Object.fromEntries(selectFields.map((field) => [field, true])),
        role: { select: { id: true, name: true } },
        _count: {
          select: {
            userFollower: true,
            userEnrollment: true,
            userCertificate: true,
          },
        },
      },
    })

    return user as PublicProfileResType | null
  }

  async listTeachers(query: TeacherListQueryType): Promise<TeacherListResType> {
    const where = {
      deletedAt: null,
      status: UserStatus.ACTIVE,

      role: {
        name: RoleName.Seller,
        isActive: true,
      },
    }

    const [items, total] = await this.prismaService.$transaction([
      this.prismaService.user.findMany({
        where,
        select: { id: true, fullname: true, avatar: true },
        orderBy: { createdAt: 'desc' },
        skip: query.skip,
        take: query.take,
      }),
      this.prismaService.user.count({ where }),
    ])

    return { items, total, skip: query.skip, take: query.take }
  }

  async ensureTeacher(userId: number): Promise<TeacherPublicItem> {
    const user = await this.prismaService.user.findUnique({
      where: { id: userId, deletedAt: null },
      include: { role: true },
    })

    if (!user) {
      throw UserNotFoundException
    }

    if (user.role?.name !== RoleName.Seller) {
      throw new BadRequestException('User does not have Seller role')
    }

    await this.prismaService.teacher.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        bio: '',
        specialization: '',
        experience: '',
      },
    })

    return {
      id: user.id,
      fullname: user.fullname,
      avatar: user.avatar,
    }
  }
}
