import {
  BadRequestException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { randomBytes } from 'crypto';
import Stripe from 'stripe';
import { ClientsService } from '../clients/clients.service';
import { AuthService } from '../auth/auth.service';
import { RegisterDto } from '../auth/dto/auth.dto';
import { InvoicingService } from '../invoicing/invoicing.service';
import { InvoiceKind } from '../invoicing/schemas/invoice.schema';
import { ContractsService } from '../contracts/contracts.service';
import {
  PendingRegistration,
  PendingRegistrationDocument,
} from './schemas/pending-registration.schema';
import {
  Payment,
  PaymentDocument,
  PaymentKind,
  PaymentRecordType,
} from './schemas/payment.schema';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  private readonly stripe: Stripe | null;
  private cachedYearlyPriceId: string | null = null;

  constructor(
    @InjectModel(PendingRegistration.name)
    private readonly pending: Model<PendingRegistrationDocument>,
    @InjectModel(Payment.name)
    private readonly payments: Model<PaymentDocument>,
    private readonly config: ConfigService,
    private readonly clients: ClientsService,
    private readonly auth: AuthService,
    private readonly invoicing: InvoicingService,
    private readonly contracts: ContractsService,
  ) {
    const key = this.config.get<string>('stripe.secretKey');
    this.stripe = key ? new Stripe(key) : null;
    if (!this.stripe) {
      this.logger.warn('Stripe neconfigurat — plata rulează în mod MOCK.');
    }
  }

  get isMock(): boolean {
    return !this.stripe;
  }

  config_(): {
    publishableKey: string;
    mock: boolean;
    pricing: {
      base: number;
      vatRate: number;
    };
  } {
    return {
      publishableKey: this.config.get<string>('stripe.publishableKey') ?? '',
      mock: this.isMock,
      pricing: this.config.get('pricing')!,
    };
  }

  /** Preț fix anual (lei): base + TVA, indiferent de numărul de puncte de lucru. */
  computeAmount(): {
    noVat: number;
    vat: number;
    total: number;
  } {
    const p = this.config.get('pricing');
    const noVat = round2(p.base);
    const total = round2(noVat * (1 + p.vatRate));
    return { noVat, vat: round2(total - noVat), total };
  }

  /**
   * Pas 1: creează un abonament Stripe anual (sau mock) și reține datele de înregistrare.
   * Frontend-ul confirmă plata primului invoice prin Payment Element (clientSecret).
   */
  async createIntent(dto: RegisterDto) {
    if (await this.clients.findByEmail(dto.email)) {
      throw new BadRequestException('Există deja un cont cu acest email');
    }
    const { noVat, total } = this.computeAmount();

    let paymentIntentId: string;
    let clientSecret: string;
    let subscriptionId: string | undefined;
    let customerId: string | undefined;

    if (this.stripe) {
      const priceId = await this.resolveYearlyPriceId();

      const customer = await this.stripe.customers.create({
        email: dto.email,
        name: dto.companyName,
        metadata: {
          cui: dto.cui,
          companyName: dto.companyName,
        },
      });
      customerId = customer.id;

      const subscription = await this.stripe.subscriptions.create({
        customer: customer.id,
        items: [{ price: priceId }],
        payment_behavior: 'default_incomplete',
        payment_settings: {
          save_default_payment_method: 'on_subscription',
          payment_method_types: ['card'],
        },
        expand: ['latest_invoice.payment_intent'],
        metadata: {
          email: dto.email,
          companyName: dto.companyName,
          cui: dto.cui,
          sncu: 'registration',
        },
      });
      subscriptionId = subscription.id;

      const { paymentIntentId: piId, clientSecret: secret } =
        this.extractInvoicePaymentIntent(subscription.latest_invoice);
      paymentIntentId = piId;
      clientSecret = secret;
    } else {
      paymentIntentId = 'pi_mock_' + randomBytes(8).toString('hex');
      clientSecret = paymentIntentId + '_secret_mock';
      subscriptionId = 'sub_mock_' + randomBytes(6).toString('hex');
      customerId = 'cus_mock_' + randomBytes(6).toString('hex');
    }

    await this.pending.create({
      paymentIntentId,
      subscriptionId,
      customerId,
      data: dto as unknown as Record<string, unknown>,
      amountNoVat: noVat,
      amountTotal: total,
    });

    return {
      clientSecret,
      paymentIntentId,
      publishableKey: this.config.get<string>('stripe.publishableKey') ?? '',
      mock: this.isMock,
      amount: total,
    };
  }

  /** Pas 2 (idempotent): creează contul, emite factura, trimite emailuri. */
  async provision(paymentIntentId: string): Promise<{ ok: boolean; email?: string }> {
    const pending = await this.pending
      .findOneAndUpdate(
        { paymentIntentId, completed: false },
        { $set: { completed: true } },
        { new: true },
      )
      .exec();

    if (!pending) {
      return { ok: true }; // deja procesat sau inexistent.
    }

    const dto = pending.data as unknown as RegisterDto;

    try {
      const client = await this.auth.registerClient(dto);

      if (pending.customerId || pending.subscriptionId) {
        await this.clients.updateProfile(String(client._id), {
          stripeCustomerId: pending.customerId,
          stripeSubscriptionId: pending.subscriptionId,
        });
      }

      await this.invoicing.issueAndRecord(
        {
          clientId: String(client._id),
          companyName: dto.companyName,
          cui: dto.cui,
          email: dto.email,
          kind: InvoiceKind.REGISTRATION,
          periodYears: 1,
          amountNoVat: pending.amountNoVat,
          amountTotal: pending.amountTotal,
          phone: dto.phone,
          address: dto.address,
          city: dto.city,
          judet: dto.judet,
          contactPerson: dto.contactPerson,
        },
        { swallowError: true },
      );
    } catch (err) {
      await this.pending
        .updateOne({ paymentIntentId }, { $set: { completed: false } })
        .exec();
      throw err;
    }

    return { ok: true, email: dto.email };
  }

  /**
   * Webhook Stripe — abonament anual:
   * - invoice.payment_succeeded (subscription_create) → provisioning cont
   * - invoice.payment_succeeded (subscription_cycle) → reînnoire
   * - payment_intent.succeeded → fallback idempotent pentru primul plată
   */
  async handleWebhook(rawBody: Buffer, signature: string) {
    if (!this.stripe) {
      throw new BadRequestException('Stripe neconfigurat.');
    }
    const secret = this.config.get<string>('stripe.webhookSecret');
    const event = this.stripe.webhooks.constructEvent(
      rawBody,
      signature,
      secret!,
    );

    if (event.type === 'invoice.payment_succeeded') {
      const invoice = event.data.object as Stripe.Invoice;
      const reason = invoice.billing_reason;
      if (reason === 'subscription_create') {
        const piId = this.invoicePaymentIntentId(invoice);
        if (piId) await this.provision(piId);
      } else if (reason === 'subscription_cycle') {
        await this.handleSubscriptionRenewal(invoice);
      }
    } else if (event.type === 'payment_intent.succeeded') {
      // Fallback: confirmPayment din frontend poate ajunge aici înainte de invoice.*.
      const pi = event.data.object as Stripe.PaymentIntent;
      await this.provision(pi.id);
    }

    return { received: true };
  }

  /** Confirmare simulată (doar în mod mock). */
  async mockConfirm(paymentIntentId: string) {
    if (!this.isMock) {
      throw new BadRequestException(
        'Confirmarea mock e disponibilă doar fără chei Stripe.',
      );
    }
    return this.provision(paymentIntentId);
  }

  /** Înregistrează o plată OP de prelungire (fără Stripe). */
  async recordOpExtension(input: {
    clientId: string;
    periodYears: number;
    amountNoVat: number;
    amountTotal: number;
    previousExpiresAt?: Date;
    newExpiresAt: Date;
    contractId?: string;
    note?: string;
  }): Promise<PaymentDocument> {
    return this.payments.create({
      clientId: new Types.ObjectId(input.clientId),
      type: PaymentRecordType.OP,
      kind: PaymentKind.EXTENSION,
      periodYears: input.periodYears,
      amountNoVat: input.amountNoVat,
      amountTotal: input.amountTotal,
      previousExpiresAt: input.previousExpiresAt,
      newExpiresAt: input.newExpiresAt,
      contractId: input.contractId
        ? new Types.ObjectId(input.contractId)
        : undefined,
      note: input.note,
      paidAt: new Date(),
    });
  }

  listByClient(clientId: string): Promise<PaymentDocument[]> {
    return this.payments
      .find({ clientId })
      .sort({ createdAt: -1 })
      .exec();
  }

  // ─── Stripe helpers ───────────────────────────────────────────────────────

  /**
   * Price ID pentru abonamentul anual. Preferă STRIPE_PRICE_ID; altfel creează /
   * reutilizează un Price recurring yearly cu suma curentă (TVA inclus).
   */
  private async resolveYearlyPriceId(): Promise<string> {
    if (!this.stripe) throw new BadRequestException('Stripe neconfigurat.');

    const configured = this.config.get<string>('stripe.priceId')?.trim();
    if (configured) return configured;

    if (this.cachedYearlyPriceId) return this.cachedYearlyPriceId;

    const { total } = this.computeAmount();
    const unitAmount = Math.round(total * 100);

    const prices = await this.stripe.prices.list({
      active: true,
      type: 'recurring',
      currency: 'ron',
      limit: 100,
    });
    const existing = prices.data.find(
      (p) =>
        p.recurring?.interval === 'year' &&
        p.unit_amount === unitAmount &&
        p.metadata?.sncu === 'annual',
    );
    if (existing) {
      this.cachedYearlyPriceId = existing.id;
      return existing.id;
    }

    const product = await this.stripe.products.create({
      name: 'Abonament SNCU anual',
      description: 'Contract cadru anual — colectare / transport / neutralizare SNCU',
      metadata: { sncu: 'annual' },
    });
    const price = await this.stripe.prices.create({
      product: product.id,
      currency: 'ron',
      unit_amount: unitAmount,
      recurring: { interval: 'year' },
      metadata: { sncu: 'annual' },
    });
    this.logger.log(
      `Stripe Price anual creat automat: ${price.id} (${total} RON/an). Setează STRIPE_PRICE_ID în producție.`,
    );
    this.cachedYearlyPriceId = price.id;
    return price.id;
  }

  private extractInvoicePaymentIntent(latestInvoice: unknown): {
    paymentIntentId: string;
    clientSecret: string;
  } {
    const invoice = latestInvoice as Stripe.Invoice | string | null;
    if (!invoice || typeof invoice === 'string') {
      throw new BadRequestException(
        'Abonamentul Stripe nu a returnat invoice-ul inițial.',
      );
    }
    const pi = (invoice as Stripe.Invoice & {
      payment_intent?: string | Stripe.PaymentIntent | null;
    }).payment_intent;
    if (!pi || typeof pi === 'string') {
      throw new BadRequestException(
        'Abonamentul Stripe nu a returnat PaymentIntent pentru plata inițială.',
      );
    }
    if (!pi.client_secret) {
      throw new BadRequestException('PaymentIntent fără client_secret.');
    }
    return { paymentIntentId: pi.id, clientSecret: pi.client_secret };
  }

  private invoicePaymentIntentId(invoice: Stripe.Invoice): string | null {
    const pi = (invoice as Stripe.Invoice & {
      payment_intent?: string | Stripe.PaymentIntent | null;
    }).payment_intent;
    if (!pi) return null;
    return typeof pi === 'string' ? pi : pi.id;
  }

  /** Reînnoire anuală: prelungește expirarea + factură Oblio. */
  private async handleSubscriptionRenewal(invoice: Stripe.Invoice) {
    const subscriptionRef =
      typeof invoice.subscription === 'string'
        ? invoice.subscription
        : invoice.subscription?.id;
    const customerRef =
      typeof invoice.customer === 'string'
        ? invoice.customer
        : invoice.customer?.id;

    let client =
      (subscriptionRef
        ? await this.clients.findByStripeSubscriptionId(subscriptionRef)
        : null) ??
      (customerRef
        ? await this.clients.findByStripeCustomerId(customerRef)
        : null);

    if (!client) {
      this.logger.warn(
        `Reînnoire Stripe fără client local (sub=${subscriptionRef}, cus=${customerRef}).`,
      );
      return;
    }

    const now = new Date();
    const previousExpiresAt = client.contractExpiresAt
      ? new Date(client.contractExpiresAt)
      : undefined;
    const base =
      previousExpiresAt && previousExpiresAt > now ? previousExpiresAt : now;
    const newExpiresAt = new Date(base);
    newExpiresAt.setFullYear(newExpiresAt.getFullYear() + 1);

    const { noVat, total } = this.computeAmount();

    await this.contracts
      .extendLatestExpiry(String(client._id), newExpiresAt)
      .catch((err) =>
        this.logger.warn(`Nu s-a putut prelungi contractul: ${err}`),
      );

    await this.clients.updateProfile(String(client._id), {
      contractExpiresAt: newExpiresAt,
    });

    await this.payments.create({
      clientId: client._id,
      type: PaymentRecordType.CARD,
      kind: PaymentKind.EXTENSION,
      periodYears: 1,
      amountNoVat: noVat,
      amountTotal: total,
      previousExpiresAt,
      newExpiresAt,
      note: `Reînnoire abonament Stripe ${invoice.id}`,
      paidAt: new Date(),
    });

    await this.invoicing.issueAndRecord(
      {
        clientId: String(client._id),
        companyName: client.companyName,
        cui: client.cui,
        email: client.email,
        kind: InvoiceKind.EXTENSION,
        periodYears: 1,
        amountNoVat: noVat,
        amountTotal: total,
        phone: client.phone,
        address: client.address,
        city: client.city,
        judet: client.judet,
        regCom: client.regCom,
        contactPerson: [client.contactFirstName, client.contactLastName]
          .filter(Boolean)
          .join(' '),
      },
      { swallowError: true },
    );
  }
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
