import { BadRequestException, InternalServerErrorException, NotFoundException } from '@nestjs/common'

export const FeedbackNotFoundException = new NotFoundException({
  message: 'Error.FeedbackNotFound',
  path: 'feedback',
})

export const InternalCreateFeedbackErrorException = new InternalServerErrorException({
  message: 'Error.InternalCreateFeedbackError',
  path: 'feedback',
})

export const InternalUpdateFeedbackErrorException = new InternalServerErrorException({
  message: 'Error.InternalUpdateFeedbackError',
  path: 'feedback',
})

export const InternalDeleteFeedbackErrorException = new InternalServerErrorException({
  message: 'Error.InternalDeleteFeedbackError',
  path: 'feedback',
})

export const AtLeastOneFieldMustBeProvidedFeedbackException = new BadRequestException({
  message: 'Error.AtLeastOneFieldMustBeProvided',
  path: 'feedback',
})
