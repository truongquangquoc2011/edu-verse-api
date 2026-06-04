export const MessageType = {
  TEXT: 'TEXT',
  IMAGE: 'IMAGE',
  FILE: 'FILE',
  VIDEO: 'VIDEO',
  AUDIO: 'AUDIO',
  SYSTEM: 'SYSTEM',
} as const
export type MessageTypeKey = keyof typeof MessageType
export type MessageTypeValue = (typeof MessageType)[keyof typeof MessageType]

export const ReactionType = {
  Like: 'Like',
  Love: 'Love',
  Haha: 'Haha',
  Wow: 'Wow',
  Sad: 'Sad',
  Angry: 'Angry',
} as const
export type ReactionTypeKey = keyof typeof ReactionType
export type ReactionTypeValue = (typeof ReactionType)[keyof typeof ReactionType]

export const ReactionAction = {
  ADD: 'add',
  REMOVE: 'remove',
} as const

export type ReactionActionValue = (typeof ReactionAction)[keyof typeof ReactionAction]
export const JoinRequestStatus = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED'
} as const