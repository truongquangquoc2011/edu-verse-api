import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, Patch, Delete, Query, Put } from '@nestjs/common'
import { ZodSerializerDto } from 'nestjs-zod'
import { ActiveUser } from 'src/shared/decorator/active-user.decorator'
import {
  AssignPermissionToRoleDTO,
  AssignPermissionToRoleResDTO,
  AssignRolesToUserResDTO,
  CreateRoleBodyDTO,
  CreateRoleResDTO,
  RoleIdParamDTO,
  UserIdParamDTO,
  UpdateRoleBodyDTO,
} from './dto/role.dto'
import { RoleService } from './role.service'
import { AuthTypes, ConditionGuard } from 'src/shared/constants/auth.constant'
import { Auth } from 'src/shared/decorator/auth.decorator'
import { MessageResDTO } from '../auth/dto/auth.dto'
import { RequireAdminRole, RequireSellerRole } from 'src/shared/decorator/role.decorator'
import { parseSkipTake } from 'src/shared/utils/pagination.util'
import { ApiBody, ApiOperation, ApiTags, ApiParam, ApiQuery } from '@nestjs/swagger'
import { ApiStandardResponses } from 'src/shared/decorator/api-standard-response'
import { HttpStatusCode } from 'src/shared/swagger/swagger.interface'
import { RESPONSE_MESSAGES } from 'src/shared/constants/swagger.constant'

