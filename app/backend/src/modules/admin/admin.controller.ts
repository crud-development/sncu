import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Res,
  UseGuards,
  Query,
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
import { PaymentsService } from '../payments/payments.service';
import {
  AdminCreateClientDto,
  AdminCreateOrderDto,
  AdminUpdateOrderDto,
  ExtendContractDto,
  SetOrderCostDto,
  UpdateOrderStatusDto,
  UpdateSettingsDto,
} from './dto/admin.dto';
import { UpdateProfileDto } from '../clients/dto/profile.dto';

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

  @Get(':id')
  getOne(@Param('id') id: string) {
    return this.admin.getClient(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateProfileDto) {
    return this.admin.updateClient(id, dto as Record<string, unknown>);
  }

  @Post(':id/impersonate')
  impersonate(@Param('id') id: string) {
    return this.auth.tokenForClient(id);
  }

  @Post(':id/extend-contract')
  extendContract(@Param('id') id: string, @Body() dto: ExtendContractDto) {
    return this.admin.extendContract(id, dto.periodYears);
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

  @Get(':id')
  get(@Param('id') id: string) {
    return this.orders.getOrFail(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: AdminUpdateOrderDto) {
    return this.orders.adminUpdate(id, dto as Record<string, any>);
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

  @Get(':id/html')
  async html(@Param('id') id: string) {
    return { html: await this.contracts.renderHtmlById(id) };
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
@Controller('admin/invoices')
export class AdminInvoicesController {
  constructor(private readonly admin: AdminService) {}

  @Get()
  list() {
    return this.admin.listInvoices();
  }

  @Get('status')
  status() {
    return this.admin.invoicingStatus();
  }

  @Post(':id/retry')
  retry(@Param('id') id: string) {
    return this.admin.retryInvoice(id);
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


@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('admin/stripe')
export class AdminStripeController {
  constructor(private readonly payments: PaymentsService) {}

  @Get('status')
  status() {
    return this.payments.stripeStatus();
  }

  @Get('customers')
  customers() {
    return this.payments.stripeListCustomers();
  }

  @Get('subscriptions')
  subscriptions() {
    return this.payments.stripeListSubscriptions();
  }

  @Get('invoices')
  invoices() {
    return this.payments.stripeListInvoices();
  }

  @Get('promotion-codes')
  promotionCodes() {
    return this.payments.stripeListPromotionCodes({});
  }

  @Post('promotion-codes')
  promotionCodesCreate(@Body() dto: any) {
    return this.payments.stripeCreatePromotionCode(dto);
  }

  @Post('promotion-codes/:id/deactivate')
  promotionCodesDeactivate(@Param('id') id: string) {
    return this.payments.stripeDeactivatePromotionCode(id);
  }
}
