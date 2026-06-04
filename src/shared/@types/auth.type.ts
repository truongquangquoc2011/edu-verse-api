import { RoleType } from "src/routes/auth/auth.model"
import { UserType } from "../models/shared-user.model."

export type UserWithRoleAndPermissions = UserType & {
  role: RoleType & {
    permissions: { name: string }[]
  }
}