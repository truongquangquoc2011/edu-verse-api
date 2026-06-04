import { Prisma } from '@prisma/client'


export const toNumber = (v: unknown): number => (v instanceof Prisma.Decimal ? v.toNumber() : Number(v))
