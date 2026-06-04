import { Injectable } from '@nestjs/common'
import { CartRepository } from './cart.repo'
import { PaginationQueryType } from 'src/shared/models/pagination.model'
import { AddCartInputType, AddCartResType, ListCartResType } from './cart.model'

@Injectable()
export class CartService {
  constructor(private readonly repo: CartRepository) {}

  /**
   * Retrieve the cart items of a specific user.
   *
   * **Endpoint:** GET /cart
   *
   * Delegates to `CartRepository.getCart`.
   *
   * @param userId - ID of the authenticated user retrieving the cart
   * @param query - Pagination parameters (skip, take)
   * @returns Paginated list of cart items and total count
   */
  getCart(userId: number, query: PaginationQueryType): Promise<ListCartResType> {
    return this.repo.getCart(userId, query)
  }

  /**
   * Add a course to the user's cart.
   *
   * **Endpoint:** POST /cart
   *
   * Delegates to `CartRepository.addToCart`.
   *
   * @param userId - ID of the authenticated user adding the course
   * @param payload - Request payload containing the courseId
   * @returns Result containing whether the item was added or user was enrolled directly
   */
  addToCart(userId: number, payload: AddCartInputType): Promise<AddCartResType> {
    return this.repo.addToCart(userId, payload)
  }

  /**
   * Remove a specific course from the user's cart.
   *
   * **Endpoint:** DELETE /cart/:courseId
   *
   * Delegates to `CartRepository.removeFromCart`.
   *
   * @param userId - ID of the authenticated user removing the course
   * @param courseId - ID of the course to remove
   * @returns Confirmation message
   */
  removeFromCart(userId: number, courseId: number): Promise<{ message: string }> {
    return this.repo.removeFromCart(userId, courseId)
  }

  /**
   * Clear all courses from the user's cart.
   *
   * **Endpoint:** DELETE /cart
   *
   * Delegates to `CartRepository.clearCart`.
   *
   * @param userId - ID of the authenticated user clearing the cart
   * @returns Confirmation message
   */
  clearCart(userId: number): Promise<{ message: string }> {
    return this.repo.clearCart(userId)
  }
}
