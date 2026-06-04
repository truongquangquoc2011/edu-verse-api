import { ZodSerializerDto } from 'nestjs-zod'
import { Controller, Post, Body, HttpCode, HttpStatus, Patch, Param, Get, Query, Delete } from '@nestjs/common'
import { PermissionService } from './permission.service'
import { Auth } from 'src/shared/decorator/auth.decorator'
import { AuthTypes } from 'src/shared/constants/auth.constant'
import { ActiveUser } from 'src/shared/decorator/active-user.decorator'
import {
  AssignRoleToPermissionDTO,
  AssignRoleToPermissionResDTO,
  CreatePermisionBodyDTO,
  CreatePermisionResDTO,
  GetAllPermissionResDTO,
  GetPermissionDetailResDTO,
  GetPermissionQueryDTO,
  GetPermissionsResDTO,
  PermissisonIdParamDTO,
  UpdatePermisionBodyDTO,
  UpdatePermisionResDTO,
} from './dto/permission.dto'
import { MessageResDTO } from 'src/shared/dto/response.dto'
import { RequireClientRole } from 'src/shared/decorator/role.decorator'
import { RequirePerm } from 'src/shared/decorator/permissions.decorator'
import { ApiTags, ApiBody, ApiOperation, ApiParam } from '@nestjs/swagger'
import { RESPONSE_MESSAGES } from 'src/shared/constants/swagger.constant'
import { HttpStatusCode } from 'src/shared/swagger/swagger.interface'
import { ApiStandardResponses } from 'src/shared/decorator/api-standard-response'

@ApiTags('Permission')
@Controller('permission')
export class PermissionController {
  constructor(private readonly permissionService: PermissionService) {}

