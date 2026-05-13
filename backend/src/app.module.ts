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
import { CompanySettingsModule } from './company-settings/company-settings.module';
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
import { ChatModule } from './chat/chat.module';
import { LegalDocumentsModule } from './legal-documents/legal-documents.module';
import { MarketingModule } from './marketing/marketing.module';
import { LegalLibraryModule } from './legal-library/legal-library.module';
import { CallCenterModule } from './call-center/call-center.module';
import { FormsModule } from './forms/forms.module';
import { DocumentFoldersModule } from './document-folders/document-folders.module';
import { AppController } from './app.controller';
import { SocialInboxModule } from './social-inbox/social-inbox.module';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: '.env',
        }),

        ServeStaticModule.forRoot({
            rootPath: join(process.cwd(), 'uploads'),
            serveRoot: '/uploads',
            serveStaticOptions: {
                index: false,
            },
        }),

        PrismaModule,
        EntityCodeModule,

        ThrottlerModule.forRoot([{
            ttl: 60000,
            limit: 100,
        }]),

        AuthModule,
        UsersModule,
        CompanySettingsModule,
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
        CallsModule,
        WebhooksModule,
        MessagingModule,
        AccountingModule,
        HrModule,
        ChatModule,
        LegalDocumentsModule,
        MarketingModule,
        LegalLibraryModule,
        CallCenterModule,
        FormsModule,
        DocumentFoldersModule,

        SocialInboxModule,
    ],
    controllers: [AppController],
    providers: [
        {
            provide: APP_FILTER,
            useClass: HttpExceptionFilter,
        },
        {
            provide: APP_GUARD,
            useClass: ThrottlerGuard,
        },
        {
            provide: APP_INTERCEPTOR,
            useClass: ActivityLogInterceptor,
        },
    ],
})
export class AppModule { }