@ApiTags('Role')
@Controller('role')
export class RoleController {
  constructor(private readonly roleService: RoleService) {}
  /**
   * Creates a new role in the system.
   * Requires Bearer authentication. The `userId` of the currently authenticated user
   * will be set as the creator of the role.
   * @param body - The DTO containing role details (name, description, isActive).
   * @param userId - The ID of the currently authenticated user (extracted from access token).
   * @returns The created role record without soft-delete fields.
   */
  @Auth([AuthTypes.BEARER])
  @Post('create')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a new role',
    description: 'Create a new role. Requires Bearer authentication.',
  })
  @ApiBody({ type: CreateRoleBodyDTO })
  @ZodSerializerDto(CreateRoleResDTO)
  @ApiStandardResponses(HttpStatusCode.CREATED, RESPONSE_MESSAGES.ROLE.CREATED, CreateRoleResDTO)
  async createRole(@Body() body: CreateRoleBodyDTO, @ActiveUser('userId') userId: number) {
    return await this.roleService.createRole({ data: body, createdById: userId })
  }

  /**
   * Assigns a list of permissions to an existing role.
   * Requires Bearer authentication. The specified role will have its permissions
   * replaced with the provided list (`set` behavior).
   * @param params - Object containing `roleId` as a path parameter.
   * @param body - The DTO containing an array of permission IDs to assign.
   * @returns The updated role with its assigned permissions.
   */
  @Auth([AuthTypes.BEARER])
  @Post(':roleId/permissions')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Assign permissions to role',
    description: 'Assign or replace permissions for a given role.',
  })
  @ApiParam({ name: 'roleId', type: Number })
  @ApiBody({ type: AssignPermissionToRoleDTO })
  @ZodSerializerDto(AssignPermissionToRoleResDTO)
  @ApiStandardResponses(
    HttpStatusCode.CREATED,
    RESPONSE_MESSAGES.ROLE.PERMISSION_ASSIGNED,
    AssignPermissionToRoleResDTO,
  )
  async assignPermissionToRole(@Param() params: RoleIdParamDTO, @Body() body: AssignPermissionToRoleDTO) {
    return await this.roleService.assignPermissionToRole(params.roleId, body)
  }

  /**
   * Assigns (replaces) a user's single role.
   * Requires Bearer authentication. The `userId` of the currently authenticated user
   * will be recorded as the actor (`updatedById`) who performed the change.
   * @param params - DTO containing the target `userId` from the route path.
   * @param body   - DTO containing the `roleId` to assign to the user.
   * @param userId - ID of the authenticated admin/actor (extracted from the access token).
   * @returns The updated user record including its current role (response serialized by `AssignRolesToUserResDTO`).
   */
  @Auth([AuthTypes.BEARER])
  @Put('users/:userId/roles')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Assign role to user',
    description: 'Assigns a role to a user. Replaces existing role if present.',
  })
  @ApiParam({ name: 'userId', type: Number })
  @ApiBody({ type: RoleIdParamDTO })
  @ZodSerializerDto(AssignRolesToUserResDTO)
  @ApiStandardResponses(HttpStatusCode.OK, RESPONSE_MESSAGES.ROLE.USER_ROLE_ASSIGNED, AssignRolesToUserResDTO)
  async assignRolesToUser(
    @Param() params: UserIdParamDTO,
    @Body() body: RoleIdParamDTO,
    @ActiveUser('userId') userId: number,
  ) {
    return await this.roleService.assignRolesToUser({ id: params.userId, data: body, updatedById: userId })
  }
  /**
   * Retrieves a list of all roles in the system.
   * Requires Bearer or API Key authentication with Admin role.
   * @returns An array of roles.
   */
  @Auth([AuthTypes.BEARER, AuthTypes.APIKey], { condition: ConditionGuard.OR })
  @RequireAdminRole()
  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'List all roles',
    description: 'Lists all roles in the system with pagination support.',
  })
  @ApiQuery({ name: 'skip', required: false, type: String })
  @ApiQuery({ name: 'take', required: false, type: String })
  @ApiStandardResponses(HttpStatusCode.OK, RESPONSE_MESSAGES.ROLE.LISTED)
  async listRoles(@ActiveUser('userId') userId: number, @Query('skip') skip?: string, @Query('take') take?: string) {
    const { skip: parsedSkip, take: parsedTake } = parseSkipTake(skip, take)
    return this.roleService.listRoles(parsedSkip, parsedTake)
  }

  /**
   * Retrieves details of a specific role by its ID.
   * Requires Bearer or API Key authentication with Admin role.
   * @param params - Object containing `roleId` as a path parameter.
   * @returns The role details if found.
   */
  @Auth([AuthTypes.BEARER, AuthTypes.APIKey], { condition: ConditionGuard.OR })
  @RequireAdminRole()
  @Get(':roleId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get role detail', description: 'Retrieve a role by ID.' })
  @ApiParam({ name: 'roleId', type: Number })
  @ApiStandardResponses(HttpStatusCode.OK, RESPONSE_MESSAGES.ROLE.DETAIL)
  async getRole(@Param() params: RoleIdParamDTO) {
    return await this.roleService.getRoleById(params.roleId)
  }

  /**
   * Updates an existing role by its ID.
   * Requires Bearer or API Key authentication with Admin role.
   * @param params - Object containing `roleId` as a path parameter.
   * @param body - Partial DTO containing fields to update (name, description, isActive).
   * @returns The updated role record.
   */
  @Auth([AuthTypes.BEARER, AuthTypes.APIKey], { condition: ConditionGuard.OR })
  @RequireAdminRole()
  @Patch(':roleId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update role',
    description: 'Update an existing role by ID. Requires Admin privileges.',
  })
  @ApiParam({ name: 'roleId', type: Number })
  @ApiBody({ type: UpdateRoleBodyDTO })
  @ZodSerializerDto(CreateRoleResDTO)
  @ApiStandardResponses(HttpStatusCode.OK, RESPONSE_MESSAGES.ROLE.UPDATED, CreateRoleResDTO)
  async updateRole(@Param() params: RoleIdParamDTO, @Body() body: UpdateRoleBodyDTO) {
    return await this.roleService.updateRole(params.roleId, body)
  }

  /**
   * Soft deletes an existing role by its ID (marks as deleted but keeps record).
   * Requires Bearer or API Key authentication with Admin role.
   * @param params - Object containing `roleId` as a path parameter.
   * @returns A message indicating successful deletion.
   */
  @Auth([AuthTypes.BEARER, AuthTypes.APIKey], { condition: ConditionGuard.OR })
  @RequireAdminRole()
  @Delete(':roleId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Soft delete role',
    description: 'Soft deletes a role (marks it deleted but retains record).',
  })
  @ApiParam({ name: 'roleId', type: Number })
  @ZodSerializerDto(MessageResDTO)
  @ApiStandardResponses(HttpStatusCode.OK, RESPONSE_MESSAGES.ROLE.DELETED, MessageResDTO)
  async deleteRole(@Param() params: RoleIdParamDTO) {
    return await this.roleService.softDeleteRole(params.roleId)
  }

  /**
   * Restores a previously soft-deleted role by its ID.
   * Requires Bearer or API Key authentication with Admin role.
   * @param params - Object containing `roleId` as a path parameter.
   * @returns A message indicating successful restoration.
   */
  @Auth([AuthTypes.BEARER, AuthTypes.APIKey], { condition: ConditionGuard.OR })
  @RequireAdminRole()
  @Patch(':roleId/restore')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Restore soft-deleted role',
    description: 'Restores a previously soft-deleted role by ID.',
  })
  @ApiParam({ name: 'roleId', type: Number })
  @ZodSerializerDto(MessageResDTO)
  @ApiStandardResponses(HttpStatusCode.OK, RESPONSE_MESSAGES.ROLE.RESTORED, MessageResDTO)
  async restoreRole(@Param() params: RoleIdParamDTO) {
    return await this.roleService.restoreRole(params.roleId)
  }
}