  /**
   * Creates a new permission in the system.
   * This endpoint allows authenticated users to create a new permission record.
   * The permission defines an allowed action (path + HTTP method) that can be assigned to roles.
   * @param body - The DTO containing permission details (name, description, path, method).
   * @param userId - The ID of the currently authenticated user, extracted from the access token.
   * @returns The created permission record.
   **/
  @Auth([AuthTypes.BEARER])
  @Post('create')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create permission',
    description: 'Create a new permission record (name, path, method, description). Requires Bearer authentication.',
  })
  @ApiBody({ type: CreatePermisionBodyDTO })
  @ZodSerializerDto(CreatePermisionResDTO)
  @ApiStandardResponses(HttpStatusCode.CREATED, RESPONSE_MESSAGES.PERMISSION.CREATED, CreatePermisionResDTO)
  async createPermission(@Body() body: CreatePermisionBodyDTO, @ActiveUser('userId') userId: number) {
    return await this.permissionService.createPermission({ data: body, createdById: userId })
  }

  /**
   * Updates an existing permission.
   * Authenticated users can modify fields of a permission (e.g., name, description, path, method).
   * Audits the updater by saving `updatedById`.
   * @param params - Route params containing the target permission ID.
   * @param body - The DTO with fields to update.
   * @param userId - The ID of the currently authenticated user, extracted from the access token.
   * @returns The updated permission record.
   */
  @Patch(':permissionId')
  @Auth([AuthTypes.BEARER])
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update permission',
    description: 'Update an existing permission (name, description, path, method).',
  })
  @ApiParam({ name: 'permissionId', type: Number, description: 'Permission ID' })
  @ApiBody({ type: UpdatePermisionBodyDTO })
  @ZodSerializerDto(UpdatePermisionResDTO)
  @ApiStandardResponses(HttpStatusCode.OK, RESPONSE_MESSAGES.PERMISSION.UPDATED, UpdatePermisionResDTO)
  async updatePermission(
    @Param() params: PermissisonIdParamDTO,
    @Body() body: UpdatePermisionBodyDTO,
    @ActiveUser('userId') userId: number,
  ) {
    return await this.permissionService.updatePermission({ id: params.permissionId, data: body, updatedById: userId })
  }

  /**
   * Deletes a permission by ID.
   * Requires a valid bearer token. Soft/hard delete behavior depends on the service implementation.
   * @param params - Route params containing the permission ID to delete.
   * @returns A generic message response indicating the result.
   */
  @Auth([AuthTypes.BEARER])
  @Delete(':permissionId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Delete permission',
    description: 'Delete a permission by ID (soft or hard delete).',
  })
  @ApiParam({ name: 'permissionId', type: Number, description: 'Permission ID' })
  @ZodSerializerDto(MessageResDTO)
  @ApiStandardResponses(HttpStatusCode.OK, RESPONSE_MESSAGES.PERMISSION.DELETED, MessageResDTO)
  async deletePermission(@Param() params: PermissisonIdParamDTO) {
    return await this.permissionService.deletePermission({ id: params.permissionId })
  }

  /**
   * Assigns roles to a permission.
   * Allows linking one permission with one or more roles (or replacing/merging based on service rules).
   * @param params - Route params with the target permission ID.
   * @param body - The DTO describing role assignments to apply.
   * @returns The permission with its updated role assignments.
   */
  @Auth([AuthTypes.BEARER])
  @Post(':permissionId/roles')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Assign roles to permission',
    description: 'Assign or update roles for a given permission. Links roles with permission entities.',
  })
  @ApiParam({ name: 'permissionId', type: Number, description: 'Permission ID' })
  @ApiBody({ type: AssignRoleToPermissionDTO })
  @ZodSerializerDto(AssignRoleToPermissionResDTO)
  @ApiStandardResponses(HttpStatusCode.CREATED, RESPONSE_MESSAGES.PERMISSION.ASSIGNED, AssignRoleToPermissionResDTO)
  async assignRoleToPermission(@Param() params: PermissisonIdParamDTO, @Body() body: AssignRoleToPermissionDTO) {
    return await this.permissionService.assignRoleToPermission(params.permissionId, body)
  }

  /**
   * Retrieves a paginated list of permissions.
   * @param queryParams - Pagination and filter options (e.g., page, limit, search keyword).
   * @returns A paginated collection of permissions with metadata.
   */
  @Auth([AuthTypes.BEARER])
  @Get('pagination')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get permissions (paginated)',
    description: 'Retrieve paginated permissions list with optional filters.',
  })
  @ZodSerializerDto(GetPermissionsResDTO)
  @ApiStandardResponses(HttpStatusCode.OK, RESPONSE_MESSAGES.PERMISSION.LIST, GetPermissionsResDTO)
  async findAll(@Query() queryParams: GetPermissionQueryDTO) {
    return await this.permissionService.findAll(queryParams)
  }

  /**
   * Retrieves a single permission by ID.
   * Returns detailed information about the specified permission.
   * @param params - Route params containing the permission ID.
   * @returns The permission detail record.
   */
  @Auth([AuthTypes.BEARER])
  @Get(':permissionId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get permission detail',
    description: 'Retrieve detailed information about a specific permission by ID.',
  })
  @ApiParam({ name: 'permissionId', type: Number, description: 'Permission ID' })
  @ZodSerializerDto(GetPermissionDetailResDTO)
  @ApiStandardResponses(HttpStatusCode.OK, RESPONSE_MESSAGES.PERMISSION.DETAIL, GetPermissionDetailResDTO)
  async findOne(@Param() params: PermissisonIdParamDTO) {
    return await this.permissionService.findOne(params.permissionId)
  }

  /**
   * Retrieves all permissions (non-paginated).
   * @returns The complete list of permissions.
   */
  @Auth([AuthTypes.BEARER])
  @Get()
  @RequireClientRole()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get all permissions',
    description: 'Retrieve all permissions in the system (non-paginated).',
  })
  @ZodSerializerDto(GetAllPermissionResDTO)
  @ApiStandardResponses(HttpStatusCode.OK, RESPONSE_MESSAGES.PERMISSION.ALL, GetAllPermissionResDTO)
  async getAllPermission() {
    return await this.permissionService.getAllPermission()
  }
}
