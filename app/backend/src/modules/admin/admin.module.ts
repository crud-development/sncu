import { Module } from '@nestjs/common';
import { ClientsModule } from '../clients/clients.module';
import { AuthModule } from '../auth/auth.module';
import { ContractsModule } from '../contracts/contracts.module';
import { OrdersModule } from '../orders/orders.module';
import { SettingsModule } from '../settings/settings.module';
import { AdminService } from './admin.service';
import { SeedService } from './seed.service';
import {
  AdminClientsController,
  AdminContractsController,
  AdminOrdersController,
  AdminSettingsController,
} from './admin.controller';

@Module({
  imports: [
    ClientsModule,
    AuthModule,
    ContractsModule,
    OrdersModule,
    SettingsModule,
  ],
  controllers: [
    AdminClientsController,
    AdminOrdersController,
    AdminContractsController,
    AdminSettingsController,
  ],
  providers: [AdminService, SeedService],
})
export class AdminModule {}
