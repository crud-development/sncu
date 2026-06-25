import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { randomBytes } from 'crypto';
import * as bcrypt from 'bcryptjs';
import { ClientsService } from '../clients/clients.service';
import {
  AccountStatus,
  ClientDocument,
  PaymentType,
} from '../clients/schemas/client.schema';
import { MailService } from '../mail/mail.service';
import { RegisterDto } from './dto/auth.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly clients: ClientsService,
    private readonly jwt: JwtService,
    private readonly mail: MailService,
    private readonly config: ConfigService,
  ) {}

  /**
   * Creează un cont nou cu status `inactiv` și trimite emailul de activare.
   * Apelat de fluxul de plată (Stripe webhook) sau de admin (plată OP).
   */
  async registerClient(
    dto: RegisterDto,
    paymentType: PaymentType = PaymentType.CARD,
  ): Promise<ClientDocument> {
    const existing = await this.clients.findByEmail(dto.email);
    if (existing) {
      throw new BadRequestException('Există deja un cont cu acest email');
    }

    const [firstName, ...rest] = dto.contactPerson.trim().split(' ');
    const ttl = this.config.get<number>('activationTtlHours') ?? 24;

    const client = await this.clients.create({
      companyName: dto.companyName,
      cui: dto.cui,
      address: dto.address,
      city: dto.city,
      judet: dto.judet,
      tipActivitate: dto.tipActivitate,
      ansvsaAuthorization: dto.ansvsaAuthorization,
      contactFirstName: firstName,
      contactLastName: rest.join(' '),
      email: dto.email,
      phone: dto.phone,
      paymentType,
      workpointsAllowed: dto.workpoints ?? 1,
      status: AccountStatus.INACTIV,
      activationToken: randomBytes(32).toString('hex'),
      activationExpiresAt: new Date(Date.now() + ttl * 3600_000),
    });

    await this.sendActivation(client);
    return client;
  }

  async sendActivation(client: ClientDocument): Promise<void> {
    const link = `${this.config.get('appUrl')}/app/activare?token=${client.activationToken}`;
    await this.mail.sendActivation(client.email, client.companyName, link);
  }

  /** Admin (4.1.2): creează un client cu plată OP, status inactiv + email activare. */
  async createManagedClient(data: {
    companyName: string;
    cui: string;
    regCom?: string;
    address: string;
    city: string;
    judet: string;
    tipActivitate: string;
    contactFirstName: string;
    contactLastName: string;
    email: string;
    phone: string;
    contractExpiresAt: string;
    workpoints?: number;
  }): Promise<ClientDocument> {
    if (await this.clients.findByEmail(data.email)) {
      throw new BadRequestException('Există deja un cont cu acest email');
    }
    const ttl = this.config.get<number>('activationTtlHours') ?? 24;
    const client = await this.clients.create({
      ...data,
      paymentType: PaymentType.OP,
      status: AccountStatus.INACTIV,
      workpointsAllowed: data.workpoints ?? 1,
      contractExpiresAt: new Date(data.contractExpiresAt),
      activationToken: randomBytes(32).toString('hex'),
      activationExpiresAt: new Date(Date.now() + ttl * 3600_000),
    });
    await this.sendActivation(client);
    return client;
  }

  /** Admin: emite un token pentru a impersona un client. */
  async tokenForClient(clientId: string) {
    const client = await this.clients.getOrFail(clientId);
    return this.issueToken(client);
  }

  /** US-02: setarea parolei activează contul și autentifică automat. */
  async activate(token: string, password: string) {
    const client = await this.clients.findByActivationToken(token);
    if (
      !client ||
      !client.activationExpiresAt ||
      client.activationExpiresAt.getTime() < Date.now()
    ) {
      throw new BadRequestException('Link de activare invalid sau expirat');
    }

    client.passwordHash = await bcrypt.hash(password, 10);
    client.status = AccountStatus.ACTIV;
    client.activationToken = undefined;
    client.activationExpiresAt = undefined;
    await client.save();

    return this.issueToken(client);
  }

  /** US-03: autentificare. */
  async login(email: string, password: string) {
    const client = await this.clients.findByEmail(email);
    const ok =
      client?.passwordHash &&
      (await bcrypt.compare(password, client.passwordHash));
    // Mesaj generic, fără a indica ce câmp e greșit.
    if (!client || !ok) {
      throw new UnauthorizedException('Email sau parolă incorecte');
    }
    if (client.status !== AccountStatus.ACTIV) {
      throw new UnauthorizedException('Contul nu este activat');
    }
    return this.issueToken(client);
  }

  async requestPasswordReset(email: string): Promise<void> {
    const client = await this.clients.findByEmail(email);
    // Nu dezvăluim dacă emailul există.
    if (!client) {
      return;
    }
    const ttl = this.config.get<number>('activationTtlHours') ?? 24;
    client.activationToken = randomBytes(32).toString('hex');
    client.activationExpiresAt = new Date(Date.now() + ttl * 3600_000);
    await client.save();

    const link = `${this.config.get('appUrl')}/app/reset-parola?token=${client.activationToken}`;
    await this.mail.sendPasswordReset(client.email, link);
  }

  async resetPassword(token: string, password: string) {
    const client = await this.clients.findByActivationToken(token);
    if (
      !client ||
      !client.activationExpiresAt ||
      client.activationExpiresAt.getTime() < Date.now()
    ) {
      throw new BadRequestException('Link invalid sau expirat');
    }
    client.passwordHash = await bcrypt.hash(password, 10);
    client.activationToken = undefined;
    client.activationExpiresAt = undefined;
    await client.save();
    return this.issueToken(client);
  }

  private issueToken(client: ClientDocument) {
    const payload = {
      sub: client.id,
      email: client.email,
      role: client.role,
    };
    return {
      accessToken: this.jwt.sign(payload),
      user: {
        id: client.id,
        email: client.email,
        role: client.role,
        companyName: client.companyName,
        status: client.status,
      },
    };
  }
}
