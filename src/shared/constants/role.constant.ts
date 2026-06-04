export const RoleName = {
  Admin: 'ADMIN',
  Client: 'CLIENT',
  Seller: 'SELLER',
} as const

export enum UserRole {
  ADMIN = 'ADMIN',
  SELLER = 'SELLER',
  CLIENT = 'CLIENT',
}

export interface SanitizedUser {
  roleName: UserRole
}

export interface SanitizeOptions {
  forbiddenFields: string[]
  maxDepth?: number 
}

export interface FieldPolicy {
  [role: string]: string[] 
}


