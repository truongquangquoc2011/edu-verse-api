import 'tsconfig-paths/register'
import { NestFactory } from '@nestjs/core'
import { AppModule } from 'src/app.module'
import { DiscoveryService, MetadataScanner, DiscoveryModule } from '@nestjs/core'
import { PrismaService } from 'src/shared/services/prisma.service'
import { Module } from '@nestjs/common'
import path from 'path'

@Module({
  imports: [AppModule, DiscoveryModule],
  providers: [PrismaService],
})
class ScriptModule {}

enum HTTPMethod {
  GET = 'GET',
  POST = 'POST',
  PUT = 'PUT',
  PATCH = 'PATCH',
  DELETE = 'DELETE',
  OPTIONS = 'OPTIONS',
  HEAD = 'HEAD',
}

enum RoleName {
  Admin = 'ADMIN',
  Seller = 'SELLER',
  Client = 'CLIENT',
}

interface Permission {
  id?: number
  name: string
  method: HTTPMethod
  path: string
  description: string
  deletedAt?: Date | null
}

const CONFIG = {
  apiPrefix: process.env.APP_API_PREFIX || '/api/v1',
  cacheFile: path.join(__dirname, 'permissions-cache.json'),
  batchSize: 50,
  clientPathPatterns: [
    '/course',
    '/category',
    '/lesson',
    '/profile',
    '/teachers/:id/followers',
    '/teachers/:id/following',
  ],
  sellerPathPatterns: ['/course', '/module', '/lesson', '/enroll', '/teachers'],
  sellerMethods: [HTTPMethod.POST, HTTPMethod.PUT, HTTPMethod.PATCH, HTTPMethod.DELETE],
}

const PERMISSION_TEMPLATES = new Map<HTTPMethod, (resource: string, isDetail: boolean) => string>([
  [HTTPMethod.GET, (resource, isDetail) => (isDetail ? `View ${resource} Detail` : `View ${resource} List`)],
  [HTTPMethod.POST, (resource) => `Create ${resource}`],
  [HTTPMethod.PUT, (resource) => `Update ${resource}`],
  [HTTPMethod.PATCH, (resource) => `Update ${resource}`],
  [HTTPMethod.DELETE, (resource) => `Delete ${resource}`],
])

/**
 * Utility to capitalize the first string.
 * @param str - String to capitalize.
 * @returns The capitalized string.
 */
