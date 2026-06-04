import {
  BadRequestException,
  InternalServerErrorException,
  NotFoundException,
  UnprocessableEntityException,
  ForbiddenException,
} from '@nestjs/common'

export const ConversationNotFoundException = new NotFoundException({
  message: 'Error.ConversationNotFound',
  path: 'conversations',
})

export const MessageNotFoundException = new NotFoundException({
  message: 'Error.MessageNotFound',
  path: 'messages',
})

export const UserNotInConversationException = new ForbiddenException({
  message: 'Error.UserNotInConversation',
  path: 'conversations',
})

export const ConversationAlreadyExistsException = new UnprocessableEntityException({
  message: 'Error.ConversationAlreadyExists',
  path: 'conversations',
})

export const AtLeastOneFieldMustBeProvidedConversationException = new BadRequestException({
  message: 'Error.AtLeastOneFieldMustBeProvided',
  path: 'conversations',
})

export const InternalCreateConversationErrorException = new InternalServerErrorException({
  message: 'Error.InternalCreateConversationError',
  path: 'conversations',
})

export const InternalUpdateConversationErrorException = new InternalServerErrorException({
  message: 'Error.InternalUpdateConversationError',
  path: 'conversations',
})

export const InternalCreateMessageErrorException = new InternalServerErrorException({
  message: 'Error.InternalCreateMessageError',
  path: 'messages',
})

export const UserMustFollowTeacherToChatException = new ForbiddenException({
  message: 'Error.UserMustFollowTeacherToChat',
  path: 'conversations',
})

export const DirectConversationMustUseTeacherEndpointException = new BadRequestException({
  message: 'Error.DirectConversationMustUseTeacherEndpoint',
  path: 'conversations',
})
