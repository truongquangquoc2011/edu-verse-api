import { Module } from '@nestjs/common';
import { CouponService } from './coupon.service';
import { CouponController } from './coupon.controller';
import { CouponRepository } from './coupon.repo';

@Module({
  controllers: [CouponController],
  providers: [CouponService, CouponRepository],
})
export class CouponModule {}
