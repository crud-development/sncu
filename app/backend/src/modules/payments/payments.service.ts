import {
  BadRequestException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { randomBytes } from 'crypto';
import Stripe from 'stripe';
import { ClientsService } from '../clients/clients.service';
import { AuthService } from '../auth/auth.service';
import { RegisterDto } from '../auth/dto/auth.dto';
import { OblioService } from '../invoicing/oblio.service';
import { MailService } from '../mail/mail.service';
import {
  PendingRegistration,
  PendingRegistrationDocument,
} from './schemas/pending-registration.schema';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  private readonly stripe: Stripe | null;

  constructor(
    @InjectModel(PendingRegistration.name)
    private readonly pending: Model<PendingRegistrationDocument>,
    private readonly config: ConfigService,
    private readonly clients: ClientsService,
    private readonly auth: AuthService,
    private readonly oblio: OblioService,
    private readonly mail: MailService,
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

  config_(): { publishableKey: string; mock: boolean } {
    return {
      publishableKey: this.config.get<string>('stripe.publishableKey') ?? '',
      mock: this.isMock,
    };
  }

  /** Preț (lei) pentru un număr de puncte de lucru, conform analizei. */
  computeAmount(workpoints: number): {
    noVat: number;
    vat: number;
    total: number;
  } {
    const p = this.config.get('pricing');
    const extra = Math.max(0, workpoints - p.includedWorkpoints);
    const noVat = round2(p.base + extra * p.extraWorkpoint);
    const total = round2(noVat * (1 + p.vatRate));
    return { noVat, vat: round2(total - noVat), total };
  }

  /** Pas 1: creează PaymentIntent (sau mock) și reține datele de înregistrare. */
  async createIntent(dto: RegisterDto) {
    if (await this.clients.findByEmail(dto.email)) {
      throw new BadRequestException('Există deja un cont cu acest email');
    }
    const workpoints = dto.workpoints ?? 1;
    const { noVat, total } = this.computeAmount(workpoints);

    let paymentIntentId: string;
    let clientSecret: string;

    if (this.stripe) {
      const pi = await this.stripe.paymentIntents.create({
        amount: Math.round(total * 100),
        currency: 'ron',
        metadata: { email: dto.email, companyName: dto.companyName },
        automatic_payment_methods: { enabled: true },
      });
      paymentIntentId = pi.id;
      clientSecret = pi.client_secret!;
    } else {
      paymentIntentId = 'pi_mock_' + randomBytes(8).toString('hex');
      clientSecret = paymentIntentId + '_secret_mock';
    }

    await this.pending.create({
      paymentIntentId,
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
      // Creează contul inactiv + trimite emailul de activare.
      await this.auth.registerClient(dto);

      // Emite factura prin Oblio (sau mock) și o trimite pe email.
      const vat = round2(pending.amountTotal - pending.amountNoVat);
      const invoice = await this.oblio.issueInvoice({
        companyName: dto.companyName,
        cui: dto.cui,
        noVat: pending.amountNoVat,
        vat,
        total: pending.amountTotal,
      });
      await this.mail
        .sendInvoice(dto.email, `${invoice.series}-${invoice.number}`, invoice.total)
        .catch(() => undefined);
    } catch (err) {
      // La eșec, permite reluarea.
      await this.pending
        .updateOne({ paymentIntentId }, { $set: { completed: false } })
        .exec();
      throw err;
    }

    return { ok: true, email: dto.email };
  }

  /** Webhook Stripe — verifică semnătura și declanșează provisioning. */
  async handleWebhook(rawBody: Buffer, signature: string) {
    if (!this.stripe) {
      throw new BadRequestException('Stripe neconfigurat.');
    }
    const secret = this.config.get<string>('stripe.webhookSecret');
    const event = this.stripe.webhooks.constructEvent(rawBody, signature, secret!);
    if (event.type === 'payment_intent.succeeded') {
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
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
