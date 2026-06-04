import { Injectable } from '@nestjs/common'
import { WishlistRepository } from './wishlist.repo'
import { PaginationQueryType } from 'src/shared/models/pagination.model'
import { AddWishlistInputType, AddWishlistResType, ListWishlistResType } from './wishlist.model'

@Injectable()
export class WishlistService {
  constructor(private readonly repo: WishlistRepository) {}

  /**
   * Retrieve the wishlist items of a specific user.
   *
   * **Endpoint:** GET /wishlist
   *
   * Delegates to `WishlistRepository.getWishlist`.
   *
   * @param userId - ID of the authenticated user retrieving the wishlist
   * @param query - Pagination parameters (skip, take)
   * @returns Paginated list of wishlist items and total count
   */
  getWishlist(userId: number, query: PaginationQueryType): Promise<ListWishlistResType> {
    return this.repo.getWishlist(userId, query)
  }

  /**
   * Add a course to the user's wishlist.
   *
   * **Endpoint:** POST /wishlist
   *
   * Delegates to `WishlistRepository.addToWishlist`.
   *
   * @param userId - ID of the authenticated user adding the course
   * @param payload - Request payload containing the courseId
   * @returns Result containing whether the item was added
   */
  addToWishlist(userId: number, payload: AddWishlistInputType): Promise<AddWishlistResType> {
    return this.repo.addToWishlist(userId, payload)
  }

  /**
   * Remove a specific course from the user's wishlist.
   *
   * **Endpoint:** DELETE /wishlist/:courseId
   *
   * Delegates to `WishlistRepository.removeFromWishlist`.
   *
   * @param userId - ID of the authenticated user removing the course
   * @param courseId - ID of the course to remove
   * @returns Confirmation message
   */
  removeFromWishlist(userId: number, courseId: number): Promise<{ message: string }> {
    return this.repo.removeFromWishlist(userId, courseId)
  }

  /**
   * Clear all courses from the user's wishlist.
   *
   * **Endpoint:** DELETE /wishlist
   *
   * Delegates to `WishlistRepository.clearWishlist`.
   *
   * @param userId - ID of the authenticated user clearing the wishlist
   * @returns Confirmation message
   */
  clearWishlist(userId: number): Promise<{ message: string }> {
    return this.repo.clearWishlist(userId)
  }
}
