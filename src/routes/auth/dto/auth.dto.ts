import {
  AuthStateSchema,
  LogoutBodySchema,
  OAuthCallbackQuerySchema,
  ProfileResSchema,
  UpdateAvatarResSchema,
  UpdateUserProfileSchema,
  ForgotPasswordSchema,
  GetUsersResSchema,
  LockUserBodySchema,
  UserIdParamSchema,
  UserLockResSchema,
  CreateUserViolationBodySchema,
  CreateUserViolationResSchema,
} from './../auth.model'
import { createZodDto } from 'nestjs-zod'
import {
  DeviceSchema,
  LoginBodySchema,
  LoginResSchema,
  RefreshTokenBodySchema,
  RefreshTokenResSchema,
  RegisterBodySchema,
  RegisterResSchema,
  SendOTPBodySchema,
} from '../auth.model'
import { MessageResSchema } from 'src/shared/models/response.model'

export class RegisterBodyDTO extends createZodDto(RegisterBodySchema) {}

export class RegisterResDTO extends createZodDto(RegisterResSchema) {}

export class SendOTPBodyDTO extends createZodDto(SendOTPBodySchema) {}

export class LoginBodyDTO extends createZodDto(LoginBodySchema) {}

export class LoginResDTO extends createZodDto(LoginResSchema) {}

export class ForgotPasswordResDTO extends createZodDto(ForgotPasswordSchema) {}

export class ResetPasswordResDTO extends createZodDto(ForgotPasswordSchema) {}

export class RefreshTokenBodyDTO extends createZodDto(RefreshTokenBodySchema) {}

export class RefreshTokenResDTO extends createZodDto(RefreshTokenResSchema) {}

export class DeviceType extends createZodDto(DeviceSchema) {}

export class MessageResDTO extends createZodDto(MessageResSchema) {}

export class LogoutBodyDTO extends createZodDto(LogoutBodySchema) {}

export class GoogleAuthStateDTO extends createZodDto(AuthStateSchema) {}

export class OAuthCallbackQueryDTO extends createZodDto(OAuthCallbackQuerySchema) {}
export class ProfileResDTO extends createZodDto(ProfileResSchema) {}
export class UpdateUserProfileDTO extends createZodDto(UpdateUserProfileSchema) {}
export class GetAllUsersResponseDTO extends createZodDto(GetUsersResSchema) {}
export class LockUserBodyDTO extends createZodDto(LockUserBodySchema) {}
export class UserIdParamDTO extends createZodDto(UserIdParamSchema) {}
export class UserLockResDTO extends createZodDto(UserLockResSchema) {}
export class CreateUserViolationBodyDTO extends createZodDto(CreateUserViolationBodySchema) {}
export class CreateUserViolationResDTO extends createZodDto(CreateUserViolationResSchema) {}
export class UpdateAvatarResDTO extends createZodDto(UpdateAvatarResSchema) {}
