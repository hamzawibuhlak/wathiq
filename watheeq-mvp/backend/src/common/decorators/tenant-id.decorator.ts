import { createParamDecorator, ExecutionContext, UnauthorizedException } from '@nestjs/common';

/**
 * Extracts the tenantId from the authenticated user
 * Usage: @TenantId() tenantId: string
 * 
 * IMPORTANT: This decorator enforces tenant isolation by ensuring
 * every request has a valid tenantId from the JWT token.
 */
export const TenantId = createParamDecorator(
    (data: unknown, ctx: ExecutionContext): string => {
        const request = ctx.switchToHttp().getRequest();
        const user = request.user;

        if (!user || !user.tenantId) {
            throw new UnauthorizedException('Tenant ID not found in token');
        }

        return user.tenantId;
    },
);
