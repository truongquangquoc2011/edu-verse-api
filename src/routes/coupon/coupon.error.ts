import { BadRequestException, InternalServerErrorException, NotFoundException, UnprocessableEntityException } from '@nestjs/common'

export const CouponAlreadyExistsException = new UnprocessableEntityException({
  message: 'Error.CouponAlreadyExists',
  path: 'coupons',
})

export const AtLeastOneFieldMustBeProvidedCouponException = new BadRequestException({
  message: 'Error.AtLeastOneFieldMustBeProvided',
  path: 'coupons',
})

export const CouponNotFoundException = new NotFoundException({
  message: 'Error.CouponNotFound',
  path: 'coupons',
})

export const InternalCreateCouponErrorException = new InternalServerErrorException({
  message: 'Error.InternalCreateCouponError',
  path: 'coupons',
})

export const InternalUpdateCouponErrorException = new InternalServerErrorException({
  message: 'Error.InternalUpdateCouponError',
  path: 'coupons',
})

export const InternalRetrieveCouponErrorException = new InternalServerErrorException({
  message: 'Error.InternalRetrieveCouponError',
  path: 'coupons',
})

export const InternalDeleteCouponErrorException = new InternalServerErrorException({
  message: 'Error.InternalDeleteCouponError',
  path: 'coupons',
})
