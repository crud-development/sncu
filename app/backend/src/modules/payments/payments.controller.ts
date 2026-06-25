import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Headers,
  Post,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { RegisterDto } from '../auth/dto/auth.dto';
import { PaymentsService } from './payments.service';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly payments: PaymentsService) {}

  @Get('config')
  config() {
    return this.payments.config_();
  }

  @Post('create-intent')
  createIntent(@Body() dto: RegisterDto) {
    return this.payments.createIntent(dto);
  }

  @Post('webhook')
  webhook(
    @Req() req: Request,
    @Headers('stripe-signature') signature: string,
  ) {
    // Corpul brut este atașat de middleware-ul `raw` din main.ts.
    const raw = req.body as unknown as Buffer;
    return this.payments.handleWebhook(raw, signature);
  }

  @Post('mock-confirm')
  mockConfirm(@Body('paymentIntentId') id: string) {
    if (!id) throw new BadRequestException('paymentIntentId lipsă');
    return this.payments.mockConfirm(id);
  }
}
