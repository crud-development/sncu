import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { MailService } from '../mail/mail.service';
import { OblioService } from './oblio.service';
import {
  Invoice,
  InvoiceDocument,
  InvoiceKind,
  InvoiceStatus,
} from './schemas/invoice.schema';

export interface IssueInvoiceParams {
  clientId?: string;
  companyName: string;
  cui: string;
  email: string;
  kind: InvoiceKind;
  periodYears?: number;
  amountNoVat: number;
  amountTotal: number;
  paymentId?: string;
  sendEmail?: boolean;
  productName?: string;
  phone?: string;
  address?: string;
  city?: string;
  judet?: string;
  regCom?: string;
  contactPerson?: string;
}

@Injectable()
export class InvoicingService {
  private readonly logger = new Logger(InvoicingService.name);

  constructor(
    @InjectModel(Invoice.name)
    private readonly invoices: Model<InvoiceDocument>,
    private readonly oblio: OblioService,
    private readonly mail: MailService,
  ) {}

  /**
   * Emite factura Oblio, o salvează local și (opțional) o trimite pe email.
   * La eșec salvează status `failed`; cu swallowError nu aruncă.
   */
  async issueAndRecord(
    params: IssueInvoiceParams,
    opts?: { swallowError?: boolean },
  ): Promise<InvoiceDocument> {
    const periodYears = params.periodYears ?? 1;
    const amountVat = round2(params.amountTotal - params.amountNoVat);
    const productName =
      params.productName ??
      (periodYears === 1
        ? 'Abonament anual gestionare SNCU'
        : `Abonament SNCU — ${periodYears} ani`);

    const draft = await this.invoices.create({
      clientId: params.clientId
        ? new Types.ObjectId(params.clientId)
        : undefined,
      companyName: params.companyName,
      cui: params.cui,
      email: params.email,
      kind: params.kind,
      status: InvoiceStatus.FAILED,
      periodYears,
      amountNoVat: params.amountNoVat,
      amountVat,
      amountTotal: params.amountTotal,
      paymentId: params.paymentId
        ? new Types.ObjectId(params.paymentId)
        : undefined,
      mock: false,
    });

    try {
      const result = await this.oblio.issueInvoice({
        companyName: params.companyName,
        cui: params.cui,
        noVat: params.amountNoVat,
        vat: amountVat,
        total: params.amountTotal,
        quantity: periodYears,
        productName,
        unitPriceNoVat: this.unitPriceNoVat(params.amountNoVat, periodYears),
        email: params.email,
        phone: params.phone,
        address: params.address,
        city: params.city,
        judet: params.judet,
        regCom: params.regCom,
        contactPerson: params.contactPerson,
      });

      draft.status = InvoiceStatus.ISSUED;
      draft.series = result.series;
      draft.number = result.number;
      draft.link = result.link;
      draft.mock = result.mock;
      draft.error = undefined;
      await draft.save();

      if (params.sendEmail !== false) {
        await this.mail
          .sendInvoice(
            params.email,
            `${result.series}-${result.number}`,
            result.total,
            result.pdf,
          )
          .then(async () => {
            draft.emailedAt = new Date();
            await draft.save();
          })
          .catch((err) =>
            this.logger.warn(`Email factură eșuat: ${err?.message ?? err}`),
          );
      }

      return draft;
    } catch (err: any) {
      draft.status = InvoiceStatus.FAILED;
      draft.error =
        err?.response?.data?.statusMessage ??
        err?.message ??
        String(err);
      await draft.save();
      this.logger.error(`Emitere factură eșuată (${draft.id}): ${draft.error}`);
      if (opts?.swallowError) return draft;
      throw err;
    }
  }

  /** Reîncearcă o factură eșuată (sau re-trimite email pentru una emisă fără email). */
  async retry(id: string): Promise<InvoiceDocument> {
    const inv = await this.invoices.findById(id).exec();
    if (!inv) throw new NotFoundException('Factură inexistentă');

    if (inv.status === InvoiceStatus.ISSUED && inv.emailedAt) {
      return inv;
    }

    if (inv.status === InvoiceStatus.ISSUED && !inv.emailedAt) {
      await this.mail.sendInvoice(
        inv.email,
        `${inv.series}-${inv.number}`,
        inv.amountTotal,
      );
      inv.emailedAt = new Date();
      await inv.save();
      return inv;
    }

    const result = await this.oblio.issueInvoice({
      companyName: inv.companyName,
      cui: inv.cui,
      noVat: inv.amountNoVat,
      vat: inv.amountVat,
      total: inv.amountTotal,
      quantity: inv.periodYears,
      productName:
        inv.periodYears === 1
          ? 'Abonament anual gestionare SNCU'
          : `Abonament SNCU — ${inv.periodYears} ani`,
      unitPriceNoVat: this.unitPriceNoVat(inv.amountNoVat, inv.periodYears),
    });

    inv.status = InvoiceStatus.ISSUED;
    inv.series = result.series;
    inv.number = result.number;
    inv.link = result.link;
    inv.mock = result.mock;
    inv.error = undefined;
    await inv.save();

    await this.mail
      .sendInvoice(
        inv.email,
        `${result.series}-${result.number}`,
        result.total,
        result.pdf,
      )
      .then(async () => {
        inv.emailedAt = new Date();
        await inv.save();
      })
      .catch(() => undefined);

    return inv;
  }

  async list() {
    const rows = await this.invoices.find().sort({ createdAt: -1 }).exec();
    return rows.map((i) => ({
      id: i.id,
      clientId: i.clientId ? String(i.clientId) : undefined,
      companyName: i.companyName,
      cui: i.cui,
      email: i.email,
      kind: i.kind,
      status: i.status,
      periodYears: i.periodYears,
      amountNoVat: i.amountNoVat,
      amountVat: i.amountVat,
      amountTotal: i.amountTotal,
      series: i.series,
      number: i.number,
      link: i.link,
      mock: i.mock,
      error: i.error,
      emailedAt: i.emailedAt?.toISOString(),
      createdAt:
        (i as any).createdAt?.toISOString?.() ?? new Date().toISOString(),
    }));
  }

  get isConfigured(): boolean {
    return this.oblio.isConfigured;
  }

  private unitPriceNoVat(amountNoVat: number, periodYears: number): number {
    return round2(amountNoVat / Math.max(1, periodYears));
  }
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
