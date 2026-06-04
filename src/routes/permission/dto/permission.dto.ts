import { createZodDto } from "nestjs-zod";
import { AssignRoleToPermissionResSchema, AssignRoleToPermissionSchema, CreatePermissionBodySchema, CreatePermissionResSchema, GetPermissionDetailSchema, GetPermissionQuerySchema, getPermissionResSchema, GetPermissionsResSchema, UpdatePermissionBodySchema, UpdatePermissionResSchema } from "../permission.model";
import { PermissionIdParamSchema } from "src/shared/models/shared-permission.model";

export class CreatePermisionResDTO extends createZodDto(CreatePermissionResSchema){}

export class CreatePermisionBodyDTO extends createZodDto(CreatePermissionBodySchema){}

export class UpdatePermisionResDTO extends createZodDto(UpdatePermissionResSchema){}

export class UpdatePermisionBodyDTO extends createZodDto(UpdatePermissionBodySchema){}

export class PermissisonIdParamDTO extends createZodDto(PermissionIdParamSchema){}

export class AssignRoleToPermissionResDTO extends createZodDto(AssignRoleToPermissionResSchema) {}

export class AssignRoleToPermissionDTO extends createZodDto(AssignRoleToPermissionSchema){}

export class GetPermissionDetailResDTO extends createZodDto(GetPermissionDetailSchema) {}

export class GetPermissionsResDTO extends createZodDto(GetPermissionsResSchema) {}

export class GetPermissionQueryDTO extends createZodDto(GetPermissionQuerySchema) {}

export class GetAllPermissionResDTO extends createZodDto(getPermissionResSchema){}
