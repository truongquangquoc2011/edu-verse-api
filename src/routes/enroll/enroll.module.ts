import { Module } from '@nestjs/common';
import { EnrollService } from './enroll.service';
import { EnrollController } from './enroll.controller';
import { EnrollRepository } from './enroll.repo';

@Module({
  controllers: [EnrollController],
  providers: [EnrollService, EnrollRepository],
})
export class EnrollModule {}
