export interface GoogleCallbackParams {
  code: string
  state: string
}

export interface TokenResponse {
  accessToken: string
  refreshToken: string
}
