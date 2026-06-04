import { JwtService } from '@nestjs/jwt'
import { UnauthorizedException } from '@nestjs/common'
import { Socket } from 'socket.io'
import { envConfig } from 'src/shared/config'
import { ConfigService } from '@nestjs/config'

export interface JwtPayload {
  userId: number
}

/**
 * Socket middleware to authenticate using JWT.
 * @param jwt - JwtService instance.
 * @param config - ConfigService for secret/scheme.
 * @returns Middleware function.
 */
export function socketAuth(jwt: JwtService, config: ConfigService) {
  return (socket: Socket, next: (err?: any) => void) => {
    try {
      // Extract token from handshake.auth.token or headers.authorization
      const rawToken = socket.handshake.auth?.token || socket.handshake.headers.authorization
      const token = (rawToken || '').replace(new RegExp(`^Bearer\\s+`, 'i'), '')
      if (!token) {
        throw new UnauthorizedException('Missing authentication token')
      }

      const payload = jwt.verify<JwtPayload>(token, {
        secret: envConfig.accessTokenSecret,
      })
      if (!payload.userId) {
        throw new UnauthorizedException('Invalid token payload: missing userId')
      }
      socket.data.userId = payload.userId
      next()
    } catch (error) {
      let message = 'Invalid access token'
      if (error.name === 'TokenExpiredError') {
        message = 'Access token expired'
      } else if (error.name === 'JsonWebTokenError') {
        message = 'Invalid token signature'
      }
      // Log error for debug
      console.error(`Socket auth error: ${error.message}`)
      next(new UnauthorizedException(message))
    }
  }
}
