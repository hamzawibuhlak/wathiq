import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class RequestLoggerMiddleware implements NestMiddleware {
    private readonly logger = new Logger('HTTP');

    use(req: Request, res: Response, next: NextFunction) {
        const { method, originalUrl, ip } = req;
        const userAgent = req.get('user-agent') || '';
        const startTime = Date.now();

        res.on('finish', () => {
            const { statusCode } = res;
            const contentLength = res.get('content-length') || 0;
            const duration = Date.now() - startTime;

            const logMessage = `${method} ${originalUrl} ${statusCode} ${contentLength} - ${duration}ms`;

            if (statusCode >= 500) {
                this.logger.error(logMessage, { ip, userAgent });
            } else if (statusCode >= 400) {
                this.logger.warn(logMessage, { ip, userAgent });
            } else {
                this.logger.log(logMessage);
            }
        });

        next();
    }
}
