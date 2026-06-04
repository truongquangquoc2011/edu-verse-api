import { Module } from '@nestjs/common';
import { OrderService } from './order.service';
import { OrderController } from './order.controller';
import { OrderRepository } from './order.repo';
import { MomoService } from 'src/shared/services/momo.service';

@Module({
  controllers: [OrderController],
  providers: [OrderService,OrderRepository,MomoService],
})
export class OrderModule {}
