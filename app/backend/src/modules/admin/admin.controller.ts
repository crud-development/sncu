import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../clients/schemas/client.schema';
import { AuthService } from '../auth/auth.service';
import { OrdersService } from '../orders/orders.service';
import { ContractsService } from '../contracts/contracts.service';
import { SettingsService } from '../settings/settings.service';
import { AdminService } from './admin.service';
import {
  AdminCreateClientDto,
  AdminCreateOrderDto,
  SetOrderCostDto,
  UpdateOrderStatusDto,
  UpdateSettingsDto,
} from './dto/admin.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('admin/clients')
export class AdminClientsController {
  constructor(
    private readonly admin: AdminService,
    private readonly auth: AuthService,
  ) {}

  @Get()
  list() {
    return this.admin.listClients();
  }

  @Post()
  async create(@Body() dto: AdminCreateClientDto) {
    const client = await this.auth.createManagedClient(dto);
    return { id: client.id, status: client.status };
  }

  @Get(':id/workpoints')
  workpoints(@Param('id') id: string) {
    return this.admin.clientWorkpoints(id);
  }

  @Post(':id/impersonate')
  impersonate(@Param('id') id: string) {
    return this.auth.tokenForClient(id);
  }
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('admin/orders')
export class AdminOrdersController {
  constructor(
    private readonly admin: AdminService,
    private readonly orders: OrdersService,
  ) {}

  @Get()
  list() {
    return this.admin.listOrders();
  }

  @Post()
  create(@Body() dto: AdminCreateOrderDto) {
    return this.orders.adminCreate(dto.clientId, dto);
  }

  @Patch(':id/status')
  status(@Param('id') id: string, @Body() dto: UpdateOrderStatusDto) {
    return this.orders.adminChangeStatus(id, dto.status, dto.note);
  }

  @Patch(':id/cost')
  cost(@Param('id') id: string, @Body() dto: SetOrderCostDto) {
    return this.orders.adminSetCost(id, dto.estimatedCost);
  }

  @Get(':id/pdf')
  async pdf(@Param('id') id: string, @Res() res: Response) {
    const order = await this.orders.getOrFail(id);
    const { buffer, filename } = await this.orders.pdf(order);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': buffer.length,
    });
    res.end(buffer);
  }
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('admin/contracts')
export class AdminContractsController {
  constructor(
    private readonly admin: AdminService,
    private readonly contracts: ContractsService,
  ) {}

  @Get()
  list() {
    return this.admin.listContracts();
  }

  @Get(':id/text')
  async text(@Param('id') id: string) {
    return { text: await this.contracts.renderTextById(id) };
  }

  @Post(':id/cancel')
  cancel(@Param('id') id: string) {
    return this.contracts.adminCancel(id);
  }

  @Get(':id/pdf')
  async pdf(@Param('id') id: string, @Res() res: Response) {
    const contract = await this.contracts.getAnyOrFail(id);
    const { buffer, filename } = await this.contracts.pdfByDoc(contract);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': buffer.length,
    });
    res.end(buffer);
  }
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('admin/settings')
export class AdminSettingsController {
  constructor(private readonly settings: SettingsService) {}

  @Get()
  get() {
    return this.settings.get();
  }

  @Patch()
  update(@Body() dto: UpdateSettingsDto) {
    const data: any = { ...dto };
    if (dto.contractStartDate) data.contractStartDate = new Date(dto.contractStartDate);
    return this.settings.update(data);
  }
}
