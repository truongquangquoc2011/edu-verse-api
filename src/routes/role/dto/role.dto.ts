import { createZodDto } from "nestjs-zod";
import { AssignPermissionsToRoleSchema, AssignPermissionToRoleResSchema, CreateRoleBodySchema, CreateRoleResSchema, RoleIdParamSchema, UserIdParamSchema, UserWithRolesResSchema } from "../role.model";

export class CreateRoleResDTO extends createZodDto(CreateRoleResSchema) {}

export class CreateRoleBodyDTO extends createZodDto(CreateRoleBodySchema) {}

export class AssignPermissionToRoleResDTO extends createZodDto(AssignPermissionToRoleResSchema) {}

export class RoleIdParamDTO extends createZodDto(RoleIdParamSchema){}

export class AssignPermissionToRoleDTO extends createZodDto(AssignPermissionsToRoleSchema) {}

export class UserIdParamDTO extends createZodDto(UserIdParamSchema) {}

export class AssignRolesToUserResDTO extends createZodDto(UserWithRolesResSchema) {}

export const UpdateRoleBodySchema = CreateRoleBodySchema.partial();

export class UpdateRoleBodyDTO extends createZodDto(UpdateRoleBodySchema) {}
