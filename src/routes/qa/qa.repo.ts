import { Injectable, Logger, BadRequestException } from '@nestjs/common'
import { Prisma, QaStatus } from '@prisma/client'
import { PrismaService } from 'src/shared/services/prisma.service'
import { ValidationService } from 'src/shared/services/validation.service'
import {
  ClientCreateThreadInputType,
  ClientCreatePostInputType,
  ClientEditPostInputType,
  SellerAcceptAnswerInputType,
  SellerUpdateThreadStatusInputType,
  SellerLockThreadInputType,
  ListThreadsQueryType,
  ListThreadsResType,
  ListPostsResType,
  ThreadPublicResType,
  PostPublicResType,
} from './qa.model'
import { QA_MESSAGES } from '../../shared/constants/qa.message'
import { QA_POST_PUBLIC_SELECT, QA_THREAD_PUBLIC_SELECT } from '../../shared/constants/qa.selects'
import { mapThreadPublic, mapPostPublic, toSkipTake } from '../../shared/helper/qa.helper'
import {
  QaThreadNotFoundOrForbiddenException,
  QaPostNotFoundOrForbiddenException,
  QaEnrollmentRequiredException,
  QaThreadLockedException,
  QaAcceptInvalidException,
  QaLessonNotFoundException,
  QaCourseNotFoundException,
} from '../../shared/constants/qa.error.constant'

@Injectable()
export class QaRepository {
  private readonly logger = new Logger(QaRepository.name)

  constructor(
    private readonly prisma: PrismaService,
    private readonly validation: ValidationService,
  ) {}

  // ===== Guards (ownership & access) 

  /**
   * Ensure the seller owns the given thread via course.createdById.
   * - Validates seller status.
   * - Returns the thread with public SELECT on success.
   * - Throws Forbidden if not found or not owned by seller.
   *
   * @param sellerId - Seller/User ID
   * @param threadId - Thread ID
   * @returns Thread payload selected by QA_THREAD_PUBLIC_SELECT
   */
  private async assertSellerOwnsThread(
    sellerId: number,
    threadId: number,
  ): Promise<Prisma.QaThreadGetPayload<{ select: typeof QA_THREAD_PUBLIC_SELECT }>> {
    await this.validation.validateUserStatus(sellerId)

    const thread = await this.prisma.qaThread.findFirst({
      where: { id: threadId, isDelete: false, course: { isDelete: false, createdById: sellerId } },
      select: QA_THREAD_PUBLIC_SELECT,
    })
    if (!thread) throw QaThreadNotFoundOrForbiddenException
    return thread
  }

  /**
   * Ensure the client can access a thread (must be enrolled in its course).
   * - Validates client status.
   * - Returns the thread with public SELECT on success.
   * - Throws Forbidden if not enrolled or not found.
   *
   * @param clientId - Client/User ID
   * @param threadId - Thread ID
   * @returns Thread payload selected by QA_THREAD_PUBLIC_SELECT
   */
  private async assertClientCanAccessThread(
    clientId: number,
    threadId: number,
  ): Promise<Prisma.QaThreadGetPayload<{ select: typeof QA_THREAD_PUBLIC_SELECT }>> {
    await this.validation.validateUserStatus(clientId)

    const thread = await this.prisma.qaThread.findFirst({
      where: {
        id: threadId,
        isDelete: false,
        course: { isDelete: false, enrollments: { some: { userId: clientId, deletedAt: null } } },
      },
      select: QA_THREAD_PUBLIC_SELECT,
    })
    if (!thread) throw QaThreadNotFoundOrForbiddenException
    return thread
  }

  /**
   * Ensure client is enrolled to the given course.
   * - Validates user status.
   * - Throws Forbidden if not enrolled.
   *
   * @param clientId - Client/User ID
   * @param courseId - Course ID
   */
  private async assertClientEnrolledCourse(clientId: number, courseId: number): Promise<void> {
    await this.validation.validateUserStatus(clientId)
    const enrolled = await this.prisma.enrollment.findFirst({
      where: { userId: clientId, courseId, deletedAt: null },
      select: { id: true },
    })
    if (!enrolled) throw QaEnrollmentRequiredException
  }

  /**
   * Ensure the lesson belongs to the given course (and not deleted).
   * - Throws NotFound if not matched.
   *
   * @param lessonId - Lesson ID
   * @param courseId - Course ID
   */
  private async assertLessonBelongsCourse(lessonId: number, courseId: number): Promise<void> {
    const lesson = await this.prisma.lesson.findFirst({
      where: { id: lessonId, deletedAt: null, module: { courseId, isDelete: false, course: { isDelete: false } } },
      select: { id: true },
    })
    if (!lesson) throw QaLessonNotFoundException
  }

