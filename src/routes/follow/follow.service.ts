import { HttpException, Injectable } from '@nestjs/common'
import {
  CannotFollowSelfException,
  InternalFollowTeacherErrorException,
  InternalListFollowersErrorException,
  InternalListFollowingErrorException,
  InternalUnfollowTeacherErrorException,
  TeacherNotFoundException,
} from './follow.error'
import { FollowRepository } from './follow.repo'
import {
  FollowersListResType,
  FollowingListResType,
  FollowResType,
  PaginationQueryType,
  UnfollowResType,
} from './follow.model'

@Injectable()
export class FollowService {
  constructor(private readonly followRepository: FollowRepository) {}

  /**
   * Follow a teacher (idempotent).
   * Flow:
   * 1) Ensure teacher exists & is active.
   * 2) Prevent self-follow (teacher.userId === userId).
   * 3) Call repository `follow()` which creates/restores the Follower row
   *    and increments Teacher.followersCount only when needed.
   * @param teacherId Target teacher id to follow.
   * @param userId    Current authenticated user id (from token).
   * @returns `{ success: true, followerId }`
   *
   * @throws TeacherNotFoundException        If teacher not found or soft-deleted.
   * @throws CannotFollowSelfException       If user attempts to follow themselves.
   * @throws InternalFollowTeacherErrorException On unexpected server errors.
   */
  async followTeacher(teacherId: number, userId: number): Promise<FollowResType> {
    try {
      const teacher = await this.followRepository.findTeacherActive(teacherId)
      if (!teacher) throw TeacherNotFoundException
      if (teacher.userId === userId) throw CannotFollowSelfException

      const { follow: follower } = await this.followRepository.follow(userId, teacherId, userId)
      return { success: true as const, followerId: follower.id }
    } catch (error) {
      if (error instanceof HttpException) throw error
      throw InternalFollowTeacherErrorException
    }
  }

  /**
   * Unfollow a teacher (idempotent).
   *
   * Flow:
   * 1) Ensure teacher exists & is active.
   * 2) Prevent “unfollow self” (same rationale as follow).
   * 3) Call repository `unfollow()` which soft-deletes the Follower row
   *    and decrements Teacher.followersCount (guarded from going negative).
   *
   * @param teacherId Target teacher id to unfollow.
   * @param userId    Current authenticated user id.
   * @returns `{ success: true }`
   *
   * @throws TeacherNotFoundException            If teacher not found or soft-deleted.
   * @throws CannotFollowSelfException           If user attempts to unfollow themselves.
   * @throws InternalUnfollowTeacherErrorException On unexpected server errors.
   */
  async unfollowTeacher(teacherId: number, userId: number): Promise<UnfollowResType> {
    try {
      const teacher = await this.followRepository.findTeacherActive(teacherId)
      if (!teacher) throw TeacherNotFoundException
      if (teacher.userId === userId) throw CannotFollowSelfException

      await this.followRepository.unfollow(userId, teacherId, userId)
      return { success: true as const }
    } catch (error) {
      if (error instanceof HttpException) throw error
      throw InternalUnfollowTeacherErrorException
    }
  }

  /**
   * List followers (users) of a given teacher, with pagination.
   *
   * Flow:
   * 1) Ensure teacher exists & is active.
   * 2) Fetch paginated follower rows and total count (active only).
   *
   * @param teacherId   Teacher whose followers to list.
   * @param queryParam  `{ page, limit }` (validated by Zod at controller).
   * @returns `{ items, total, page, limit }` where each item contains
   *          follower id, createdAt, and basic follower.user info.
   *
   * @throws TeacherNotFoundException           If teacher not found or soft-deleted.
   * @throws InternalListFollowersErrorException On unexpected server errors.
   */
  async followersList(teacherId: number, queryParam: PaginationQueryType): Promise<FollowersListResType> {
    try {
      const teacher = await this.followRepository.findTeacherActive(teacherId)
      if (!teacher) throw TeacherNotFoundException

      const [items, total] = await Promise.all([
        this.followRepository.listFollowers(teacherId, queryParam.page, queryParam.limit),
        this.followRepository.countFollowersActive(teacherId),
      ])

      return { items, total, page: queryParam.page, limit: queryParam.limit }
    } catch (error) {
      if (error instanceof HttpException) throw error
      throw InternalListFollowersErrorException
    }
  }

  /**
   * List who this teacher is following (via the teacher's user), with pagination.
   *
   * Flow:
   * 1) Ensure teacher exists & is active.
   * 2) Use `teacher.userId` as the follower user id to fetch followings.
   *
   * @param teacherId   Teacher whose “following list” to fetch.
   * @param queryParam  `{ page, limit }`.
   * @returns `{ items, total, page, limit }` where each item contains
   *          the followed `teacher` (and its basic `user`) plus link metadata.
   *
   * @throws TeacherNotFoundException           If teacher not found or soft-deleted.
   * @throws InternalListFollowingErrorException On unexpected server errors.
   */
  async followingList(teacherId: number, queryParam: PaginationQueryType): Promise<FollowingListResType> {
    try {
      const teacher = await this.followRepository.findTeacherActive(teacherId)
      if (!teacher) throw TeacherNotFoundException

      const [items, total] = await Promise.all([
        this.followRepository.listFollowing(teacher.userId, queryParam.page, queryParam.limit),
        this.followRepository.countFollowingActive(teacher.userId),
      ])

      return { items, total, page: queryParam.page, limit: queryParam.limit }
    } catch (error) {
      if (error instanceof HttpException) throw error
      throw InternalListFollowingErrorException
    }
  }

