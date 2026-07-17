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
import { buildOrderPdf, buildOrderPdfFromTemplate } from './order-pdf';
import { renderOrderDriveHtml, renderOrderDriveTemplate } from './order-template';
import { fetchGoogleDocHtml, fetchGoogleDocText } from '../contracts/google-docs';
import { HtmlPdfService } from '../pdf/html-pdf.service';
import { ContractStatus } from '../contracts/schemas/contract.schema';

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
    private readonly htmlPdf: HtmlPdfService,
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
    skipContractCheck = false,
  ): Promise<OrderDocument> {
    const client = await this.clients.getOrFail(clientId);
    if (!skipContractCheck && !(await this.contracts.hasActiveContract(clientId))) {
      throw new BadRequestException(
        'Ai nevoie de un contract activ pentru a plasa o comandă.',
      );
    }
    const wp = await this.workpoints.getOwned(clientId, dto.workpointId);

    const base = {
      ...dto,
      clientId: new Types.ObjectId(clientId),
      workpointId: wp._id,
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
    };

    // Alocă numărul de comandă; reîncearcă dacă seria desincronizată produce coliziuni.
    let order: OrderDocument | null = null;
    let orderNo = '';
    for (let attempt = 0; attempt < 5; attempt++) {
      const { series, number } = await this.settings.allocateOrderNumber();
      orderNo = `${series}-${number}`;
      try {
        order = await this.model.create({ ...base, orderNo });
        break;
      } catch (err: any) {
        if (err?.code === 11000 && attempt < 4) continue;
        throw err;
      }
    }
    if (!order) {
      throw new BadRequestException('Nu s-a putut aloca numărul comenzii.');
    }

    const details = `Punct de lucru: ${wp.denumire || wp.address} · ${order.sncuCategory} · ${order.estimatedQuantityKg} kg · data ${new Date(order.desiredDate).toLocaleDateString('ro-RO')}`;
    if (order.contactEmail) {
      let pdf: Buffer | undefined;
      try {
        pdf = await this.renderOrderPdf(order);
      } catch {
        /* fără atașament dacă PDF-ul eșuează */
      }
      const mail = autoConfirm
        ? this.mail.sendOrderStatus(
            order.contactEmail,
            orderNo,
            OrderStatus.CONFIRMATA,
            details,
            pdf,
          )
        : this.mail.sendOrderPlaced(order.contactEmail, orderNo, details, pdf);
      await mail.catch(() => undefined);
    }

    return order;
  }

  /** 4.2.2: comandă adăugată din admin — auto Confirmată, fără gate de contract. */
  adminCreate(clientId: string, dto: CreateOrderDto): Promise<OrderDocument> {
    return this.create(clientId, dto, true, true);
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
    const buffer = await this.renderOrderPdf(order);
    return { buffer, filename: `Cerere_ridicare_${order.orderNo}.pdf` };
  }

  /** Generează PDF-ul cererii: template din Drive dacă e setat, altfel layout intern. */
  private async renderOrderPdf(order: OrderDocument): Promise<Buffer> {
    const settings = await this.settings.get();
    if (settings.orderTemplateUrl) {
      const client = await this.clients.findById(order.clientId.toString());
      const contracts = await this.contracts.list(order.clientId.toString());
      const contract = contracts.find((c) => {
        const s = ContractsService.effectiveStatus(c);
        return (
          s === ContractStatus.SEMNAT || s === ContractStatus.EXPIRAT
        );
      });
      const contractDate = contract
        ? (contract.signedAt ?? (contract as any).createdAt)
        : undefined;
      const extra = {
        regCom: client?.regCom ?? '',
        judet: client?.judet ?? '',
        localitate: client?.city ?? '',
        adminCI: [client?.adminIdSeries, client?.adminIdNumber]
          .filter(Boolean)
          .join(' '),
        adminName: client?.adminName ?? '',
        companyAddress: client?.address ?? '',
        contractNoAndDate: contract?.contractNo
          ? `${contract.contractNo}${
              contractDate
                ? ` din ${new Date(contractDate).toLocaleDateString('ro-RO')}`
                : ''
            }`
          : '',
      };
      // Preferă HTML formatat (randat prin Chromium); fallback la text/pdfkit.
      const html = await fetchGoogleDocHtml(settings.orderTemplateUrl);
      if (html) {
        return this.htmlPdf.toPdf(renderOrderDriveHtml(html, order, extra));
      }
      const docText = await fetchGoogleDocText(settings.orderTemplateUrl);
      if (docText) {
        return buildOrderPdfFromTemplate(
          renderOrderDriveTemplate(docText, order, extra),
        );
      }
    }
    return buildOrderPdf(order);
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

  /** 4.2.1: editează câmpurile unei comenzi din admin. */
  async adminUpdate(
    id: string,
    data: Record<string, any>,
  ): Promise<OrderDocument> {
    const order = await this.getOrFail(id);
    const { desiredDate, ...rest } = data;
    Object.assign(order, rest);
    if (desiredDate) order.desiredDate = new Date(desiredDate);
    await order.save();
    return order;
  }
}
