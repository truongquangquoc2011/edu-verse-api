import { Prisma } from '@prisma/client'
import { randomInt } from 'crypto'

// Type Predicates for Prisma Errors

export function isUniqueConstraintPrismaError(error: any): error is Prisma.PrismaClientKnownRequestError {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002'
}

export function isNotFoundPrismaError(error: any): error is Prisma.PrismaClientKnownRequestError {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025'
}

export function isValidationPrismaError(error: any): error is Prisma.PrismaClientKnownRequestError {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003'
}

export const generateOTP = (): string => {
  return String(randomInt(100000, 1000000)) // Generates a random 6-digit number
}

/**
 * Parses "YYYY-MM-DD HH:mm" to a Date (local time).
 * Defaults to 23:59 if no time is provided.
 * @param s - Input date string.
 * @returns Date (local time) or throws if invalid.
 * @example
 * parseLocalYMDHM('2025-10-13') => 2025-10-13T23:59:00 (local time)
 * parseLocalYMDHM('2025-10-13 14:30') => 2025-10-13T14:30:00 (local time)
 */
export function parseLocalYMDHM(s: string): Date {
  // Regex: YYYY-MM-DD or YYYY-MM-DD HH:mm
  const regex = /^(?<Y>\d{4})-(?<M>\d{2})-(?<D>\d{2})(?:\s+(?<hh>\d{2}):(?<mm>\d{2}))?$/

  const match = s.match(regex)
  if (!match || !match.groups) {
    throw new Error("Invalid date format. Expected 'YYYY-MM-DD HH:mm'")
  }

  const { Y, M, D, hh, mm } = match.groups as {
    Y: string
    M: string
    D: string
    hh?: string
    mm?: string
  }

  const DEFAULT_HOUR = 23
  const DEFAULT_MIN = 59

  const year = Number(Y)
  const month = Number(M) - 1 // JS Date month is 0-based
  const day = Number(D)
  const hour = hh ? Number(hh) : DEFAULT_HOUR
  const minute = mm ? Number(mm) : DEFAULT_MIN

  const date = new Date(year, month, day, hour, minute, 0, 0)

  if (isNaN(date.getTime())) {
    throw new Error('Invalid date components')
  }

  return date
}

/**
 * Parses relative token like "2h" or "30m" to a future Date.
 * @param s - Input string.
 * @returns Date object or throws if invalid.
 * @example
 * parseRelativeToken("2h") -> now + 2 hours
 * parseRelativeToken("3d") -> now + 3 days
 * parseRelativeToken("15m") -> now + 15 minutes
 */
export function parseRelativeToken(s: string): Date {
  const regex = /^(?<val>\d+)(?<unit>[smhd])$/i
  const match = s.match(regex)

  if (!match || !match.groups) {
    throw new Error("Invalid relative format. Expected something like '2h' or '30m'")
  }

  const { val, unit } = match.groups as { val: string; unit: string }
  const value = Number(val)
  if (isNaN(value)) {
    throw new Error('Invalid number in relative token')
  }

  const now = new Date()
  const lowercaseUnit = unit.toLowerCase()

  switch (lowercaseUnit) {
    case 's':
      now.setSeconds(now.getSeconds() + value)
      break
    case 'm':
      now.setMinutes(now.getMinutes() + value)
      break
    case 'h':
      now.setHours(now.getHours() + value)
      break
    case 'd':
      now.setDate(now.getDate() + value)
      break
    default:
      throw new Error('Invalid time unit. Use s, m, h, or d.')
  }

  return now
}

/**
 * Coerces various inputs to a Date.
 * @param v - Input value (Date | number | string).
 * @returns Date or throws error if cannot convert.
 * @example
 * coerceUntil('2h') → now + 2 hours
 * coerceUntil('2025-10-13 12:00') → specific date
 * coerceUntil(1700000000000) → timestamp to Date
 */
export function coerceUntil(v: unknown): Date {
  if (v instanceof Date) return v

  if (typeof v === 'number') return new Date(v)

  if (typeof v === 'string') {
    const num = Number(v)
    if (!isNaN(num)) return new Date(num)

    try {
      return parseLocalYMDHM(v)
    } catch {}

    try {
      const match = v.match(/^(\d+)([smhd])$/)
      if (match) {
        const amount = Number(match[1])
        const unit = match[2]
        const now = new Date()
        switch (unit) {
          case 's':
            now.setSeconds(now.getSeconds() + amount)
            break
          case 'm':
            now.setMinutes(now.getMinutes() + amount)
            break
          case 'h':
            now.setHours(now.getHours() + amount)
            break
          case 'd':
            now.setDate(now.getDate() + amount)
            break
        }
        return now
      }
    } catch {}
  }

  throw new Error('Cannot coerce value to Date')
}
