import { Controller, Post, Body, Get, Query, Param, Delete, ParseIntPipe, HttpStatus, HttpCode } from '@nestjs/common'
import { ZodSerializerDto } from 'nestjs-zod'
import { Auth } from 'src/shared/decorator/auth.decorator'
import { AuthTypes } from 'src/shared/constants/auth.constant'
import { ActiveUser } from 'src/shared/decorator/active-user.decorator'
import { parseSkipTake } from 'src/shared/utils/pagination.util'
import { FeedbackService } from './feedback.service'
import { CreateFeedbackDTO, FeedbackResDTO, GetAdminFeedbackQueryDTO, GetFeedbacksResDTO } from './dto/feedback.dto'
import { ApiTags, ApiOperation, ApiBody, ApiParam, ApiQuery } from '@nestjs/swagger'
import { HttpStatusCode } from 'src/shared/swagger/swagger.interface'
import { ApiStandardResponses } from 'src/shared/decorator/api-standard-response'
import { RESPONSE_MESSAGES } from 'src/shared/constants/swagger.constant'
import { FeedbackStatus, FeedbackType } from 'src/shared/constants/feedback.constant'

@ApiTags('Feedback')
@Controller('feedback')
export class FeedbackController {
  constructor(private readonly feedbackService: FeedbackService) {}

  @Post()
  @Auth([AuthTypes.BEARER])
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create feedback',
    description: 'Allows authenticated users to create feedback for a course or other entity.',
  })
  @ApiBody({ type: CreateFeedbackDTO })
  @ZodSerializerDto(FeedbackResDTO)
  @ApiStandardResponses(HttpStatusCode.CREATED, RESPONSE_MESSAGES.FEEDBACK.CREATED, FeedbackResDTO)
  async create(@Body() body: CreateFeedbackDTO, @ActiveUser('userId') userId: number) {
    return this.feedbackService.createFeedback(body, userId)
  }

  @Get(':id')
  @Auth([AuthTypes.BEARER])
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get feedback detail',
    description: 'Retrieve feedback details by ID.',
  })
  @ApiParam({ name: 'id', type: Number, description: 'Feedback ID' })
  @ZodSerializerDto(FeedbackResDTO)
  @ApiStandardResponses(HttpStatusCode.OK, RESPONSE_MESSAGES.FEEDBACK.DETAIL, FeedbackResDTO)
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.feedbackService.getFeedbackDetail(id)
  }

  @Delete(':id')
  @Auth([AuthTypes.BEARER])
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Delete feedback',
    description: 'Delete a feedback by ID (soft delete if supported).',
  })
  @ApiParam({ name: 'id', type: Number, description: 'Feedback ID' })
  @ApiStandardResponses(HttpStatusCode.OK, RESPONSE_MESSAGES.FEEDBACK.DELETED)
  async delete(@Param('id', ParseIntPipe) id: number, @ActiveUser('userId') userId: number) {
    return this.feedbackService.deleteFeedback(id, userId)
  }

  @Get()
  @Auth([AuthTypes.BEARER])
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'List feedbacks (admin)',
    description: 'Retrieve a paginated list of feedbacks with optional filters for admin users.',
  })
  @ApiQuery({ name: 'skip', required: false, type: Number, description: 'Records to skip' })
  @ApiQuery({ name: 'take', required: false, type: Number, description: 'Records to take' })
  @ApiQuery({ name: 'status', required: false, enum: FeedbackStatus, description: 'Filter by status (if applicable)' })
  @ApiQuery({ name: 'feedbackType', required: false, enum: FeedbackType, description: 'Filter by feedbackType' })
  @ZodSerializerDto(GetFeedbacksResDTO)
  @ApiStandardResponses(HttpStatusCode.OK, RESPONSE_MESSAGES.FEEDBACK.LIST, GetFeedbacksResDTO)
  async adminList(@Query() query: GetAdminFeedbackQueryDTO) {
    const { skip, take } = parseSkipTake(query.skip?.toString(), query.take?.toString())
    return this.feedbackService.getAdminFeedbacks(query, skip, take)
  }
}
