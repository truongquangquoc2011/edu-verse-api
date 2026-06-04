import { Injectable } from '@nestjs/common'
import { QaRepository } from '../qa.repo'
import {
  SellerAcceptAnswerInputType,
  SellerUpdateThreadStatusInputType,
  SellerLockThreadInputType,
  ListThreadsQueryType,
  ListThreadsResType,
  ListPostsResType,
  ThreadPublicResType,
  PostPublicResType,
  ClientCreatePostInputType,
} from '../qa.model'

@Injectable()
export class SellerQaService {
  constructor(private readonly repo: QaRepository) {}

  /**
   * List threads owned by the seller (instructor).
   *
   * - Supports filtering by course, lesson, and status.
   * - Returns paginated result sorted by last activity.
   *
   * @param userId - ID of the authenticated seller
   * @param query - Pagination/filter/sort parameters
   * @returns Paginated threads typed as `ListThreadsResType`
   */
  listThreads(userId: number, query: ListThreadsQueryType): Promise<ListThreadsResType> {
    return this.repo.sellerListThreads(userId, query)
  }

  /**
   * Retrieve details of a single thread owned by the seller.
   *
   * - Ensures seller is the instructor of the course related to the thread.
   *
   * @param userId - ID of the authenticated seller
   * @param threadId - Thread identifier
   * @returns Thread typed as `ThreadPublicResType`
   * @throws QaThreadNotFoundOrForbiddenException if unauthorized
   */
  getThread(userId: number, threadId: number): Promise<ThreadPublicResType> {
    return this.repo.sellerGetThread(userId, threadId)
  }

  /**
   * Update the thread’s status (e.g., PENDING ↔ RESOLVED).
   *
   * - When marking RESOLVED, thread must have an accepted post.
   * - When reverting to PENDING, acceptedPostId is cleared.
   *
   * @param userId - ID of the authenticated seller
   * @param threadId - Thread identifier
   * @param payload - Status update payload
   * @returns Updated thread typed as `ThreadPublicResType`
   */
  updateStatus(
    userId: number,
    threadId: number,
    payload: SellerUpdateThreadStatusInputType,
  ): Promise<ThreadPublicResType> {
    return this.repo.sellerUpdateStatus(userId, threadId, payload)
  }

  /**
   * Lock or unlock a thread.
   *
   * - Locked threads cannot receive new replies from clients or sellers.
   *
   * @param userId - ID of the authenticated seller
   * @param threadId - Thread identifier
   * @param payload - Lock payload (`{ locked: boolean }`)
   * @returns Updated thread typed as `ThreadPublicResType`
   */
  lockThread(userId: number, threadId: number, payload: SellerLockThreadInputType): Promise<ThreadPublicResType> {
    return this.repo.sellerLockThread(userId, threadId, payload)
  }

  /**
   * Soft delete a thread as a seller.
   *
   * - Marks thread as deleted, preserving data for audit/logging.
   *
   * @param userId - ID of the authenticated seller
   * @param threadId - Thread identifier
   * @returns Object containing success message
   */
  softDeleteThread(userId: number, threadId: number): Promise<{ message: string }> {
    return this.repo.softDeleteThreadAsSeller(userId, threadId)
  }

  // ===== Posts =====

  /**
   * List all posts within a thread owned by the seller.
   *
   * - Includes both client and seller posts.
   * - Supports pagination via `page` and `pageSize`.
   *
   * @param userId - ID of the authenticated seller
   * @param threadId - Thread identifier
   * @param page - Current page index (default: 1)
   * @param pageSize - Items per page (default: 50)
   * @returns Paginated posts typed as `ListPostsResType`
   */
  listPosts(userId: number, threadId: number, page = 1, pageSize = 50): Promise<ListPostsResType> {
    return this.repo.sellerListPosts(userId, threadId, page, pageSize)
  }

  /**
   * Create a reply (post) as a seller within a thread.
   *
   * - Automatically marks the thread as UNREAD for client.
   * - Inherits validation & formatting rules from client post schema.
   *
   * @param userId - ID of the authenticated seller
   * @param payload - Post creation payload
   * @returns Created post typed as `PostPublicResType`
   * @throws QaThreadLockedException if thread is locked
   */
  createPost(userId: number, payload: ClientCreatePostInputType): Promise<PostPublicResType> {
    return this.repo.sellerCreatePost(userId, payload)
  }

  /**
   * Accept a post as the official answer for the thread.
   *
   * - Ensures post belongs to the same thread.
   * - Updates thread status to RESOLVED and records acceptedPostId.
   *
   * @param userId - ID of the authenticated seller
   * @param threadId - Thread identifier
   * @param payload - Accept payload containing postId
   * @returns Updated thread typed as `ThreadPublicResType`
   * @throws QaPostNotFoundOrForbiddenException if post not valid
   */
  acceptAnswer(userId: number, threadId: number, payload: SellerAcceptAnswerInputType): Promise<ThreadPublicResType> {
    return this.repo.sellerAcceptAnswer(userId, threadId, payload)
  }

  /**
   * Unaccept the currently accepted answer for a thread.
   *
   * - Clears acceptedPostId and reverts status to PENDING.
   *
   * @param userId - ID of the authenticated seller
   * @param threadId - Thread identifier
   * @returns Updated thread typed as `ThreadPublicResType`
   */
  unacceptAnswer(userId: number, threadId: number): Promise<ThreadPublicResType> {
    return this.repo.sellerUnacceptAnswer(userId, threadId)
  }
}
