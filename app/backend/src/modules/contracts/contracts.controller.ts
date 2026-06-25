import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  AuthUser,
  CurrentUser,
} from '../auth/decorators/current-user.decorator';
import { ContractsService } from './contracts.service';
import { GenerateContractDto, SignContractDto } from './dto/contract.dto';

@UseGuards(JwtAuthGuard)
@Controller('contracts')
export class ContractsController {
  constructor(private readonly service: ContractsService) {}

  @Get()
  list(@CurrentUser() user: AuthUser) {
    return this.service.list(user.id);
  }

  @Post('generate')
  generate(@CurrentUser() user: AuthUser, @Body() dto: GenerateContractDto) {
    return this.service.generate(user.id, dto.workpointIds);
  }

  @Get(':id/text')
  async text(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return { text: await this.service.renderText(user.id, id) };
  }

  @Post(':id/sign')
  sign(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: SignContractDto,
  ) {
    return this.service.sign(user.id, id, dto.signature);
  }

  @Post(':id/cancel')
  cancel(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.service.cancel(user.id, id);
  }

  @Get(':id/pdf')
  async pdf(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Res() res: Response,
  ) {
    const { buffer, filename } = await this.service.pdf(user.id, id);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': buffer.length,
    });
    res.end(buffer);
  }
}
