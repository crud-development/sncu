import { Global, Module } from '@nestjs/common';
import { HtmlPdfService } from './html-pdf.service';

@Global()
@Module({
  providers: [HtmlPdfService],
  exports: [HtmlPdfService],
})
export class HtmlPdfModule {}
