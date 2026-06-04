import { Module } from '@nestjs/common';
import { PermissionService } from './permission.service';
import { PermissionController } from './permission.controller';
import { PermissionRepository } from './permission.repo';
import { RoleModule } from '../role/role.module';

@Module({
  imports: [RoleModule],
  controllers: [PermissionController],
  providers: [PermissionService, PermissionRepository],
})
export class PermissionModule {}
