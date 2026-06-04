import z from 'zod'

export const CreateEnrollmentBodySchema = z.object({
  courseId: z.number().int().positive(),
  source: z.enum(['purchase', 'manual', 'free']).optional().default('purchase'),
})

export const CreateEnrollmentResSchema = z.object({
  success: z.literal(true),
  alreadyEnrolled: z.boolean().optional(),
  enrollmentId: z.number().int().positive().optional(),
})

export const EnrollmentSchema = CreateEnrollmentResSchema

export type EnrollmentType = z.infer<typeof EnrollmentSchema>
export type CreateEnrollmentBodyType = z.infer<typeof CreateEnrollmentBodySchema>
export type CreateEnrollmentResType = z.infer<typeof CreateEnrollmentResSchema>
