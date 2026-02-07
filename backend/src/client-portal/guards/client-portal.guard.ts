import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class ClientPortalGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('يرجى تسجيل الدخول');
    }

    const token = authHeader.split(' ')[1];

    try {
      const payload = this.jwtService.verify(token, {
        secret: process.env.JWT_SECRET || 'your-secret-key',
      });

      // Check if it's a client portal token
      if (payload.type !== 'client-portal' || !payload.clientId) {
        throw new UnauthorizedException('رمز غير صالح');
      }

      // Attach client info to request
      request.client = {
        clientId: payload.clientId,
        tenantId: payload.tenantId,
      };

      return true;
    } catch (error) {
      throw new UnauthorizedException('رمز غير صالح أو منتهي الصلاحية');
    }
  }
}
