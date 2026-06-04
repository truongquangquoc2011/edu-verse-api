import { Module } from '@nestjs/common';
import { ModuleService } from './module.service';
import { ModuleController } from './module.controller';
import { ModuleRepository } from './module.repo';
import { ModuleStudyController } from './module.study.controller';

@Module({
  controllers: [ModuleController,ModuleStudyController],
  providers: [ModuleService,ModuleRepository],
})
export class ModuleModule {}
