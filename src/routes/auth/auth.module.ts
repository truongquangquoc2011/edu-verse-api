import { Module } from '@nestjs/common'
import { AuthService } from './auth.service'
import { AuthController } from './auth.controller'
import { RolesService } from './role.service'
import { AuthRepository } from './auth.repo'
import { GoogleService } from './google.service'
import { FacebookService } from './facebook.service'
import { CloudinaryService} from '../../shared/services/cloudinary.service'

@Module({
  controllers: [AuthController],
  providers: [AuthService, RolesService, AuthRepository,GoogleService,FacebookService,CloudinaryService],
})
export class AuthModule {}
