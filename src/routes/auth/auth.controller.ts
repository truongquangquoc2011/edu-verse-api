import {
  Controller,
  Post,
  Body,
  Req,
  Ip,
  HttpCode,
  HttpStatus,
  Get,
  Query,
  Res,
  Inject,
  Patch,
  Param,
  Put,
  BadRequestException,
} from '@nestjs/common'
import { AuthService } from './auth.service'
import {
  CreateUserViolationBodyDTO,
  CreateUserViolationResDTO,
  ForgotPasswordResDTO,
  GetAllUsersResponseDTO,
  LockUserBodyDTO,
  LoginBodyDTO,
  LoginResDTO,
  LogoutBodyDTO,
  MessageResDTO,
  ProfileResDTO,
  RefreshTokenBodyDTO,
  RefreshTokenResDTO,
  RegisterBodyDTO,
  RegisterResDTO,
  ResetPasswordResDTO,
  SendOTPBodyDTO,
  UpdateUserProfileDTO,
  UserIdParamDTO,
  UserLockResDTO,
} from './dto/auth.dto'
import { ZodSerializerDto } from 'nestjs-zod'
import { UserAgent } from 'src/shared/decorator/user-agent.decorator'
import { Auth, IsPublic } from 'src/shared/decorator/auth.decorator'
import { GoogleService } from './google.service'
import { Response } from 'express'
import { FacebookService } from './facebook.service'
import { AuthError } from 'src/shared/constants/auth-error.enum'
import { handleOAuthCallback } from 'src/shared/helper/oauth.helper'
import { envConfig } from 'src/shared/config'
import { AuthTypes, ConditionGuard } from 'src/shared/constants/auth.constant'
import { ActiveUser } from 'src/shared/decorator/active-user.decorator'
import { ProfileResType, UpdateAvatarResType } from './auth.model'
import { CloudinaryService } from 'src/shared/services/cloudinary.service'
import { UseInterceptors, UploadedFile } from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { NoFileProvidedException } from 'src/shared/constants/file-error.constant'
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery, ApiSecurity, ApiParam } from '@nestjs/swagger'
import { HttpStatusCode } from 'src/shared/swagger/swagger.interface'
import { ApiStandardResponses } from 'src/shared/decorator/api-standard-response'
import { RESPONSE_MESSAGES } from 'src/shared/constants/swagger.constant'

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  private readonly googleRedirectBase: URL
  private readonly facebookRedirectBase: URL
  constructor(
    private readonly authService: AuthService,
    @Inject(GoogleService) private readonly googleService: GoogleService,
    @Inject(FacebookService) private readonly facebookService: FacebookService,
    private readonly cloudinaryService: CloudinaryService,
  ) {
    this.googleRedirectBase = new URL(envConfig.googleClientRedirectUri)
    this.facebookRedirectBase = new URL(envConfig.facebookClientRedirectUri)
  }

  /**
   * Registers a new user with email/phone and password.
   * @param body - The user registration data.
   * @returns Registered user info and tokens.
   */
  @Post('register')
  @IsPublic()
  @ZodSerializerDto(RegisterResDTO)
  @ApiOperation({ summary: 'Register user', description: 'Registers a new user with email/phone and password.' })
  @ApiStandardResponses(HttpStatusCode.CREATED, RESPONSE_MESSAGES.SUCCESS.REGISTER, RegisterResDTO)
  async register(@Body() body: RegisterBodyDTO) {
    return await this.authService.register(body)
  }

  /**
   * Sends OTP to the provided email or phone.
   * @param body - Contains destination to send OTP.
   * @returns A message confirming OTP sent.
   */
  @Post('otp')
  @IsPublic()
  @ZodSerializerDto(MessageResDTO)
  @ApiOperation({ summary: 'Send OTP', description: 'Send OTP to user email or phone.' })
  @ApiStandardResponses(HttpStatusCode.OK, RESPONSE_MESSAGES.SUCCESS.SEND_OTP, MessageResDTO)
  async sendOTP(@Body() body: SendOTPBodyDTO) {
    return await this.authService.sendOTP(body)
  }

  /**
   * Authenticates a user using email/phone and password.
   * @param body - Login credentials.
   * @param userAgent - The client's user agent string.
   * @param ip - The client's IP address.
   * @returns Access and refresh tokens.
   */
  @Post('login')
  @IsPublic()
  @ZodSerializerDto(LoginResDTO)
  @ApiOperation({ summary: 'Login user', description: 'Authenticate user using email/phone and password.' })
  @ApiStandardResponses(HttpStatusCode.OK, RESPONSE_MESSAGES.SUCCESS.LOGIN, LoginResDTO)
  async login(@Body() body: LoginBodyDTO, @UserAgent() userAgent: string, @Ip() ip: string) {
    return await this.authService.login({
      ...body,
      userAgent,
      ip,
    })
  }

  /**
   * Refreshes the access token using a valid refresh token.
   * @param body - The refresh token data.
   * @param userAgent - The client's user agent string.
   * @param ip - The client's IP address.
   * @returns New access and refresh tokens.
   */
  @Post('refresh-token')
  @IsPublic()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh token', description: 'Refresh access token using a valid refresh token.' })
  @ApiStandardResponses(HttpStatusCode.OK, RESPONSE_MESSAGES.SUCCESS.REFRESH_TOKEN, RefreshTokenResDTO)
  async refreshToken(@Body() body: RefreshTokenBodyDTO, @UserAgent() userAgent: string, @Ip() ip: string) {
    return await this.authService.refreshToken({
      ...body,
      userAgent,
      ip,
    })
  }

  /**
   * Logs out a user by revoking their refresh token.
   * @param body - Contains the refresh token to revoke.
   * @returns A success message.
   */
  @Post('logout')
  @Auth([AuthTypes.BEARER])
  @ApiBearerAuth('authorization')
  @HttpCode(HttpStatus.OK)
  @ZodSerializerDto(MessageResDTO)
  @ApiOperation({ summary: 'Logout user', description: 'Revoke refresh token and logout.' })
  @ApiStandardResponses(HttpStatusCode.OK, RESPONSE_MESSAGES.SUCCESS.LOGOUT, MessageResDTO)
  async logout(@Body() body: LogoutBodyDTO) {
    return await this.authService.logout(body)
  }

  /**
   * Sends a reset password link or OTP to the user.
   * @param body - Contains email/phone of the user.
   * @returns A message indicating the request result.
   */
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @IsPublic()
  @ZodSerializerDto(MessageResDTO)
  @ApiOperation({ summary: 'Forgot password', description: 'Send reset link or OTP to user email/phone.' })
  @ApiStandardResponses(HttpStatusCode.OK, RESPONSE_MESSAGES.SUCCESS.FORGOT_PASSWORD, MessageResDTO)
  async forgotPassword(@Body() body: ForgotPasswordResDTO) {
    return await this.authService.forgotPassword(body)
  }

  /**
   * Resets the user password using provided token or OTP.
   * @param body - Contains new password and verification data.
   * @returns A message confirming password reset.
   */
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @IsPublic()
  @ZodSerializerDto(MessageResDTO)
  @ApiOperation({ summary: 'Reset password', description: 'Reset user password using token or OTP.' })
  @ApiStandardResponses(HttpStatusCode.OK, RESPONSE_MESSAGES.SUCCESS.RESET_PASSWORD, MessageResDTO)
  async resetPassword(@Body() body: ResetPasswordResDTO) {
    return await this.authService.resetPassword(body)
  }

  /**
   * Generates the Google OAuth authorization URL.
   *
   * @param userAgent - The client's user agent string.
   * @param ip - The client's IP address.
   * @returns The authorization URL.
   */
  @Get('google')
  @IsPublic()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get Google OAuth URL', description: 'Generate Google OAuth authorization URL.' })
  @ApiStandardResponses(HttpStatusCode.OK, RESPONSE_MESSAGES.SUCCESS.LOGIN_GOOGLE)
  async getGoogleAuthUrl(@UserAgent() userAgent: string, @Ip() ip: string) {
    return await this.googleService.getAuthorizationUrl({ userAgent, ip })
  }
  /**
   * Handles the Google OAuth callback, exchanging the authorization code for tokens.
   *
   * @param code - The authorization code from Google.
   * @param state - The state parameter for CSRF protection.
   * @param res - The HTTP response object for redirecting.
   * @returns Redirects to the client with access and refresh tokens or an error message.
   */
  @Get('google/callback')
  @IsPublic()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Google OAuth callback', description: 'Handle Google OAuth2 callback.' })
  @ApiQuery({ name: 'code', type: String, required: true })
  @ApiQuery({ name: 'state', type: String, required: false })
  @ApiStandardResponses(HttpStatusCode.OK, RESPONSE_MESSAGES.SUCCESS.GOOGLE_CALLBACK)
  /**
   * Handles the Google OAuth callback, exchanging code for tokens.
   * Redirects with token or error message.
   */
  async googleCallback(@Query('code') code: string, @Query('state') state: string, @Res() res: Response) {
    const redirectUrl = await handleOAuthCallback(
      this.googleService,
      this.googleRedirectBase,
      code,
      state,
      AuthError.GOOGLE_LOGIN_FAILED,
    )

    return res.redirect(redirectUrl.toString())
  }

  /**
   * Generates the Facebook OAuth authorization URL.
   *
   * @param userAgent - The client's user agent string.
   * @param ip - The client's IP address.
   * @returns The authorization URL.
   */

  @Get('facebook')
  @IsPublic()
  @ApiOperation({ summary: 'Get Facebook OAuth URL', description: 'Generate Facebook OAuth authorization URL.' })
  @ApiStandardResponses(HttpStatusCode.OK, RESPONSE_MESSAGES.SUCCESS.LOGIN_FACEBOOK)
  async getFacebookAuthUrl(@UserAgent() userAgent: string, @Ip() ip: string) {
    return this.facebookService.getAuthorizationUrl({ userAgent, ip })
  }

  /**
   * Handles the Facebook OAuth callback, exchanging the authorization code for tokens.
   *
   * @param code - The authorization code from Facebook.
   * @param state - The state parameter for CSRF protection.
   * @param res - The HTTP response object for redirecting.
   * @returns Redirects to the client with access and refresh tokens or an error message.
   */
  @Get('facebook/callback')
  @IsPublic()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Facebook OAuth callback', description: 'Handle Facebook OAuth2 callback.' })
  @ApiQuery({ name: 'code', type: String, required: true })
  @ApiQuery({ name: 'state', type: String, required: false })
  @ApiStandardResponses(HttpStatusCode.OK, RESPONSE_MESSAGES.SUCCESS.FACEBOOK_CALLBACK)
  async facebookCallback(@Query('code') code: string, @Query('state') state: string, @Res() res: Response) {
    const redirectUrl = await handleOAuthCallback(
      this.facebookService,
      this.facebookRedirectBase,
      code,
      state,
      AuthError.FACEBOOK_LOGIN_FAILED,
    )

    return res.redirect(redirectUrl.toString())
  }
  /**
   * Retrieves the authenticated user's profile.
   *
   * @param userId - The ID of the authenticated user.
   * @returns The user's profile information.
   */
  @Auth([AuthTypes.BEARER, AuthTypes.APIKey], { condition: ConditionGuard.OR })
  @ApiBearerAuth('authorization')
  @ApiSecurity('X-Api-Key')
  @Get('profile')
  @HttpCode(HttpStatus.OK)
  @ZodSerializerDto(ProfileResDTO)
  @ApiOperation({ summary: 'Get user profile', description: 'Retrieve authenticated user profile.' })
  @ApiStandardResponses(HttpStatusCode.OK, RESPONSE_MESSAGES.SUCCESS.PROFILE.GET, ProfileResDTO)
  async getProfile(@ActiveUser('userId') userId: number): Promise<ProfileResType> {
    return await this.authService.getUserProfile(userId)
  }
  /**
   * Updates the authenticated user's profile.
   *
   * @param userId - The ID of the authenticated user.
   * @param body - The updated profile information.
   * @returns The updated user's profile information.
   */
  @Auth([AuthTypes.BEARER, AuthTypes.APIKey], { condition: ConditionGuard.OR })
  @ApiBearerAuth('authorization')
  @ApiSecurity('X-Api-Key')
  @Patch('profile')
  @HttpCode(HttpStatus.OK)
  @ZodSerializerDto(ProfileResDTO)
  @ApiOperation({ summary: 'Update profile', description: 'Update authenticated user profile.' })
  @ApiStandardResponses(HttpStatusCode.OK, RESPONSE_MESSAGES.SUCCESS.PROFILE.UPDATE, ProfileResDTO)
  async updateProfile(
    @ActiveUser('userId') userId: number,
    @Body() body: UpdateUserProfileDTO,
  ): Promise<ProfileResType> {
    return await this.authService.updateUserProfile(userId, body)
  }

  /**
   * GET /users
   * Retrieves a list of all users in the system.
   * @returns An array of user objects.
   * @status 200 - Successful response
   */
  @Get()
  @ApiBearerAuth('authorization')
  @HttpCode(HttpStatus.OK)
  @ZodSerializerDto(GetAllUsersResponseDTO)
  @ApiOperation({ summary: 'Get all users', description: 'List all users (admin only).' })
  @ApiStandardResponses(HttpStatusCode.OK, RESPONSE_MESSAGES.SUCCESS.AUTH.GET, GetAllUsersResponseDTO)
  async getAllUsers() {
    return await this.authService.getAllUsers()
  }

  /**
   * Locks a user account until a specific time or for a given duration.
   * Requires Bearer authentication. The authenticated admin's `userId`
   * will be saved as `updatedById`.
   * @param params - DTO containing the target `userId` from the route path.
   * @param body   - DTO containing either `durationMinutes` or `until` (ISO), plus optional `reason`.
   * @param userId - ID of the authenticated admin/actor (extracted from the access token).
   * @returns The updated user lock state (serialized by `UserLockResDTO`).
   */
  @Auth([AuthTypes.BEARER])
  @ApiBearerAuth('authorization')
  @Put(':userId/lock')
  @HttpCode(HttpStatus.OK)
  @ZodSerializerDto(UserLockResDTO)
  @ApiOperation({ summary: 'Lock user', description: 'Lock a user account temporarily or until specific date.' })
  @ApiParam({ name: 'userId', type: Number })
  @ApiStandardResponses(HttpStatusCode.OK, RESPONSE_MESSAGES.SUCCESS.AUTH.LOCK_USER, UserLockResDTO)
  async lockUser(@Param() params: UserIdParamDTO, @Body() body: LockUserBodyDTO, @ActiveUser('userId') userId: number) {
    return this.authService.lockUser({ id: params.userId, body, updatedById: userId })
  }

  /**
   * Unlocks a user account (clears `lockExpirationDate`).
   * Requires Bearer authentication. The authenticated admin's `userId`
   * will be saved as `updatedById`.
   * @param params - DTO containing the target `userId` from the route path.
   * @param userId - ID of the authenticated admin/actor (extracted from the access token).
   * @returns The updated user lock state with `locked=false` (serialized by `UserLockResDTO`).
   */
  @Auth([AuthTypes.BEARER])
  @ApiBearerAuth('authorization')
  @Put(':userId/unlock')
  @HttpCode(HttpStatus.OK)
  @ZodSerializerDto(UserLockResDTO)
  @ApiOperation({ summary: 'Unlock user', description: 'Unlock a previously locked user account.' })
  @ApiParam({ name: 'userId', type: Number })
  @ApiStandardResponses(HttpStatusCode.OK, RESPONSE_MESSAGES.SUCCESS.AUTH.UNLOCK_USER, UserLockResDTO)
  async unlockUser(@Param() params: UserIdParamDTO, @ActiveUser('userId') userId: number) {
    return this.authService.unlockUser({ id: params.userId, updatedById: userId })
  }

  /**
   * Creates a violation record for a user and optionally locks the user if the action is LOCK.
   * Requires Bearer authentication. The authenticated admin's `userId` will be saved as `createdById`/`updatedById`.
   *
   * @param params  - Path params containing the target `userId`.
   * @param body    - Violation details (reason, violationType, actionTaken, lockDurationDays?).
   * @param adminId - Acting admin ID from access token.
   * @returns The created violation plus the user's current `lockExpirationDate`.
   */
  @Auth([AuthTypes.BEARER])
  @ApiBearerAuth('authorization')
  @Post(':userId/violations')
  @HttpCode(HttpStatus.CREATED)
  @ZodSerializerDto(CreateUserViolationResDTO)
  @ApiOperation({
    summary: 'Create user violation',
    description: 'Create a violation record and optionally lock user.',
  })
  @ApiParam({ name: 'userId', type: Number })
  @ApiStandardResponses(HttpStatusCode.CREATED, RESPONSE_MESSAGES.SUCCESS.VIOLATION, CreateUserViolationResDTO)
  async markViolationForUser(
    @Param() params: UserIdParamDTO,
    @Body() body: CreateUserViolationBodyDTO,
    @ActiveUser('userId') adminId: number,
  ) {
    return await this.authService.markViolationForUser({ id: params.userId, body, adminId })
  }
  /**
   * Uploads a new avatar image and updates the user's profile.
   *
   * @param userId - The ID of the authenticated user.
   * @param file - The uploaded avatar image.
   * @returns Success message + new avatar URL.
   */
  @Auth([AuthTypes.BEARER, AuthTypes.APIKey], { condition: ConditionGuard.OR })
  @ApiBearerAuth('authorization')
  @ApiSecurity('X-Api-Key')
  @Post('avatar')
  @UseInterceptors(FileInterceptor('file'))
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Upload avatar', description: 'Upload a new avatar image and update user profile.' })
  @ApiStandardResponses(HttpStatusCode.OK, RESPONSE_MESSAGES.SUCCESS.AVATAR)
  async uploadAvatar(
    @ActiveUser('userId') userId: number,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<UpdateAvatarResType> {
    if (!file) {
      throw NoFileProvidedException
    }

    const avatarUrl = await this.cloudinaryService.uploadImage(file)
    return this.authService.updateUserAvatar(userId, avatarUrl)
  }
}