  /**
   * Ensure the optional parent reply is in the same thread.
   * - No-op if parentId is null/undefined.
   * - Throws Forbidden/NotFound if invalid.
   *
   * @param threadId - Thread ID
   * @param parentId - Optional parent post ID
   */
  private async assertParentInSameThread(threadId: number, parentId?: number | null): Promise<void> {
    if (!parentId) return
    const parent = await this.prisma.qaPost.findFirst({
      where: { id: parentId, threadId, isDelete: false },
      select: { id: true },
    })
    if (!parent) throw QaPostNotFoundOrForbiddenException
  }

  // ===== CLIENT — THREADS

  /**
   * Create a thread for client and bootstrap the first post from content.
   *
   * Flow:
   * - Validate enrollment & lesson-course relation.
   * - Resolve instructorId from course.createdById.
   * - Create thread → create first post (content).
   * - Return mapped public thread.
   *
   * @param clientId - Client/User ID
   * @param payload - Thread creation payload (validated by zod)
   * @returns ThreadPublicResType
   */
  async clientCreateThread(clientId: number, payload: ClientCreateThreadInputType): Promise<ThreadPublicResType> {
    await this.assertClientEnrolledCourse(clientId, payload.courseId)
    await this.assertLessonBelongsCourse(payload.lessonId, payload.courseId)

    const course = await this.prisma.course.findFirst({
      where: { id: payload.courseId, isDelete: false },
      select: { id: true, createdById: true, title: true },
    })
    if (!course?.createdById) throw QaCourseNotFoundException

    const created = await this.prisma.qaThread.create({
      data: {
        courseId: payload.courseId,
        lessonId: payload.lessonId,
        instructorId: course.createdById,
        authorId: clientId,
        title: payload.title ?? null,
        content: payload.content,
        status: 'PENDING',
        isResolved: false,
        locked: false,
        lastActivityAt: new Date(),
        createdAt: new Date(),
      },
      select: QA_THREAD_PUBLIC_SELECT,
    })

    // First post mirrors the thread initial content (keeps posts uniform).
    await this.prisma.qaPost.create({
      data: { threadId: created.id, authorId: clientId, content: payload.content, parentId: null },
    })

    const thread = await this.prisma.qaThread.findUnique({ where: { id: created.id }, select: QA_THREAD_PUBLIC_SELECT })
    if (!thread) throw QaThreadNotFoundOrForbiddenException
    return mapThreadPublic(thread)
  }

  /**
   * List threads that client has access to (enrolled courses only).
   * - Supports search on title or post content (insensitive).
   * - Supports sort & pagination.
   *
   * @param clientId - Client/User ID
   * @param query - Filter/sort/pagination
   * @returns Paginated list of threads
   */
  async clientListThreads(clientId: number, query: ListThreadsQueryType): Promise<ListThreadsResType> {
    await this.validation.validateUserStatus(clientId)
    const { page, pageSize, skip, take } = toSkipTake(query)

    const where: Prisma.QaThreadWhereInput = {
      isDelete: false,
      course: { isDelete: false, enrollments: { some: { userId: clientId, deletedAt: null } } },
      ...(query.courseId ? { courseId: query.courseId } : {}),
      ...(query.lessonId ? { lessonId: query.lessonId } : {}),
      ...(query.status ? { status: query.status as QaStatus } : {}),
      ...(query.search
        ? {
            // Search matches thread title or any post content
            OR: [
              { title: { contains: query.search, mode: 'insensitive' } },
              { posts: { some: { content: { contains: query.search, mode: 'insensitive' }, isDelete: false } } },
            ],
          }
        : {}),
    }

    const [rows, total] = await Promise.all([
      this.prisma.qaThread.findMany({
        where,
        select: QA_THREAD_PUBLIC_SELECT,
        orderBy:
          (query.sortBy ?? 'lastActivityAt') === 'createdAt'
            ? { createdAt: query.order ?? 'desc' }
            : { lastActivityAt: query.order ?? 'desc' }, // default sort by activity
        skip,
        take,
      }),
      this.prisma.qaThread.count({ where }),
    ])

    return { items: rows.map((r) => mapThreadPublic(r)), total, page, pageSize }
  }

