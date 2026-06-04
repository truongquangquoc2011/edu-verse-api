import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common'
import { RoleType } from '../auth/auth.model'
import { PrismaService } from 'src/shared/services/prisma.service'
import {
  CreateRoleBodyType,
  RoleWithPermissionsType,
  RoleWithRelationsType,
  AssignRolesToUserBodyType,
  UserWithRolesResType,
} from './role.model'
import { Permission, Prisma } from '@prisma/client'
import { RoleNotFoundException } from './role.error'
import { PAGINATION } from 'src/shared/constants/pagination.constant'
import { CACHE_MANAGER } from '@nestjs/cache-manager'
import type { Cache } from 'cache-manager'
export const ROLE_DEFAULT_SELECT = {
  id: true,
  name: true,
  description: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
  createdById: true,
  updatedById: true,
} as const

enum RoleName {
  ADMIN = 'ADMIN',
  SELLER = 'SELLER',
  CLIENT = 'CLIENT',
}

type PermissionTriple = Pick<Permission, 'name' | 'method' | 'path'>
type PermissionName = Pick<Permission, 'name'>

@Injectable()
export class RoleRepository {
  private readonly logger = new Logger(RoleRepository.name)
  constructor(
    private readonly prismaService: PrismaService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}
  private async checkExists(
    id: number,
    mustBeDeleted = false,
    client: PrismaService | Prisma.TransactionClient = this.prismaService,
  ): Promise<void> {
    const role = await client.role.findUnique({
      where: { id },
      select: { id: true, deletedAt: true },
    })
    if (!role) {
      throw RoleNotFoundException
    }
    if (!mustBeDeleted && role.deletedAt !== null) {
      throw RoleNotFoundException
    }
  }

  /**
   * Finds a role by its name.
   * @param name - The role name to search for.
   * @param excludeId - (Optional) If provided, exclude this role ID from the search (useful when updating).
   * @param includeDeleted - (Optional) Whether to include soft-deleted roles in the search. Defaults to false.
   * @returns A Promise resolving to the role record if found, or null if not found.
   */
  async findByName(name: string, excludeId?: number, includeDeleted: boolean = false): Promise<RoleType | null> {
    const payload: any = {
      name,
    }

    if (excludeId) {
      payload.id = { not: excludeId }
    }

    if (!includeDeleted) {
      payload.deletedAt = null
    }

    return await this.prismaService.role.findFirst({
      where: payload,
    })
  }
  /**
   * Creates a new role in the database.
   * @param params - The parameters for creating a role.
   * @param params.data - The validated role data (name, description, isActive).
   * @param params.createdById - The ID of the user creating the role, or null if not applicable.
   * @returns A Promise resolving to the created role record.
   */
  async createRole({ data, createdById }: { data: CreateRoleBodyType; createdById: number | null }): Promise<RoleType> {
    return await this.prismaService.role.create({
      data: {
        ...data,
        createdById,
      },
    })
  }

  /**
   * Assigns a list of permissions to a role (overwrites existing permissions).
   * @param roleId - The ID of the role to update.
   * @param permissionIds - An array of permission IDs to assign to the role.
   * @returns A Promise resolving to the updated role with its assigned permissions.
   */
  async assignPermissionsToRole(roleId: number, permissionIds: number[]): Promise<RoleWithRelationsType> {
    return await this.prismaService.role.update({
      where: { id: roleId },
      data: {
        permissions: {
          set: permissionIds.map((permissionId) => ({ id: permissionId })),
        },
      },
      include: {
        permissions: {
          where: { deletedAt: null },
          select: {
            id: true,
            name: true,
            description: true,
            path: true,
            method: true,
          },
        },
      },
    })
  }
  /**
   * Finds a role by its ID, including its permissions.
   * @param id - The ID of the role to find.
   * @returns A Promise resolving to the role with permissions, or null if not found or deleted.
   */
  async findOne(id: number): Promise<RoleWithPermissionsType | null> {
    return await this.prismaService.role.findFirst({
      where: {
        id,
        deletedAt: null,
      },
      include: {
        permissions: {
          where: { deletedAt: null },
        },
      },
    })
  }

