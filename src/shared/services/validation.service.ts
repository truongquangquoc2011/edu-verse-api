import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common'
import { PrismaService } from './prisma.service'
import { ERROR_MESSAGE } from '../constants/error-message.constant'
import { UserStatus } from '../constants/auth.constant'
const idSelect = { id: true }
@Injectable()
export class ValidationService {
  constructor(private readonly prisma: PrismaService) {}
  /**
   * Validates that an entity exists by ID in the specified model.
   * @param model - Prisma model name (e.g., 'category', 'role').
   * @param id - ID of the entity to validate.
   * @param errorMessage - Custom error message for not found case.
   * @throws BadRequestException if entity is not found.
   */
  private async validateEntityExists(model: string, id: number, errorMessage: string): Promise<void> {
    if (!id || id <= 0) {
      throw new BadRequestException(`Invalid ID for ${model}`)
    }

    const entity = await this.prisma[model].findUnique({
      where: { id },
      select: idSelect,
    })

    if (!entity) {
      throw new BadRequestException(errorMessage)
    }
  }
  /**
   * Validates that the given category ID exists.
   * @throws BadRequestException if category not found
   */
  async validateCategoryExists(categoryId: number): Promise<void> {
    await this.validateEntityExists('category', categoryId, ERROR_MESSAGE.VALIDATION.CATEGORY.NOT_FOUND)
  }

  /**
   * Validates that all hashtag IDs exist.
   * @param hashtagIds - Array of hashtag IDs to validate.
   * @throws BadRequestException if any hashtag ID is missing.
   */
  async validateHashtagIdsExist(hashtagIds: number[]): Promise<void> {
    if (!hashtagIds?.length) return

    if (hashtagIds.some((id) => !id || id <= 0)) {
      throw new BadRequestException('Invalid hashtag IDs')
    }

    const found = await this.prisma.hashtag.findMany({
      where: { id: { in: hashtagIds } },
      select: idSelect,
    })

    if (found.length !== hashtagIds.length) {
      throw new BadRequestException(ERROR_MESSAGE.VALIDATION.HASHTAG.NOT_FOUND)
    }
  }

  /**
   * Validates that a role ID exists.
   * @throws BadRequestException if role not found
   */
  async validateRoleExists(roleId: number): Promise<void> {
    await this.validateEntityExists('role', roleId, ERROR_MESSAGE.AUTH.INVALID_ROLE_ID)
  }
  /**
   * Validates that the user exists and has ACTIVE status.
   *
   * @param userId - The ID of the user to validate
   * @throws BadRequestException if user not found or not active
   */
  async validateUserStatus(userId: number): Promise<void> {
    if (!userId || userId <= 0) {
      throw new BadRequestException('Invalid user ID')
    }
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        status: true,
      },
    })

    if (!user) {
      throw new BadRequestException(ERROR_MESSAGE.AUTH.USER_NOT_FOUND)
    }

    const invalidStatuses: Record<string, string> = {
      [UserStatus.INACTIVE]: ERROR_MESSAGE.USER.ACCOUNT_INACTIVE,
      [UserStatus.BLOCKED]: ERROR_MESSAGE.USER.ACCOUNT_BLOCKED,
      [UserStatus.SUSPENDED]: ERROR_MESSAGE.USER.ACCOUNT_SUSPENDED,
    }
    if (invalidStatuses[user.status]) {
      throw new UnauthorizedException(invalidStatuses[user.status])
    }
  }
}
