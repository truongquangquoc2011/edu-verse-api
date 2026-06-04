import { Injectable, UnauthorizedException } from '@nestjs/common'
import { JsonWebTokenError, JwtService, TokenExpiredError } from '@nestjs/jwt'
import { AccessTokenPayload, RefreshTokenPayload } from '../@types/jwt.type'
import { AccessTokenDto, RefreshTokenDto } from '../dto/jwt.dto'
import { ALGORITHMS } from '../constants/auth.constant'
import { envConfig } from '../config'
import { v4 as uuidv4 } from 'uuid'

@Injectable()
export class TokenService {
  constructor(private readonly jwtService: JwtService) {}

  signAccessToken(payload: AccessTokenDto): string {
    return this.jwtService.sign(
      { ...payload, uuid: uuidv4() },
      {
        expiresIn: envConfig.accessTokenExpiration,
        secret: envConfig.accessTokenSecret,
        algorithm: ALGORITHMS,
      },
    )
  }

  signRefreshToken(payload: RefreshTokenDto): string {
    return this.jwtService.sign(
      { ...payload, uuid: uuidv4() },
      {
        expiresIn: envConfig.refreshTokenExpiration,
        secret: envConfig.refreshTokenSecret,
        algorithm: ALGORITHMS,
      },
    )
  }
  async verifyAccessToken(token: string): Promise<AccessTokenPayload> {
    try {
      const payload = await this.jwtService.verifyAsync<AccessTokenPayload>(token, {
        secret: envConfig.accessTokenSecret,
        algorithms: [ALGORITHMS],
      })
      return payload
    } catch (err) {
      if (err instanceof TokenExpiredError) {
        throw new UnauthorizedException('Token has expired')
      }
      if (err instanceof JsonWebTokenError) {
        throw new UnauthorizedException('Invalid token')
      }
      throw new UnauthorizedException('Token verification failed')
    }
  }

  async verifyRefreshToken(token: string): Promise<RefreshTokenPayload> {
    try {
      const payload = await this.jwtService.verifyAsync<RefreshTokenPayload>(token, {
        secret: envConfig.refreshTokenSecret,
        algorithms: [ALGORITHMS],
      })
      return payload
    } catch (err) {
      if (err instanceof TokenExpiredError) {
        throw new UnauthorizedException('Token has expired')
      }
      if (err instanceof JsonWebTokenError) {
        throw new UnauthorizedException('Invalid token')
      }
      throw new UnauthorizedException('Token verification failed')
    }
  }
}
