import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common'
import { UserType } from 'src/shared/models/shared-user.model.'
import { PrismaService } from 'src/shared/services/prisma.service'
import { ProfileResType, RefreshTokenType, RoleType, VerificationCodeType } from './auth.model'
import {
  TypeVerifycationCodeType,
  UserStatus,
  UserStatusType,
  userWithRoleSelect,
} from 'src/shared/constants/auth.constant'
import { DeviceType, UpdateUserProfileDTO } from './dto/auth.dto'
import { ERROR_MESSAGE } from 'src/shared/constants/error-message.constant'
import { UserWithRoleAndPermissions } from 'src/shared/@types/auth.type'
import { ActionTaken, Prisma, ViolationType } from '@prisma/client'
import { UserNotFoundException } from './auth.error'

@Injectable()
export class AuthRepository {
  constructor(private readonly prismaService: PrismaService) {}

  /**
   * Creates a new user with the given details.
   * Used during the registration process.
   *
   * @param user - User data including email, full name, password, phone number, and role ID
   * @returns Promise resolving to the created user without sensitive fields (password, totpSecret)
   */
  async createUser(
    user: Pick<UserType, 'email' | 'fullname' | 'password' | 'phoneNumber' | 'roleId' | 'status'>,
  ): Promise<Omit<UserType, 'password' | 'totpSecret'>> {
    return await this.prismaService.user.create({
      data: user,
      omit: {
        password: true,
        totpSecret: true,
      },
    })
  }

  /**
   * Creates or updates a verification code associated with an email.
   * If a code already exists for the email, it updates the code and expiration.
   *
   * @param payload - Data containing email, code, type, and expiration time
   * @returns Promise resolving to the created or updated verification code
   */
  async createVerificationCode(
    payload: Pick<VerificationCodeType, 'email' | 'code' | 'type' | 'expiresAt'>,
  ): Promise<VerificationCodeType> {
    // Nếu chưa có thì tạo mới, nếu đã có thì cập nhật
    return await this.prismaService.verificationCode.upsert({
      where: {
        email: payload.email,
      },
      create: payload,
      update: {
        code: payload.code,
        expiresAt: payload.expiresAt,
      },
    })
  }

  /**
   * Finds a verification code based on email, code, and type, or by ID/email only.
   * Used to validate OTP during registration or login.
   *
   * @param uniqueValue - Object containing email, or id, or full match for email+code+type
   * @returns Promise resolving to the verification code or null if not found
   */
  findVerificationCodeByEmailAndType(
    uniqueValue: { email: string } | { id: number } | { email: string; code: string; type: TypeVerifycationCodeType },
  ): Promise<VerificationCodeType | null> {
    return this.prismaService.verificationCode.findFirst({
      where: uniqueValue,
    })
  }

  /**
   * Creates a new refresh token record in the database.
   * Used when issuing a new refresh token to a user.
   *
   * @param data - Includes userId, token string, expiration date, and device ID
   */
  async createRefreshToken(data: { userId: number; token: string; expiresAt: Date; deviceId: number }) {
    await this.prismaService.refreshToken.create({
      data,
    })
  }

  /**
   * Creates a new device record associated with a user.
   * Used to track login sessions and device activity.
   *
   * @param data - Includes userId, user agent, IP address, and optionally lastActive or isActive status
   * @returns Promise resolving to the created device
   */
  createDevice(
    data: Pick<DeviceType, 'userId' | 'userAgent' | 'ip'> & Partial<Pick<DeviceType, 'lastActive' | 'isActive'>>,
  ) {
    return this.prismaService.device.create({
      data,
    })
  }

  /**
   * Finds a user and their associated role by a unique identifier (email or ID).
   * Commonly used during login to retrieve user-role pair.
   *
   * @param uniqueObject - Object with either email or ID
   * @returns Promise resolving to user with role or null if not found
   */
  async findUniqueUserIncludeRole(
    uniqueObject: { email: string } | { id: number },
  ): Promise<UserWithRoleAndPermissions | null> {
    return this.prismaService.user.findUnique({
      where: uniqueObject,
      include: {
        role: {
          include: {
            permissions: true,
          },
        },
      },
    })
  }

