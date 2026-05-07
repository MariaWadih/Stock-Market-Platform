import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import configuration from './config/configuration';
import { validateEnvironment } from './config/env.validation';
import { GatewayController } from './gateway/gateway.controller';
import { GatewayService } from './gateway/gateway.service';
import { RateLimitService } from './gateway/rate-limit.service';
import { RouteResolverService } from './gateway/route-resolver.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validate: validateEnvironment,
    }),
    JwtModule.register({}),
  ],
  controllers: [GatewayController],
  providers: [GatewayService, RateLimitService, RouteResolverService],
})
export class AppModule {}
