import { HttpException, Injectable } from '@nestjs/common'
import { CreateHashtagBodyType, HashtagResponseType, UpdateHashtagBodyType } from './hashtag.model'
import {
  AtLeastOneFieldMustBeProvidedHashtagException,
  HashtagAlreadyExistsException,
  InternalCreateHashtagErrorException,
  InternalDeleteHashtagErrorException,
  InternalUpdateHashtagErrorException,
} from './hashtag.error'
import { HashtagRepository } from './hashtag.repo'

@Injectable()
export class HashtagService {
  constructor(private readonly hashtagRepository: HashtagRepository) {}

  async createHashtag(data: CreateHashtagBodyType, userId: number): Promise<HashtagResponseType> {
    try {
      const normalizedName = data.name.toLowerCase().trim()
      const existing = await this.hashtagRepository.findByNormalizedName(normalizedName)
      if (existing) throw HashtagAlreadyExistsException
      return this.hashtagRepository.create(data, userId)
    } catch (error) {
      if (error instanceof HttpException) throw error
      throw InternalCreateHashtagErrorException
    }
  }

  async updateHashtag(id: number, data: UpdateHashtagBodyType, userId: number) {
    if (Object.keys(data).length === 0) throw AtLeastOneFieldMustBeProvidedHashtagException
    try {
      if (data.name) {
        const existing = await this.hashtagRepository.findByNormalizedName(data.name.toLowerCase().trim())
        if (existing) throw HashtagAlreadyExistsException
      }
      return this.hashtagRepository.update(id, data, userId)
    } catch (error) {
      if (error instanceof HttpException) throw error
      throw InternalUpdateHashtagErrorException
    }
  }

  async deleteHashtag(id: number) {
    try {
      await this.hashtagRepository.findById(id)
      await this.hashtagRepository.softDelete(id)
      return { message: `Hashtag ${id} deleted successfully` }
    } catch (error) {
      if (error instanceof HttpException) throw error
      throw InternalDeleteHashtagErrorException
    }
  }

  async findOne(id: number) {
    return this.hashtagRepository.findById(id)
  }

  async listHashtags(skip: number, take: number) {
    return this.hashtagRepository.listHashtags(skip, take)
  }
}
