import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { SuperAdminService } from './super-admin.service';
import { SuperAdminAuthService } from './super-admin-auth.service';
import { StaffService } from './staff.service';
import { SuperAdminChatService } from './chat.service';
import { CustomRolesService } from './roles.service';
import { PermissionService } from './permission.service';
import { SuperAdminAuthController, SuperAdminDashboardController } from './super-admin.controller';
import { SuperAdminDashboardGuard } from './guards/super-admin-dashboard.guard';
import { PermissionGuard } from './guards/permission.guard';
import { PrismaModule } from '../common/prisma/prisma.module';

@Module({
    imports: [
        PrismaModule,
        JwtModule.register({
            secret: process.env.SUPER_ADMIN_JWT_SECRET || process.env.JWT_SECRET,
            signOptions: { expiresIn: '12h' },
        }),
    ],
    providers: [
        SuperAdminService,
        SuperAdminAuthService,
        StaffService,
        SuperAdminChatService,
        CustomRolesService,
        PermissionService,
        SuperAdminDashboardGuard,
        PermissionGuard,
    ],
    controllers: [
        SuperAdminAuthController,
        SuperAdminDashboardController,
    ],
    exports: [SuperAdminChatService],
})
export class SuperAdminModule { }
