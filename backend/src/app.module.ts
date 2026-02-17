import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { join } from 'path';

// Common
import { PrismaModule } from './common/prisma/prisma.module';
import { EntityCodeModule } from './common/services/entity-code.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { ActivityLogInterceptor } from './common/interceptors/activity-log.interceptor';

// Feature Modules
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { TenantsModule } from './tenants/tenants.module';
import { ClientsModule } from './clients/clients.module';
import { CasesModule } from './cases/cases.module';
import { HearingsModule } from './hearings/hearings.module';
import { DocumentsModule } from './documents/documents.module';
import { InvoicesModule } from './invoices/invoices.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { UploadsModule } from './uploads/uploads.module';
import { ReportsModule } from './reports/reports.module';
import { SearchModule } from './search/search.module';
import { NotificationsModule } from './notifications/notifications.module';
import { SmsModule } from './sms/sms.module';
import { EmailModule } from './email/email.module';
import { PermissionsModule } from './permissions/permissions.module';
import { ActivityLogsModule } from './activity-logs/activity-logs.module';
import { ExportsModule } from './exports/exports.module';
import { WhatsAppModule } from './whatsapp/whatsapp.module';
import { ClientPortalModule } from './client-portal/client-portal.module';
import { WebSocketModule } from './websocket/websocket.module';
import { OcrModule } from './ocr/ocr.module';
import { TasksModule } from './tasks/tasks.module';
import { WorkflowsModule } from './workflows/workflows.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { AiModule } from './ai/ai.module';
import { SecurityModule } from './security/security.module';
import { ComplianceModule } from './compliance/compliance.module';
import { CacheConfigModule } from './cache/cache.module';
import { PerformanceModule } from './performance/performance.module';
import { CallsModule } from './calls/calls.module';
import { WebhooksModule } from './webhooks/webhooks.module';
import { MessagingModule } from './messaging/messaging.module';
import { AccountingModule } from './accounting/accounting.module';
import { HrModule } from './hr/hr.module';
import { SuperAdminModule } from './super-admin/super-admin.module';
import { ChatModule } from './chat/chat.module';
import { OwnerModule } from './owner/owner.module';
import { LegalDocumentsModule } from './legal-documents/legal-documents.module';
import { MarketingModule } from './marketing/marketing.module';
import { LegalLibraryModule } from './legal-library/legal-library.module';
import { CallCenterModule } from './call-center/call-center.module';
import { TenantRolesModule } from './tenant-roles/tenant-roles.module';
import { FormsModule } from './forms/forms.module';
import { AppController } from './app.controller';

@Module({
    imports: [
        // Configuration
        ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: '.env',
        }),

        // Serve static uploads folder
        ServeStaticModule.forRoot({
            rootPath: join(process.cwd(), 'uploads'),
            serveRoot: '/uploads',
            serveStaticOptions: {
                index: false,
            },
        }),

        // Database
        PrismaModule,

        // Entity Codes (global)
        EntityCodeModule,

        // Rate Limiting (100 requests per minute per IP)
        ThrottlerModule.forRoot([{
            ttl: 60000,
            limit: 100,
        }]),

        // Feature Modules
        AuthModule,
        UsersModule,
        TenantsModule,
        ClientsModule,
        CasesModule,
        HearingsModule,
        DocumentsModule,
        InvoicesModule,
        DashboardModule,
        UploadsModule,
        ReportsModule,
        SearchModule,
        NotificationsModule,
        SmsModule,
        EmailModule,
        PermissionsModule,
        ActivityLogsModule,
        ExportsModule,
        WhatsAppModule,
        ClientPortalModule,
        WebSocketModule,
        OcrModule,
        TasksModule,
        WorkflowsModule,
        AnalyticsModule,
        AiModule,
        SecurityModule,
        ComplianceModule,
        CacheConfigModule,
        PerformanceModule,

        // Phase 22: Communication Hub
        CallsModule,
        WebhooksModule,
        MessagingModule,

        // Phase 23: Accounting & Finance
        AccountingModule,

        // Phase 24: HR Management
        HrModule,

        // Phase 25: Super Admin Dashboard
        SuperAdminModule,

        // Phase 26: Internal Chat
        ChatModule,

        // Phase 27: Owner Panel
        OwnerModule,

        // Phase 28: Legal Document Editor
        LegalDocumentsModule,

        // Phase 29: Marketing Module
        MarketingModule,

        // Phase 30: Legal Library
        LegalLibraryModule,

        // Phase 32: Call Center & WhatsApp QR
        CallCenterModule,

        // Phase 35: Tenant RBAC
        TenantRolesModule,

        // Phase 38: Dynamic Forms
        FormsModule,
    ],
    controllers: [AppController],
    providers: [
        // Global Exception Filter
        {
            provide: APP_FILTER,
            useClass: HttpExceptionFilter,
        },
        // Global Rate Limiting Guard
        {
            provide: APP_GUARD,
            useClass: ThrottlerGuard,
        },
        // Global Activity Log Interceptor
        {
            provide: APP_INTERCEPTOR,
            useClass: ActivityLogInterceptor,
        },
    ],
})
export class AppModule { }

