import {
  BadRequestException,
  ConflictException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
  UnprocessableEntityException,
} from '@nestjs/common'
import { HashingService } from 'src/shared/services/hashing.service'
import { TokenService } from 'src/shared/services/token.service'
import { generateOTP, isNotFoundPrismaError, isUniqueConstraintPrismaError } from 'src/shared/helper'
import { RolesService } from './role.service'
import {
  LoginBodyType,
  ProfileResType,
  RefreshTokenBodyType,
  RegisterBodyType,
  SendOTPBodyType,
  UpdateAvatarResType,
  UpdateUserProfileType,
  ForgotPasswordType,
  ResetPasswordType,
  UserWithPermissionsDto,
  CreateUserViolationResType,
  CreateUserViolationBodyType,
  GetUsersResType,
  LockUserBodyType,
  UserLockResType,
} from './auth.model'
import { AuthRepository } from './auth.repo'
import { SharedUserRepository } from 'src/shared/repositories/shared-user.repo'
import { addMilliseconds } from 'date-fns'
import ms from 'ms'
import { envConfig } from 'src/shared/config'
import { TypeVerifycationCode, TypeVerifycationCodeType, UserStatus } from 'src/shared/constants/auth.constant'
import { EmailService } from 'src/shared/services/email.service'
import { AccessTokenDto } from 'src/shared/dto/jwt.dto'
import { PrismaService } from 'src/shared/services/prisma.service'
import { v4 as uuidv4 } from 'uuid'
import {
  EmailNotExistsException,
  InternalCreateViolationErrorException,
  InternalLockUserErrorException,
  InternalRetrieveUserErrorException,
  InternalUnlockUserErrorException,
  InvalidOTPException,
  InvalidOTPExpiredExcepton,
  LockDurationRequiredForViolationException,
  LockPayloadRequiredException,
  LockUntilMustBeFutureException,
  UserBlockedException,
  UserNotFoundException,
} from './auth.error'
import { AuthMessages } from 'src/shared/constants/message.constant'
import { ERROR_MESSAGE } from 'src/shared/constants/error-message.constant'
import { ActionTaken } from 'src/shared/constants/user.constant'
import { MESSAGES } from 'src/shared/constants/succes-message.constant'

@Injectable()
export class AuthService {
  constructor(
    private readonly hashingService: HashingService,
    private readonly tokenService: TokenService,
    private readonly rolesService: RolesService,
    private readonly authRepository: AuthRepository,
    private readonly shareUserRepository: SharedUserRepository,
    private readonly emailService: EmailService,
    private readonly prismaService: PrismaService,
  ) {}

  /**
   * Validates an OTP code for a given email and verification type.
   * @throws InvalidOTPException if code is not found.
   * @throws InvalidOTPExpiredExcepton if code is expired.
   */
  async validateVerificationCode({
    email,
    code,
    type,
  }: {
    email: string
    code: string
    type: TypeVerifycationCodeType
  }) {
    const verifycationCode = await this.authRepository.findVerificationCodeByEmailAndType({
      email,
      code,
      type,
    })

    if (!verifycationCode) {
      throw InvalidOTPException
    }

    if (verifycationCode.expiresAt < new Date()) {
      throw InvalidOTPExpiredExcepton
    }
    return verifycationCode
  }

