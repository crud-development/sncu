import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ClientsService } from '../clients/clients.service';
import { WorkpointsService } from '../workpoints/workpoints.service';
import { ContractsService } from '../contracts/contracts.service';
import { SettingsService } from '../settings/settings.service';
import { MailService } from '../mail/mail.service';
import { CreateOrderDto } from './dto/order.dto';
import { Order, OrderDocument, OrderStatus } from './schemas/order.schema';
import { buildOrderPdf } from './order-pdf';

/** Tranziții permise de status (US-07). */
const TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  [OrderStatus.PLASATA]: [OrderStatus.CONFIRMATA, OrderStatus.ANULATA],
  [OrderStatus.CONFIRMATA]: [OrderStatus.ONORATA, OrderStatus.ANULATA],
  [OrderStatus.ONORATA]: [],
  [OrderStatus.ANULATA]: [],
};

@Injectable()
export class OrdersService {
  constructor(
    @InjectModel(Order.name) private readonly model: Model<OrderDocument>,
    private readonly clients: ClientsService,
    private readonly workpoints: WorkpointsService,
    private readonly contracts: ContractsService,
    private readonly settings: SettingsService,
    private readonly mail: MailService,
  ) {}

  list(clientId: string): Promise<OrderDocument[]> {
    return this.model.find({ clientId }).sort({ createdAt: -1 }).exec();
  }

  listAll(): Promise<OrderDocument[]> {
    return this.model.find().sort({ createdAt: -1 }).exec();
  }

  async getOwned(clientId: string, id: string): Promise<OrderDocument> {
    const o = await this.model.findById(id).exec();
    if (!o) throw new NotFoundException('Comandă inexistentă');
    if (o.clientId.toString() !== clientId) {
      throw new ForbiddenException('Acces interzis');
    }
    return o;
  }

  getById(id: string): Promise<OrderDocument | null> {
    return this.model.findById(id).exec();
  }

  /**
   * US-06: plasează o comandă. Necesită contract activ și un punct de lucru.
   * `autoConfirm` e folosit când comanda e adăugată din admin (secțiunea 4.2.2).
   */
  async create(
    clientId: string,
    dto: CreateOrderDto,
    autoConfirm = false,
  ): Promise<OrderDocument> {
    const client = await this.clients.getOrFail(clientId);
    if (!(await this.contracts.hasActiveContract(clientId))) {
      throw new BadRequestException(
        'Ai nevoie de un contract activ pentru a plasa o comandă.',
      );
    }
    const wp = await this.workpoints.getOwned(clientId, dto.workpointId);

    const { series, number } = await this.settings.allocateOrderNumber();
    const orderNo = `${series}-${number}`;

    const order = await this.model.create({
      ...dto,
      clientId: new Types.ObjectId(clientId),
      workpointId: wp._id,
      orderNo,
      status: autoConfirm ? OrderStatus.CONFIRMATA : OrderStatus.PLASATA,
      desiredDate: new Date(dto.desiredDate),
      exactAddress: dto.exactAddress || wp.address,
      activity: dto.activity || wp.tipActivitate,
      sanitaryAuthNumber: dto.sanitaryAuthNumber || wp.sanitaryAuthNumber,
      contactPerson: dto.contactPerson || wp.contactPerson,
      contactPhone: dto.contactPhone || wp.contactPhone,
      contactEmail: dto.contactEmail || client.email,
      companyName: client.companyName,
      cui: client.cui,
    });

    const details = `Punct de lucru: ${wp.denumire || wp.address} · ${order.sncuCategory} · ${order.estimatedQuantityKg} kg · data ${new Date(order.desiredDate).toLocaleDateString('ro-RO')}`;
    await this.mail
      .sendOrderPlaced(order.contactEmail!, orderNo, details)
      .catch(() => undefined);

    return order;
  }

  /** US-07: clientul poate anula doar o comandă `Plasată`. */
  async cancelByClient(
    clientId: string,
    id: string,
    reason?: string,
  ): Promise<OrderDocument> {
    const order = await this.getOwned(clientId, id);
    if (order.status !== OrderStatus.PLASATA) {
      throw new BadRequestException(
        'Poți anula doar comenzile cu status „Plasată".',
      );
    }
    return this.changeStatus(order, OrderStatus.ANULATA, reason);
  }

  /** Schimbare status cu validarea tranziției + notificare email. */
  async changeStatus(
    order: OrderDocument,
    next: OrderStatus,
    note?: string,
  ): Promise<OrderDocument> {
    if (!TRANSITIONS[order.status].includes(next)) {
      throw new BadRequestException(
        `Tranziție invalidă: ${order.status} → ${next}`,
      );
    }
    order.status = next;
    if (note) order.cancelReason = note;
    await order.save();

    if (order.contactEmail) {
      await this.mail
        .sendOrderStatus(order.contactEmail, order.orderNo, next, note)
        .catch(() => undefined);
    }
    return order;
  }

  async pdf(
    order: OrderDocument,
  ): Promise<{ buffer: Buffer; filename: string }> {
    const buffer = await buildOrderPdf(order);
    return { buffer, filename: `Cerere_ridicare_${order.orderNo}.pdf` };
  }

  // ─── Admin ───

  async getOrFail(id: string): Promise<OrderDocument> {
    const o = await this.model.findById(id).exec();
    if (!o) throw new NotFoundException('Comandă inexistentă');
    return o;
  }

  /** Admin: schimbă statusul oricărei comenzi (cu notificare client). */
  async adminChangeStatus(
    id: string,
    next: OrderStatus,
    note?: string,
  ): Promise<OrderDocument> {
    return this.changeStatus(await this.getOrFail(id), next, note);
  }

  /** Admin: setează costul estimat după evaluare. */
  async adminSetCost(id: string, estimatedCost: number): Promise<OrderDocument> {
    const order = await this.getOrFail(id);
    order.estimatedCost = estimatedCost;
    await order.save();
    return order;
  }
}
