import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ClientsModule } from '../clients/clients.module';
import { AuthModule } from '../auth/auth.module';
import { InvoicingModule } from '../invoicing/invoicing.module';
import { ContractsModule } from '../contracts/contracts.module';
import {
  PendingRegistration,
  PendingRegistrationSchema,
} from './schemas/pending-registration.schema';
import { Payment, PaymentSchema } from './schemas/payment.schema';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: PendingRegistration.name, schema: PendingRegistrationSchema },
      { name: Payment.name, schema: PaymentSchema },
    ]),
    ClientsModule,
    AuthModule,
    InvoicingModule,
    ContractsModule,
  ],
  controllers: [PaymentsController],
  providers: [PaymentsService],
  exports: [PaymentsService],
})
export class PaymentsModule {}