  /**
   * Follow a teacher by teacher's userId (idempotent).
   * Flow:
   * 1) Resolve teacher by `targetUserId` and ensure teacher exists & is active.
   * 2) Prevent self-follow (teacher.userId === userId).
   * 3) Call repository `follow()` using resolved `teacher.id` (teacherId),
   *    which creates/restores the Follower row and increments Teacher.followersCount only when needed.
   *
   * @param targetUserId Target teacher user id to follow.
   * @param userId       Current authenticated user id (from token).
   * @returns `{ success: true, followerId }`
   *
   * @throws TeacherNotFoundException        If teacher not found or soft-deleted.
   * @throws CannotFollowSelfException       If user attempts to follow themselves.
   * @throws InternalFollowTeacherErrorException On unexpected server errors.
   */
  async followTeacherByUserId(targetUserId: number, userId: number) {
    try {
      const teacher = await this.followRepository.findTeacherActiveByUserId(targetUserId)
      if (!teacher) throw TeacherNotFoundException
      if (teacher.userId === userId) throw CannotFollowSelfException

      const { follow: follower } = await this.followRepository.follow(userId, teacher.id, userId)
      return { success: true as const, followerId: follower.id }
    } catch (error) {
      if (error instanceof HttpException) throw error
      throw InternalFollowTeacherErrorException
    }
  }

  /**
   * Unfollow a teacher by teacher's userId (idempotent).
   *
   * Flow:
   * 1) Resolve teacher by `targetUserId` and ensure teacher exists & is active.
   * 2) Prevent “unfollow self” (same rationale as follow).
   * 3) Call repository `unfollow()` using resolved `teacher.id` (teacherId),
   *    which soft-deletes the Follower row and decrements Teacher.followersCount (guarded from going negative).
   *
   * @param targetUserId Target teacher user id to unfollow.
   * @param userId       Current authenticated user id.
   * @returns `{ success: true }`
   *
   * @throws TeacherNotFoundException            If teacher not found or soft-deleted.
   * @throws CannotFollowSelfException           If user attempts to unfollow themselves.
   * @throws InternalUnfollowTeacherErrorException On unexpected server errors.
   */
  async unfollowTeacherByUserId(targetUserId: number, userId: number) {
    try {
      const teacher = await this.followRepository.findTeacherActiveByUserId(targetUserId)
      if (!teacher) throw TeacherNotFoundException
      if (teacher.userId === userId) throw CannotFollowSelfException

      await this.followRepository.unfollow(userId, teacher.id, userId)
      return { success: true as const }
    } catch (error) {
      if (error instanceof HttpException) throw error
      throw InternalUnfollowTeacherErrorException
    }
  }

  /**
   * List followers (users) of a given teacher (resolved by userId), with pagination.
   *
   * Flow:
   * 1) Resolve teacher by `targetUserId` and ensure teacher exists & is active.
   * 2) Fetch paginated follower rows and total count (active only) using resolved `teacher.id` (teacherId).
   *
   * @param targetUserId Teacher user id whose followers to list.
   * @param queryParam   `{ page, limit }` (validated by Zod at controller).
   * @returns `{ items, total, page, limit }` where each item contains
   *          follower id, createdAt, and basic follower.user info.
   *
   * @throws TeacherNotFoundException           If teacher not found or soft-deleted.
   * @throws InternalListFollowersErrorException On unexpected server errors.
   */
  async followersListByUserId(targetUserId: number, queryParam: PaginationQueryType) {
    try {
      const teacher = await this.followRepository.findTeacherActiveByUserId(targetUserId)
      if (!teacher) throw TeacherNotFoundException

      const [items, total] = await Promise.all([
        this.followRepository.listFollowers(teacher.id, queryParam.page, queryParam.limit),
        this.followRepository.countFollowersActive(teacher.id),
      ])

      return { items, total, page: queryParam.page, limit: queryParam.limit }
    } catch (error) {
      if (error instanceof HttpException) throw error
      throw InternalListFollowersErrorException
    }
  }

  /**
   * List who this teacher is following (via the teacher's user), resolved by teacher userId, with pagination.
   *
   * Flow:
   * 1) Resolve teacher by `targetUserId` and ensure teacher exists & is active.
   * 2) Use resolved `teacher.userId` as the follower user id to fetch followings.
   *
   * @param targetUserId Teacher user id whose “following list” to fetch.
   * @param queryParam   `{ page, limit }`.
   * @returns `{ items, total, page, limit }` where each item contains
   *          the followed `teacher` (and its basic `user`) plus link metadata.
   *
   * @throws TeacherNotFoundException           If teacher not found or soft-deleted.
   * @throws InternalListFollowingErrorException On unexpected server errors.
   */
  async followingListByUserId(targetUserId: number, queryParam: PaginationQueryType) {
    try {
      const teacher = await this.followRepository.findTeacherActiveByUserId(targetUserId)
      if (!teacher) throw TeacherNotFoundException

      const [items, total] = await Promise.all([
        this.followRepository.listFollowing(teacher.userId, queryParam.page, queryParam.limit),
        this.followRepository.countFollowingActive(teacher.userId),
      ])

      return { items, total, page: queryParam.page, limit: queryParam.limit }
    } catch (error) {
      if (error instanceof HttpException) throw error
      throw InternalListFollowingErrorException
    }
  }
}
