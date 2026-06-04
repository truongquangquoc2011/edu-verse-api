import { Injectable } from '@nestjs/common'
import { PrismaService } from 'src/shared/services/prisma.service'
import {
  CreatePermissionBodyType,
  GetPermissionQueryTye,
  HTTPMethodType,
  PermissionType,
  PermissionWithRelationsType,
  PermissionWithRoleType,
  UpdatePermissionBodyType,
} from './permission.model'
import { PermissionSchema } from 'src/shared/models/shared-permission.model'

@Injectable()
export class PermissionRepository {
  constructor(private readonly prismaService: PrismaService) {}
  /**
   * Creates a new permission record in the database.
   *
   * @param params - The parameters for creating a permission.
   * @param params.data - The validated permission data (name, description, path, method).
   * @param params.createdById - The ID of the user creating this permission, or null if not applicable.
   * @returns A Promise that resolves to the created permission record.
   **/
  async create({
    data,
    createdById,
  }: {
    data: CreatePermissionBodyType
    createdById: number | null
  }): Promise<PermissionType> {
    return await this.prismaService.permission.create({
      data: {
        ...data,
        createdById,
      },
      include: {
        createdBy: {
          where: { deletedAt: null },
          select: {
            id: true,
            fullname: true,
            role: { select: { id: true, name: true } },
          },
        },
      },
    })
  }
  /**
   * Finds a permission by its path and HTTP method.
   * Useful for checking if a permission already exists before creating or updating.
   * @param path - The API path associated with the permission.
   * @param method - The HTTP method (GET, POST, PUT, DELETE, etc.).
   * @param excludeId - (Optional) If provided, exclude this permission ID from the search (useful for updates).
   * @param includeDeleted - (Optional) Whether to include soft-deleted permissions in the search. Defaults to false.
   * @returns A Promise that resolves to the found permission, or null if no match is found.
   **/
  async findByPathAndMethod(
    path: string,
    method: HTTPMethodType,
    excludeId?: number,
    includeDeleted: boolean = false,
  ): Promise<PermissionType | null> {
    const whereClause: any = {
      path,
      method,
    }

    if (typeof excludeId === 'number') {
      whereClause.id = { not: excludeId }
    }

    if (!includeDeleted) {
      whereClause.deletedAt = null
    }

    return await this.prismaService.permission.findFirst({
      where: whereClause,
    })
  }

  /**
   * Finds a permission by its ID.
   *
   * @param id - The permission ID to look up.
   * @param includeDeleted - (Optional) Include soft-deleted records. Defaults to false.
   * @returns The permission record if found; otherwise null.
   */
  async findById(id: number, includeDeleted: boolean = false): Promise<PermissionType | null> {
    const payload: any = { id }

    if (!includeDeleted) {
      payload.deletedAt = null
    }

    return await this.prismaService.permission.findUnique({
      where: payload,
    })
  }

  /**
   * Updates an existing permission by ID.
   * Also records the updater via `updatedById`.
   *
   * @param params - Update parameters.
   * @param params.id - The target permission ID.
   * @param params.data - Partial fields to update (name, description, path, method, etc.).
   * @param params.updatedById - The user ID performing the update, or null if not applicable.
   * @returns The updated permission record.
   */
  async update({
    id,
    data,
    updatedById,
  }: {
    id: number
    data: UpdatePermissionBodyType
    updatedById: number | null
  }): Promise<PermissionType> {
    return await this.prismaService.permission.update({
      where: { id },
      data: {
        ...data,
        updatedById,
      },
      include: {
        createdBy: {
          where: { deletedAt: null },
          select: {
            id: true,
            fullname: true,
            role: { select: { id: true, name: true } },
          },
        },
        updatedBy: {
          where: { deletedAt: null },
          select: {
            id: true,
            fullname: true,
            role: { select: { id: true, name: true } },
          },
        },
      },
    })
  }

  /**
   * Replaces the set of roles assigned to a permission.
   * Uses Prisma `set` to overwrite existing role relations with the provided list.
   *
   * @param permissionId - The permission ID to update.
   * @param roleIds - List of role IDs to assign to the permission.
   * @returns The permission with its (filtered) related roles included.
   */
  async assignRoleToPermission(permissionId: number, roleIds: number[]): Promise<PermissionWithRelationsType> {
    return await this.prismaService.permission.update({
      where: { id: permissionId },
      data: {
        roles: {
          set: roleIds.map((roleId) => ({ id: roleId })),
        },
      },
      include: {
        roles: {
          where: { deletedAt: null },
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
   * Retrieves a single permission by ID with its active roles.
   *
   * @param id - The permission ID to fetch.
   * @returns The permission with related roles, or null if not found/soft-deleted.
   */
  async findOne(id: number): Promise<PermissionWithRoleType | null> {
    return await this.prismaService.permission.findUnique({
      where: {
        id,
        deletedAt: null,
      },
      include: {
        roles: {
          where: { deletedAt: null },
        },
      },
    })
  }

  /**
   * Retrieves a paginated list of permissions with optional filters.
   * Supports keyword search across `name`, `description`, and `path`, plus method filtering.
   * Excludes soft-deleted records by default.
   *
   * @param queryParams - Pagination and filter options.
   * @param queryParams.page - Current page number (1-based).
   * @param queryParams.limit - Page size.
   * @param queryParams.search - (Optional) Case-insensitive keyword to match name/description/path.
   * @param queryParams.method - (Optional) Filter by HTTP method.
   * @param queryParams.includeDeleted - (Optional) Include soft-deleted records. Defaults to false.
   * @returns An object containing `data` and `pagination` metadata.
   */
  async findAll(queryParams: GetPermissionQueryTye): Promise<{
    data: PermissionType[]
    pagination: {
      page: number
      limit: number
      total: number
      totalPages: number
    }
  }> {
    const { page, limit, search, method, includeDeleted } = queryParams
    const skip = (page - 1) * limit

    const payload: any = {}

    if (!includeDeleted) {
      payload.deletedAt = null
    }

    if (method) {
      payload.method = method
    }

    if (search) {
      payload.OR = [
        {
          name: {
            contains: search,
            mode: 'insensitive',
          },
        },
        {
          description: {
            contains: search,
            mode: 'insensitive',
          },
        },
        {
          path: {
            contains: search,
            mode: 'insensitive',
          },
        },
      ]
    }

    const [permissions, totalCount] = await Promise.all([
      this.prismaService.permission.findMany({
        where: payload,
        skip,
        take: limit,
        orderBy: [{ createdAt: 'desc' }, { name: 'asc' }],
      }),
      this.prismaService.permission.count({
        where: payload,
      }),
    ])

    const totalPages = Math.ceil(totalCount / limit)

    return {
      data: permissions,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages,
      },
    }
  }

  /**
   * Retrieves all active (non-deleted) permissions.
   * Validates each record with {@link PermissionSchema}.
   *
   * @returns A list of validated permission records.
   */
  async getAllPermission(): Promise<PermissionType[]> {
    const permission = await this.prismaService.permission.findMany({
      where: {
        deletedAt: null,
      },
    })
    return permission.map((r) => PermissionSchema.parse(r))
  }

  /**
   * Soft-deletes a permission by setting `deletedAt` to the current timestamp.
   * The record remains in the database and can be excluded by queries that filter on `deletedAt = null`.
   *
   * @param id - The permission ID to soft-delete.
   * @returns The updated permission record with `deletedAt` set.
   */
  async deletePermission(id: number): Promise<PermissionType> {
    return await this.prismaService.permission.update({
      where: { id },
      data: { deletedAt: new Date() },
    })
  }
}
