interface GoogleCallbackParams {
  code: string
  state: string
}

interface TokenResponse {
  accessToken: string
  refreshToken: string
}
