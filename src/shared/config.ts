import { Logger } from '@nestjs/common'
import { config as loadDotenv } from 'dotenv'
import fs from 'fs'
import path from 'path'
import { z } from 'zod'

// Define allowed environments (for future use if needed)
export enum Environment {
  Development = 'development',
  Production = 'production',
  Test = 'test',
  Provision = 'provision',
}

// Load .env file
const ENV_PATH = path.resolve('.env')
if (process.env.NODE_ENV !== Environment.Production) {
  if (!fs.existsSync(ENV_PATH)) {
    throw new Error(`Missing .env at ${ENV_PATH} (local dev)`)
  }
  loadDotenv({ path: ENV_PATH })
}

export const CODE_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
export const DEFAULT_LENGTH = 8
export const MAX_ATTEMPTS = 10

// Define the environment schema using Zod for validation
const EnvSchema = z.object({
  NODE_ENV: z.enum([Environment.Development, Environment.Production, Environment.Test, Environment.Provision]),
  PORT: z
    .string()
    .transform(Number)
    .refine((val) => !isNaN(val), {
      message: 'PORT must be a number',
    }),
  DATABASE_URL: z.string().url({ message: 'DATABASE_URL must be a valid URL' }),
  ACCESS_TOKEN_SECRET: z.string().min(10),
  REFRESH_TOKEN_SECRET: z.string().min(10),
  ACCESS_TOKEN_EXPIRATION: z.string(),
  REFRESH_TOKEN_EXPIRATION: z.string(),
  SALT_ROUNDS: z
    .string()
    .transform(Number)
    .refine((val) => !isNaN(val), {
      message: 'SALT_ROUNDS must be a number',
    }),
  SECRET_API_KEY: z.string().min(10),
  ADMIN_PASSWORD: z.string().min(8, { message: 'ADMIN_PASSWORD must be at least 8 characters long' }),
  ADMIN_EMAIL: z.string().email({ message: 'ADMIN_EMAIL must be a valid email address' }),
  ADMIN_NAME: z.string().min(1, { message: 'ADMIN_NAME must not be empty' }),
  ADMIN_PHONE: z.string().min(10, { message: 'ADMIN_PHONE must be at least 10 characters long' }),
  OTP_EXPIRES_IN: z.string().default('5m'),
  RESEND_API_KEY: z.string(),
  OTP_EMAIL: z.string(),
  OTP_EMAIL_PASSWORD: z.string(),
  OTP_EMAIL_NAME: z.string(),
  EMAIL_HOST: z.string(),
  EMAIL_PORT: z
    .string()
    .transform(Number)
    .refine((val) => !isNaN(val), {
      message: 'PORT must be a number',
    }),
  GOOGLE_CLIENT_ID: z.string().min(1, 'GOOGLE_CLIENT_ID is required'),
  GOOGLE_CLIENT_SECRET: z.string().min(1, 'GOOGLE_CLIENT_SECRET is required'),
  GOOGLE_REDIRECT_URL: z.string().url({ message: 'GOOGLE_REDIRECT_URL must be a valid URL' }),
  GOOGLE_CLIENT_REDIRECT_URI: z.string().url({ message: 'GOOGLE_CLIENT_REDIRECT_URI must be a valid URL' }),
  FACEBOOK_APP_ID: z.string().min(1, 'FACEBOOK_APP_ID is required'),
  FACEBOOK_APP_SECRET: z.string().min(1, 'FACEBOOK_APP_SECRET is required'),
  FACEBOOK_REDIRECT_URL: z.string().url({ message: 'FACEBOOK_REDIRECT_URL must be a valid URL' }),
  FACEBOOK_CLIENT_REDIRECT_URI: z.string().url({ message: 'FACEBOOK_CLIENT_REDIRECT_URI must be a valid URL' }),
  GOOGLE_OAUTH_SCOPES: z
    .string()
    .transform((val) => val.split(',').map((s) => s.trim()))
    .refine((arr) => arr.length > 0, {
      message: 'GOOGLE_OAUTH_SCOPES must contain at least one scope',
    }),

  GOOGLE_OAUTH_ACCESS_TYPE: z.enum(['online', 'offline'], {
    required_error: 'GOOGLE_OAUTH_ACCESS_TYPE is required',
  }),
  FACEBOOK_AUTH_URL: z.string().url({ message: 'FACEBOOK_AUTH_URL must be a valid URL' }),
  FACEBOOK_TOKEN_URL: z.string().url({ message: 'FACEBOOK_TOKEN_URL must be a valid URL' }),
  OAUTH_DEFAULT_FULL_NAME: z.string().min(1, { message: 'OAUTH_DEFAULT_FULL_NAME is required' }),
  OAUTH_DEFAULT_PHONE_NUMBER: z.string().min(1, { message: 'OAUTH_DEFAULT_PHONE_NUMBER is required' }),
  OAUTH_DEFAULT_AVATAR: z.string().min(1, { message: 'OAUTH_DEFAULT_AVATAR is required' }),
  START_URL: z.string().url({ message: 'START_URL must be a valid URL' }),
  CLOUDINARY_NAME: z.string().min(1, { message: 'CLOUDINARY_NAME is required' }),
  CLOUDINARY_API_KEY: z.string().min(1, { message: 'CLOUDINARY_API_KEY is required' }),
  CLOUDINARY_API_SECRET: z.string().min(1, { message: 'CLOUDINARY_API_SECRET is required' }),
  CLOUDINARY_DEFAULT_FOLDER: z.string().default('avatars'),
  CLOUDINARY_PDF_FOLDER: z.string().default('pdfs'),
  CLOUDINARY_RETRY_ATTEMPTS: z
    .string()
    .default('3')
    .transform(Number)
    .refine((v) => Number.isInteger(v) && v >= 0, {
      message: 'CLOUDINARY_RETRY_ATTEMPTS must be a non-negative integer',
    }),

  CLOUDINARY_MIN_TIMEOUT_MS: z
    .string()
    .default('1000')
    .transform(Number)
    .refine((v) => Number.isInteger(v) && v >= 0, {
      message: 'CLOUDINARY_MIN_TIMEOUT_MS must be a non-negative integer',
    }),

  CLOUDINARY_MAX_TIMEOUT_MS: z
    .string()
    .default('5000')
    .transform(Number)
    .refine((v) => Number.isInteger(v) && v >= 0, {
      message: 'CLOUDINARY_MAX_TIMEOUT_MS must be a non-negative integer',
    }),
  SWAGGER_USERNAME: z.string().min(1, 'SWAGGER_USERNAME cannot be empty'),
  SWAGGER_PASSWORD: z.string().min(8, 'SWAGGER_PASSWORD must be at least 8 characters'),
  MOMO_PARTNER_CODE: z.string().min(1, 'MOMO_PARTNER_CODE is required'),
  MOMO_ACCESS_KEY: z.string().min(1, 'MOMO_ACCESS_KEY is required'),
  MOMO_SECRET_KEY: z.string().min(1, 'MOMO_SECRET_KEY is required'),
  MOMO_CREATE_URL: z.string().url({ message: 'MOMO_CREATE_URL must be a valid URL' }),

  APP_BASE_URL: z.string().url({ message: 'APP_BASE_URL must be a valid URL' }),
  MOMO_REDIRECT_URL: z.string().url({ message: 'MOMO_REDIRECT_URL must be a valid URL' }),
  MOMO_IPN_URL: z.string().url({ message: 'MOMO_IPN_URL must be a valid URL' }),
  ELASTICSEARCH: z.string().url(),
  FRONTEND_SUCCESS_URL: z.string().url({ message: 'FRONTEND_SUCCESS_URL must be a valid URL' }),
  FRONTEND_FAIL_URL: z.string().url({ message: ' FRONTEND_FAIL_URL must be a valid URL' }),
  SWAGGER_SERVER_PROD: z.string().url({ message: 'SWAGGER_SERVER_PROD must be a valid URL' }),
  GEMINI_API_KEY: z.string().min(10, 'GEMINI_API_KEY is required'),
})

