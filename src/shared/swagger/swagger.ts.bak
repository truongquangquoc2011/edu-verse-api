import { INestApplication } from '@nestjs/common'
import { SwaggerModule } from '@nestjs/swagger'
import expressBasicAuth from 'express-basic-auth'
import { ConfigGroups } from '../config'
import { patchNestJsSwagger } from 'nestjs-zod'
import { ConfigService } from '@nestjs/config'
import { SwaggerConfigService } from 'src/config/swagger.config'

export function setupSwagger(app: INestApplication) {
  const { username, password } = ConfigGroups.swagger
  app.use(
    ['/docs', '/docs-json'],
    expressBasicAuth({
      challenge: true,
      users: { [username]: password },
    }),
  )
  patchNestJsSwagger()
  const configService = app.get(ConfigService)
  const swaggerConfig = new SwaggerConfigService(configService).build()
  const document = SwaggerModule.createDocument(app, swaggerConfig)

  SwaggerModule.setup('docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  })
}
