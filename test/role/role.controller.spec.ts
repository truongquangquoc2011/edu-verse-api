import { Test, TestingModule } from '@nestjs/testing'
import { RoleController } from 'src/routes/role/role.controller'
import { RoleService } from 'src/routes/role/role.service'

describe('RoleController', () => {
  let controller: RoleController
  let service: jest.Mocked<RoleService>

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RoleController],
      providers: [
        {
          provide: RoleService,
          useValue: {
            createRole: jest.fn(),
            assignPermissionToRole: jest.fn(),
            listRoles: jest.fn(),
            getRoleById: jest.fn(),
            updateRole: jest.fn(),
            softDeleteRole: jest.fn(),
            restoreRole: jest.fn(),
          },
        },
      ],
    }).compile()

    controller = module.get<RoleController>(RoleController)
    service = module.get(RoleService)
  })

  it('should create role', async () => {
    ;(service.createRole as jest.Mock).mockResolvedValue({ id: 1, name: 'admin' })

    const result = await controller.createRole({ name: 'admin', description: '', isActive: true } as any, 1)

    expect(service.createRole).toHaveBeenCalledWith({
      data: { name: 'admin', description: '', isActive: true },
      createdById: 1,
    })
    expect(result.name).toBe('admin')
  })

  it('should assign permissions to role', async () => {
    ;(service.assignPermissionToRole as jest.Mock).mockResolvedValue({ id: 1, permissions: [{ id: 2 }] })

    const result = await controller.assignPermissionToRole({ roleId: 1 } as any, { permissionIds: [2] } as any)

    expect(result.permissions).toBeDefined()
  })

  it('should list roles', async () => {
    ;(service.listRoles as jest.Mock).mockResolvedValue([{ id: 1, name: 'admin' }])

    const result = await controller.listRoles(1, '0', '10')

    expect(result[0].name).toBe('admin')
  })

  it('should get role by id', async () => {
    ;(service.getRoleById as jest.Mock).mockResolvedValue({ id: 1, name: 'admin' })

    const result = await controller.getRole({ roleId: 1 } as any)

    expect(result.id).toBe(1)
  })

  it('should update role', async () => {
    ;(service.updateRole as jest.Mock).mockResolvedValue({ id: 1, name: 'updated' })

    const result = await controller.updateRole({ roleId: 1 } as any, { name: 'updated' } as any)

    expect(result.name).toBe('updated')
  })

  it('should delete role', async () => {
    ;(service.softDeleteRole as jest.Mock).mockResolvedValue({ message: 'deleted' })

    const result = await controller.deleteRole({ roleId: 1 } as any)

    expect(result.message).toBe('deleted')
  })

  it('should restore role', async () => {
    ;(service.restoreRole as jest.Mock).mockResolvedValue({ message: 'restored' })

    const result = await controller.restoreRole({ roleId: 1 } as any)

    expect(result.message).toBe('restored')
  })
  describe('RoleController (negative cases)', () => {
    it('should bubble up error when createRole fails', async () => {
      ;(service.createRole as jest.Mock).mockRejectedValue(new Error('bad data'))

      await expect(controller.createRole({ name: '', description: '', isActive: true } as any, 1)).rejects.toThrow(
        'bad data',
      )
    })

    it('should bubble up error when assignPermissionToRole fails', async () => {
      ;(service.assignPermissionToRole as jest.Mock).mockRejectedValue(new Error('invalid permissions'))

      await expect(
        controller.assignPermissionToRole({ roleId: 1 } as any, { permissionIds: [] } as any),
      ).rejects.toThrow('invalid permissions')
    })

    it('should bubble up error when getRole fails', async () => {
      ;(service.getRoleById as jest.Mock).mockRejectedValue(new Error('role not found'))

      await expect(controller.getRole({ roleId: 999 } as any)).rejects.toThrow('role not found')
    })

    it('should bubble up error when updateRole fails', async () => {
      ;(service.updateRole as jest.Mock).mockRejectedValue(new Error('cannot update'))

      await expect(controller.updateRole({ roleId: 123 } as any, { name: 'dup' } as any)).rejects.toThrow(
        'cannot update',
      )
    })

    it('should bubble up error when deleteRole fails', async () => {
      ;(service.softDeleteRole as jest.Mock).mockRejectedValue(new Error('cannot delete'))

      await expect(controller.deleteRole({ roleId: 123 } as any)).rejects.toThrow('cannot delete')
    })

    it('should bubble up error when restoreRole fails', async () => {
      ;(service.restoreRole as jest.Mock).mockRejectedValue(new Error('cannot restore'))

      await expect(controller.restoreRole({ roleId: 123 } as any)).rejects.toThrow('cannot restore')
    })
  })
})
