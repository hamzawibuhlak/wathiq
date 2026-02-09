import {
    Injectable,
    NestInterceptor,
    ExecutionContext,
    CallHandler,
    RequestTimeoutException,
} from '@nestjs/common';
import { Observable, throwError, TimeoutError } from 'rxjs';
import { catchError, timeout } from 'rxjs/operators';

/**
 * Timeout Interceptor - Request timeout handler
 * يمنع الطلبات من التعليق إلى ما لا نهاية
 */
@Injectable()
export class TimeoutInterceptor implements NestInterceptor {
    constructor(private readonly timeoutMs: number = 30000) { } // 30 seconds default

    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        return next.handle().pipe(
            timeout(this.timeoutMs),
            catchError(err => {
                if (err instanceof TimeoutError) {
                    return throwError(
                        () => new RequestTimeoutException('انتهت مهلة الطلب - حاول مرة أخرى')
                    );
                }
                return throwError(() => err);
            })
        );
    }
}
