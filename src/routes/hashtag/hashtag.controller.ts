import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common'
import { HashtagService } from './hashtag.service'
import { Auth } from 'src/shared/decorator/auth.decorator'
import { AuthTypes } from 'src/shared/constants/auth.constant'
import { ZodSerializerDto } from 'nestjs-zod'
import { CreateHashtagDTO, GetHashtagsResDTO, HashtagResDTO, UpdateHashtagDTO } from './dto/hashtag.dto'
import { ActiveUser } from 'src/shared/decorator/active-user.decorator'
import { parseSkipTake } from 'src/shared/utils/pagination.util'
import { ApiBody, ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger'
import { ApiStandardResponses } from 'src/shared/decorator/api-standard-response'
import { HttpStatusCode } from 'src/shared/swagger/swagger.interface'
import { RESPONSE_MESSAGES } from 'src/shared/constants/swagger.constant'

@ApiTags('Hashtag')
@Controller('hashtag')
export class HashtagController {
  constructor(private readonly hashtagService: HashtagService) {}

  @Post()
  @Auth([AuthTypes.BEARER])
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create hashtag',
    description: 'Create a new hashtag. Requires authentication.',
  })
  @ApiBody({ type: CreateHashtagDTO })
  @ZodSerializerDto(HashtagResDTO)
  @ApiStandardResponses(HttpStatusCode.CREATED, RESPONSE_MESSAGES.HASHTAG.CREATED, HashtagResDTO)
  create(@Body() body: CreateHashtagDTO, @ActiveUser('userId') userId: number) {
    return this.hashtagService.createHashtag(body, userId)
  }

  @Patch(':id')
  @Auth([AuthTypes.BEARER])
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update hashtag',
    description: 'Update an existing hashtag by ID. At least one field must be provided in the body.',
  })
  @ApiParam({ name: 'id', type: Number, description: 'Hashtag ID' })
  @ApiBody({ type: UpdateHashtagDTO })
  @ZodSerializerDto(HashtagResDTO)
  @ApiStandardResponses(HttpStatusCode.OK, RESPONSE_MESSAGES.HASHTAG.UPDATED, HashtagResDTO)
  update(@Param('id', ParseIntPipe) id: number, @Body() body: UpdateHashtagDTO, @ActiveUser('userId') userId: number) {
    return this.hashtagService.updateHashtag(id, body, userId)
  }

  @Delete(':id')
  @Auth([AuthTypes.BEARER])
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Delete hashtag',
    description: 'Soft delete a hashtag by ID (marks as deleted, not hard delete).',
  })
  @ApiParam({ name: 'id', type: Number, description: 'Hashtag ID' })
  @ApiStandardResponses(HttpStatusCode.OK, RESPONSE_MESSAGES.HASHTAG.DELETED)
  delete(@Param('id', ParseIntPipe) id: number) {
    return this.hashtagService.deleteHashtag(id)
  }

  @Get(':id')
  @Auth([AuthTypes.BEARER])
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get hashtag detail',
    description: 'Fetch hashtag details by ID.',
  })
  @ApiParam({ name: 'id', type: Number, description: 'Hashtag ID' })
  @ZodSerializerDto(HashtagResDTO)
  @ApiStandardResponses(HttpStatusCode.OK, RESPONSE_MESSAGES.HASHTAG.DETAIL, HashtagResDTO)
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.hashtagService.findOne(id)
  }

  @Get()
  @Auth([AuthTypes.BEARER])
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'List hashtags (paginated)',
    description: 'Fetch paginated list of hashtags with optional skip & take query parameters.',
  })
  @ApiQuery({ name: 'skip', required: false, type: Number, description: 'Number of records to skip' })
  @ApiQuery({ name: 'take', required: false, type: Number, description: 'Number of records to take' })
  @ZodSerializerDto(GetHashtagsResDTO)
  @ApiStandardResponses(HttpStatusCode.OK, RESPONSE_MESSAGES.HASHTAG.LIST, GetHashtagsResDTO)
  list(@Query('skip') skip?: string, @Query('take') take?: string) {
    const { skip: s, take: t } = parseSkipTake(skip, take)
    return this.hashtagService.listHashtags(s, t)
  }
}
