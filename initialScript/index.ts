import { Logger } from '@nestjs/common'
import { envConfig } from 'src/shared/config'
import { RoleName } from 'src/shared/constants/role.constant'
import { HashingService } from 'src/shared/services/hashing.service'
import { PrismaService } from 'src/shared/services/prisma.service'

const predefinedRoles = [
  { name: RoleName.Admin, description: 'Administrator role with full access' },
  { name: RoleName.Seller, description: 'Seller role with product management capabilities' },
  { name: RoleName.Client, description: 'Client role with purchase permissions' },
]

const createRolesIfNotExists = async (prisma: PrismaService) => {
  const roleCount = await prisma.role.count()

  if (roleCount > 0) {
    Logger.warn('Roles already exist. Skipping role creation.')
    return 0
  }

  const { count } = await prisma.role.createMany({ data: predefinedRoles })
  return count
}

const createAdminUser = async (prisma: PrismaService, hashingService: HashingService) => {
  const existingAdmin = await prisma.user.findUnique({
    where: { email: envConfig.adminEmail },
  })

  if (existingAdmin) {
    Logger.error(`Admin user with email ${envConfig.adminEmail} already exists.`)
    return null
  }

  const adminRole = await prisma.role.findFirstOrThrow({
    where: { name: RoleName.Admin },
  })

  const hashedPassword = await hashingService.hashPassword(envConfig.adminPassword)

  const adminUser = await prisma.user.create({
    data: {
      email: envConfig.adminEmail,
      password: hashedPassword,
      fullname: envConfig.adminName,
      phoneNumber: envConfig.adminPhone,
      roleId: adminRole.id,
    },
  })

  return adminUser
}

const main = async () => {
  const prisma = new PrismaService()
  const hashingService = new HashingService()

  const createdRoleCount = await createRolesIfNotExists(prisma)
  const adminUser = await createAdminUser(prisma, hashingService)

  return { createdRoleCount, adminUser }
}

main()
  .then(({ createdRoleCount, adminUser }) => {
    console.log(`Created ${createdRoleCount} role(s)`)
    console.log(`${adminUser ? `Admin user created: ${adminUser.email}` : 'No admin user created'}`)
  })
  .catch((error) => {
    console.error('Seeding failed:', error.message)
    process.exit(1)
  })
