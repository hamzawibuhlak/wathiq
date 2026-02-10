import { UseGuards, applyDecorators } from '@nestjs/common';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { OwnerGuard } from '../guards/owner.guard';

export function OwnerOnly() {
    return applyDecorators(
        UseGuards(JwtAuthGuard, OwnerGuard),
    );
}
