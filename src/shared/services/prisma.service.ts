import { Injectable, OnModuleInit } from '@nestjs/common'
import { PrismaClient } from '@prisma/client'

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  constructor() {
    super({
      log: ['info'], // Ghi log các truy vấn, thông tin, cảnh báo và lỗi
    })
  }

  // Khi module này bắt đầu chạy, nó sẽ kết nối đến cơ sở dữ liệu
  async onModuleInit() {
    await this.$connect()
  }
}
