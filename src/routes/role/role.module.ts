import { Module } from '@nestjs/common';
import { RoleService } from './role.service';
import { RoleController } from './role.controller';
import { RoleRepository } from './role.repo';
import { CacheModule } from '@nestjs/cache-manager';

@Module({
  imports: [
    CacheModule.register({
      isGlobal: true,      
      ttl: 300,            
      max: 100,            
    }),
  ],
  controllers: [RoleController],
  providers: [RoleService, RoleRepository],
  exports: [RoleService]
})
export class RoleModule {}  
