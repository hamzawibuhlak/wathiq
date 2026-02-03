import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { ActivityLogsService } from '../../activity-logs/activity-logs.service';

@Injectable()
export class ActivityLogInterceptor implements NestInterceptor {
  constructor(private activityLogsService: ActivityLogsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { user, method, url, ip, headers } = request;

    // Only log for authenticated users
    if (!user) return next.handle();

    // Skip certain endpoints
    const skipPaths = [
      '/auth',
      '/activity-logs',
      '/notifications',
      '/health',
      '/swagger',
    ];
    if (skipPaths.some(path => url.includes(path))) {
      return next.handle();
    }

    // Only log mutating operations (not GET)
    if (method === 'GET') return next.handle();

    // Determine action from HTTP method
    let action: 'CREATE' | 'UPDATE' | 'DELETE' | 'VIEW' = 'VIEW';
    if (method === 'POST') action = 'CREATE';
    if (method === 'PATCH' || method === 'PUT') action = 'UPDATE';
    if (method === 'DELETE') action = 'DELETE';

    // Extract entity from URL (e.g., /cases/123 -> Case)
    const urlParts = url
      .replace('/api/', '')
      .split('/')
      .filter((p: string) => p && !p.startsWith('?'));

    const entityRaw = urlParts[0] || 'unknown';
    const entity = this.capitalizeEntity(entityRaw);
    const entityId = urlParts[1] || undefined;

    // Build description
    const actionLabels: Record<string, string> = {
      CREATE: 'إنشاء',
      UPDATE: 'تعديل',
      DELETE: 'حذف',
      VIEW: 'عرض',
    };

    const entityLabels: Record<string, string> = {
      Case: 'قضية',
      Client: 'عميل',
      Hearing: 'جلسة',
      Invoice: 'فاتورة',
      Document: 'مستند',
      User: 'مستخدم',
    };

    const entityLabel = entityLabels[entity] || entity;
    const description = `${actionLabels[action]} ${entityLabel}${entityId ? ` #${entityId.slice(0, 8)}` : ''}`;

    return next.handle().pipe(
      tap({
        next: () => {
          // Log activity after successful request
          this.activityLogsService
            .log({
              action,
              entity,
              entityId,
              description,
              userId: user.id || user.userId || user.sub,
              tenantId: user.tenantId,
              ipAddress: ip || request.connection?.remoteAddress,
              userAgent: headers['user-agent'],
            })
            .catch(err => {
              console.error('Failed to log activity:', err);
            });
        },
      }),
    );
  }

  private capitalizeEntity(entity: string): string {
    // Remove trailing 's' for plurals and capitalize
    const singular = entity.endsWith('s') ? entity.slice(0, -1) : entity;
    return singular.charAt(0).toUpperCase() + singular.slice(1);
  }
}
