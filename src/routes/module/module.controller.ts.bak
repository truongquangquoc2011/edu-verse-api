import { Auth } from 'src/shared/decorator/auth.decorator'
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common'
import { ModuleService } from './module.service'
import { RequireSellerRole } from 'src/shared/decorator/role.decorator'
import { ActiveUser } from 'src/shared/decorator/active-user.decorator'
import {
  CreateModuleDTO,
  CreateModuleResDTO,
  ListModulesQueryDTO,
  ListModulesResDTO,
  UpdateModuleDTO,
  UpdateModuleResDTO,
} from './dto/module.dto'
import { ZodSerializerDto } from 'nestjs-zod'
import { MessageResDTO } from 'src/shared/dto/response.dto'
import { AuthTypes, ConditionGuard } from 'src/shared/constants/auth.constant'
import { ApiOperation, ApiParam, ApiBody, ApiTags } from '@nestjs/swagger'
import { ApiStandardResponses } from 'src/shared/decorator/api-standard-response'
import { HttpStatusCode } from 'src/shared/swagger/swagger.interface'
import { RESPONSE_MESSAGES } from 'src/shared/constants/swagger.constant'

@ApiTags('Module')
@Controller('course/:courseId/builder/modules')
export class ModuleController {
  constructor(private readonly service: ModuleService) {}

  /**
   * Creates a new module under a course.
   *
   * @param userId - ID of the authenticated user
   * @param courseId - ID of the course
   * @param body - Module creation payload
   */
  @Auth([AuthTypes.BEARER, AuthTypes.APIKey], { condition: ConditionGuard.OR })
  @RequireSellerRole()
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create modules',
    description: 'Create one or multiple modules under a course (seller only).',
  })
  @ApiParam({ name: 'courseId', type: Number, description: 'Course ID' })
  @ApiBody({ type: CreateModuleDTO, isArray: true })
  @ZodSerializerDto(CreateModuleResDTO)
  @ApiStandardResponses(HttpStatusCode.CREATED, RESPONSE_MESSAGES.MODULE.CREATED, CreateModuleResDTO)
  createModule(
    @ActiveUser('userId') userId: number,
    @Param('courseId', ParseIntPipe) courseId: number,
    @Body() body: CreateModuleDTO[],
  ) {
    return this.service.createModules(userId, courseId, body)
  }

  /**
   * Updates an existing module.
   *
   * @param moduleId - ID of the module to update
   * @param userId - ID of the authenticated user
   * @param body - Module update payload
   */
  @Auth([AuthTypes.BEARER, AuthTypes.APIKey], { condition: ConditionGuard.OR })
  @RequireSellerRole()
  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update module',
    description: 'Update an existing module by ID (seller only).',
  })
  @ApiParam({ name: 'courseId', type: Number })
  @ApiParam({ name: 'id', type: Number, description: 'Module ID' })
  @ApiBody({ type: UpdateModuleDTO })
  @ZodSerializerDto(UpdateModuleResDTO)
  @ApiStandardResponses(HttpStatusCode.OK, RESPONSE_MESSAGES.MODULE.UPDATED, UpdateModuleResDTO)
  updateModule(
    @Param('id', ParseIntPipe) moduleId: number,
    @ActiveUser('userId') userId: number,
    @Body() body: UpdateModuleDTO,
  ) {
    return this.service.updateModule(userId, moduleId, body)
  }

  /**
   * Soft-deletes a module.
   *
   * @param moduleId - ID of the module to delete
   * @param userId - ID of the authenticated user
   */
  @Auth([AuthTypes.BEARER, AuthTypes.APIKey], { condition: ConditionGuard.OR })
  @RequireSellerRole()
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Delete module (soft)',
    description: 'Soft delete a module (seller only).',
  })
  @ApiParam({ name: 'courseId', type: Number })
  @ApiParam({ name: 'id', type: Number, description: 'Module ID' })
  @ZodSerializerDto(MessageResDTO)
  @ApiStandardResponses(HttpStatusCode.OK, RESPONSE_MESSAGES.MODULE.DELETED, MessageResDTO)
  deleteModule(@Param('id', ParseIntPipe) moduleId: number, @ActiveUser('userId') userId: number) {
    return this.service.deleteModule(userId, moduleId)
  }

  /**
   * Restores a soft-deleted module.
   *
   * @param moduleId - ID of the module to restore
   * @param userId - ID of the authenticated user
   */
  @Auth([AuthTypes.BEARER, AuthTypes.APIKey], { condition: ConditionGuard.OR })
  @RequireSellerRole()
  @Patch(':id/restore')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Restore module',
    description: 'Restore a previously soft-deleted module (seller only).',
  })
  @ApiParam({ name: 'courseId', type: Number })
  @ApiParam({ name: 'id', type: Number, description: 'Module ID' })
  @ZodSerializerDto(MessageResDTO)
  @ApiStandardResponses(HttpStatusCode.OK, RESPONSE_MESSAGES.MODULE.RESTORED, MessageResDTO)
  restoreModule(@Param('id', ParseIntPipe) moduleId: number, @ActiveUser('userId') userId: number) {
    return this.service.restoreModule(userId, moduleId)
  }

  /**
   * Lists all modules for a course.
   *
   * @param courseId - ID of the course
   * @param userId - ID of the authenticated user
   */
  @Auth([AuthTypes.BEARER, AuthTypes.APIKey], { condition: ConditionGuard.OR })
  @RequireSellerRole()
  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'List modules',
    description: 'List all modules under a course with optional filters/pagination (seller only).',
  })
  @ApiParam({ name: 'courseId', type: Number })
  @ZodSerializerDto(ListModulesResDTO)
  @ApiStandardResponses(HttpStatusCode.OK, RESPONSE_MESSAGES.MODULE.LIST, ListModulesResDTO)
  listModules(
    @Param('courseId', ParseIntPipe) courseId: number,
    @ActiveUser('userId') userId: number,
    @Query() query: ListModulesQueryDTO,
  ) {
    return this.service.listModules(userId, courseId, query)
  }
}