function capitalize(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

/**
 * Get permission name based on method and path.
 * @param method - HTTP method.
 * @param fullPath - Full route path.
 * @returns Permission name.
 */
function getPermissionName(method: HTTPMethod, fullPath: string): string {
  const parts = fullPath.split('/').filter(Boolean)
  const resource = capitalize(parts.filter((p) => !p.startsWith(':')).pop() || '')
  const isDetail = parts.some((p) => p.startsWith(':'))

  const template = PERMISSION_TEMPLATES.get(method) || ((r: string) => `${method} ${r}`)
  return template(resource, isDetail)
}

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(ScriptModule, { logger: false })
  const prisma = app.get(PrismaService)
  const discovery = app.get(DiscoveryService)
  const metadataScanner = app.get(MetadataScanner)

  // Quét toàn bộ controller
  const controllers = discovery.getControllers()
  const apiPrefix = '/api/v1'
  const permissions: {
    name: string
    method: HTTPMethod
    path: string
    description: string
  }[] = []

  for (const wrapper of controllers) {
    const { instance, metatype } = wrapper
    if (!instance || !metatype) continue

    const basePath: string = Reflect.getMetadata('path', metatype) || ''

    metadataScanner.scanFromPrototype(instance, Object.getPrototypeOf(instance), (methodName) => {
      const methodRef = instance[methodName]
      const routePath: string = Reflect.getMetadata('path', methodRef)
      const requestMethod: number = Reflect.getMetadata('method', methodRef)
      if (routePath && requestMethod !== undefined) {
        const methodStr = Object.values(HTTPMethod)[requestMethod] as HTTPMethod
        const fullPath = `${apiPrefix}/${[basePath, routePath].filter(Boolean).join('/')}`.replace(/\/+/g, '/')

        permissions.push({
          name: getPermissionName(methodStr, fullPath),
          method: methodStr as HTTPMethod,
          path: fullPath,
          description: `${methodStr} ${fullPath}`,
        })
      }
    })
  }

  console.log(`Quét được ${permissions.length} permissions từ routes`)

  // Permissions trong DB
  const permissionsInDb = await prisma.permission.findMany({ where: { deletedAt: null } })

  const permissionMap = new Set(permissionsInDb.map((p) => `${p.method}-${p.path}`))
  const routeMap = new Set(permissions.map((r) => `${r.method}-${r.path}`))

  const toDelete = permissionsInDb.filter((p) => !routeMap.has(`${p.method}-${p.path}`))
  const toAdd = permissions.filter((r) => !permissionMap.has(`${r.method}-${r.path}`))
  const toUpdate = permissions.filter((r) =>
    permissionsInDb.some(
      (p) => p.method === r.method && p.path === r.path && (p.name !== r.name || p.description !== r.description),
    ),
  )

  console.log(`Xoá ${toDelete.length} permissions`)
  console.log(`Thêm ${toAdd.length} permissions`)
  console.log(`Update ${toUpdate.length} permissions`)

  await prisma.$transaction([
    ...(toDelete.length ? [prisma.permission.deleteMany({ where: { id: { in: toDelete.map((p) => p.id) } } })] : []),
    ...(toUpdate.length
      ? toUpdate.map((r) =>
          prisma.permission.updateMany({
            where: { method: r.method, path: r.path },
            data: { name: r.name, description: r.description },
          }),
        )
      : []),
    ...(toAdd.length ? [prisma.permission.createMany({ data: toAdd, skipDuplicates: true })] : []),
  ])

  // Gán role
  const allPermissions = await prisma.permission.findMany({ where: { deletedAt: null } })
  const adminRole = await prisma.role.findFirstOrThrow({ where: { name: RoleName.Admin } })
  const sellerRole = await prisma.role.findFirstOrThrow({ where: { name: RoleName.Seller } })
  const clientRole = await prisma.role.findFirstOrThrow({ where: { name: RoleName.Client } })

  const clientPermissions = allPermissions.filter(
    (p) =>
      // READ (GET)
      (p.method === 'GET' &&
        (/(course|category|lesson|hashtag)/.test(p.path) ||
          /teachers\/.*\/(followers|following)/.test(p.path) ||
          /users\/teachers/.test(p.path) ||
          /profile/.test(p.path) ||
          /wishlist/.test(p.path) ||
          /cart/.test(p.path) ||
          /conversations/.test(p.path) ||
          /qa\/client/.test(p.path))) ||
      // WRITE for client features
      (['POST', 'PATCH', 'PUT', 'DELETE'].includes(p.method) &&
        (/cart/.test(p.path) ||
          /wishlist/.test(p.path) ||
          /orders\/(buy-now|cart-checkout)/.test(p.path) ||
          /enroll\/request/.test(p.path) ||
          /conversations/.test(p.path) ||
          /qa\/client/.test(p.path) ||
          /teachers\/.*\/(follow|unfollow)/.test(p.path) ||
          /auth\/(profile|avatar|logout)/.test(p.path))),
  )

  const sellerPermissions = allPermissions.filter(
    (p) =>
      // SELLER WRITE
      (['POST', 'PUT', 'PATCH', 'DELETE'].includes(p.method) &&
        (/(course|module|lesson|enroll|teachers)/.test(p.path) ||
          /quizzes/.test(p.path) ||
          /coupon/.test(p.path) ||
          /qa\/seller/.test(p.path) ||
          /users\/.*\/ensure-teacher/.test(p.path))) ||
      // SELLER READ (builder + management)
      (p.method === 'GET' &&
        (/(course|module|lesson)/.test(p.path) ||
          /builder/.test(p.path) ||
          /quizzes/.test(p.path) ||
          /qa\/seller/.test(p.path) ||
          /coupon/.test(p.path))),
  )

  const sellerPlusClient = [...new Set([...sellerPermissions.map((p) => p.id), ...clientPermissions.map((p) => p.id)])]

  await prisma.role.update({
    where: { id: adminRole.id },
    data: { permissions: { set: allPermissions.map((p) => ({ id: p.id })) } },
  })

  await prisma.role.update({
    where: { id: sellerRole.id },
    data: { permissions: { set: sellerPlusClient.map((id) => ({ id })) } },
  })

  await prisma.role.update({
    where: { id: clientRole.id },
    data: { permissions: { set: clientPermissions.map((p) => ({ id: p.id })) } },
  })

  console.log(`Admin được gán ${allPermissions.length} quyền`)
  console.log(`Seller được gán ${sellerPlusClient.length} quyền (bao gồm ${clientPermissions.length} từ client)`)
  console.log(`Client được gán ${clientPermissions.length} quyền`)

  await app.close()
  process.exit(0)
}

bootstrap()
