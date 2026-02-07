import { Module, Global } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { WebSocketGatewayService } from './websocket.gateway';

@Global()
@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-secret-key',
    }),
  ],
  providers: [WebSocketGatewayService],
  exports: [WebSocketGatewayService],
})
export class WebSocketModule {}
