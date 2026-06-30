import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ClientsService } from '../clients/clients.service';
import { WorkpointsService } from '../workpoints/workpoints.service';
import { SettingsService } from '../settings/settings.service';
import { MailService } from '../mail/mail.service';
import {
  Contract,
  ContractDocument,
  ContractSnapshot,
  ContractStatus,
} from './schemas/contract.schema';
import {
  DEFAULT_CONTRACT_TEMPLATE,
  renderContract,
} from './contract-template';
import { buildContractPdf } from './contract-pdf';

@Injectable()
export class ContractsService {
  constructor(
    @InjectModel(Contract.name)
    private readonly model: Model<ContractDocument>,
    private readonly clients: ClientsService,
    private readonly workpoints: WorkpointsService,
    private readonly settings: SettingsService,
    private readonly mail: MailService,
    private readonly config: ConfigService,
  ) {}

  list(clientId: string): Promise<ContractDocument[]> {
    return this.model.find({ clientId }).sort({ createdAt: -1 }).exec();
  }

  /** True dacă clientul are un contract semnat și neexpirat. */
  async hasActiveContract(clientId: string): Promise<boolean> {
    const count = await this.model
      .countDocuments({
        clientId,
        status: ContractStatus.SEMNAT,
        expiresAt: { $gt: new Date() },
      })
      .exec();
    return count > 0;
  }

  async getOwned(clientId: string, id: string): Promise<ContractDocument> {
    const c = await this.model.findById(id).exec();
    if (!c) throw new NotFoundException('Contract inexistent');
    if (c.clientId.toString() !== clientId) {
      throw new ForbiddenException('Acces interzis');
    }
    return c;
  }

  /** US-05: generează un contract draft pentru punctele de lucru selectate. */
  async generate(
    clientId: string,
    workpointIds: string[],
  ): Promise<ContractDocument> {
    if (!workpointIds?.length) {
      throw new BadRequestException('Selectează cel puțin un punct de lucru.');
    }

    const client = await this.clients.getOrFail(clientId);
    if (!client.adminName || !client.adminIdSeries || !client.adminIdNumber) {
      throw new BadRequestException(
        'Completează datele administratorului (nume, serie și număr CI) înainte de a genera contractul.',
      );
    }

    // Validează că punctele aparțin clientului și nu au deja contract.
    const wps = await Promise.all(
      workpointIds.map((id) => this.workpoints.getOwned(clientId, id)),
    );
    const blocked = wps.filter((w) => w.hasContract);
    if (blocked.length) {
      throw new BadRequestException(
        'Unele puncte de lucru au deja un contract. Reîncarcă pagina.',
      );
    }

    const contract = await this.model.create({
      clientId: new Types.ObjectId(clientId),
      workpointIds: wps.map((w) => w._id),
      status: ContractStatus.DRAFT,
      snapshot: this.buildSnapshot(client, wps),
    });

    await this.workpoints.markContracted(
      wps.map((w) => w.id),
      true,
    );

    return contract;
  }

  /** Construiește snapshot-ul (datele înghețate) din client + puncte de lucru. */
  private buildSnapshot(client: any, wps: any[]): ContractSnapshot {
    return {
      company: {
        companyName: client.companyName,
        cui: client.cui,
        regCom: client.regCom,
        address: client.address,
        city: client.city,
        judet: client.judet,
      },
      admin: {
        name: client.adminName,
        idSeries: client.adminIdSeries,
        idNumber: client.adminIdNumber,
      },
      contact: {
        person: [client.contactFirstName, client.contactLastName]
          .filter(Boolean)
          .join(' '),
        email: client.email,
        phone: client.phone,
      },
      workpoints: wps.map((w) => ({
        denumire: w.denumire,
        address: w.address,
        tipActivitate: w.tipActivitate,
        sanitaryAuthNumber: w.sanitaryAuthNumber,
        contactPerson: w.contactPerson,
        contactPhone: w.contactPhone,
      })),
    };
  }

  /**
   * US-05/4.3: editează un contract Draft — schimbă punctele de lucru incluse și
   * reîmprospătează datele înghețate din punctele de lucru curente.
   */
  async editDraft(
    clientId: string,
    id: string,
    workpointIds: string[],
  ): Promise<ContractDocument> {
    if (!workpointIds?.length) {
      throw new BadRequestException('Selectează cel puțin un punct de lucru.');
    }
    const contract = await this.getOwned(clientId, id);
    if (contract.status !== ContractStatus.DRAFT) {
      throw new BadRequestException('Doar contractele Draft pot fi editate.');
    }

    // Eliberează punctele curente, apoi validează noua selecție.
    await this.workpoints.markContracted(
      contract.workpointIds.map((w) => w.toString()),
      false,
    );
    const wps = await Promise.all(
      workpointIds.map((wid) => this.workpoints.getOwned(clientId, wid)),
    );
    const blocked = wps.filter((w) => w.hasContract);
    if (blocked.length) {
      // Re-marchează punctele inițiale și raportează conflictul.
      await this.workpoints.markContracted(
        contract.workpointIds.map((w) => w.toString()),
        true,
      );
      throw new BadRequestException(
        'Unele puncte de lucru au deja un alt contract.',
      );
    }

    const client = await this.clients.getOrFail(clientId);
    contract.workpointIds = wps.map((w) => w._id);
    contract.snapshot = this.buildSnapshot(client, wps);
    await contract.save();
    await this.workpoints.markContracted(
      wps.map((w) => w.id),
      true,
    );
    return contract;
  }

