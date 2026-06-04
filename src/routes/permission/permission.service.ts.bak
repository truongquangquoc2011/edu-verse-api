import { BadRequestException, ConflictException, HttpException, Injectable, NotFoundException } from '@nestjs/common'
import {
  AssignRoleToPermissionType,
  CreatePermissionBodyType,
  GetAllPermissionsResType,
  GetPermissionQueryTye,
  GetPermissionsResType,
  PermissionResponseType,
  PermissionWithRelationsType,
  UpdatePermissionBodyType,
} from './permission.model'
import { isNotFoundPrismaError, isUniqueConstraintPrismaError } from 'src/shared/helper'
import { PermissionRepository } from './permission.repo'
import {
  AtLeastOneFieldMustBeProvidedException,
  InternalAssignRoleToPermissionErrorException,
  InternalCreatePermissionErrorException,
  InternalDeletePermissionErrorException,
  InternalRetrievePermissionErrorException,
  InternalUpdatePermissionErrorException,
  PermissionAlreadyExistsException,
  PermissionNotFoundException,
} from './permission.error'

@Injectable()
export class PermissionService {
  constructor(private readonly PermissionRepository: PermissionRepository) {}
  /**
   * Creates a new permission in the system.
   * This method checks if a permission with the same path and HTTP method already exists
   * (including soft-deleted ones). If a duplicate is found, it throws a `PermissionAlreadyExistsException`.
   * Otherwise, it creates a new permission record in the database and returns the sanitized response.
   * @param params - The parameters for creating a permission.
   * @param params.data - The validated permission data (name, description, path, method).
   * @param params.createdById - The ID of the currently authenticated user creating the permission.
   * @returns A Promise that resolves to the created permission without soft-delete fields.
   * @throws PermissionAlreadyExistsException - If a permission with the same path and method already exists.
   * @throws InternalCreatePermissionErrorException - If an unexpected error occurs during creation.
   **/
  async createPermission({
    data,
    createdById,
  }: {
    data: CreatePermissionBodyType
    createdById: number
  }): Promise<PermissionResponseType> {
    try {
      const existingPermission = await this.PermissionRepository.findByPathAndMethod(
        data.path,
        data.method,
        undefined,
        true,
      )

      if (existingPermission) {
        throw PermissionAlreadyExistsException
      }

      const createdPermission = await this.PermissionRepository.create({ data, createdById })

      // Return response without sensitive fields
      return this.mapToResponseType(createdPermission)
    } catch (error) {
      if (isUniqueConstraintPrismaError(error)) {
        throw PermissionAlreadyExistsException
      }
      if (error instanceof ConflictException) {
        throw error
      }
      throw InternalCreatePermissionErrorException
    }
  }

  /**
   * Updates an existing permission by ID.
   * Validates that at least one field is provided; ensures (path, method) uniqueness
   * against other permissions (excluding the current one). Returns a sanitized permission object.
   *
   * @param params - Update arguments.
   * @param params.id - The target permission ID to update.
   * @param params.data - Partial fields to update (e.g., name, description, path, method).
   * @param params.updatedById - The ID of the user performing the update.
   * @returns The updated permission in `PermissionResponseType` shape.
   *
   * @throws AtLeastOneFieldMustBeProvidedException - When no fields are supplied in the payload.
   * @throws PermissionNotFoundException - If the target permission does not exist.
   * @throws PermissionAlreadyExistsException - If the new (path, method) conflicts with another permission.
   * @throws InternalUpdatePermissionErrorException - For unexpected errors during update.
   */
  async updatePermission({
    id,
    data,
    updatedById,
  }: {
    id: number
    data: UpdatePermissionBodyType
    updatedById: number
  }): Promise<PermissionResponseType> {
    try {
      const { path, method } = data

      if (Object.keys(data).length === 0) {
        throw AtLeastOneFieldMustBeProvidedException
      }

      const existingPermission = await this.PermissionRepository.findById(id)
      if (!existingPermission) {
        throw PermissionNotFoundException
      }
      if (path || method) {
        const pathToCheck = path ?? existingPermission.path
        const methodToCheck = method ?? existingPermission.method

        const isSamePath = pathToCheck === existingPermission.path
        const isSameMethod = methodToCheck === existingPermission.method

        if (!isSameMethod && !isSamePath) {
          const conflictingPermission = await this.PermissionRepository.findByPathAndMethod(
            pathToCheck,
            methodToCheck,
            id,
          )

          if (conflictingPermission) {
            throw PermissionAlreadyExistsException
          }
        }
      }

      const updatePermission = await this.PermissionRepository.update({ id, data, updatedById })

      return this.mapToResponseType(updatePermission)
    } catch (error) {
      if (error instanceof HttpException) throw error
      throw InternalUpdatePermissionErrorException
    }
  }

