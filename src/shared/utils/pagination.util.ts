import { PAGINATION } from '../constants/pagination.constant'

/**
 * Convert query params `skip` and `take` into valid pagination numbers.
 *
 * - Defaults to `PAGINATION.DEFAULT_SKIP` and `PAGINATION.DEFAULT_TAKE` if missing/invalid.
 * - Ensures `skip >= DEFAULT_SKIP` and `1 <= take <= MAX_TAKE`.
 *
 * @param skip - Number of records to skip (as string).
 * @param take - Number of records to take/limit (as string).
 * @returns Object with numeric `skip` and `take`.
 */
export function parseSkipTake(skip?: string, take?: string) {
  const parsedSkip = Math.max(PAGINATION.DEFAULT_SKIP, Number(skip) || PAGINATION.DEFAULT_SKIP)
  const rawTake = Number(take) || PAGINATION.DEFAULT_TAKE
  const parsedTake = Math.max(1, Math.min(PAGINATION.MAX_TAKE, rawTake))
  return { skip: parsedSkip, take: parsedTake }
}
