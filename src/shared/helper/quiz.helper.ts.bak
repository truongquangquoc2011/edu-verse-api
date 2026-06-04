import { Prisma } from '@prisma/client'
import { QuizContext } from 'src/routes/quizz/quizz.repo'
import { QuizAnswerOptionNotFoundOrForbiddenException } from 'src/shared/constants/quiz-error.constant'
export const OPTION_SENTINEL_ORDER = 1_000_000_000
/**
 * Gets current option or throws if not found/deleted.
 * @param tx - Transaction client.
 * @param ctx - Quiz context.
 * @returns { id, optionOrder }
 * @throws QuizAnswerOptionNotFoundException if not found.
 */
export async function getCurrentOptionOrThrow(
  tx: Prisma.TransactionClient,
  ctx: QuizContext,
): Promise<{ id: number; optionOrder: number }> {
  const current = await tx.quizAnswerOption.findUnique({
    where: { id: ctx.optionId!, deletedAt: null },
    select: { id: true, optionOrder: true },
  })

  if (!current) throw QuizAnswerOptionNotFoundOrForbiddenException
  return current
}

/**
 * Shifts all answer options with order >= targetOrder by +1.
 * Used when inserting a new option in the middle of existing ones
 * to prevent duplicate order positions.
 */
export async function shiftOrdersOnInsert(
  tx: Prisma.TransactionClient,
  questionId: number,
  targetOrder: number,
): Promise<void> {
  await tx.quizAnswerOption.updateMany({
    where: { questionId, deletedAt: null, optionOrder: { gte: targetOrder } }, //shiff location của answer
    data: { optionOrder: { increment: 1 } },
  })
}

/**
 * Safely swaps or moves an option to a new order.
 *
 * - If another option already has the same target order → swap positions.
 * - If no conflict → just move current option.
 *
 * Uses a temporary "sentinel" order (1_000_000_000) to ensure atomic swap.
 */
export async function swapOrMoveOptionOrder(
  tx: Prisma.TransactionClient,
  questionId: number,
  currentId: number,
  currentOrder: number,
  targetOrder: number,
  updatedById: number,
): Promise<void> {
  if (currentOrder === targetOrder) return

  // Find if there is an existing option occupying the target position
  const conflict = await tx.quizAnswerOption.findFirst({
    where: { questionId, optionOrder: targetOrder, deletedAt: null },
    select: { id: true, optionOrder: true },
  })

  if (conflict) {
    // Temporarily move conflicting option far away (sentinel)
    await tx.quizAnswerOption.update({
      where: { id: conflict.id },
      data: { optionOrder: OPTION_SENTINEL_ORDER, updatedById },
    })

    //  Move current option into the target position
    await tx.quizAnswerOption.update({
      where: { id: currentId },
      data: { optionOrder: targetOrder, updatedById },
    })

    //  Move the conflict back to the old current position
    await tx.quizAnswerOption.update({
      where: { id: conflict.id },
      data: { optionOrder: currentOrder, updatedById },
    })
  } else {
    // No conflict → just move directly
    await tx.quizAnswerOption.update({
      where: { id: currentId },
      data: { optionOrder: targetOrder, updatedById },
    })
  }
}

/**
 * Enforces single-choice rule.
 * When one option is marked as correct, this method unsets all others
 * (sets isCorrect = false for all except the selected one).
 */
export async function enforceSingleChoice(
  tx: Prisma.TransactionClient,
  questionId: number,
  exceptOptionId: number,
): Promise<void> {
  await tx.quizAnswerOption.updateMany({
    where: {
      questionId,
      id: { not: exceptOptionId },
      deletedAt: null,
      isCorrect: true,
    },
    data: { isCorrect: false },
  })
}
