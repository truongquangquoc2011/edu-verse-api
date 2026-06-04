import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common'
import { EnrollService } from './enroll.service'
import { ActiveUser } from 'src/shared/decorator/active-user.decorator'
import { ZodSerializerDto } from 'nestjs-zod'
import { Auth } from 'src/shared/decorator/auth.decorator'
import { AuthTypes } from 'src/shared/constants/auth.constant'
import { CreateEnrollmentBodyDTO, CreateEnrollmentResDTO } from './dto/enroll.dto'
import { ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger'
import { ApiStandardResponses } from 'src/shared/decorator/api-standard-response'
import { HttpStatusCode } from 'src/shared/swagger/swagger.interface'
import { RESPONSE_MESSAGES } from 'src/shared/constants/swagger.constant'

@ApiTags('Enrollment')
@Controller('enroll')
export class EnrollController {
  constructor(private readonly enrollService: EnrollService) {}

  /**
   * API endpoint to create (or request) a course enrollment.
   * @route POST /enroll/request
   * @auth Bearer
   * @param userId - ID of the authenticated user requesting the enrollment (injected via `@ActiveUser('userId')`)
   * @param body - Enrollment payload validated by `CreateEnrollmentBodyDTO` (includes `courseId` and optional `source`)
   * @returns The created enrollment data, typed by `CreateEnrollmentResDTO`
   */
  @Auth([AuthTypes.BEARER])
  @Post('request')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Request enrollment',
    description: 'Create (or request) a course enrollment for the authenticated user. Requires a valid Bearer token.',
  })
  @ApiBody({ type: CreateEnrollmentBodyDTO })
  @ZodSerializerDto(CreateEnrollmentResDTO)
  @ApiStandardResponses(HttpStatusCode.OK, RESPONSE_MESSAGES.ENROLL.REQUESTED, CreateEnrollmentResDTO)
  async request(@ActiveUser('userId') userId: number, @Body() body: CreateEnrollmentBodyDTO) {
    return await this.enrollService.createAndNotify(userId, body.courseId, body.source)
  }
}
