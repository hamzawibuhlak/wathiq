import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';

@Injectable()
export class OwnerGuard implements CanActivate {
    canActivate(context: ExecutionContext): boolean {
        const user = context.switchToHttp().getRequest().user;

        if (!user || user.role !== 'OWNER') {
            throw new ForbiddenException('هذا القسم خاص بمالك الشركة فقط');
        }

        return true;
    }
}
