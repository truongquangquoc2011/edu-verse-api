import { Injectable } from '@nestjs/common'
import { UserRepository } from './user.repo'
import { PublicProfileResType, TeacherListQueryType, TeacherListResType } from './user.model'
import { UserNotFoundException } from './user.error'

@Injectable()
export class UserService {
  constructor(private readonly userRepository: UserRepository) {}

  async getPublicProfile(userId: number): Promise<PublicProfileResType> {
    const profile = await this.userRepository.findPublicProfile(userId)
    if (!profile) throw UserNotFoundException
    return profile
  }

  /**
   * Retrieves a paginated list of teachers (role = Seller)
   * @param query - Pagination and optional search filter
   * @returns Paginated list of teachers
   */
  async listTeachers(query: TeacherListQueryType): Promise<TeacherListResType> {
    return await this.userRepository.listTeachers(query)
  }

  async ensureTeacher(userId: number) {
    return this.userRepository.ensureTeacher(userId)
  }
}
