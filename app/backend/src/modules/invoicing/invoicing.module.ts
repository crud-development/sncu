import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MailModule } from '../mail/mail.module';
import { OblioService } from './oblio.service';
import { InvoicingService } from './invoicing.service';
import { Invoice, InvoiceSchema } from './schemas/invoice.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Invoice.name, schema: InvoiceSchema }]),
    MailModule,
  ],
  providers: [OblioService, InvoicingService],
  exports: [OblioService, InvoicingService],
})
export class InvoicingModule {}
