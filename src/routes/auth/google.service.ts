import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common'
import { google } from 'googleapis'
import { envConfig } from 'src/shared/config'
import { AuthStateType } from './auth.model'
import { AuthService } from './auth.service'
import { ERROR_MESSAGE } from 'src/shared/constants/error-message.constant'
import { DEFAULT_OAUTH_VALUES, GOOGLE_OAUTH_VERSION, GOOGLE_PROMPTS } from 'src/shared/constants/oauth.constant'
import { parseOAuthState } from 'src/shared/helper/oauth.helper'
import { PrismaService } from 'src/shared/services/prisma.service'
import { GoogleCallbackParams, TokenResponse } from 'src/shared/constants/google.constant'

@Injectable()
export class GoogleService {
  private oauth2Client
  constructor(
    private readonly authService: AuthService,
    private readonly prismaService: PrismaService,
  ) {
    this.oauth2Client = new google.auth.OAuth2(
      envConfig.googleClientId,
      envConfig.googleClientSecret,
      envConfig.googleRedirectUrl,
    )
  }
  async handleCallback(params: { code: string; state: string }) {
    return await this.googleCallback(params)
  }
  private decodeOAuthState(state: string): { userAgent: string; ip: string } {
    try {
      return parseOAuthState(state)
    } catch {
      throw new BadRequestException(ERROR_MESSAGE.AUTH.INVALID_OAUTH_STATE)
    }
  }
  private async getGoogleUserInfo() {
    const oauth2 = google.oauth2({ auth: this.oauth2Client, version: GOOGLE_OAUTH_VERSION })
    const { data } = await oauth2.userinfo.get()

    if (!data.email) {
      throw new BadRequestException(ERROR_MESSAGE.AUTH.GOOGLE_EMAIL_NOT_FOUND)
    }

    return data
  }

  private async createOrGetUser(userInfo: any) {
    return this.authService.createOAuthUserIfNotExist(
      userInfo.email ?? '',
      userInfo.name ?? DEFAULT_OAUTH_VALUES.FULL_NAME,
      userInfo.picture ?? DEFAULT_OAUTH_VALUES.AVATAR,
    )
  }

  /**
   * Generate Google OAuth2 authorization URL
   * @param {GoogleAuthStateType} payload - Object containing client `userAgent` and `ip` for state tracking
   * @returns {{ url: string }} Object containing the Google OAuth2 authorization URL
   */
  async getAuthorizationUrl({ userAgent, ip }: AuthStateType) {
    const state = Buffer.from(JSON.stringify({ userAgent, ip })).toString('base64') // Encode state to base64

    const url = this.oauth2Client.generateAuthUrl({
      access_type: envConfig.googleOAuthAccessType,
      scope: envConfig.googleOAuthScopes,
      include_granted_scopes: true,
      state,
      prompt: GOOGLE_PROMPTS.CONSENT,
    })

    return { url }
  }
  /**
   * Handles the Google OAuth2 callback by exchanging the code for tokens, retrieving user info,
   * creating a user if they don’t exist, registering a device, and generating tokens.
   *
   * @param params - The callback parameters.
   * @param params.code - The authorization code from Google.
   * @param params.state - The base64-encoded state containing userAgent and IP.
   * @returns A promise resolving to access and refresh tokens.
   * @throws BadRequestException if the code, state, or email is invalid.
   * @throws InternalServerErrorException if any step in the flow fails.
   */
  async googleCallback({ code, state }: GoogleCallbackParams): Promise<TokenResponse> {
    try {
      return await this.prismaService.$transaction(async (prisma) => {
        // Step 1: Decode state
        const { userAgent, ip } = this.decodeOAuthState(state)

        // Step 2: Exchange code for tokens
        const { tokens } = await this.oauth2Client.getToken(code)
        this.oauth2Client.setCredentials(tokens)

        // Step 3: Get user info from Google
        const userInfo = await this.getGoogleUserInfo()

        // Step 4: Create user if not exists
        const user = await this.createOrGetUser(userInfo)

        // Step 5: Register device
        const device = await this.authService.registerDevice(user.id, userAgent, ip)

        // Step 6: Clean up old refresh tokens
        await this.authService.deleteRefreshTokensForDevice(user.id, device.id)

        // Step 7: Generate token
        const permissions = user.role?.permissions?.map((p) => p.name) ?? []
        return this.authService.generateAccessAndRefreshToken({
          userId: user.id,
          email: user.email,
          deviceId: device.id,
          roleId: user.role.id,
          roleName: user.role.name,
        })
      })
    } catch (error) {
      console.error(`Google OAuth callback failed:`, error)
      throw error instanceof BadRequestException
        ? error
        : new InternalServerErrorException(ERROR_MESSAGE.AUTH.GOOGLE_CALLBACK_FAILED)
    }
  }
}