// Parse and validate process.env
const parsedEnv = EnvSchema.safeParse(process.env)

if (!parsedEnv.success) {
  Logger.error('❌ Invalid environment variables:\n' + JSON.stringify(parsedEnv.error.format(), null, 2))
  process.exit(1)
}

// Convert the parsed and transformed environment variables into an exportable object
export const envConfig = {
  nodeEnv: parsedEnv.data.NODE_ENV,
  port: parsedEnv.data.PORT,
  databaseUrl: parsedEnv.data.DATABASE_URL,
  accessTokenSecret: parsedEnv.data.ACCESS_TOKEN_SECRET,
  refreshTokenSecret: parsedEnv.data.REFRESH_TOKEN_SECRET,
  accessTokenExpiration: parsedEnv.data.ACCESS_TOKEN_EXPIRATION,
  refreshTokenExpiration: parsedEnv.data.REFRESH_TOKEN_EXPIRATION,
  saltRounds: parsedEnv.data.SALT_ROUNDS,
  secretApiKey: parsedEnv.data.SECRET_API_KEY,
  adminPassword: parsedEnv.data.ADMIN_PASSWORD,
  adminEmail: parsedEnv.data.ADMIN_EMAIL,
  adminName: parsedEnv.data.ADMIN_NAME,
  adminPhone: parsedEnv.data.ADMIN_PHONE,
  otpExpiresIn: parsedEnv.data.OTP_EXPIRES_IN,
  resendApiKey: parsedEnv.data.RESEND_API_KEY,
  otpEmail: parsedEnv.data.OTP_EMAIL,
  otpEmailPassword: parsedEnv.data.OTP_EMAIL_PASSWORD,
  otpEmailName: parsedEnv.data.OTP_EMAIL_NAME,
  emailHost: parsedEnv.data.EMAIL_HOST,
  emailPort: parsedEnv.data.EMAIL_PORT,
  googleClientId: parsedEnv.data.GOOGLE_CLIENT_ID,
  googleClientSecret: parsedEnv.data.GOOGLE_CLIENT_SECRET,
  googleRedirectUrl: parsedEnv.data.GOOGLE_REDIRECT_URL,
  googleClientRedirectUri: parsedEnv.data.GOOGLE_CLIENT_REDIRECT_URI,
  facebookAppId: parsedEnv.data.FACEBOOK_APP_ID,
  facebookAppSecret: parsedEnv.data.FACEBOOK_APP_SECRET,
  facebookRedirectUrl: parsedEnv.data.FACEBOOK_REDIRECT_URL,
  facebookClientRedirectUri: parsedEnv.data.FACEBOOK_CLIENT_REDIRECT_URI,
  facebookAuthUrl: parsedEnv.data.FACEBOOK_AUTH_URL,
  googleOAuthScopes: parsedEnv.data.GOOGLE_OAUTH_SCOPES,
  googleOAuthAccessType: parsedEnv.data.GOOGLE_OAUTH_ACCESS_TYPE,
  facebookTokenUrl: parsedEnv.data.FACEBOOK_TOKEN_URL,
  oauthDefaults: {
    FULL_NAME: parsedEnv.data.OAUTH_DEFAULT_FULL_NAME,
    PHONE_NUMBER: parsedEnv.data.OAUTH_DEFAULT_PHONE_NUMBER,
    AVATAR: parsedEnv.data.OAUTH_DEFAULT_AVATAR,
  },
  startUrl: parsedEnv.data.START_URL,
  cloudinary: {
    name: parsedEnv.data.CLOUDINARY_NAME,
    apiKey: parsedEnv.data.CLOUDINARY_API_KEY,
    apiSecret: parsedEnv.data.CLOUDINARY_API_SECRET,
    defaultFolder: parsedEnv.data.CLOUDINARY_DEFAULT_FOLDER,
    pdfFolder: parsedEnv.data.CLOUDINARY_PDF_FOLDER,
  },
  retryAttempts: parsedEnv.data.CLOUDINARY_RETRY_ATTEMPTS,
  minTimeoutMs: parsedEnv.data.CLOUDINARY_MIN_TIMEOUT_MS,
  maxTimeoutMs: parsedEnv.data.CLOUDINARY_MAX_TIMEOUT_MS,

  /** App base URL for redirects (used by MoMo redirect/ipn defaults) */
  appBaseUrl: parsedEnv.data.APP_BASE_URL,

  /** MoMo configuration group (used across order/momo services) */
  momo: {
    partnerCode: parsedEnv.data.MOMO_PARTNER_CODE,
    accessKey: parsedEnv.data.MOMO_ACCESS_KEY,
    secretKey: parsedEnv.data.MOMO_SECRET_KEY,
    createUrl: parsedEnv.data.MOMO_CREATE_URL,
    redirectUrl: parsedEnv.data.MOMO_REDIRECT_URL,
    ipnUrl: parsedEnv.data.MOMO_IPN_URL,
  },
  elasticSearch: parsedEnv.data.ELASTICSEARCH,
  frontendSuccessUrl: parsedEnv.data.FRONTEND_SUCCESS_URL,
  frontendFailUrl: parsedEnv.data.FRONTEND_FAIL_URL,
  swaggerServerProd: parsedEnv.data.SWAGGER_SERVER_PROD,
  geminiApiKey: parsedEnv.data.GEMINI_API_KEY,
}

export const ConfigGroups = {
  swagger: {
    username: parsedEnv.data.SWAGGER_USERNAME,
    password: parsedEnv.data.SWAGGER_PASSWORD,
  },
} as const

export type ConfigGroupsType = typeof ConfigGroups
