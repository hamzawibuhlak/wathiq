import {
    IsString,
    IsOptional,
    IsBoolean,
    IsArray,
    ValidateNested,
    IsEnum,
    MinLength,
    MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { AccessLevel, AccessScope } from '@prisma/client';

export class PermissionEntryDto {
    @IsString()
    resource: string;

    @IsString()
    action: string;

    @IsEnum(AccessLevel)
    accessLevel: AccessLevel;

    @IsEnum(AccessScope)
    @IsOptional()
    scope?: AccessScope;
}

export class CreateTenantRoleDto {
    @IsString()
    @MinLength(2)
    @MaxLength(100)
    name: string;

    @IsString()
    @IsOptional()
    @MaxLength(100)
    nameEn?: string;

    @IsString()
    @IsOptional()
    @MaxLength(500)
    description?: string;

    @IsString()
    @IsOptional()
    color?: string;

    @IsString()
    @IsOptional()
    icon?: string;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => PermissionEntryDto)
    permissions: PermissionEntryDto[];
}

export class UpdateTenantRoleDto {
    @IsString()
    @IsOptional()
    @MinLength(2)
    @MaxLength(100)
    name?: string;

    @IsString()
    @IsOptional()
    @MaxLength(100)
    nameEn?: string;

    @IsString()
    @IsOptional()
    @MaxLength(500)
    description?: string;

    @IsString()
    @IsOptional()
    color?: string;

    @IsString()
    @IsOptional()
    icon?: string;

    @IsBoolean()
    @IsOptional()
    isActive?: boolean;

    @IsArray()
    @IsOptional()
    @ValidateNested({ each: true })
    @Type(() => PermissionEntryDto)
    permissions?: PermissionEntryDto[];
}

export class AssignRoleDto {
    @IsString()
    userId: string;

    @IsString()
    roleId: string;
}

export class CloneRoleDto {
    @IsString()
    @MinLength(2)
    @MaxLength(100)
    newName: string;
}
