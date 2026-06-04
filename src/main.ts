import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { envConfig } from './shared/config'
import { setupSwagger } from './shared/swagger/swagger'
import { HttpExceptionFilter } from './shared/filters/http-exception.filter'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  app.useGlobalFilters(new HttpExceptionFilter())
  app.setGlobalPrefix('/api/v1', {
    exclude: ['/docs', '/docs-json'],
  })
  app.enableCors()
  setupSwagger(app)

  await app.listen(envConfig.port ?? 3000)
}
bootstrap()
  