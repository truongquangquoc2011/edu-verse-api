import { Controller, Get, HttpCode, HttpStatus, Param, ParseIntPipe, Query } from '@nestjs/common'
import { ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger'
import { ZodSerializerDto } from 'nestjs-zod'

import { ModuleService } from './module.service'

import { Auth } from 'src/shared/decorator/auth.decorator'
import { ActiveUser } from 'src/shared/decorator/active-user.decorator'
import { RequireSellerRole } from 'src/shared/decorator/role.decorator'
import { AuthTypes, ConditionGuard } from 'src/shared/constants/auth.constant'
import { ApiStandardResponses } from 'src/shared/decorator/api-standard-response'
import { HttpStatusCode } from 'src/shared/swagger/swagger.interface'

import { ListModuleQuizQueryDTO, ListModuleQuizResDTO, ListModuleStudyQueryDTO, ListModuleStudyResDTO } from './dto/module.dto'
import { RESPONSE_MESSAGES } from 'src/shared/constants/swagger.constant'

@ApiTags('Module - Study')
@Controller('course/:courseId/modules')
export class ModuleStudyController {
  constructor(private readonly service: ModuleService) {}

  /**
   * Retrieves modules for a course (for STUDENT view in Study Page).
   *
   * - Requires authentication (Bearer/API Key)
   * - Only works if the user is already enrolled in the course
   * - Returns modules sorted by chapterOrder
   * - Does NOT include lessons (lessons are fetched in a separate endpoint)
   *
   * @param userId - Authenticated user ID
   * @param courseId - Course ID the student is studying
   * @param query - Pagination query (skip/take)
   * @returns List of modules for the course
   */
  @Auth([AuthTypes.BEARER, AuthTypes.APIKey], { condition: ConditionGuard.OR })
  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'List modules for study',
    description: 'Retrieve paginated modules of a course for STUDENT view. Student must be enrolled.',
  })
  @ApiParam({ name: 'courseId', type: Number, description: 'Course ID' })
  @ZodSerializerDto(ListModuleStudyResDTO)
  @ApiStandardResponses(HttpStatusCode.OK, RESPONSE_MESSAGES.MODULE.LIST, ListModuleStudyResDTO)
  listModulesForStudy(
    @Param('courseId', ParseIntPipe) courseId: number,
    @ActiveUser('userId') userId: number,
    @Query() query: ListModuleStudyQueryDTO,
  ) {
    return this.service.listModulesForStudy(userId, courseId, query)
  }

  /**
   * Retrieves quizzes of a module (for STUDENT view in Study Page).
   *
   * - Requires authentication (Bearer/API Key)
   * - User must be enrolled in the course
   * - Only returns quizzes under the specified module
   *
   * @param userId - Authenticated user ID
   * @param courseId - Course ID the student is studying
   * @param moduleId - Module ID inside the course
   * @param query - Pagination query (skip/take)
   * @returns List of quizzes under the module
   */
  @Auth([AuthTypes.BEARER, AuthTypes.APIKey], { condition: ConditionGuard.OR })
  @Get(':moduleId/quizzes')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'List quizzes of a module for study',
    description: 'Retrieve paginated quizzes of a module for STUDENT view. Student must be enrolled.',
  })
  @ApiParam({ name: 'courseId', type: Number, description: 'Course ID' })
  @ApiParam({ name: 'moduleId', type: Number, description: 'Module ID' })
  @ZodSerializerDto(ListModuleQuizResDTO)
  @ApiStandardResponses(HttpStatusCode.OK, RESPONSE_MESSAGES.QUIZ.LIST, ListModuleQuizResDTO)
  listModuleQuizzesForStudy(
    @Param('courseId', ParseIntPipe) courseId: number,
    @Param('moduleId', ParseIntPipe) moduleId: number,
    @ActiveUser('userId') userId: number,
    @Query() query: ListModuleQuizQueryDTO,
  ) {
    return this.service.listModuleQuizzesForStudy(userId, courseId, moduleId, query)
  }
}
