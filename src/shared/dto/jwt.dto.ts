export interface AccessTokenDto {
  userId: number
  email: string
  deviceId: number
  roleId: number
  roleName: string
}

export interface RefreshTokenDto {
  userId: number
  email: string
}