  /**
   * Get one thread for client (enrollment required).
   *
   * @param clientId - Client/User ID
   * @param threadId - Thread ID
   * @returns ThreadPublicResType
   */
  async clientGetThread(clientId: number, threadId: number): Promise<ThreadPublicResType> {
    const thread = await this.assertClientCanAccessThread(clientId, threadId)
    return mapThreadPublic(thread)
  }

  // ===== CLIENT — POSTS =====================================================

  /**
   * List posts in a thread for client.
   * - Ascending by createdAt (conversation order).
   * - Returns accepted flag by comparing with thread.acceptedPostId.
   *
   * @param clientId - Client/User ID
   * @param threadId - Thread ID
   * @param page - Page index (1-based)
   * @param pageSize - Page size (default 50)
   * @returns Paginated list of posts
   */
  async clientListPosts(clientId: number, threadId: number, page = 1, pageSize = 50): Promise<ListPostsResType> {
    const thread = await this.assertClientCanAccessThread(clientId, threadId)
    const skip = (page - 1) * pageSize
    const take = pageSize

    const where: Prisma.QaPostWhereInput = { threadId, isDelete: false }
    const [rows, total] = await Promise.all([
      this.prisma.qaPost.findMany({ where, select: QA_POST_PUBLIC_SELECT, orderBy: { createdAt: 'asc' }, skip, take }),
      this.prisma.qaPost.count({ where }),
    ])

    return { items: rows.map((r) => mapPostPublic(r, thread.acceptedPostId)), total, page, pageSize }
  }

  /**
   * Client creates a post (reply) in a thread.
   * - Rejects if thread is locked.
   * - Validates optional parent belongs to the same thread.
   * - If thread is UNREAD (seller replied last), flip back to PENDING.
   *
   * @param clientId - Client/User ID
   * @param payload - Post creation payload
   * @returns PostPublicResType
   */
  async clientCreatePost(clientId: number, payload: ClientCreatePostInputType): Promise<PostPublicResType> {
    const thread = await this.assertClientCanAccessThread(clientId, payload.threadId)
    if (thread.locked) throw QaThreadLockedException
    await this.assertParentInSameThread(payload.threadId, payload.parentId ?? null)

    const created = await this.prisma.qaPost.create({
      data: {
        threadId: payload.threadId,
        authorId: clientId,
        content: payload.content,
        parentId: payload.parentId ?? null,
      },
      select: QA_POST_PUBLIC_SELECT,
    })

    // Status transition rule:
    // - If client replies when status is UNREAD, set back to PENDING.
    const nextStatus: QaStatus = thread.status === 'UNREAD' ? 'PENDING' : (thread.status as QaStatus)
    await this.prisma.qaThread.update({
      where: { id: payload.threadId },
      data: { status: nextStatus, lastActivityAt: new Date() },
    })

    return mapPostPublic(created, thread.acceptedPostId)
  }

  /**
   * Client edits own post (content only).
   * - Marks isEdited & updates editedAt.
   * - Throws if not author.
   *
   * @param clientId - Client/User ID
   * @param postId - Post ID
   * @param payload - Edit payload
   * @returns Updated post as PostPublicResType
   */
  async clientEditPost(clientId: number, postId: number, payload: ClientEditPostInputType): Promise<PostPublicResType> {
    await this.validation.validateUserStatus(clientId)

    const post = await this.prisma.qaPost.findFirst({
      where: { id: postId, isDelete: false },
      select: { ...QA_POST_PUBLIC_SELECT, thread: { select: { acceptedPostId: true } } },
    })
    if (!post || post.authorId !== clientId) throw QaPostNotFoundOrForbiddenException

    const updated = await this.prisma.qaPost.update({
      where: { id: postId },
      data: { content: payload.content, isEdited: true, editedAt: new Date() },
      select: QA_POST_PUBLIC_SELECT,
    })
    return mapPostPublic(updated, post.thread.acceptedPostId)
  }

  /**
   * Client soft-deletes own post.
   * - Prevents deleting the accepted answer.
   * - Sets isDelete and deletedAt.
   *
   * @param clientId - Client/User ID
   * @param postId - Post ID
   * @returns i18n message key payload
   * @throws BadRequestException if the post is the accepted answer
   */
  async clientDeletePost(clientId: number, postId: number): Promise<{ message: string }> {
    await this.validation.validateUserStatus(clientId)

    const post = await this.prisma.qaPost.findFirst({
      where: { id: postId, isDelete: false },
      select: { id: true, authorId: true, threadId: true, thread: { select: { acceptedPostId: true } } },
    })
    if (!post || post.authorId !== clientId) throw QaPostNotFoundOrForbiddenException
    if (post.thread.acceptedPostId === post.id) {
      // Keep UX consistent with i18n messages (avoid leaking raw English text)
      throw new BadRequestException({ message: QA_MESSAGES.POST.CANNOT_DELETE_ACCEPTED, path: 'qaPost' })
    }

    await this.prisma.qaPost.update({
      where: { id: postId },
      data: { isDelete: true, deletedAt: new Date() as any },
    })
    return { message: QA_MESSAGES.POST.DELETED }
  }

