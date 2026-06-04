import { BadRequestException, InternalServerErrorException } from '@nestjs/common'

export const InvalidImageTypeException = new BadRequestException({
  message: 'Error.InvalidImageType',
  path: 'image',
})

export const ImageTooLargeException = new BadRequestException({
  message: 'Error.ImageTooLarge',
  path: 'image',
})

export const ImageBufferNotFoundException = new InternalServerErrorException({
  message: 'Error.ImageBufferNotFound',
  path: 'image',
})
export const PdfBufferNotFoundException = new InternalServerErrorException({
  message: 'Error.PdfBufferNotFound',
  path: 'image',
})

export const UploadToCloudinaryFailedException = new InternalServerErrorException({
  message: 'Error.UploadToCloudinaryFailed',
  path: 'image',
})

export const UserNotFoundException = new BadRequestException({
  message: 'Error.UserNotFound',
  path: 'user',
})

export const NoFileProvidedException = new BadRequestException({
  message: 'Error.NoFileProvided',
  path: 'image',
})