  /**
   * Finds an active (not soft-deleted) user by ID.
   * Uses `findFirst` with `deletedAt: null` and selects only minimal fields.
   * @param id - The user ID to look up.
   * @returns The user record `{ id, email }` if found; otherwise `null`.
   */
  async findUserById(id: number) {
    return await this.prismaService.user.findFirst({
      where: { id, deletedAt: null },
      select: { id: true, email: true },
    })
  }
  /**
   * Retrieves the list of roles.
   * Excludes soft-deleted roles. Supports pagination for large datasets.
   * @param skip - Number of roles to skip (default: 0).
   * @param take - Number of roles to return (default: 10).
   * @returns Array of roles.
   * @example
   * await listRoles(0, 10); // Returns first 10 roles
   */
  async listRoles(skip: number = PAGINATION.DEFAULT_SKIP, take: number = PAGINATION.DEFAULT_TAKE) {
    return this.prismaService.role.findMany({
      where: { deletedAt: null },
      select: ROLE_DEFAULT_SELECT,
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    })
  }

  /**
   * Retrieves a role by its ID.
   * Throws a RoleNotFoundException if the role does not exist or has been soft-deleted.
   * @param id - The ID of the role to retrieve.
   * @returns A Promise resolving to the role with default fields selected.
   * @throws RoleNotFoundException if the role is not found or is soft-deleted.
   */
  async findRoleById(id: number) {
    await this.checkExists(id, false)
    return this.prismaService.role.findUnique({
      where: { id },
      select: ROLE_DEFAULT_SELECT,
    })
  }

  /**
   * Replaces a user's single role (direct assignment) and records the updater.
   * @param params
   * @param params.id          - The user ID to update.
   * @param params.data        - Payload containing the target `roleId` to assign.
   * @param params.updatedById - The ID of the actor performing the change (stored in `updatedById`).
   * @returns The updated user with its `role` included:
   *          `{ id, email, role: { id, name, description } }`
   */
  async setRolesForUser({
    id,
    data,
    updatedById,
  }: {
    id: number
    data: AssignRolesToUserBodyType
    updatedById: number
  }): Promise<UserWithRolesResType> {
    return await this.prismaService.user.update({
      where: { id },
      data: {
        ...data,
        updatedById,
      },
      include: {
        role: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
      },
    })
  }
  /**
   * Updates a role with the provided data.
   * Executes inside a transaction and throws if the role does not exist or has been soft-deleted.
   * @param id - The ID of the role to update.
   * @param data - The updated role data (partial input or Prisma update input).
   * @returns A Promise resolving to the updated role with default fields selected.
   * @throws RoleNotFoundException if the role is not found or is soft-deleted.
   */
  async updateRole(id: number, data: Prisma.RoleUpdateInput | Partial<CreateRoleBodyType>) {
    return this.prismaService.$transaction(async (tx) => {
      await this.checkExists(id, false, tx)
      return tx.role.update({
        where: { id },
        data,
        select: ROLE_DEFAULT_SELECT,
      })
    })
  }

  /**
   * Soft deletes a role by marking its deletedAt field.
   * Executes inside a transaction and throws if the role does not exist or has already been deleted.
   * @param id - The ID of the role to soft delete.
   * @returns A Promise resolving to the soft-deleted role's ID and name.
   * @throws RoleNotFoundException if the role is not found or already soft-deleted.
   */
  async softDeleteRole(id: number) {
    return this.prismaService.$transaction(async (tx) => {
      await this.checkExists(id, false, tx)
      return tx.role.update({
        where: { id },
        data: { deletedAt: new Date() },
        select: { id: true, name: true },
      })
    })
  }

