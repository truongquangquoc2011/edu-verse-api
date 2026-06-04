// initialScript/seed-teacher.ts
import { Logger } from '@nestjs/common'
import { envConfig } from 'src/shared/config'
import { RoleName } from 'src/shared/constants/role.constant'
import { HashingService } from 'src/shared/services/hashing.service'
import { PrismaService } from 'src/shared/services/prisma.service'
import type { Teacher } from '@prisma/client' // để khai báo kiểu cho results

const predefinedTeachers = [
  {
    email: 'alice.teacher@example.com',
    fullname: 'Alice Teacher',
    phoneNumber: '0901234567',
    bio: 'Giảng viên Frontend với 5 năm kinh nghiệm.',
    specialization: 'Frontend (React, TypeScript)',
    experience: 'Từng làm tại ABC Corp, giảng dạy 20+ khóa',
  },
  {
    email: 'bob.teacher@example.com',
    fullname: 'Bob Mentor',
    phoneNumber: '0902345678',
    bio: 'Giảng viên Backend, yêu thích kiến trúc sạch.',
    specialization: 'Backend (NestJS, Prisma, PostgreSQL)',
    experience: '5+ năm xây dựng hệ thống LMS, eCommerce',
  },
]

/**
 * Tạo (hoặc xác nhận) Users + Teachers.
 * Lưu ý: Không nested create teacher trong user, vì User không có back-relation teacher.
 */
const createTeachers = async (prisma: PrismaService, hashingService: HashingService) => {
  // Giả định Teacher dùng role Seller (đổi sang role bạn muốn)
  const teacherRole = await prisma.role.findFirstOrThrow({
    where: { name: RoleName.Seller },
  })

  // Nếu muốn gán createdById/updateById = admin:
  const admin = await prisma.user.findUnique({ where: { email: envConfig.adminEmail } }).catch(() => null)

  // fallback password nếu không có testPassword trong config
  const rawPassword =
    (envConfig as any).testPassword || envConfig.adminPassword || 'Default@12345'
  const hashedPassword = await hashingService.hashPassword(rawPassword)

  const results: Teacher[] = []

  for (const t of predefinedTeachers) {
    // 1) User
    let user = await prisma.user.findUnique({ where: { email: t.email } })
    if (!user) {
      user = await prisma.user.create({
        data: {
          email: t.email,
          password: hashedPassword,
          fullname: t.fullname,
          phoneNumber: t.phoneNumber,
          roleId: teacherRole.id,
        },
      })
      Logger.log(`Created user for teacher: ${t.email}`)
    } else {
      // Có thể cập nhật nhẹ thông tin user nếu muốn
      await prisma.user.update({
        where: { id: user.id },
        data: {
          fullname: t.fullname,
          phoneNumber: t.phoneNumber,
          // roleId: teacherRole.id, // bật nếu bạn muốn ép role về Seller
        },
      })
    }

    // 2) Teacher (userId là @unique ⇒ dùng upsert theo userId)
    const teacher = await prisma.teacher.upsert({
      where: { userId: user.id },
      update: {
        bio: t.bio,
        specialization: t.specialization,
        experience: t.experience,
        updatedById: admin?.id ?? null,
      },
      create: {
        userId: user.id,
        bio: t.bio,
        specialization: t.specialization,
        experience: t.experience,
        createdById: admin?.id ?? null,
      },
    })

    Logger.log(`Upserted teacher for user: ${t.email} (teacherId=${teacher.id})`)
    results.push(teacher)
  }

  return results
}

const main = async () => {
  const prisma = new PrismaService()
  const hashingService = new HashingService()

  const teachers = await createTeachers(prisma, hashingService)
  return { teachers }
}

main()
  .then(({ teachers }) => {
    console.log(`Created/verified ${teachers.length} teacher(s).`)
  })
  .catch((error) => {
    console.error('Seeding Teachers failed:', error.message)
    process.exit(1)
  })
//npx ts-node --compiler-options '{"module":"CommonJS"}' initialScript/seed-teacher.ts