  // ===== SELLER — THREADS ===================================================

  /**
   * List threads created under seller's courses.
   * - Search, filter, sort, pagination (same rules as client list).
   *
   * @param sellerId - Seller/User ID
   * @param query - Filter/sort/pagination
   * @returns Paginated threads as ListThreadsResType
   */
  async sellerListThreads(sellerId: number, query: ListThreadsQueryType): Promise<ListThreadsResType> {
    await this.validation.validateUserStatus(sellerId)
    const { page, pageSize, skip, take } = toSkipTake(query)

    const where: Prisma.QaThreadWhereInput = {
      isDelete: false,
      course: { isDelete: false, createdById: sellerId },
      ...(query.courseId ? { courseId: query.courseId } : {}),
      ...(query.lessonId ? { lessonId: query.lessonId } : {}),
      ...(query.status ? { status: query.status as QaStatus } : {}),
      ...(query.search
        ? {
            OR: [
              { title: { contains: query.search, mode: 'insensitive' } },
              { posts: { some: { content: { contains: query.search, mode: 'insensitive' }, isDelete: false } } },
            ],
          }
        : {}),
    }

    const [rows, total] = await Promise.all([
      this.prisma.qaThread.findMany({
        where,
        select: QA_THREAD_PUBLIC_SELECT,
        orderBy:
          (query.sortBy ?? 'lastActivityAt') === 'createdAt'
            ? { createdAt: query.order ?? 'desc' }
            : { lastActivityAt: query.order ?? 'desc' },
        skip,
        take,
      }),
      this.prisma.qaThread.count({ where }),
    ])

    return { items: rows.map((r) => mapThreadPublic(r)), total, page, pageSize }
  }

  /**
   * Get one thread owned by seller.
   *
   * @param sellerId - Seller/User ID
   * @param threadId - Thread ID
   * @returns ThreadPublicResType
   */
  async sellerGetThread(sellerId: number, threadId: number): Promise<ThreadPublicResType> {
    const thread = await this.assertSellerOwnsThread(sellerId, threadId)
    return mapThreadPublic(thread)
  }

  // ===== SELLER — POSTS & moderation =======================================

  /**
   * List posts in a seller-owned thread.
   * - Sorted ascending by createdAt for conversation order.
   *
   * @param sellerId - Seller/User ID
   * @param threadId - Thread ID
   * @param page - Page index (1-based)
   * @param pageSize - Page size (default 50)
   * @returns Paginated posts as ListPostsResType
   */
  async sellerListPosts(sellerId: number, threadId: number, page = 1, pageSize = 50): Promise<ListPostsResType> {
    const thread = await this.assertSellerOwnsThread(sellerId, threadId)
    const skip = (page - 1) * pageSize
    const take = pageSize

    const where: Prisma.QaPostWhereInput = { threadId, isDelete: false }
    const [rows, total] = await Promise.all([
      this.prisma.qaPost.findMany({ where, select: QA_POST_PUBLIC_SELECT, orderBy: { createdAt: 'asc' }, skip, take }),
      this.prisma.qaPost.count({ where }),
    ])

    return { items: rows.map((r) => mapPostPublic(r, thread.acceptedPostId)), total, page, pageSize }
  }

  /**
   * Seller replies to a thread.
   * - Rejects if locked.
   * - Sets thread status to UNREAD (signals client to check).
   *
   * @param sellerId - Seller/User ID
   * @param payload - Post creation payload
   * @returns PostPublicResType
   */
  async sellerCreatePost(sellerId: number, payload: ClientCreatePostInputType): Promise<PostPublicResType> {
    const thread = await this.assertSellerOwnsThread(sellerId, payload.threadId)
    if (thread.locked) throw QaThreadLockedException
    await this.assertParentInSameThread(payload.threadId, payload.parentId ?? null)

    const created = await this.prisma.qaPost.create({
      data: {
        threadId: payload.threadId,
        authorId: sellerId,
        content: payload.content,
        parentId: payload.parentId ?? null,
      },
      select: QA_POST_PUBLIC_SELECT,
    })

    // Seller reply → set status to UNREAD for client visibility.
    await this.prisma.qaThread.update({
      where: { id: payload.threadId },
      data: { status: 'UNREAD', lastActivityAt: new Date() },
    })

    return mapPostPublic(created, thread.acceptedPostId)
  }

