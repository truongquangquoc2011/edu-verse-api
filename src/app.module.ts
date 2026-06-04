import { Module } from '@nestjs/common'
import { SharedModule } from './shared/shared.module'
import { AuthModule } from './routes/auth/auth.module'
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core'
import CustomZodValidationPipe from './shared/pipes/custom-zod-validation.pipe'
import { ZodSerializerInterceptor } from 'nestjs-zod'
import { HttpExceptionFilter } from './shared/filters/http-exception.filter'
import { CourseModule } from './routes/course/course.module'
import { RoleModule } from './routes/role/role.module'
import { PermissionModule } from './routes/permission/permission.module'
import { EnrollModule } from './routes/enroll/enroll.module'
import { FollowModule } from './routes/follow/follow.module'
import { PermissionGuard } from './shared/guards/permission.guard'
import { AuthenticationGuard } from './shared/guards/authentication.guard'
import { AccessTokenGuard } from './shared/guards/access-token.guard'
import { ApiKeyGuard } from './shared/guards/api-key.guard'
import { SensitiveFieldInterceptor } from './interceptors/sensitive-field.interceptor'
import { UserModule } from './routes/user/user.module'
import { ConfigModule } from '@nestjs/config'
import { ModuleModule } from './routes/module/module.module'
import { LessonModule } from './routes/lesson/lesson.module'
import { CouponModule } from './routes/coupon/coupon.module'
import { CategoryModule } from './routes/category/category.module'
import { QuizzModule } from './routes/quizz/quizz.module'
import { HashtagModule } from './routes/hashtag/hashtag.module'
import { FeedbackModule } from './routes/feedback/feedback.module'
import { ConversationModule } from './routes/conversation/conversation.module'
import { ThrottlerModule } from '@nestjs/throttler'
import { CartModule } from './routes/cart/cart.module'
import { WishlistModule } from './routes/wishlist/wishlist.module'
import { OrderModule } from './routes/order/order.module'
import { SearchModule } from './routes/search/search.module'
import { QaModule } from './routes/qa/qa.module'
import { ChatbotModule } from './routes/chatbot/chatbot.module'

const TIME_THROTTLER = 60
const LIMIT_THROTTLER = 20

@Module({
  imports: [
    SharedModule,
    AuthModule,
    CourseModule,
    RoleModule,
    PermissionModule,
    EnrollModule,
    FollowModule,
    UserModule,
    ModuleModule,
    LessonModule,
    ConfigModule.forRoot({
      isGlobal: true,
      ignoreEnvFile: true,
    }),
    CouponModule,
    CategoryModule,
    QuizzModule,
    HashtagModule,
    FeedbackModule,
    ConversationModule,
    ThrottlerModule.forRoot({
      throttlers: [
        {
          ttl: TIME_THROTTLER,
          limit: LIMIT_THROTTLER,
        },
      ],
    }),
    CartModule,
    WishlistModule,
    OrderModule,
    SearchModule,
    QaModule,
    ChatbotModule,
  ],
  controllers: [],
  providers: [
    AccessTokenGuard,
    ApiKeyGuard,
    {
      provide: APP_INTERCEPTOR,
      useClass: SensitiveFieldInterceptor,
    },
    {
      provide: APP_PIPE,
      useClass: CustomZodValidationPipe,
    },
    {
      provide: APP_GUARD,
      useClass: AuthenticationGuard,
    },
    // { provide: APP_GUARD, useClass: PermissionGuard },
    { provide: APP_INTERCEPTOR, useClass: ZodSerializerInterceptor },
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
  ],
})
export class AppModule {}
