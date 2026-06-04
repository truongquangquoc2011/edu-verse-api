export interface AccessTokenPayload {
  userId: number
  email: string
  deviceId: number
  roleId: number
  roleName: string
  iat: number
  exp: number
  permissions: string[];
}

export interface RefreshTokenPayload {
  userId: number
  email: string
  iat: number
  exp: number
}

export enum JwtType {
  accessToken = 'AccessToken',
  refreshToken = 'RefreshToken',
}
