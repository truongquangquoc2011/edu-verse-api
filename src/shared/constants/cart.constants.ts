import { EnrollmentStatus } from "@prisma/client";

export const ACTIVE_ENROLL_STATUSES = [
  EnrollmentStatus.NotStarted,
  EnrollmentStatus.InProgress,
  EnrollmentStatus.Completed,
]