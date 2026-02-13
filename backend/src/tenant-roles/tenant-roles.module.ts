import { Module } from '@nestjs/common';
import { TenantRolesService } from './tenant-roles.service';
import { TenantRolesController } from './tenant-roles.controller';
import { TenantPermissionService } from './tenant-permission.service';
import { TenantPermissionGuard } from './guards/tenant-permission.guard';
import { PrismaModule } from '../common/prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [TenantRolesController],
    providers: [
        TenantRolesService,
        TenantPermissionService,
        TenantPermissionGuard,
    ],
    exports: [TenantPermissionService, TenantRolesService, TenantPermissionGuard],
})
export class TenantRolesModule { }