  /**
   * Seller marks a post as accepted answer.
   * - Validates post belongs to the thread.
   * - Connects acceptedPost relation, sets RESOLVED, updates lastActivityAt.
   *
   * @param sellerId - Seller/User ID
   * @param threadId - Thread ID
   * @param payload - Accept payload (postId)
   * @returns Updated thread as ThreadPublicResType
   */
  async sellerAcceptAnswer(
    sellerId: number,
    threadId: number,
    payload: SellerAcceptAnswerInputType,
  ): Promise<ThreadPublicResType> {
    await this.assertSellerOwnsThread(sellerId, threadId)

    const post = await this.prisma.qaPost.findFirst({
      where: { id: payload.postId, threadId, isDelete: false },
      select: { id: true },
    })
    if (!post) throw QaAcceptInvalidException

    const updated = await this.prisma.qaThread.update({
      where: { id: threadId },
      data: {
        acceptedPost: { connect: { id: payload.postId } },
        isResolved: true,
        status: 'RESOLVED',
        lastActivityAt: new Date(),
      },
      select: QA_THREAD_PUBLIC_SELECT,
    })
    return mapThreadPublic(updated)
  }

  /**
   * Seller un-accepts the current answer.
   * - Disconnects acceptedPost relation.
   * - Sets status back to PENDING and isResolved to false.
   *
   * @param sellerId - Seller/User ID
   * @param threadId - Thread ID
   * @returns Updated thread as ThreadPublicResType
   */
  async sellerUnacceptAnswer(sellerId: number, threadId: number): Promise<ThreadPublicResType> {
    await this.assertSellerOwnsThread(sellerId, threadId)

    const updated = await this.prisma.qaThread.update({
      where: { id: threadId },
      data: { acceptedPost: { disconnect: true }, isResolved: false, status: 'PENDING', lastActivityAt: new Date() },
      select: QA_THREAD_PUBLIC_SELECT,
    })
    return mapThreadPublic(updated)
  }

  /**
   * Seller updates thread status (RESOLVED or PENDING).
   * - If PENDING: also disconnect acceptedPost.
   *
   * @param sellerId - Seller/User ID
   * @param threadId - Thread ID
   * @param payload - Status update payload
   * @returns Updated thread as ThreadPublicResType
   */
  async sellerUpdateStatus(
    sellerId: number,
    threadId: number,
    payload: SellerUpdateThreadStatusInputType,
  ): Promise<ThreadPublicResType> {
    await this.assertSellerOwnsThread(sellerId, threadId)

    const next: Prisma.QaThreadUpdateInput =
      payload.status === 'RESOLVED'
        ? { status: 'RESOLVED', isResolved: true }
        : { status: 'PENDING', isResolved: false, acceptedPost: { disconnect: true } }

    const updated = await this.prisma.qaThread.update({
      where: { id: threadId },
      data: { ...next, lastActivityAt: new Date() },
      select: QA_THREAD_PUBLIC_SELECT,
    })
    return mapThreadPublic(updated)
  }

  /**
   * Seller locks/unlocks a thread.
   *
   * @param sellerId - Seller/User ID
   * @param threadId - Thread ID
   * @param payload - { locked: boolean }
   * @returns Updated thread as ThreadPublicResType
   */
  async sellerLockThread(
    sellerId: number,
    threadId: number,
    payload: SellerLockThreadInputType,
  ): Promise<ThreadPublicResType> {
    await this.assertSellerOwnsThread(sellerId, threadId)

    const updated = await this.prisma.qaThread.update({
      where: { id: threadId },
      data: { locked: payload.locked, lastActivityAt: new Date() },
      select: QA_THREAD_PUBLIC_SELECT,
    })
    return mapThreadPublic(updated)
  }

  // ===== Optional actions ===================================================

  /**
   * Soft delete a thread by seller (isDelete + deletedAt).
   *
   * @param sellerId - Seller/User ID
   * @param threadId - Thread ID
   * @returns i18n message key payload
   */
  async softDeleteThreadAsSeller(sellerId: number, threadId: number): Promise<{ message: string }> {
    await this.assertSellerOwnsThread(sellerId, threadId)
    await this.prisma.qaThread.update({
      where: { id: threadId },
      data: { isDelete: true, deletedAt: new Date() as any },
    })
    return { message: QA_MESSAGES.THREAD.DELETED }
  }
}