  /**
   * Finds a unique refresh token by token string and includes the associated user's role information.
   * This function is essential for token validation and authorization processes.
   *
   * @param token - The refresh token string to search for
   * @returns Promise resolving to refresh token with user and role data, or null if not found
   */
  async findUniqueRefreshTokenIncludeUserRole(token: string): Promise<
    | (RefreshTokenType & {
        user: UserType & {
          role: RoleType & {
            permissions: { name: string }[]
          }
        }
      })
    | null
  > {
    if (!token || typeof token !== 'string' || token.trim().length === 0) {
      throw new Error('Token parameter must be a non-empty string')
    }

    return await this.prismaService.refreshToken.findUnique({
      where: {
        token: token.trim(),
      },
      include: {
        user: {
          include: {
            role: {
              include: {
                permissions: true,
              },
            },
          },
        },
      },
    })
  }

  /**
   * Deletes a specific refresh token by token string.
   * Used for logout functionality and token cleanup.
   *
   * @param token - The refresh token string to delete
   * @returns Promise resolving to the deleted token data, or null if not found
   */
  async deleteRefreshToken(token: string): Promise<RefreshTokenType> {
    // Validate input parameter
    if (!token || typeof token !== 'string' || token.trim().length === 0) {
      throw new Error('Token parameter must be a non-empty string')
    }

    // Delete the token
    const deletedToken = await this.prismaService.refreshToken.delete({
      where: {
        token: token.trim(),
      },
    })

    return deletedToken
  }

  /**
   * Updates a specific device record.
   *
   * @param deviceId - The ID of the device to update
   * @param data - The data to update the device with
   * @returns Promise resolving to the updated device data
   */
  async udpateDevice(deviceId: number, data: Partial<DeviceType>) {
    return await this.prismaService.device.update({
      where: {
        id: deviceId,
      },
      data,
    })
  }

  /**
   * Creates a user with an associated role.
   *
   * @param user - An object containing user data: email, fullname, password, phoneNumber, roleId, and avatar.
   * @returns The newly created user along with the associated role information.
   *
   * @throws {BadRequestException} If the provided role ID does not exist.
   * @throws {InternalServerErrorException} If the user creation transaction fails.
   */

  async createUserWithRole(
    user: Pick<UserType, 'email' | 'fullname' | 'password' | 'phoneNumber' | 'roleId' | 'avatar'>,
  ): Promise<UserType & { role: RoleType }> {
    // Validate that the role exists before creating the user
    const roleExists = await this.prismaService.role.findUnique({
      where: { id: user.roleId },
    })

    if (!roleExists) {
      throw new BadRequestException(ERROR_MESSAGE.AUTH.INVALID_ROLE_ID)
    }

    return this.prismaService.$transaction(async (prisma) => {
      return prisma.user.create({
        data: user,
        include: {
          role: true,
        },
      })
    })
  }
  /**
   * Deletes all refresh tokens associated with a specific user and device.
   * Used to ensure only one valid refresh token exists per device.
   *
   * @param userId - ID of the user
   * @param deviceId - ID of the device
   * @returns Promise resolving to the count of deleted refresh tokens
   */
  async deleteOldRefreshTokens(userId: number, deviceId: number): Promise<{ count: number }> {
    return await this.prismaService.refreshToken.deleteMany({
      where: {
        userId,
        deviceId,
      },
    })
  }
  /**
   * Finds an existing device by user ID, user agent, and IP address.
   *
   * @param userId - The user's ID
   * @param userAgent - The user agent string to match
   * @param ip - The IP address to match
   * @returns A device record if found, otherwise null
   */
  async findDeviceByUserAgentAndIp(userId: number, userAgent: string, ip: string) {
    return this.prismaService.device.findFirst({
      where: {
        userId,
        userAgent,
        ip,
      },
    })
  }

