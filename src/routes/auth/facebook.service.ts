import { Injectable, BadRequestException, InternalServerErrorException } from '@nestjs/common'
import { envConfig } from 'src/shared/config'
import { AuthService } from './auth.service'
import { AuthStateType } from './auth.model'
import { API_URLS, DEFAULT_OAUTH_VALUES, FACEBOOK_FIELDS, OAUTH_SCOPES } from 'src/shared/constants/oauth.constant'
import { ERROR_MESSAGE } from 'src/shared/constants/error-message.constant'
import { parseOAuthState } from 'src/shared/helper/oauth.helper'
import axios from 'axios'

interface FacebookUser {
  id: string
  name: string
  email?: string
  picture?: { data: { url: string } }
}

@Injectable()
export class FacebookService {
  private readonly facebookAuthBaseUrl: URL

  constructor(private readonly authService: AuthService) {
    this.facebookAuthBaseUrl = new URL(envConfig.facebookAuthUrl)
  }

  /**
   * Generate state parameter for CSRF protection
   */
  private generateState({ userAgent, ip }: AuthStateType): string {
    if (!userAgent || !ip) {
      throw new BadRequestException(ERROR_MESSAGE.AUTH.USER_AGENT_AND_IP_REQUIRED)
    }
    return Buffer.from(JSON.stringify({ userAgent, ip })).toString('base64')
  }

  /**
   * Generate Facebook OAuth2 authorization URL
   */
  getAuthorizationUrl({ userAgent, ip }: AuthStateType): { url: string } {
    try {
      // Validate env config
      if (!envConfig.facebookAppId || !envConfig.facebookRedirectUrl) {
        throw new InternalServerErrorException(ERROR_MESSAGE.AUTH.FACEBOOK_CONFIG_MISSING)
      }

      const state = this.generateState({ userAgent, ip })
      const url = new URL(this.facebookAuthBaseUrl)

      url.searchParams.set('client_id', envConfig.facebookAppId)
      url.searchParams.set('redirect_uri', envConfig.facebookRedirectUrl)
      url.searchParams.set('state', state)
      url.searchParams.set('scope', OAUTH_SCOPES.FACEBOOK.join(','))

      return { url: url.toString() }
    } catch (error) {
      console.error(`Failed to generate Facebook auth URL: ${error.message}`)
      throw error instanceof BadRequestException
        ? error
        : new InternalServerErrorException(ERROR_MESSAGE.AUTH.FACEBOOK_AUTH_URL_GENERATION_FAILED)
    }
  }

  /**
   * Facebook OAuth callback handler
   */
  async handleCallback({ code, state }: { code: string; state: string }) {
    return this.facebookCallback({ code, state })
  }

  async facebookCallback({ code, state }: { code: string; state: string }) {
    try {
      // Step 1: Parse state
      const { userAgent, ip } = parseOAuthState(state)

      // Step 2: Exchange code for access token
      const accessToken = await this.exchangeCodeForToken(code)

      // Step 3: Get user info from Facebook
      const fbUser = await this.getFacebookUser(accessToken)

      // Step 4: Validate email
      if (!fbUser.email) {
        throw new Error(ERROR_MESSAGE.AUTH.FACEBOOK_EMAIL_NOT_FOUND)
      }

      // Step 5: Create user if not exists
      const user = await this.authService.createOAuthUserIfNotExist(
        fbUser.email,
        fbUser.name ?? DEFAULT_OAUTH_VALUES.FULL_NAME,
        fbUser.picture?.data?.url ?? DEFAULT_OAUTH_VALUES.AVATAR,
      )

      // Step 6: Register or update device info
      const device = await this.authService.registerDevice(user.id, userAgent, ip)

      // Step 7: Clear old refresh tokens for this device
      await this.authService.deleteRefreshTokensForDevice(user.id, device.id)

      // Step 8: Generate access & refresh tokens
      const permissions = user.role?.permissions?.map(p => p.name) ?? []
      return this.authService.generateAccessAndRefreshToken({
        userId: user.id,
        email: user.email,
        deviceId: device.id,
        roleId: user.role.id,
        roleName: user.role.name,
      })
    } catch (error) {
      console.error(`Facebook callback failed: ${error.message}`)
      throw error
    }
  }

  private async exchangeCodeForToken(code: string): Promise<string> {
    // Step 1: Validate input
    if (!code) {
      throw new BadRequestException('Authorization code is required')
    }

    // Step 2: Validate environment config
    if (!envConfig.facebookAppId || !envConfig.facebookAppSecret || !envConfig.facebookRedirectUrl) {
      throw new InternalServerErrorException(ERROR_MESSAGE.AUTH.FACEBOOK_CONFIG_MISSING)
    }

    // Step 3: Build Facebook token exchange URL
    const url = new URL(API_URLS.FACEBOOK_TOKEN)
    url.searchParams.set('client_id', envConfig.facebookAppId)
    url.searchParams.set('client_secret', envConfig.facebookAppSecret)
    url.searchParams.set('redirect_uri', envConfig.facebookRedirectUrl)
    url.searchParams.set('code', code)

    try {
      // Step 4: Make HTTP request
      const response = await axios.get(url.toString(), { timeout: 5000 })
      const data = response.data

      // Check response status and access token
      if (response.status !== 200 || !data.access_token) {
        throw new BadRequestException(ERROR_MESSAGE.AUTH.FACEBOOK_TOKEN_FETCH_FAILED)
      }

      return data.access_token
    } catch (error) {
      console.error(' Facebook token exchange error:', error?.response?.data || error.message)
      throw new BadRequestException(ERROR_MESSAGE.AUTH.FACEBOOK_TOKEN_FETCH_FAILED)
    }
  }

  private async getFacebookUser(accessToken: string): Promise<FacebookUser> {
    // Step 1: Validate access token
    if (!accessToken) {
      throw new BadRequestException(ERROR_MESSAGE.AUTH.ACCESS_TOKEN_REQUIRED)
    }

    try {
      // Step 2: Construct Facebook user info URL
      const url = new URL(API_URLS.FACEBOOK_USER)
      url.searchParams.set('fields', FACEBOOK_FIELDS.join(','))
      url.searchParams.set('access_token', accessToken)

      // Step 3: Make HTTP request
      const res = await axios.get(url.toString(), { timeout: 5000 })
      const data = res.data

      // Step 4: Check for response error
      if (res.status !== 200) {
        throw new BadRequestException(ERROR_MESSAGE.AUTH.FACEBOOK_USER_FETCH_FAILED)
      }

      return data
    } catch (error) {
      console.error('Failed to fetch Facebook user:', error?.response?.data || error.message)
      throw error instanceof BadRequestException
        ? error
        : new InternalServerErrorException(ERROR_MESSAGE.AUTH.FACEBOOK_USER_FETCH_FAILED)
    }
  }
}
