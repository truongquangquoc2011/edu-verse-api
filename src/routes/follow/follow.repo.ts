import { Injectable } from '@nestjs/common'
import { Follower } from '@prisma/client'
import { PrismaService } from 'src/shared/services/prisma.service'

export type FollowOpResult = {
  follow: Pick<Follower, 'id'>
  incremented: boolean
}

export type UnfollowOpRessult = {
  changed: boolean
}

@Injectable()
export class FollowRepository {
  constructor(private readonly prismaService: PrismaService) {}

  /**
   * Find an active teacher by id (not soft-deleted).
   * @param teacherId - Target teacher id.
   * @returns `{ id, userId, followersCount }` or `null` if not found / soft-deleted.
   */
  async findTeacherActive(teacherId: number) {
    return await this.prismaService.teacher.findFirst({
      where: { id: teacherId, isDelete: false, deletedAt: null },
      select: { id: true, userId: true, followersCount: true },
    })
  }

  /**
   * Follow (idempotent).
   * Logic:
   * - If an active Follower already exists (not soft-deleted), return it with `incremented=false`.
   * - If a soft-deleted Follower exists, restore it and increment `Teacher.followersCount`.
   * - If not exists, create it and increment `Teacher.followersCount`.
   * @param userId   - The follower (current user).
   * @param teacherId - The teacher being followed.
   * @param actorId  - Who performs this action (usually equals `userId`; allows admin flows later).
   * @returns `{ follow: { id }, incremented }`
   */
  async follow(userId: number, teacherId: number, actorId: number): Promise<FollowOpResult> {
    return await this.prismaService.$transaction(async (tx) => {
      const existing = await tx.follower.findUnique({
        where: { userId_teacherId: { userId, teacherId } },
      })

      // Already followed and still active -> idempotent
      if (existing && !existing.isDelete && !existing.deletedAt) {
        return { follow: existing, incremented: false }
      }

      // Soft-deleted -> restore and increment counter
      if (existing) {
        const restored = await tx.follower.update({
          where: { userId_teacherId: { userId, teacherId } },
          data: {
            isDelete: false,
            deletedAt: null,
            updatedById: actorId,
          },
        })
        await tx.teacher.update({
          where: { id: teacherId },
          data: {
            followersCount: {
              increment: 1,
            },
          },
        })
        return { follow: restored, incremented: true }
      }

      // Not exists -> create and increment counter
      const created = await tx.follower.create({
        data: { teacherId, userId, createdById: actorId },
      })
      await tx.teacher.update({
        where: { id: teacherId },
        data: {
          followersCount: {
            increment: 1,
          },
        },
      })
      return { follow: created, incremented: true }
    })
  }

  /**
   * Unfollow (idempotent).
   * Logic:
   * - If follower does not exist or is already soft-deleted, return `{ changed: false }`.
   * - Otherwise set `deletedAt` (soft-delete) and decrement `Teacher.followersCount` (guarded to avoid negative).
   * @param userId    - The follower (current user).
   * @param teacherId - The teacher being unfollowed.
   * @param actorId   - Who performs this action (usually equals `userId`).
   * @returns `{ changed: boolean }`
   */
  async unfollow(userId: number, teacherId: number, actorId: number): Promise<UnfollowOpRessult> {
    return this.prismaService.$transaction(async (tx) => {
      const existing = await tx.follower.findUnique({
        where: { userId_teacherId: { userId, teacherId } },
        select: { id: true, deletedAt: true },
      })

      if (!existing || existing.deletedAt !== null) {
        return { changed: false }
      }
      await tx.follower.update({
        where: { userId_teacherId: { userId, teacherId } },
        data: { deletedAt: new Date(), updatedById: actorId },
      })

      await tx.teacher.updateMany({
        where: { id: teacherId, followersCount: { gt: 0 } },
        data: { followersCount: { decrement: 1 } },
      })

      return { changed: true }
    })
  }

  /**
   * List followers (users) of a teacher, paginated.
   * @param teacherId - The teacher whose followers to list.
   * @param page      - 1-based page index.
   * @param limit     - Page size.
   * @returns Array of `{ id, createdAt, user: { id, fullname, username, avatar } }`, newest first.
   */
  listFollowers(teacherId: number, page: number, limit: number) {
    const skip = (page - 1) * limit
    return this.prismaService.follower.findMany({
      where: { teacherId, isDelete: false, deletedAt: null },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      select: {
        id: true,
        createdAt: true,
        user: { select: { id: true, fullname: true, username: true, avatar: true } },
      },
    })
  }

  /**
   * Count active followers of a teacher.
   * @param teacherId - Target teacher id.
   * @returns Total number of active follower links.
   */
  countFollowersActive(teacherId: number) {
    return this.prismaService.follower.count({
      where: { teacherId, isDelete: false, deletedAt: null },
    })
  }

  /**
   * List teachers that a given user is following, paginated.
   * @param userId - The follower user id (for a teacher, use `teacher.userId`).
   * @param page   - 1-based page index.
   * @param limit  - Page size.
   * @returns Array of
   *   `{ id, createdAt, teacher: { id, specialization, followersCount, user: { id, fullname, avatar } } }`
   *   ordered by newest first.
   */
  listFollowing(userId: number, page: number, limit: number) {
    const skip = (page - 1) * limit
    return this.prismaService.follower.findMany({
      where: { userId, isDelete: false, deletedAt: null },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      select: {
        id: true,
        createdAt: true,
        teacher: {
          select: {
            id: true,
            specialization: true,
            followersCount: true,
            user: { select: { id: true, fullname: true, avatar: true } },
          },
        },
      },
    })
  }

  /**
   * Count how many active followings a user currently has.
   * @param userId - The follower user id.
   * @returns Total number of active following links.
   */
  countFollowingActive(userId: number) {
    return this.prismaService.follower.count({
      where: { userId, deletedAt: null },
    })
  }

  /**
   * Find an active teacher by the associated userId.
   * - Excludes soft-deleted teachers.
   *
   * @param userId - User id associated with the teacher.
   * @returns `{ id, userId, followersCount }` if found, otherwise `null`.
   */
  async findTeacherActiveByUserId(userId: number) {
    return await this.prismaService.teacher.findFirst({
      where: { userId, deletedAt: null },
      select: { id: true, userId: true, followersCount: true },
    })
  }
}
