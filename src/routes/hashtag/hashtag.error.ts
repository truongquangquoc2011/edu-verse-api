import {
  BadRequestException,
  InternalServerErrorException,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common'

export const HashtagNotFoundException = new NotFoundException({
  message: 'Error.HashtagNotFound',
  path: 'hashtags',
})

export const HashtagAlreadyExistsException = new UnprocessableEntityException({
  message: 'Error.HashtagAlreadyExists',
  path: 'hashtags',
})

export const AtLeastOneFieldMustBeProvidedHashtagException = new BadRequestException({
  message: 'Error.AtLeastOneFieldMustBeProvided',
  path: 'hashtags',
})

export const InternalCreateHashtagErrorException = new InternalServerErrorException({
  message: 'Error.InternalCreateHashtagError',
  path: 'hashtags',
})

export const InternalUpdateHashtagErrorException = new InternalServerErrorException({
  message: 'Error.InternalUpdateHashtagError',
  path: 'hashtags',
})

export const InternalDeleteHashtagErrorException = new InternalServerErrorException({
  message: 'Error.InternalDeleteHashtagError',
  path: 'hashtags',
})
