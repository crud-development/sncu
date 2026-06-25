import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { ClientsService } from '../clients/clients.service';
import {
  AccountStatus,
  UserRole,
} from '../clients/schemas/client.schema';

/** Creează un cont de administrator la prima pornire, dacă nu există. */
@Injectable()
export class SeedService implements OnModuleInit {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    private readonly clients: ClientsService,
    private readonly config: ConfigService,
  ) {}

  async onModuleInit() {
    const email =
      process.env.ADMIN_LOGIN_EMAIL ??
      this.config.get<string>('mail.adminEmail') ??
      'admin@bioecolab.ro';

    if (await this.clients.findByEmail(email)) {
      return;
    }

    const password = process.env.ADMIN_PASSWORD ?? 'admin1234';
    await this.clients.create({
      companyName: 'BioEcoLab Admin',
      cui: '-',
      email,
      role: UserRole.ADMIN,
      status: AccountStatus.ACTIV,
      passwordHash: await bcrypt.hash(password, 10),
    });

    this.logger.warn(
      `Cont admin creat: ${email} / ${password} — schimbă parola în producție (ADMIN_PASSWORD).`,
    );
  }
}