  /**
   * Soft-deletes a permission by ID.
   * Validates existence first, then marks the record as deleted (sets `deletedAt`).
   * Returns a human-readable success message.
   *
   * @param params - Delete arguments.
   * @param params.id - The permission ID to soft-delete.
   * @returns An object with a `message` describing the result.
   *
   * @throws PermissionNotFoundException - If the permission does not exist or is already deleted.
   * @throws InternalDeletePermissionErrorException - For unexpected errors during deletion.
   */
  async deletePermission({ id }: { id: number }): Promise<{ message: string }> {
    try {
      const existing = await this.PermissionRepository.findOne(id)
      if (!existing) throw PermissionNotFoundException
      await this.PermissionRepository.deletePermission(id)
      return { message: `Permission ${existing?.name} has been successfully deleted.` }
    } catch (error) {
      if (isNotFoundPrismaError(error)) throw PermissionNotFoundException
      if (error instanceof Error) throw error
      throw InternalDeletePermissionErrorException
    }
  }

  /**
   * Assigns a set of roles to a permission (replace semantics).
   * Ensures the target permission exists, then overwrites its role relations
   * with the given list of role IDs. Returns the permission including active roles.
   *
   * @param permissionId - The permission ID to assign roles to.
   * @param body - Payload containing an array of role IDs to set.
   * @returns The updated permission with related roles.
   *
   * @throws PermissionNotFoundException - If the permission does not exist.
   * @throws InternalAssignRoleToPermissionErrorException - On unexpected assignment errors.
   */
  async assignRoleToPermission(
    permissionId: number,
    body: AssignRoleToPermissionType,
  ): Promise<PermissionWithRelationsType> {
    try {
      const existingRole = await this.PermissionRepository.findOne(permissionId)
      if (!existingRole) {
        throw PermissionNotFoundException
      }

      const permissionWithPermissions = await this.PermissionRepository.assignRoleToPermission(
        permissionId,
        body.roleIds,
      )

      return permissionWithPermissions
    } catch (error) {
      if (error instanceof HttpException) {
        throw error
      }
      throw InternalAssignRoleToPermissionErrorException
    }
  }

  /**
   * Retrieves a single permission by ID.
   * Returns the raw permission (not including related roles) or throws if not found.
   *
   * @param id - The permission ID to fetch.
   * @returns The permission record.
   *
   * @throws PermissionNotFoundException - If the permission does not exist.
   * @throws InternalRetrievePermissionErrorException - For unexpected retrieval errors.
   */
  async findOne(id: number) {
    try {
      const permission = await this.PermissionRepository.findById(id)
      if (!permission) throw PermissionNotFoundException
      return permission
    } catch (error) {
      if (error === PermissionNotFoundException) throw error
      throw InternalRetrievePermissionErrorException
    }
  }

  /**
   * Retrieves a paginated list of permissions.
   * Delegates to repository for filtering/searching/sorting,
   * then maps each record to `PermissionResponseType`.
   *
   * @param queryParams - Pagination and filter options.
   * @returns A paginated response with `data` and `pagination` metadata.
   *
   * @throws InternalRetrievePermissionErrorException - For unexpected retrieval errors.
   */
  async findAll(queryParams: GetPermissionQueryTye): Promise<GetPermissionsResType> {
    try {
      const result = await this.PermissionRepository.findAll(queryParams)
      return {
        data: result.data.map((m) => this.mapToResponseType(m)),
        pagination: result.pagination,
      }
    } catch (error) {
      throw InternalRetrievePermissionErrorException
    }
  }

  /**
   * Retrieves all active permissions (non-paginated).
   * Returns the full list with a `totalItems` count, useful for dropdowns or prefetching.
   *
   * @returns An object containing the `data` array and `totalItems` count.
   *
   * @throws InternalRetrievePermissionErrorException - For unexpected retrieval errors.
   */
  async getAllPermission(): Promise<GetAllPermissionsResType> {
    try {
      const permissions = await this.PermissionRepository.getAllPermission()
      return {
        data: permissions,
        totalItems: permissions.length,
      }
    } catch (error) {
      if (error instanceof HttpException) throw error
      throw InternalRetrievePermissionErrorException
    }
  }

  /**
   * Maps a raw permission object from the database into the `PermissionResponseType`.
   * Removes sensitive or unnecessary fields like `deletedAt` and `deletedById`
   * before returning the object to the client.
   * @param permission - The raw permission record from the database.
   * @returns The sanitized permission object for API responses.
   * @example
   * const safePermission = this.mapToResponseType(dbPermission)
   */
  private mapToResponseType(permission: any): PermissionResponseType {
    const { deletedAt = null, deletedById, ...responseData } = permission
    return responseData as PermissionResponseType
  }
}
