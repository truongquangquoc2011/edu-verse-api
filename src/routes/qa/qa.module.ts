import { Module } from '@nestjs/common'
import { QaRepository } from './qa.repo'
import { ClientQaService } from './service/client-qa.service'
import { SellerQaService } from './service/seller-qa.service'
import { ClientQaController } from './controller/client-qa.controller'
import { SellerQaController } from './controller/seller-qa.controller'

@Module({
  controllers: [ClientQaController, SellerQaController],
  providers: [QaRepository, ClientQaService, SellerQaService],
})
export class QaModule {}
