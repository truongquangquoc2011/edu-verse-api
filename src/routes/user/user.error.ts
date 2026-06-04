import { NotFoundException } from "@nestjs/common";

export const UserNotFoundException = new NotFoundException({
  message: 'Error.UserNotFound',
  path: 'user',
})