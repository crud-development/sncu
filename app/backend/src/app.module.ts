import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import configuration from './config/configuration';
import { HealthController } from './health.controller';
import { MailModule } from './modules/mail/mail.module';
import { ClientsModule } from './modules/clients/clients.module';
import { AuthModule } from './modules/auth/auth.module';
import { WorkpointsModule } from './modules/workpoints/workpoints.module';
import { SettingsModule } from './modules/settings/settings.module';
import { ContractsModule } from './modules/contracts/contracts.module';
import { OrdersModule } from './modules/orders/orders.module';
import { AdminModule } from './modules/admin/admin.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { InvoicingModule } from './modules/invoicing/invoicing.module';
import { AnafModule } from './modules/anaf/anaf.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [configuration] }),

    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        uri: config.get<string>('mongoUri'),
      }),
    }),

    // Servește SPA-ul React buildat sub /app (frontend/dist). API-ul rămâne pe /api.
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', '..', 'frontend', 'dist'),
      serveRoot: '/app',
      exclude: ['/api/{*splat}'],
    }),

    MailModule,
    ClientsModule,
    AuthModule,
    WorkpointsModule,
    SettingsModule,
    ContractsModule,
    OrdersModule,
    AdminModule,
    InvoicingModule,
    PaymentsModule,
    AnafModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
