import { createZodDto } from "nestjs-zod";
import { CouponResponseSchema, CreateCouponBodySchema, CreateCouponResSchema, GetCouponQuerySchema, GetCouponsResSchema, UpdateCouponBodySchema, UpdateCouponResSchema } from "../coupon.model";

export class CreateCouponDTO extends createZodDto(CreateCouponBodySchema) {}
export class CreateCouponResDTO extends createZodDto(CreateCouponResSchema) {}
export class UpdateCouponDTO extends createZodDto(UpdateCouponBodySchema) {}
export class UpdateCouponResDTO extends createZodDto(UpdateCouponResSchema) {}
export class GetCouponQueryDTO extends createZodDto(GetCouponQuerySchema) {}
export class GetCouponsResDTO extends createZodDto(GetCouponsResSchema) {}
export class GetCouponDetailResDTO extends createZodDto(CouponResponseSchema) {}
