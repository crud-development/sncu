import {
  BadRequestException,
  Injectable,
} from '@nestjs/common';
import { ClientsService } from '../clients/clients.service';
import { ContractsService } from '../contracts/contracts.service';
import { OrdersService } from '../orders/orders.service';
import { WorkpointsService } from '../workpoints/workpoints.service';
import { PaymentsService } from '../payments/payments.service';
import { PaymentType } from '../clients/schemas/client.schema';
import {
  ContractDocument,
  ContractStatus,
} from '../contracts/schemas/contract.schema';

@Injectable()
export class AdminService {
  constructor(
    private readonly clients: ClientsService,
    private readonly contracts: ContractsService,
    private readonly orders: OrdersService,
    private readonly workpoints: WorkpointsService,
    private readonly payments: PaymentsService,
  ) {}

  /** Punctele de lucru ale unui client (pentru formularul de comandă din admin). */
  clientWorkpoints(clientId: string) {
    return this.workpoints.list(clientId);
  }

  /** Datele complete ale unui client (pentru formularul de editare din admin). */
  async getClient(id: string) {
    const c = await this.clients.getOrFail(id);
    return {
      id: c.id,
      companyName: c.companyName,
      cui: c.cui,
      regCom: c.regCom,
      address: c.address,
      city: c.city,
      judet: c.judet,
      tipActivitate: c.tipActivitate,
      ansvsaAuthorization: c.ansvsaAuthorization,
      email: c.email,
      phone: c.phone,
      contactFirstName: c.contactFirstName,
      contactLastName: c.contactLastName,
      adminName: c.adminName,
      adminIdSeries: c.adminIdSeries,
      adminIdNumber: c.adminIdNumber,
      workpointsAllowed: c.workpointsAllowed,
      contractExpiresAt: c.contractExpiresAt,
    };
  }

  /** 4.1.1: editează datele unui client din admin. */
  async updateClient(id: string, data: Record<string, unknown>) {
    await this.clients.updateProfile(id, data);
    return { ok: true };
  }

  /**
   * Prelungește manual contractul unui client: actualizează expirarea,
   * înregistrează o plată OP în DB.
   */
  async extendContract(clientId: string, periodYears: number) {
    if (![1, 2, 3].includes(periodYears)) {
      throw new BadRequestException('Perioada trebuie să fie 1, 2 sau 3 ani.');
    }

    const client = await this.clients.getOrFail(clientId);
    const now = new Date();
    const previousExpiresAt = client.contractExpiresAt
      ? new Date(client.contractExpiresAt)
      : undefined;
    const base =
      previousExpiresAt && previousExpiresAt > now ? previousExpiresAt : now;
    const newExpiresAt = new Date(base);
    newExpiresAt.setFullYear(newExpiresAt.getFullYear() + periodYears);

    const { noVat, total } = this.payments.computeAmount();
    const amountNoVat = round2(noVat * periodYears);
    const amountTotal = round2(total * periodYears);

    const contract = await this.contracts.extendLatestExpiry(
      clientId,
      newExpiresAt,
    );

    await this.clients.updateProfile(clientId, {
      contractExpiresAt: newExpiresAt,
      paymentType: PaymentType.OP,
    });

    const payment = await this.payments.recordOpExtension({
      clientId,
      periodYears,
      amountNoVat,
      amountTotal,
      previousExpiresAt,
      newExpiresAt,
      contractId: contract?.id,
      note: `Prelungire manuală ${periodYears} ${periodYears === 1 ? 'an' : 'ani'}`,
    });

    return {
      ok: true,
      previousExpiresAt,
      newExpiresAt,
      amountNoVat,
      amountTotal,
      periodYears,
      paymentId: payment.id,
      contractId: contract?.id ?? null,
    };
  }

  /** 4.1.1 — tabel clienți cu info contract. */
  async listClients() {
    const [clients, allContracts] = await Promise.all([
      this.clients.findAll(),
      this.contracts.listAll(),
    ]);

    // Cel mai recent contract per client.
    const latest = new Map<string, ContractDocument>();
    for (const c of allContracts) {
      const key = c.clientId.toString();
      if (!latest.has(key)) latest.set(key, c);
    }

    return clients.map((cl) => {
      const contract = latest.get(cl.id);
      return {
        id: cl.id,
        companyName: cl.companyName,
        cui: cl.cui,
        contactPerson: [cl.contactFirstName, cl.contactLastName]
          .filter(Boolean)
          .join(' '),
        email: cl.email,
        phone: cl.phone,
        contractId: contract?.id ?? null,
        contractNo: contract?.contractNo ?? null,
        contractStatus: contract
          ? ContractsService.effectiveStatus(contract)
          : null,
        accountStatus: cl.status,
        paymentType: cl.paymentType,
        createdAt: (cl as any).createdAt,
        contractExpiresAt: cl.contractExpiresAt,
      };
    });
  }

  /** 4.3 — centralizator contracte. */
  async listContracts() {
    const all = await this.contracts.listAll();
    return all.map((c) => ({
      id: c.id,
      companyName: c.snapshot.company.companyName,
      cui: c.snapshot.company.cui,
      contractNo: c.contractNo,
      series: c.series,
      number: c.number,
      workpointsCount: c.snapshot.workpoints.length,
      status: ContractsService.effectiveStatus(c),
      signedAt: c.signedAt,
      createdAt: (c as any).createdAt,
      expiresAt: c.expiresAt,
      canCancel:
        ContractsService.effectiveStatus(c) === ContractStatus.SEMNAT,
    }));
  }

  /** 4.2.1 — tabel comenzi. */
  async listOrders() {
    const all = await this.orders.listAll();
    return all.map((o) => ({
      id: o.id,
      orderNo: o.orderNo,
      companyName: o.companyName,
      cui: o.cui,
      contactPhone: o.contactPhone,
      contactEmail: o.contactEmail,
      contactPerson: o.contactPerson,
      wasteName: o.wasteName,
      origin: o.origin,
      sncuCategory: o.sncuCategory,
      estimatedQuantityKg: o.estimatedQuantityKg,
      observations: o.observations,
      status: o.status,
      desiredDate: o.desiredDate,
      createdAt: (o as any).createdAt,
      estimatedCost: o.estimatedCost,
    }));
  }
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
