import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { CmsUsersModule } from './cms-users/cms-users.module';
import configuration from './config/configuration';
import { validateEnvironment } from './config/env.validation';
import { DatabaseModule } from './database/database.module';
import { MembersModule } from './members/members.module';
import { OrdersModule } from './orders/orders.module';
import { PriceAlertsModule } from './price-alerts/price-alerts.module';
import { PortfolioModule } from './portfolio/portfolio.module';
import { StocksModule } from './stocks/stocks.module';
import { WalletModule } from './wallet/wallet.module';
import { WithdrawalsModule } from './withdrawals/withdrawals.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validate: validateEnvironment,
    }),
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => [
        {
          ttl: configService.getOrThrow<number>('throttling.ttl'),
          limit: configService.getOrThrow<number>('throttling.limit'),
        },
      ],
    }),
    DatabaseModule,
    AuthModule,
    MembersModule,
    CmsUsersModule,
    StocksModule,
    PriceAlertsModule,
    WalletModule,
    WithdrawalsModule,
    OrdersModule,
    PortfolioModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
