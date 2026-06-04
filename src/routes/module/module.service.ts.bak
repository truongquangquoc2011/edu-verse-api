import { Injectable } from '@nestjs/common'
import { ModuleRepository } from './module.repo'
import {
  CreateModuleResType,
  CreateModuleType,
  UpdateModuleType,
  ModuleResType,
  ListModulesResType,
  ListModuleStudyQueryType,
  ListModuleStudyResType,
  ListModuleQuizQueryType,
  ListModuleQuizResType,
} from './module.model'
import { PaginationQueryType } from 'src/shared/models/pagination.model'

@Injectable()
export class ModuleService {
  constructor(private readonly repo: ModuleRepository) {}
  /**
   * Creates a new module for a given course.
   * - Persists the module entity in the database.
   *
   * @param userId - ID of the user creating the module
   * @param courseId - ID of the course the module belongs to
   * @param payload - Data required to create the module
   * @returns The created module with its generated ID
   * @throws BadRequestException if validation fails
   */
  createModules(userId: number, courseId: number, payloads: CreateModuleType[]): Promise<CreateModuleResType[]> {
    return this.repo.createModules(userId, courseId, payloads)
  }
  /**
   * Updates an existing module.
   * - Ensures the user has permission to update the module.
   *
   * @param userId - ID of the user updating the module
   * @param moduleId - ID of the module to update
   * @param payload - Updated data for the module
   * @returns The updated module entity
   * @throws NotFoundException if the module does not exist
   * @throws ForbiddenException if the user is not allowed to update
   */
  updateModule(userId: number, moduleId: number, payload: UpdateModuleType): Promise<ModuleResType> {
    return this.repo.updateModule(userId, moduleId, payload)
  }

  /**
   * Soft deletes a module (marks it as deleted without removing from DB).
   *
   * @param userId - ID of the user deleting the module
   * @param moduleId - ID of the module to delete
   * @returns A success message indicating deletion
   * @throws NotFoundException if the module does not exist
   * @throws ForbiddenException if the user is not allowed to delete
   */
  deleteModule(userId: number, moduleId: number): Promise<{ message: string }> {
    return this.repo.softDeleteModule(userId, moduleId)
  }

  /**
   * Restores a previously soft-deleted module.
   *
   * @param userId - ID of the user restoring the module
   * @param moduleId - ID of the module to restore
   * @returns A success message indicating restoration
   * @throws NotFoundException if the module does not exist
   * @throws ForbiddenException if the user is not allowed to restore
   */
  restoreModule(userId: number, moduleId: number): Promise<{ message: string }> {
    return this.repo.restoreModule(userId, moduleId)
  }

  /**
   * Retrieves all modules belonging to a specific course.
   *
   * @param userId - ID of the user requesting the list
   * @param courseId - ID of the course whose modules are listed
   * @returns An object containing an array of modules
   * @throws NotFoundException if the course does not exist
   * @throws ForbiddenException if the user cannot access the course
   */
  async listModules(userId: number, courseId: number, query: PaginationQueryType): Promise<ListModulesResType> {
    return this.repo.listModules(userId, courseId, query)
  }

  /**
   * CLIENT: Retrieves modules for study view inside a course.
   *
   * - Requires the user to be active and enrolled in the course.
   * - Returns modules with progress info:
   *   - lessonCount
   *   - completedLessonCount
   *
   * @param userId - ID of the authenticated learner
   * @param courseId - ID of the course being studied
   * @param query - Pagination query (skip, take)
   * @returns A paginated list of modules for study with progress stats
   */
  async listModulesForStudy(
    userId: number,
    courseId: number,
    query: ListModuleStudyQueryType,
  ): Promise<ListModuleStudyResType> {
    return this.repo.listModulesForStudy(userId, courseId, query)
  }
  /**
   * CLIENT: Retrieves quizzes of a module for study view.
   *
   * - Requires the user to be active and enrolled in the course.
   * - Returns quizzes under the given module so learner can click and start.
   *
   * @param userId - ID of the authenticated learner
   * @param courseId - ID of the course being studied
   * @param moduleId - ID of the module
   * @param query - Pagination query (skip, take)
   */
  async listModuleQuizzesForStudy(
    userId: number,
    courseId: number,
    moduleId: number,
    query: ListModuleQuizQueryType,
  ): Promise<ListModuleQuizResType> {
    return this.repo.listQuizzesForModuleStudy(userId, courseId, moduleId, query)
  }
}
