import { createZodDto } from 'nestjs-zod'
import {
  FollowersListResSchema,
  FollowingListResSchema,
  FollowResSchema,
  PaginationQuerySchema,
  TeacherIdParamSchema,
  UnfollowResSchema,
  UserIdParamSchema,
} from '../follow.model'

export class TeacherIdParamDTO extends createZodDto(TeacherIdParamSchema) {}
export class PaginationQueryDTO extends createZodDto(PaginationQuerySchema) {}
export class FollowResDTO extends createZodDto(FollowResSchema) {}
export class UnfollowResDTO extends createZodDto(UnfollowResSchema) {}
export class FollowersListResDTO extends createZodDto(FollowersListResSchema) {}
export class FollowingListResDTO extends createZodDto(FollowingListResSchema) {}
export class UserIdParamDTO extends createZodDto(UserIdParamSchema) {}