  /**
   * Restores a previously soft-deleted role.
   * Executes inside a transaction and throws if the role does not exist or is not soft-deleted.
   * @param id - The ID of the role to restore.
   * @returns A Promise resolving to the restored role's ID and name.
   * @throws RoleNotFoundException if the role is not found or is not soft-deleted.
   */
  async restoreRole(id: number) {
    return this.prismaService.$transaction(async (tx) => {
      await this.checkExists(id, true, tx)
      return tx.role.update({
        where: { id },
        data: { deletedAt: null },
        select: { id: true, name: true },
      })
    })
  }

  /**
   * Checks if a role with the given ID exists and has not been soft-deleted.
   * @param id - The ID of the role to check.
   * @returns A Promise resolving to true if the role exists and is active, otherwise false.
   */
  async existsRole(id: number): Promise<boolean> {
    const found = await this.prismaService.role.findFirst({
      where: { id, deletedAt: null },
      select: { id: true },
    })
    return !!found
  }

  /**
   * Checks if there is at least one active (non-soft-deleted) role in the system.
   * @returns A Promise resolving to true if any active role exists, otherwise false.
   */
  async hasAnyRole(): Promise<boolean> {
    const found = await this.prismaService.role.findFirst({
      where: { deletedAt: null },
      select: { id: true },
    })
    return !!found
  }

  /**
   * Get full permissions (name, method, path) for the role.
   * @param roleName - Role name (validated enum).
   * @returns Array permissions.
   * @throws NotFoundException if role does not exist.
   * @example getFullPermissionsForRole('ADMIN') → [{ name: 'View User List', method: 'GET', path: '/users' }]
   */
  async getFullPermissionsForRole(roleName: RoleName): Promise<PermissionTriple[]> {
    const cacheKey = `permissions_full_${roleName}`
    let permissions = await this.cacheManager.get<PermissionTriple[]>(cacheKey)

    if (!permissions) {
      const fetched = await this.fetchPermissionsForRole(roleName, {
        name: true,
        method: true,
        path: true,
      })
      permissions = fetched as PermissionTriple[]

      await this.cacheManager.set(cacheKey, permissions, 300)
    }
    return permissions
  }

  /**
   * Get only the names of permissions for the role
   * @param roleName.
   * @returns Array permission names.
   * @throws NotFoundException if role not exists
   * @example getPermissionNamesForRole('CLIENT') → ['View Course List']
   */
  async getPermissionNamesForRole(roleName: RoleName): Promise<string[]> {
    const cacheKey = `permissions_names_${roleName}`
    let names = await this.cacheManager.get<string[]>(cacheKey)

    if (!names) {
      const permissions = await this.fetchPermissionsForRole(roleName, {
        name: true,
      })
      names = permissions.map((p) => p.name!)
      await this.cacheManager.set(cacheKey, names, 300)
    }

    return names
  }

  /**
   * Private helper: Query core with dynamic select (avoid duplicates).
   * @param roleName - Role name.
   * @param select - Prisma select for permissions.
   * @returns Permissions array.
   * @private
   */
  private async fetchPermissionsForRole(
    roleName: RoleName,
    select: Prisma.PermissionSelect,
  ): Promise<Partial<Permission>[]> {
    const role = await this.prismaService.role.findFirst({
      where: { name: roleName, deletedAt: null },
      include: {
        permissions: {
          where: { deletedAt: null },
          select,
        },
      },
    })

    if (!role) {
      this.logger.warn(`Role not found: ${roleName}`)
      return []
    }

    return role.permissions as Partial<Permission>[]
  }

  async getPermissionTriplesByRoleName(roleName: string): Promise<PermissionTriple[]> {
    const key = roleName.trim().toUpperCase()
    if (!(key in RoleName)) {
      this.logger.warn(`Unknown role name: ${roleName}`)
      return []
    }
    return this.getFullPermissionsForRole(key as RoleName)
  }
}