  /** Șterge un contract Draft (eliberează punctele de lucru). */
  async deleteDraft(clientId: string, id: string): Promise<void> {
    const contract = await this.getOwned(clientId, id);
    if (contract.status !== ContractStatus.DRAFT) {
      throw new BadRequestException('Doar contractele Draft pot fi șterse.');
    }
    await this.workpoints.markContracted(
      contract.workpointIds.map((w) => w.toString()),
      false,
    );
    await contract.deleteOne();
  }

  /** Text contract pentru admin (orice contract). */
  async renderTextById(id: string): Promise<string> {
    return this.renderDoc(await this.getAnyOrFail(id));
  }

  /** Textul integral al contractului (pentru citire înainte de semnare). */
  async renderText(clientId: string, id: string): Promise<string> {
    const contract = await this.getOwned(clientId, id);
    return this.renderDoc(contract);
  }

  private async renderDoc(contract: ContractDocument): Promise<string> {
    const settings = await this.settings.get();
    const template =
      settings.contractTemplateText?.trim() || DEFAULT_CONTRACT_TEMPLATE;
    return renderContract(template, contract);
  }

  /** Statusul efectiv: un contract Semnat expirat se afișează ca Expirat. */
  static effectiveStatus(c: ContractDocument): ContractStatus {
    if (
      c.status === ContractStatus.SEMNAT &&
      c.expiresAt &&
      c.expiresAt.getTime() < Date.now()
    ) {
      return ContractStatus.EXPIRAT;
    }
    return c.status;
  }

  // ─── Acces pentru admin (fără verificare de proprietar) ───

  listAll(): Promise<ContractDocument[]> {
    return this.model.find().sort({ createdAt: -1 }).exec();
  }

  async getAnyOrFail(id: string): Promise<ContractDocument> {
    const c = await this.model.findById(id).exec();
    if (!c) throw new NotFoundException('Contract inexistent');
    return c;
  }

  async adminCancel(id: string): Promise<ContractDocument> {
    return this._cancel(await this.getAnyOrFail(id));
  }

  async pdfByDoc(
    contract: ContractDocument,
  ): Promise<{ buffer: Buffer; filename: string }> {
    const text = await this.renderDoc(contract);
    const buffer = await buildContractPdf(text, contract);
    const safeCompany = contract.snapshot.company.companyName.replace(
      /[^a-zA-Z0-9]+/g,
      '_',
    );
    const no = contract.contractNo ?? 'draft';
    return { buffer, filename: `Contract_BioEcoLab_${no}_${safeCompany}.pdf` };
  }

  /** US-05: semnare electronică → alocă serie/număr, expirare la 12 luni. */
  async sign(
    clientId: string,
    id: string,
    signatureDataUrl: string,
  ): Promise<ContractDocument> {
    const contract = await this.getOwned(clientId, id);
    if (contract.status !== ContractStatus.DRAFT) {
      throw new BadRequestException('Contractul nu este în starea Draft.');
    }
    if (!signatureDataUrl?.startsWith('data:image/')) {
      throw new BadRequestException('Semnătură invalidă.');
    }

    const { series, number } = await this.settings.allocateContractNumber();
    const signedAt = new Date();
    const expiresAt = new Date(signedAt);
    expiresAt.setFullYear(expiresAt.getFullYear() + 1);

    contract.status = ContractStatus.SEMNAT;
    contract.series = series;
    contract.number = number;
    contract.contractNo = `${series}-${number}`;
    contract.signedAt = signedAt;
    contract.expiresAt = expiresAt;
    contract.signatureDataUrl = signatureDataUrl;
    await contract.save();

    // Actualizează data de expirare la nivel de client.
    await this.clients.updateProfile(clientId, { contractExpiresAt: expiresAt });

    // Notificare admin.
    const link = `${this.config.get('appUrl')}/contracte`;
    await this.mail
      .notifyAdminContractSigned(
        this.config.get<string>('mail.adminEmail') ?? '',
        contract.snapshot.company.companyName,
        link,
      )
      .catch(() => undefined);

    return contract;
  }

  /** Anulează un contract; punctele redevin disponibile pentru regenerare. */
  async cancel(clientId: string, id: string): Promise<ContractDocument> {
    return this._cancel(await this.getOwned(clientId, id));
  }

  private async _cancel(contract: ContractDocument): Promise<ContractDocument> {
    if (contract.status === ContractStatus.ANULAT) {
      return contract;
    }
    contract.status = ContractStatus.ANULAT;
    await contract.save();
    await this.workpoints.markContracted(
      contract.workpointIds.map((w) => w.toString()),
      false,
    );
    return contract;
  }

  /** US-05: PDF descărcabil cu nume sugestiv. */
  async pdf(
    clientId: string,
    id: string,
  ): Promise<{ buffer: Buffer; filename: string }> {
    return this.pdfByDoc(await this.getOwned(clientId, id));
  }
}
