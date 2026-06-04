import { Controller, Get, HttpCode, HttpStatus, Param, ParseIntPipe, Post, Query } from '@nestjs/common'
import { UserService } from './user.service'
import { Auth, IsPublic } from 'src/shared/decorator/auth.decorator'
import { AuthTypes } from 'src/shared/constants/auth.constant'
import { ZodSerializerDto } from 'nestjs-zod'
import { PublicProfileResDTO, TeacherListQueryDTO, TeacherListResDTO } from './dto/user.dto'
import { ApiTags, ApiOperation, ApiParam } from '@nestjs/swagger'
import { HttpStatusCode } from 'src/shared/swagger/swagger.interface'
import { RESPONSE_MESSAGES } from 'src/shared/constants/swagger.constant'
import { ApiStandardResponses } from 'src/shared/decorator/api-standard-response'

@ApiTags('User')
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}
  @Auth([AuthTypes.BEARER])
  @Get(':userId/profile')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get public profile',
    description: 'Retrieve a user’s public profile by userId.',
  })
  @ApiParam({ name: 'userId', type: Number, description: 'User ID' })
  @ZodSerializerDto(PublicProfileResDTO)
  @ApiStandardResponses(HttpStatusCode.OK, RESPONSE_MESSAGES.USER.PUBLIC_PROFILE, PublicProfileResDTO)
  async getPublicProfile(@Param('userId', ParseIntPipe) userId: number) {
    return await this.userService.getPublicProfile(userId)
  }

  /**
   * Public endpoint — List teachers (users with role = Seller)
   *
   * - Supports pagination & optional search.
   * - Returns fullname and avatar only.
   * - No authentication required.
   */
  @Get('teachers')
  @IsPublic()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'List teachers (public)',
    description: 'Return a paginated list of teachers with minimal fields.',
  })
  @ZodSerializerDto(TeacherListResDTO)
  @ApiStandardResponses(HttpStatusCode.OK, RESPONSE_MESSAGES.USER.TEACHER_LIST, TeacherListResDTO)
  async listTeachers(@Query() query: TeacherListQueryDTO) {
    return this.userService.listTeachers(query)
  }

  @Auth([AuthTypes.BEARER])
  @Post(':userId/ensure-teacher')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Ensure teacher record for Seller user',
    description:
      'If user has Seller role, create or return existing Teacher record linked by userId.',
  })
  @ApiParam({ name: 'userId', type: Number, description: 'User ID' })
  async ensureTeacher(@Param('userId', ParseIntPipe) userId: number) {
    const teacher = await this.userService.ensureTeacher(userId)
    return {
      message: 'Teacher ensured',
      teacher,
    }
  }
}
