import { isUniqueConstraintPrismaError } from 'src/shared/helper'
import {
  InternalAssignPermissionsToRoleErrorException,
  InternalAssignRolesToUserErrorException,
  InternalCreateRoleErrorException,
  RoleAlreadyExistsException,
  RoleNotFoundException,
  UserNotFoundException,
  InternalDeleteRoleErrorException,
  InternalRestoreRoleErrorException,
  InternalUpdateRoleErrorException,
  CannotUpdateAdminException,
} from './role.error'
import {
  AssignPermissionToRoleType,
  AssignRolesToUserBodyType,
  CreateRoleBodyType,
  RoleResponseType,
  RoleWithRelationsType,
  UserWithRolesResType,
} from './role.model'
import { RoleRepository } from './role.repo'
import { ForbiddenException, HttpException, Injectable } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { RoleMessages } from 'src/shared/constants/message.constant'
import { PAGINATION } from 'src/shared/constants/pagination.constant'
import { RoleName } from 'src/shared/constants/role.constant'

@Injectable()
export class RoleService {
  constructor(private readonly roleRepository: RoleRepository) {}
  private handlePrismaError(error: unknown, context: string): never {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        throw RoleAlreadyExistsException
      }
    }

    switch (context) {
      case 'createRole':
        throw InternalCreateRoleErrorException
      case 'updateRole':
        throw InternalUpdateRoleErrorException
      case 'softDeleteRole':
        throw InternalDeleteRoleErrorException
      case 'restoreRole':
        throw InternalRestoreRoleErrorException
      default:
        throw error
    }
  }

  /**
   * Creates a new role in the system.
   * @param params - The parameters required to create a new role.
   * @param params.data - The validated role data (name, description, isActive).
   * @param params.createdById - The ID of the user creating the role.
   * @returns A Promise resolving to the created role in a safe `RoleResponseType` format.
   */
  async createRole({
    data,
    createdById,
  }: {
    data: CreateRoleBodyType
    createdById: number
  }): Promise<RoleResponseType> {
    try {
      const existingRole = await this.roleRepository.findByName(data.name, undefined, true)
      if (existingRole) throw RoleAlreadyExistsException

      const CreateRole = await this.roleRepository.createRole({ data, createdById })

      return this.mapToResponseType(CreateRole)
    } catch (error) {
      console.error('CreateRole error:', error)
      if (isUniqueConstraintPrismaError(error)) {
        throw RoleAlreadyExistsException
      }
      if (error === RoleAlreadyExistsException) {
        throw error
      }
      throw InternalCreateRoleErrorException
    }
  }

  /**
   * Maps a role entity to the public `RoleResponseType` format.
   * Removes sensitive or internal fields such as `deletedAt` and `deletedById`.
   * @param role - The raw role entity from the database.
   * @returns The role object formatted for API response.
   */
  private mapToResponseType(role: any): RoleResponseType {
    const { deletedAt = null, deletedById, ...responseData } = role
    return responseData as RoleResponseType
  }

  /**
   * Assigns a list of permissions to a role.
   * @param roleId - The ID of the role to assign permissions to.
   * @param body - The request body containing an array of permission IDs.
   * @param body.permissionIds - An array of numeric permission IDs to assign to the role.
   * @returns A Promise resolving to the updated role with its assigned permissions.
   */
  async assignPermissionToRole(roleId: number, body: AssignPermissionToRoleType): Promise<RoleWithRelationsType> {
    try {
      const existingRole = await this.roleRepository.findOne(roleId)
      if (!existingRole) {
        throw RoleNotFoundException
      }

      const roleWithPermissions = await this.roleRepository.assignPermissionsToRole(roleId, body.permissionIds)

      return roleWithPermissions
    } catch (error) {
      if (error instanceof HttpException) throw error
      throw InternalAssignPermissionsToRoleErrorException
    }
  }

  /**
   * Replace a user's **single role** with the provided `roleId` (direct REPLACE).
   * @param params
   * @param {number} params.id                    The user ID to update.
   * @param {AssignRolesToUserBodyType} params.data  Body containing the target `roleId`.
   * @param {number} params.updatedById           The admin/actor ID performing the change.
   * @returns {Promise<UserWithRolesResType>} The updated user with its current role.
   * @throws {UserNotFoundException} If the user does not exist or was soft-deleted.
   * @throws {RoleNotFoundException} If the given `roleId` does not exist.
   * @throws {InternalAssignRolesToUserErrorException} For any unexpected errors
   */
  async assignRolesToUser({
    id,
    data,
    updatedById,
  }: {
    id: number
    data: AssignRolesToUserBodyType
    updatedById: number
  }): Promise<UserWithRolesResType> {
    try {
      const existingUser = await this.roleRepository.findUserById(id)
      if (!existingUser) throw UserNotFoundException

      const existingRole = await this.roleRepository.findRoleById(data.roleId)
      if (!existingRole) throw RoleNotFoundException
      if (existingRole.name === RoleName.Admin) throw CannotUpdateAdminException
      if (id === updatedById) {
        throw new ForbiddenException('Admins cannot change their own role')
      }

      const updated = await this.roleRepository.setRolesForUser({ id, data, updatedById })

      return updated
    } catch (error) {
      if (error instanceof HttpException) throw error
      throw InternalAssignRolesToUserErrorException
    }
  }
  /**
   * Retrieves a list of all roles.
   * Delegates to the repository to fetch all non-deleted roles.
   * @returns A Promise resolving to an array of role response objects.
   */
  async listRoles(
    skip: number = PAGINATION.DEFAULT_SKIP,
    take: number = PAGINATION.DEFAULT_TAKE,
  ): Promise<RoleResponseType[]> {
    return this.roleRepository.listRoles(skip, take)
  }
  /**
   * Retrieves the details of a specific role by its ID.
   * @param roleId - The ID of the role to retrieve.
   * @returns A Promise resolving to the role response object.
   * @throws RoleNotFoundException if the role does not exist or has been soft-deleted.
   */
  async getRoleById(roleId: number): Promise<RoleResponseType> {
    const role = await this.roleRepository.findRoleById(roleId)
    return this.mapToResponseType(role)
  }

  /**
   * Updates an existing role.
   * @param roleId - The ID of the role to update.
   * @param data - A partial object containing fields to update (name, description, isActive).
   * @returns A Promise resolving to the updated role response object.
   * @throws RoleNotFoundException if the role does not exist or has been soft-deleted.
   * @throws RoleAlreadyExistsException if updating the role causes a unique constraint violation (duplicate name).
   * @throws InternalUpdateRoleErrorException for unexpected database errors.
   */
  async updateRole(roleId: number, data: Partial<CreateRoleBodyType>): Promise<RoleResponseType> {
    try {
      const updated = await this.roleRepository.updateRole(roleId, data)
      return this.mapToResponseType(updated)
    } catch (error) {
      if (error === RoleNotFoundException) throw error
      this.handlePrismaError(error, 'updateRole')
    }
  }

  /**
   * Soft deletes a role by marking it as deleted.
   * @param roleId - The ID of the role to soft delete.
   * @returns A Promise resolving to an object containing a success message key.
   * @throws RoleNotFoundException if the role does not exist or is already deleted.
   * @throws InternalDeleteRoleErrorException for unexpected database errors.
   */
  async softDeleteRole(roleId: number): Promise<{ message: string }> {
    try {
      await this.roleRepository.softDeleteRole(roleId)
      return { message: RoleMessages.ROLE_DELETED_SUCCESS }
    } catch (error) {
      if (error === RoleNotFoundException) throw error
      this.handlePrismaError(error, 'softDeleteRole')
    }
  }

  /**
   * Restores a previously soft-deleted role.
   * @param roleId - The ID of the role to restore.
   * @returns A Promise resolving to an object containing a success message key.
   * @throws RoleNotFoundException if the role does not exist or is not soft-deleted.
   * @throws InternalRestoreRoleErrorException for unexpected database errors.
   */
  async restoreRole(roleId: number): Promise<{ message: string }> {
    try {
      await this.roleRepository.restoreRole(roleId)
      return { message: RoleMessages.ROLE_RESTORED_SUCCESS }
    } catch (error) {
      if (error === RoleNotFoundException) throw error
      this.handlePrismaError(error, 'restoreRole')
    }
  }

  async getPermissionsByRole(roleName: string): Promise<string[]> {
    const cleanRoleName = this.normalizeString(roleName, { toLowerCase: true, trim: true })
    const triples = await this.roleRepository.getPermissionTriplesByRoleName(cleanRoleName)

    const names = triples.map((t) => this.normalizeString(t.name, { toLowerCase: true, trim: true })).filter(Boolean)

    const routeKeys = triples
      .map((t) =>
        `${this.normalizeString(t.method, { toLowerCase: true, trim: true })} ${this.normalizeString(t.path, {
          toLowerCase: true,
          trim: true,
        })}`.trim(),
      )
      .filter((k) => k.length > 1 && !k.startsWith(' '))

    return Array.from(new Set([...names, ...routeKeys]))
  }

  /**
   * Normalize string: trim, lowerCase nếu config, handle null/undefined.
   * @param str - Input string.
   * @param options - Norm options.
   * @returns Normalized string hoặc '' nếu invalid.
   * @private
   */
  private normalizeString(str: string | null | undefined, options: { toLowerCase: boolean; trim: boolean }): string {
    if (typeof str !== 'string' || !str) {
      return ''
    }
    let normalized = str
    if (options.trim) {
      normalized = normalized.trim()
    }
    if (options.toLowerCase) {
      normalized = normalized.toLowerCase()
    }
    return normalized
  }
}
