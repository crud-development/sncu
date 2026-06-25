import { Module } from '@nestjs/common';
import { OblioService } from './oblio.service';

@Module({
  providers: [OblioService],
  exports: [OblioService],
})
export class InvoicingModule {}
