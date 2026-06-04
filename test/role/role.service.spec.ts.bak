import { Test, TestingModule } from '@nestjs/testing'
import { RoleService } from 'src/routes/role/role.service'
import { RoleRepository } from 'src/routes/role/role.repo'
import { RoleAlreadyExistsException, RoleNotFoundException } from 'src/routes/role/role.error'
import { RoleMessages } from 'src/shared/constants/message.constant'
import { Prisma } from '@prisma/client'

describe('RoleService', () => {
  let service: RoleService
  let repo: jest.Mocked<RoleRepository>
  let module: TestingModule

  beforeEach(async () => {
    module = await Test.createTestingModule({
      providers: [
        RoleService,
        {
          provide: RoleRepository,
          useValue: {
            findByName: jest.fn(),
            createRole: jest.fn(),
            findOne: jest.fn(),
            assignPermissionsToRole: jest.fn(),
            listRoles: jest.fn(),
            findRoleById: jest.fn(),
            updateRole: jest.fn(),
            softDeleteRole: jest.fn(),
            restoreRole: jest.fn(),
          },
        },
      ],
    }).compile()

    service = module.get<RoleService>(RoleService)
    repo = module.get(RoleRepository)
  })

  afterAll(async () => {
    await module.close()
  })

  // ---------------- HAPPY PATH ----------------
  describe('createRole', () => {
    it('should create a new role when not exists', async () => {
      repo.findByName.mockResolvedValue(null)
      repo.createRole.mockResolvedValue({ id: 1, name: 'admin' } as any)

      const result = await service.createRole({
        data: { name: 'admin', description: 'Admin', isActive: true },
        createdById: 1,
      })

      expect(result.name).toBe('admin')
      expect(repo.createRole).toHaveBeenCalled()
    })

    it('should throw RoleAlreadyExistsException if name exists', async () => {
      repo.findByName.mockResolvedValue({ id: 1, name: 'admin' } as any)

      await expect(
        service.createRole({
          data: { name: 'admin', description: 'Admin', isActive: true },
          createdById: 1,
        }),
      ).rejects.toBe(RoleAlreadyExistsException)
    })
  })

  describe('assignPermissionToRole', () => {
    it('should assign permissions to role', async () => {
      repo.findOne.mockResolvedValue({ id: 1, name: 'admin' } as any)
      repo.assignPermissionsToRole.mockResolvedValue({
        id: 1,
        name: 'admin',
        permissions: [{ id: 99, name: 'test' }],
      } as any)

      const result = await service.assignPermissionToRole(1, {
        permissionIds: [99],
      })

      expect(result.permissions).toBeDefined()
    })

    it('should throw RoleNotFoundException if role not exists', async () => {
      repo.findOne.mockResolvedValue(null)

      await expect(service.assignPermissionToRole(1, { permissionIds: [99] })).rejects.toBe(RoleNotFoundException)
    })
  })

  describe('listRoles', () => {
    it('should return roles list', async () => {
      repo.listRoles.mockResolvedValue([{ id: 1, name: 'admin' }] as any)

      const result = await service.listRoles(0, 10)

      expect(result).toHaveLength(1)
      expect(result[0].name).toBe('admin')
    })
  })

  describe('getRoleById', () => {
    it('should return role', async () => {
      repo.findRoleById.mockResolvedValue({ id: 1, name: 'admin' } as any)

      const result = await service.getRoleById(1)

      expect(result.id).toBe(1)
    })

    it('should throw RoleNotFoundException if repo throws not found', async () => {
      repo.findRoleById.mockImplementation(() => {
        throw RoleNotFoundException
      })

      await expect(service.getRoleById(999)).rejects.toBe(RoleNotFoundException)
    })
  })

  describe('updateRole', () => {
    it('should update role successfully', async () => {
      repo.updateRole.mockResolvedValue({ id: 1, name: 'updated' } as any)

      const result = await service.updateRole(1, { name: 'updated' })

      expect(result.name).toBe('updated')
    })

    it('should throw RoleNotFoundException if repo throws not found', async () => {
      repo.updateRole.mockRejectedValue(RoleNotFoundException)

      await expect(service.updateRole(999, { name: 'abc' })).rejects.toBe(RoleNotFoundException)
    })
  })

  describe('softDeleteRole', () => {
    it('should soft delete role', async () => {
      repo.softDeleteRole.mockResolvedValue({ id: 1, name: 'admin' } as any)

      const result = await service.softDeleteRole(1)

      expect(result.message).toBe(RoleMessages.ROLE_DELETED_SUCCESS)
    })

    it('should throw RoleNotFoundException if repo throws not found', async () => {
      repo.softDeleteRole.mockRejectedValue(RoleNotFoundException)

      await expect(service.softDeleteRole(123)).rejects.toBe(RoleNotFoundException)
    })
  })

  describe('restoreRole', () => {
    it('should restore role', async () => {
      repo.restoreRole.mockResolvedValue({ id: 1, name: 'admin' } as any)

      const result = await service.restoreRole(1)

      expect(result.message).toBe(RoleMessages.ROLE_RESTORED_SUCCESS)
    })

    it('should throw RoleNotFoundException if repo throws not found', async () => {
      repo.restoreRole.mockRejectedValue(RoleNotFoundException)

      await expect(service.restoreRole(123)).rejects.toBe(RoleNotFoundException)
    })
  })

  // ---------------- NEGATIVE CASES ----------------
  

    describe('assignPermissionToRole', () => {
      it('should throw InternalAssignPermissionsToRoleErrorException on unexpected error', async () => {
        repo.findOne.mockResolvedValue({ id: 1, name: 'admin' } as any)
        repo.assignPermissionsToRole.mockRejectedValue(new Error('DB fail'))

        await expect(service.assignPermissionToRole(1, { permissionIds: [123] })).rejects.toMatchObject({
          message: 'Error.InternalAssignPermissionsToRoleError',
        })
      })
    })

    describe('updateRole', () => {
      it('should throw InternalUpdateRoleErrorException on unexpected error', async () => {
        repo.updateRole.mockRejectedValue(new Error('DB fail'))

        await expect(service.updateRole(1, { name: 'abc' })).rejects.toMatchObject({
          message: 'Error.Role.UpdateFailed',
        })
      })
    })

    describe('restoreRole', () => {
      it('should throw InternalRestoreRoleErrorException on unexpected error', async () => {
        repo.restoreRole.mockRejectedValue(new Error('DB fail'))

        await expect(service.restoreRole(1)).rejects.toMatchObject({
          message: 'Error.Role.RestoreFailed',
        })
      })
    })
  })

