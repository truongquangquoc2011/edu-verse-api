import { AuthStateType } from 'src/routes/auth/auth.model'
import { DEFAULT_OAUTH_VALUES } from '../constants/oauth.constant'
import { QUERY_PARAMS } from '../constants/constants'

/**
 * Decode and parse base64-encoded state from OAuth provider
 */
export function parseOAuthState(state: string): Pick<AuthStateType, 'userAgent' | 'ip'> {
  try {
    const decoded = Buffer.from(state, 'base64').toString('utf8')
    const parsed = JSON.parse(decoded) as AuthStateType
    return {
      userAgent: parsed.userAgent || DEFAULT_OAUTH_VALUES.USER_AGENT,
      ip: parsed.ip || DEFAULT_OAUTH_VALUES.IP,
    }
  } catch {
    console.warn('[OAuthCallback] Failed to parse state')
    return {
      userAgent: DEFAULT_OAUTH_VALUES.USER_AGENT,
      ip: DEFAULT_OAUTH_VALUES.IP,
    }
  }
}
/**
 * Handles the OAuth callback for Google or Facebook, exchanging the authorization code for tokens.
 *
 * @param service - The OAuth service (Google or Facebook) to handle the callback.
 * @param redirectBase - The base URL to redirect to after processing the callback.
 * @param code - The authorization code received from the OAuth provider.
 * @param state - The state parameter for CSRF protection.
 * @param errorMessage - The error message to set in case of failure.
 * @returns A URL with access and refresh tokens or an error message.
 */
export async function handleOAuthCallback(
  service: {
    handleCallback: (params: { code: string; state: string }) => Promise<{ accessToken: string; refreshToken: string }>
  },
  redirectBase: URL,
  code: string,
  state: string,
  errorMessage: string,
): Promise<URL> {
  const redirectUrl = new URL(redirectBase)

  try {
    const { accessToken, refreshToken } = await service.handleCallback({ code, state })

    redirectUrl.searchParams.set(QUERY_PARAMS.ACCESS_TOKEN, accessToken)
    redirectUrl.searchParams.set(QUERY_PARAMS.REFRESH_TOKEN, refreshToken)
  } catch (error) {
    console.error(`OAuth callback failed: ${error.message}`)
    redirectUrl.searchParams.set(QUERY_PARAMS.ERROR_MESSAGE, errorMessage)
  }

  return redirectUrl
}
