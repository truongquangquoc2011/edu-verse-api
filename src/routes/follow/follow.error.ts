import { BadRequestException, InternalServerErrorException, NotFoundException } from "@nestjs/common"

export const TeacherNotFoundException = new NotFoundException({
  message: 'Error.TeacherNotFound',
  path: 'teacher',
})

export const CannotFollowSelfException = new BadRequestException({
  message: 'Error.CannotFollowSelf',
  path: 'follow',
})

export const InternalFollowTeacherErrorException = new InternalServerErrorException({
  message: 'Error.InternalFollowTeacher',
  path: 'follow',
})

export const InternalUnfollowTeacherErrorException = new InternalServerErrorException({
  message: 'Error.InternalUnfollowTeacher',
  path: 'unfollow',
})

export const InternalListFollowersErrorException = new InternalServerErrorException({
  message: 'Error.InternalListFollowers',
  path: 'followers',
})

export const InternalListFollowingErrorException = new InternalServerErrorException({
  message: 'Error.InternalListFollowing',
  path: 'following',
})