import { Injectable } from '@nestjs/common'
import { QaRepository } from '../qa.repo'
import {
  ClientCreateThreadInputType,
  ClientCreatePostInputType,
  ClientEditPostInputType,
  ListThreadsQueryType,
  ListThreadsResType,
  ListPostsResType,
  ThreadPublicResType,
  PostPublicResType,
} from '../qa.model'

@Injectable()
export class ClientQaService {
  constructor(private readonly repo: QaRepository) {}
  /**
   * Create a new thread initiated by a client (student).
   *
   * - Validates course enrollment & lesson ownership inside repo.
   * - Automatically sets initial status (`PENDING`).
   * - Also creates the first post under the thread.
   *
   * @param userId - ID of the authenticated client
   * @param payload - Thread creation payload (`ClientCreateThreadInputType`)
   * @returns The newly created thread, typed as `ThreadPublicResType`
   * @throws QaEnrollmentRequiredException if user not enrolled
   * @throws QaLessonNotFoundException if lesson invalid
   */
  createThread(userId: number, payload: ClientCreateThreadInputType): Promise<ThreadPublicResType> {
    return this.repo.clientCreateThread(userId, payload)
  }

  /**
   * List Q&A threads available to the client.
   *
   * - Only includes threads belonging to courses where the client is enrolled.
   * - Supports filtering by course, lesson, status, and search keyword.
   * - Returns paginated data.
   *
   * @param userId - ID of the authenticated client
   * @param query - Query parameters for filtering & pagination
   * @returns Paginated thread list typed as `ListThreadsResType`
   */
  listThreads(userId: number, query: ListThreadsQueryType): Promise<ListThreadsResType> {
    return this.repo.clientListThreads(userId, query)
  }

  /**
   * Retrieve a single thread detail accessible by the client.
   *
   * - Validates that the client is enrolled in the thread’s course.
   *
   * @param userId - ID of the authenticated client
   * @param threadId - ID of the target thread
   * @returns Thread data typed as `ThreadPublicResType`
   * @throws QaThreadNotFoundOrForbiddenException if thread not accessible
   */
  getThread(userId: number, threadId: number): Promise<ThreadPublicResType> {
    return this.repo.clientGetThread(userId, threadId)
  }

  // ===== Posts =====

  /**
   * List posts within a given thread visible to the client.
   *
   * - Ordered by creation time ascending.
   * - Validates thread accessibility.
   *
   * @param userId - ID of the authenticated client
   * @param threadId - ID of the target thread
   * @param page - Current page index (default: 1)
   * @param pageSize - Items per page (default: 50)
   * @returns Paginated posts typed as `ListPostsResType`
   */
  listPosts(userId: number, threadId: number, page = 1, pageSize = 50): Promise<ListPostsResType> {
    return this.repo.clientListPosts(userId, threadId, page, pageSize)
  }

  /**
   * Create a new post or reply in a thread.
   *
   * - Validates thread accessibility and lock state.
   * - Automatically updates thread status if unread.
   *
   * @param userId - ID of the authenticated client
   * @param payload - Post creation payload
   * @returns Created post typed as `PostPublicResType`
   * @throws QaThreadLockedException if thread is locked
   * @throws QaPostNotFoundOrForbiddenException if parent invalid
   */
  createPost(userId: number, payload: ClientCreatePostInputType): Promise<PostPublicResType> {
    return this.repo.clientCreatePost(userId, payload)
  }

  /**
   * Edit an existing post authored by the client.
   *
   * - Validates ownership and non-deleted state.
   * - Updates `isEdited` and `editedAt` timestamp.
   *
   * @param userId - ID of the authenticated client
   * @param postId - ID of the post to edit
   * @param payload - Edit payload containing new content
   * @returns Updated post typed as `PostPublicResType`
   * @throws QaPostNotFoundOrForbiddenException if unauthorized
   */
  editPost(userId: number, postId: number, payload: ClientEditPostInputType): Promise<PostPublicResType> {
    return this.repo.clientEditPost(userId, postId, payload)
  }

  /**
   * Soft delete a post authored by the client.
   *
   * - Ensures ownership and prevents deleting the accepted answer.
   * - Marks `isDelete = true` instead of removing permanently.
   *
   * @param userId - ID of the authenticated client
   * @param postId - ID of the post to delete
   * @returns Object containing success message
   * @throws QaPostNotFoundOrForbiddenException if unauthorized
   * @throws BadRequestException if deleting accepted post
   */
  deletePost(userId: number, postId: number): Promise<{ message: string }> {
    return this.repo.clientDeletePost(userId, postId)
  }
}