  /**
   * Retrieves a user along with their role and permissions for RBAC.
   * @param userId - The ID of the user
   * @returns User details with role name and permissions
   * @throws NotFoundException if the user is not found
   * @example
   * await getUserWithPermissions(1);
   */
  async getUserWithPermissions(userId: number) {
    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        createdAt: true,
        updatedAt: true,
        role: {
          select: {
            name: true,
            permissions: {
              select: { name: true },
            },
          },
        },
      },
    })

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`)
    }

    const permissions = user.role?.permissions.map((p) => p.name) ?? []

    return UserWithPermissionsDto.parse({
      id: user.id,
      email: user.email,
      roleName: user.role?.name,
      permissions,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    })
  }

  /**
   * Creates a new user from OAuth provider data if they don’t already exist.
   *
   * @param email - The user’s email retrieved from the OAuth provider.
   * @param name - (Optional) The user’s full name provided by the OAuth provider.
   * @param avatar - (Optional) The user’s avatar URL from the OAuth provider.
   * @returns A promise that resolves to the existing or newly created user including their role.
   *
   * @throws {BadRequestException} If the default client role ID is invalid or missing.
   * @throws {InternalServerErrorException} If the database operation fails during user creation.
   */

  async createOAuthUserIfNotExist(email: string, name?: string, avatar?: string) {
    try {
      const existing = await this.authRepository.findUniqueUserIncludeRole({ email })
      if (existing) return existing
      return this.prismaService.$transaction(async (prisma) => {
        const clientRoleId = await this.rolesService.getClientRoleId()
        const roleExists = await prisma.role.findUnique({ where: { id: clientRoleId } })
        if (!roleExists) {
          throw new BadRequestException('Client role does not exist')
        }

        const hashedPassword = await this.hashingService.hashPassword(uuidv4())
        const defaults = envConfig.oauthDefaults

        return prisma.user.create({
          data: {
            email,
            password: hashedPassword,
            fullname: name ?? defaults.FULL_NAME,
            phoneNumber: defaults.PHONE_NUMBER,
            roleId: clientRoleId,
            avatar: avatar ?? defaults.AVATAR,
          },
          select: {
            id: true,
            email: true,
            fullname: true,
            role: {
              select: {
                id: true,
                name: true,
                permissions: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        })
      })
    } catch (error) {
      console.error(`Failed to create OAuth user: ${error.message}`)
      throw new InternalServerErrorException('Failed to create OAuth user')
    }
  }
  /**
   * Registers a device for the user based on userId, userAgent, and IP.
   * If the device already exists, it updates `lastActive` and marks it as active.
   * If it doesn't exist, it creates a new device record.
   *
   * @param userId - ID of the user
   * @param userAgent - User-Agent string of the device
   * @param ip - IP address of the device
   * @returns The registered or updated device
   * @throws InternalServerErrorException - If database operation fails
   */
  async registerDevice(userId: number, userAgent: string, ip: string) {
    // Check if device already exists based on userId, userAgent, and IP
    const existingDevice = await this.authRepository.findDeviceByUserAgentAndIp(userId, userAgent, ip)

    if (existingDevice) {
      // Update lastActive timestamp and mark device as active
      await this.authRepository.udpateDevice(existingDevice.id, {
        lastActive: new Date(),
        isActive: true,
      })

      return existingDevice
    }

    // Create a new device if no match found
    return this.authRepository.createDevice({
      userId,
      userAgent,
      ip,
      lastActive: new Date(),
      isActive: true,
    })
  }
  /**
   * Deletes all refresh tokens for a specific user and device.
   * This is used to ensure that only one valid refresh token exists per device.
   *
   * @param userId - ID of the user
   * @param deviceId - ID of the device
   * @returns Promise resolving to the count of deleted refresh tokens
   */
  async deleteRefreshTokensForDevice(userId: number, deviceId: number) {
    return await this.authRepository.deleteOldRefreshTokens(userId, deviceId)
  }

  async register(createAuthDto: RegisterBodyType) {
    try {
      // Verify the OTP code
      await this.validateVerificationCode({
        email: createAuthDto.email,
        code: createAuthDto.code,
        type: TypeVerifycationCode.REGISTER,
      })

      const clientRoleId = await this.rolesService.getClientRoleId()
      const { email, password, fullname, phoneNumber } = createAuthDto
      const hashedPassword = await this.hashingService.hashPassword(password)
      // This part was missing previously
      return await this.authRepository.createUser({
        email,
        password: hashedPassword,
        fullname,
        phoneNumber,
        roleId: clientRoleId,
        status: UserStatus.ACTIVE
      })
    } catch (error) {
      if (isUniqueConstraintPrismaError(error)) {
        throw new UnprocessableEntityException({
          message: `User with email ${createAuthDto.email} already exists.`,
          path: 'email',
        })
      }
      throw error
    }
  }

  /**
   * Sends an OTP to email based on request type (register, forgot password, etc).
   * @throws UnprocessableEntityException if user already exists or not found.
   */
  async sendOTP(body: SendOTPBodyType) {
    try {
      const user = await this.shareUserRepository.findUnique({ email: body.email })
      if (body.type === TypeVerifycationCode.REGISTER) {
        if (user) {
          throw new UnprocessableEntityException({
            message: `User with email ${body.email} already exists.`,
            path: 'email',
          })
        }
      }

      if (body.type === TypeVerifycationCode.FORGOT_PASSWORD || body.type === TypeVerifycationCode.RESET_PASSWORD) {
        if (!user) {
          throw new UnprocessableEntityException({
            message: `User with email ${body.email} not registered yet.`,
            path: 'email',
          })
        }
      }

      const code = generateOTP()
      const expiresAt = addMilliseconds(new Date(), ms(envConfig.otpExpiresIn)) // 5 minutes expiration time

      const verificationCode = await this.authRepository.createVerificationCode({
        email: body.email,
        code,
        type: body.type,
        expiresAt,
      })

      const { error } = await this.emailService.sendOtpEmail({
        email: body.email,
        code,
      })

      if (error) {
        throw new UnprocessableEntityException({
          message: `Failed to send OTP to ${body.email}. Please try again later.`,
          path: 'code',
        })
      }

      return { message: 'OTP sent successfully' }
    } catch (error) {
      if (isUniqueConstraintPrismaError(error)) {
        throw new ConflictException(`User with email ${body.email} not exists in systems.`)
      }
      throw error
    }
  }

  /**
   * Generates both access and refresh tokens, stores refresh token in DB.
   */
  async generateAccessAndRefreshToken({ userId, deviceId, roleId, roleName, email }: AccessTokenDto) {
    const [accessToken, refreshToken] = await Promise.all([
      this.tokenService.signAccessToken({
        userId,
        email,
        deviceId,
        roleId,
        roleName,
      }),
      this.tokenService.signRefreshToken({
        userId,
        email,
      }),
    ])

    const decodeRefreshToken = await this.tokenService.verifyRefreshToken(refreshToken)

    await this.authRepository.createRefreshToken({
      userId,
      token: refreshToken,
      expiresAt: new Date(decodeRefreshToken.exp * 1000),
      deviceId,
    })

    return {
      accessToken,
      refreshToken,
    }
  }

  /**
   * Handles user login: validates credentials, creates device, issues tokens.
   * @throws UnprocessableEntityException if email or password is invalid.
   */
  async login(body: LoginBodyType & { userAgent: string; ip: string }) {
    try {
      const user = await this.authRepository.findUniqueUserIncludeRole({ email: body.email })

      if (!user) {
        throw new UnprocessableEntityException([
          {
            message: 'Email is not exist',
            path: 'email',
          },
        ])
      }

      const accountInactive = await this.authRepository.findUser(body.email)
      if (!accountInactive) throw UserNotFoundException
      if (user.status === UserStatus.INACTIVE || user.status === UserStatus.BLOCKED) throw UserBlockedException

      const isPasswordValid = await this.hashingService.comparePassword(body.password, user.password)
      if (!isPasswordValid) {
        throw new UnprocessableEntityException([
          {
            message: 'Password is incorrect',
            field: 'password',
          },
        ])
      }

      const permissions = user.role?.permissions?.map((p) => p.name) || []

      const device = await this.authRepository.createDevice({
        userId: user.id,
        userAgent: body.userAgent,
        ip: body.ip,
      })

      const tokens = await this.generateAccessAndRefreshToken({
        userId: user.id,
        email: user.email,
        deviceId: device.id,
        roleId: user.roleId,
        roleName: user.role.name,
      })

      return tokens
    } catch (error) {
      if (isUniqueConstraintPrismaError(error)) {
        throw new ConflictException(`User with email ${body.email} already exists.`)
      }
      throw error
    }
  }

  /**
   * Changes password after verifying forgot-password OTP.
   * @throws EmailNotExistsException if email not found.
   */
  async forgotPassword(body: ForgotPasswordType) {
    return await this.handlePasswordReset({
      email: body.email,
      newPassword: body.newPassword,
      code: body.code,
      type: TypeVerifycationCode.FORGOT_PASSWORD,
    })
  }

  /**
   * Changes password after verifying forgot-password OTP.
   * @throws EmailNotExistsException if email not found.
   */
  async resetPassword(body: ResetPasswordType) {
    return await this.handlePasswordReset({
      email: body.email,
      newPassword: body.newPassword,
      code: body.code,
      type: TypeVerifycationCode.RESET_PASSWORD,
    })
  }
  /**
   * Handles the password reset process using a verification code.
   *
   * This method performs the following steps:
   * 1. Verifies that a user with the given email exists.
   * 2. Validates the provided OTP code based on its type (e.g., FORGOT_PASSWORD, RESET_PASSWORD).
   * 3. Hashes the new password securely.
   * 4. Updates the user's password and deletes the used verification code in parallel.
   * @param {string} email - The email of the user requesting password reset.
   * @param {string} newPassword - The new password to be set for the user.
   * @param {string} code - The verification code (OTP) used to authorize the password reset.
   * @param {TypeVerifycationCodeType} type - The type of verification (e.g., FORGOT_PASSWORD, RESET_PASSWORD).
   * @returns {Promise<{ message: string }>} A success message indicating the password has been changed.
   * @throws {EmailNotExistsException} If the user with the given email does not exist.
   * @throws {Error} If OTP validation fails or password update encounters an error.
   */
  async handlePasswordReset({
    email,
    newPassword,
    code,
    type,
  }: {
    email: string
    newPassword: string
    code: string
    type: TypeVerifycationCodeType
  }) {
    const user = await this.shareUserRepository.findUnique({ email })
    if (!user) {
      throw EmailNotExistsException
    }

    await this.validateVerificationCode({ email, code, type })

    const hashedPassword = await this.hashingService.hashPassword(newPassword)

    await Promise.all([
      this.authRepository.updateUser({ email }, { password: hashedPassword }),
      this.authRepository.deleteVerificationCode({ email, code, type }),
    ])

    return { message: AuthMessages.PASSWORD_CHANGED_SUCCESSFULLY }
  }
  /**
   * Verifies refresh token, deletes old one, generates new tokens.
   * @throws UnauthorizedException if token is invalid or revoked.
   */
  async refreshToken({ refreshToken, userAgent, ip }: RefreshTokenBodyType & { userAgent: string; ip: string }) {
    try {
      // 1. Verify if the refresh token is valid
      const { userId, email } = await this.tokenService.verifyRefreshToken(refreshToken)

      // 2. Check if the token exists in the database
      const refreshTokenInDb = await this.authRepository.findUniqueRefreshTokenIncludeUserRole(refreshToken)
      if (!refreshTokenInDb) {
        throw new UnauthorizedException('Refresh token has been revoked or does not exist')
      }

      // 3. Update device information
      const {
        deviceId,
        user: {
          roleId,
          role: { name: roleName, permissions: rolePermissions },
        },
      } = refreshTokenInDb

      const permissions = rolePermissions.map((p) => p.name)

      const $updateDevice = this.authRepository.udpateDevice(deviceId, {
        userAgent,
        ip,
        lastActive: new Date(),
      })

      // 4. Delete the old refresh token
      const $deleteRefreshToken = this.authRepository.deleteRefreshToken(refreshToken)

      // 5. Generate new access and refresh tokens
      const newTokens = this.generateAccessAndRefreshToken({
        userId: +userId,
        email,
        deviceId,
        roleId,
        roleName,
      })

      const [, , tokens] = await Promise.all([$updateDevice, $deleteRefreshToken, newTokens])
      return tokens
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error
      }
      throw new UnauthorizedException()
    }
  }

  /**
   * Logs the user out by deleting refresh token and marking device inactive.
   */
  async logout({ refreshToken }: RefreshTokenBodyType): Promise<{ message: string }> {
    try {
      // 1. Verify if the refresh token is valid
      await this.tokenService.verifyRefreshToken(refreshToken)

      // 2. Delete the old refresh token
      const $deleteRefreshToken = await this.authRepository.deleteRefreshToken(refreshToken)

      // 3. Update device status
      await this.authRepository.udpateDevice($deleteRefreshToken.deviceId, {
        isActive: false,
      })
      return { message: 'Logout successfuly' }
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error
      }
      if (isNotFoundPrismaError(error)) {
        throw new UnauthorizedException('Refresh token has been revoked or does not exist')
      }
      throw new UnauthorizedException()
    }
  }
  /**
   * Retrieves the authenticated user's profile.
   *
   * @param userId - The ID of the authenticated user.
   * @returns The user's profile information.
   *
   * @throws {BadRequestException} If the user is not found.
   * @throws {UnauthorizedException} If the user's account status is inactive, blocked, or suspended.
   */
  async getUserProfile(userId: number) {
    const user = await this.authRepository.findUserIncludeRoleById(userId)

    if (!user) {
      throw new BadRequestException(ERROR_MESSAGE.AUTH.USER_NOT_FOUND)
    }
    await this.authRepository.validateUserStatus(userId)

    return user
  }
  /**
   * Updates the authenticated user's profile.
   *
   * @param userId - The ID of the authenticated user.
   * @param body - The new profile data to update.
   * @returns The updated user's profile information.
   *
   * @throws {BadRequestException} If the user is not found.
   * @throws {UnauthorizedException} If the user's account status is inactive, blocked, or suspended.
   */
  async updateUserProfile(userId: number, body: UpdateUserProfileType) {
    const existingUser = await this.authRepository.findUserIncludeRoleById(userId)

    if (!existingUser) {
      throw new BadRequestException(ERROR_MESSAGE.AUTH.USER_NOT_FOUND)
    }
    // Validate user status before updating
    await this.authRepository.validateUserStatus(userId)

    return this.authRepository.updateUserProfile(userId, body)
  }

  /**
   * Retrieves all users from the data source.
   * This method calls the user repository to fetch all user records,
   * and returns a response object containing the user list and the total number of users.
   * If an error occurs during the retrieval process:
   * - If the error is an instance of `HttpException`, it will be re-thrown as is.
   * - Otherwise, it throws a generic `InternalRetrieveUserErrorException` to indicate an internal failure.
   * @returns {Promise<GetUsersResType>} An object containing the list of users and the total item count.
   * @throws {HttpException | InternalRetrieveUserErrorException} If an error occurs during data retrieval.
   */
  async getAllUsers(): Promise<GetUsersResType> {
    try {
      const users = await this.authRepository.getAll()
      return {
        data: users,
        totalItems: users.length,
      }
    } catch (error) {
      if (error instanceof HttpException) {
        throw error
      }
      throw InternalRetrieveUserErrorException
    }
  }

  /**
   * Locks a user account either for a given duration (in minutes) or until a specific datetime.
   * Requires a valid Bearer token; the acting admin’s `userId` is recorded as `updatedById`.
   * @param params.id The target user ID to lock.
   * @param params.body The lock payload containing `durationMinutes` (number of minutes) or `until` (Date preprocessed by DTO).
   * @param params.updatedById The authenticated admin/actor ID performing this action (captured from access token).
   * @returns {Promise<UserLockResType>} The updated user lock state (including `lockExpirationDate`).
   * @throws {UserNotFoundException} When the user does not exist or is soft-deleted.
   * @throws {LockPayloadRequiredException} When neither `durationMinutes` nor `until` is provided.
   * @throws {LockUntilMustBeFutureException} When the computed `until` is not in the future.
   * @throws {InvalidUntilDatetimeException} When `until` cannot be parsed into a valid Date (if preprocessing/DTO triggers this).
   * @throws {InternalLockUserErrorException} For any unexpected server-side failure (non-HttpException).
   */
  async lockUser({
    id,
    body,
    updatedById,
  }: {
    id: number
    body: LockUserBodyType
    updatedById: number
  }): Promise<UserLockResType> {
    try {
      const user = await this.authRepository.findActiveById(id)
      if (!user) throw UserNotFoundException

      // must have durationMinutes or until
      if (!body.durationMinutes && !body.until) throw LockPayloadRequiredException

      let until: Date
      if (typeof body.durationMinutes === 'number') {
        until = new Date(Date.now() + body.durationMinutes * 60_000)
      } else {
        until = body.until!
      }

      if (!until || until.getTime() <= Date.now()) {
        throw LockUntilMustBeFutureException
      }

      const updated = await this.authRepository.lockUser({ id, until, updatedById })
      return updated
    } catch (error) {
      if (error instanceof HttpException) throw error
      throw InternalLockUserErrorException
    }
  }

  /**
   * Unlocks a user account by clearing `lockExpirationDate`.
   * Requires a valid Bearer token; the acting admin’s `userId` is recorded as `updatedById`.
   * @param params.id The target user ID to unlock.
   * @param params.updatedById The authenticated admin/actor ID performing this action (captured from access token).
   * @returns {Promise<UserLockResType>} The updated user lock state with `locked = false` and `lockExpirationDate = null`.
   * @throws {UserNotFoundException} When the user does not exist or is soft-deleted.
   * @throws {InternalUnlockUserErrorException}For any unexpected server-side failure (non-HttpException).
   */
  async unlockUser({ id, updatedById }: { id: number; updatedById: number }): Promise<UserLockResType> {
    try {
      const user = await this.authRepository.findActiveById(id)
      if (!user) throw UserNotFoundException

      const updated = await this.authRepository.unlockUser({ id, updatedById })
      return updated
    } catch (error) {
      if (error instanceof HttpException) throw error
      throw InternalUnlockUserErrorException
    }
  }

  /**
   * Creates a violation record for a user, optionally applies a lock,
   * and updates the user's `lastViolationId` for quick lookup.
   * @param params.id - Target user ID.
   * @param params.body - Violation payload (reason, violationType, actionTaken, lockDurationDays?).
   * @param params.adminId - Acting admin/staff ID who marks the violation.
   * @returns {Promise<CreateUserViolationResType>} The created violation augmented with `lockExpirationDate`
   *   (null if not locked or unchanged if already locked and no new lock applied).
   * @throws {UserNotFoundException}
   *   Thrown when the user does not exist or has been soft-deleted.
   * @throws {LockDurationRequiredForViolationException}
   *   Thrown when `actionTaken` is `LOCK` but `lockDurationDays` is missing.
   * @throws {HttpException}
   *   Re-thrown as-is for any handled domain exceptions in the flow.
   * @throws {InternalCreateViolationErrorException}
   *   Thrown for any unexpected server-side failure.
   */
  async markViolationForUser({
    id,
    body,
    adminId,
  }: {
    id: number
    body: CreateUserViolationBodyType
    adminId: number
  }): Promise<CreateUserViolationResType> {
    try {
      const user = await this.authRepository.findActiveById(id)
      if (!user) throw UserNotFoundException

      if (body.actionTaken === ActionTaken.LOCK && !body.lockDurationDays) {
        throw LockDurationRequiredForViolationException
      }

      const violation = await this.authRepository.createViolation({
        userId: id,
        reason: body.reason,
        violationType: body.violationType,
        actionTaken: body.actionTaken,
        lockDurationDays: body.lockDurationDays,
        createdById: adminId,
      })

      let lockExpirationDate: Date | null = user.lockExpirationDate ?? null
      if (body.actionTaken === ActionTaken.LOCK && body.lockDurationDays) {
        const lockedUser = await this.authRepository.lockUserDays({
          id,
          days: body.lockDurationDays,
          updatedById: adminId,
        })
        lockExpirationDate = lockedUser.lockExpirationDate
      }

      await this.authRepository.setLastViolation({
        userId: id,
        violationId: violation.id,
        updatedById: adminId,
      })

      return {
        ...violation,
        lockExpirationDate,
      }
    } catch (error) {
      if (error instanceof HttpException) throw error
      throw InternalCreateViolationErrorException
    }
  }
  /**
   * Updates the avatar URL of the user.
   *
   * @param userId - The ID of the user.
   * @param avatarUrl - The new avatar URL.
   * @returns The updated avatar URL.
   */
  async updateUserAvatar(userId: number, avatarUrl: string): Promise<UpdateAvatarResType> {
    const user = await this.authRepository.findUserById(userId)
    if (!user) {
      throw UserNotFoundException
    }

    await this.authRepository.validateUserStatus(userId)

    const updated = await this.authRepository.updateAvatarUser(userId, { avatar: avatarUrl })
    return {
      message: MESSAGES.USER.AVATAR_UPDATED,
      avatar: updated.avatar,
    }
  }
}
