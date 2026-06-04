import 'tsconfig-paths/register'
import { NestFactory } from '@nestjs/core'
import { ExpressAdapter } from '@nestjs/platform-express'
import { AppModule } from './app.module'
import { setupSwagger } from './shared/swagger/swagger'
import { HttpExceptionFilter } from './shared/filters/http-exception.filter'
import express from 'express'

const server = express()

async function bootstrap() {
  const app = await NestFactory.create(AppModule, new ExpressAdapter(server))

  app.useGlobalFilters(new HttpExceptionFilter())
  app.setGlobalPrefix('/api/v1', {
    exclude: ['/docs', '/docs-json'],
  })
  app.enableCors()
  setupSwagger(app)

  await app.init()
}

bootstrap()

export default server