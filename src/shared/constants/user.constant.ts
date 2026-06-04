export const ViolationType = {
  CONTENT: 'Content',
  BEHAVIOR: 'Behavior',
  PAYMENT: 'Payment',
  ORTHER: 'Other',
} as const

export const ActionTaken = {
  WARNING: 'Warning',
  LOCK: 'Lock',
  SUSPEND: 'Suspend',
  UNLOCK: 'Unlock',
} as const

export const PUBLIC_PROFILE_FIELDS = [
  'id',
  'username',
  'fullname',
  'avatar',
  'email',
  'phoneNumber',
  'status',
  'dateOfBirth',
  'createdAt',
] as const

export type PublicField = (typeof PUBLIC_PROFILE_FIELDS)[number]