  /**
   * Updates a specific user record.
   *
   * @param email
   * @param data
   * @returns
   */
  async updateUser(
    payload: { email: string } | { id: number },
    data: Partial<Omit<UserType, 'id'>>,
  ): Promise<UserType> {
    return await this.prismaService.user.update({
      where: payload,
      data,
    })
  }

  async deleteVerificationCode(
    uniqueVal: { id: number } | { email: string; code: string; type: TypeVerifycationCodeType },
  ): Promise<VerificationCodeType> {
    return await this.prismaService.verificationCode.delete({
      where: uniqueVal,
    })
  }

  /* Get user profile with role for authenticated user.
   *
   * @param userId - The ID of the user
   * @returns ProfileResType
   */
  async findUserIncludeRoleById(userId: number): Promise<ProfileResType> {
    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
      select: userWithRoleSelect,
    })

    if (!user) {
      throw new BadRequestException(ERROR_MESSAGE.AUTH.USER_NOT_FOUND)
    }

    return user
  }
  /**
   * Updates the user's profile information.
   *
   * @param userId - The ID of the user to update
   * @param data - The new profile data to update
   * @returns The updated user profile
   */
  async updateUserProfile(userId: number, data: UpdateUserProfileDTO): Promise<ProfileResType> {
    return this.prismaService.user.update({
      where: { id: userId },
      data,
      select: userWithRoleSelect,
    })
  }
  /**
   * Reusable method to fetch user with specified fields.
   * @param userId - The ID of the user.
   * @param select - Fields to select from the user table.
   * @returns User data or throws an exception if not found.
   * @throws BadRequestException if user is not found.
   */
  private async fetchUser<T extends Prisma.UserSelect>(
    userId: number,
    select: T,
  ): Promise<ProfileResType | { status: UserStatusType }> {
    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
      select,
    })

    if (!user) {
      throw new BadRequestException(ERROR_MESSAGE.AUTH.USER_NOT_FOUND)
    }

    return user as ProfileResType | { status: UserStatusType }
  }

  /**
   * Validates that the user exists and has ACTIVE status.
   *
   * @param userId - The ID of the user to validate
   * @throws BadRequestException if user not found or not active
   */
  async validateUserStatus(userId: number): Promise<void> {
    const user = await this.fetchUser(userId, { status: true })

    // Check user status
    const invalidStatuses = {
      [UserStatus.INACTIVE]: ERROR_MESSAGE.USER.ACCOUNT_INACTIVE,
      [UserStatus.BLOCKED]: ERROR_MESSAGE.USER.ACCOUNT_BLOCKED,
      [UserStatus.SUSPENDED]: ERROR_MESSAGE.USER.ACCOUNT_SUSPENDED,
    }

    if (invalidStatuses[user.status]) {
      throw new UnauthorizedException(invalidStatuses[user.status])
    }
  }

  /**
   * Gets all users
   *
   * @returns Promise resolving to an array of users
   */

  async getAll(): Promise<UserType[]> {
    return await this.prismaService.user.findMany({
      where: {
        deletedAt: null,
      },
    })
  }

  /**
   * Finds an active (not soft-deleted) user by ID.
   * @param id - The user ID to look up.
   * @returns `{ id, email, lockExpirationDate }` if found; otherwise `null`.
   */
  async findActiveById(id: number) {
    return await this.prismaService.user.findFirst({
      where: { id, deletedAt: null },
      select: { id: true, email: true, lockExpirationDate: true },
    })
  }

  /**
   * Locks a user until `until` and records who updated it.
   * @param id - User ID to lock.
   * @param until - Future Date when lock expires.
   * @param updatedById - Acting admin ID.
   * @returns Updated user with lock fields.
   */
  async lockUser({ id, until, updatedById }: { id: number; until: Date; updatedById: number }) {
    return await this.prismaService.user.update({
      where: { id },
      data: { lockExpirationDate: until, updatedById, status: UserStatus.BLOCKED },
      select: { id: true, email: true, lockExpirationDate: true },
    })
  }

  /**
   * Unlocks a user by clearing `lockExpirationDate`.
   * @param id - User ID to unlock.
   * @param updatedById - Acting admin ID.
   * @returns Updated user with lock fields.
   */
  async unlockUser({ id, updatedById }: { id: number; updatedById: number }) {
    return await this.prismaService.user.update({
      where: { id },
      data: { lockExpirationDate: null, updatedById, status: UserStatus.ACTIVE },
      select: { id: true, email: true, lockExpirationDate: true },
    })
  }

  /**
   * Creates a violation record for a user and (optionally) stores lock duration.
   * Also tracks the staff who created this violation.
   * @param userId - Target user ID.
   * @param reason - Human-readable reason explaining the violation.
   * @param violationType - Violation category (enum).
   * @param actionTaken - Action applied due to the violation (enum).
   * @param lockDurationDays - Optional lock duration in days; persisted for auditing.
   * @param createdById - Admin/staff ID who created the violation.
   * @returns Newly created violation with creator info (id, reason, types, lockDurationDays, createdAt, createdBy).
   */
  async createViolation({
    userId,
    reason,
    violationType,
    actionTaken,
    lockDurationDays,
    createdById,
  }: {
    userId: number
    reason: string
    violationType: ViolationType
    actionTaken: ActionTaken
    lockDurationDays?: number
    createdById: number
  }) {
    return await this.prismaService.userViolation.create({
      data: {
        userId,
        reason,
        violationType,
        actionTaken,
        lockDurationDays: lockDurationDays ?? null,
        createdById,
      },
      select: {
        id: true,
        reason: true,
        violationType: true,
        actionTaken: true,
        lockDurationDays: true,
        createdAt: true,
        createdBy: {
          select: {
            id: true,
            email: true,
            fullname: true,
            role: { select: { id: true, name: true } },
          },
        },
      },
    })
  }

  /**
   * Locks a user until `until` and records who updated it.
   * @param id - User ID to lock.
   * @param days - Future Date when lock expires.
   * @param updatedById - Acting admin ID.
   * @returns Updated user with lock fields.
   */
  async lockUserDays({ id, days, updatedById }: { id: number; days: number; updatedById: number }) {
    const until = new Date(Date.now() + days * 86_400_000)
    return this.lockUser({ id, until, updatedById })
  }

  /**
   * Sets the latest violation reference on the user.
   * Useful for quick lookup of the most recent violation without joining the history.
   * @param userId - The user whose `lastViolationId` will be updated.
   * @param violationId - The violation to mark as the latest one.
   * @param updatedById - Admin/staff ID performing the update.
   * @returns `{ id, email, lastViolationId }` of the updated user.
   */
  async setLastViolation({
    userId,
    violationId,
    updatedById,
  }: {
    userId: number
    violationId: number
    updatedById: number
  }) {
    return this.prismaService.user.update({
      where: { id: userId },
      data: { lastViolationId: violationId, updatedById },
      select: { id: true, email: true, lastViolationId: true },
    })
  }

  findUser(email: string) {
    return this.prismaService.user.findUnique({
      where: { email },
      select: { id: true, email: true, fullname: true, status: true },
    })}
  async findUserById(userId: number) {
    return this.prismaService.user.findUnique({ where: { id: userId } })
  }

  updateAvatarUser(userId: number, data: { avatar: string }) {
    return this.prismaService.user
      .update({
        where: { id: userId },
        data,
        select: { id: true, avatar: true },
      })
      .catch((error) => {
        if (error instanceof Prisma.PrismaClientKnownRequestError ) {
          throw UserNotFoundException
        }
        throw error
      })
  }
}
