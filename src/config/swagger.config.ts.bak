import { DocumentBuilder, OpenAPIObject } from '@nestjs/swagger'
import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { envConfig } from 'src/shared/config'

export enum Environment {
  Development = 'development',
  Production = 'production',
  Test = 'test',
  Provision = 'provision',
}

@Injectable()
export class SwaggerConfigService {
  constructor(private readonly config: ConfigService) {}

  build(): Omit<OpenAPIObject, 'paths'> {
    const authOptions = {
      type: 'http' as const,
      scheme: 'bearer' as const,
      bearerFormat: 'JWT',
    }

    const apiKeyOptions = {
      type: 'apiKey' as const,
      in: 'header' as const,
      name: 'X-Api-Key',
      description: 'Enter your API key to access this endpoint',
    }

    const isProd = this.config.get('NODE_ENV_PROD') === Environment.Production

    const builder = new DocumentBuilder()
      .setTitle(this.config.get<string>('APP_TITLE') || 'EduVerse')
      .setDescription(this.config.get<string>('APP_DESCRIPTION') || 'An advanced elearning platform backend')
      .setVersion(this.config.get<string>('APP_VERSION') || '1.0')
      .addBearerAuth(authOptions, 'JWT-Auth')
      .addApiKey(apiKeyOptions, 'Api-Key-Auth')

    if (!isProd) {
      builder.addServer(this.config.get<string>('START_URL') || envConfig.startUrl, Environment.Development)
    }

    builder.addServer(
      this.config.get<string>('SWAGGER_SERVER_PROD') || envConfig.swaggerServerProd,
      Environment.Production,
    )

    return builder.build()
  }
}
