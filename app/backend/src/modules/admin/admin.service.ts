import { Injectable } from '@nestjs/common';
import { ClientsService } from '../clients/clients.service';
import { ContractsService } from '../contracts/contracts.service';
import { OrdersService } from '../orders/orders.service';
import { WorkpointsService } from '../workpoints/workpoints.service';
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
  ) {}

  /** Punctele de lucru ale unui client (pentru formularul de comandă din admin). */
  clientWorkpoints(clientId: string) {
    return this.workpoints.list(clientId);
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
      sncuCategory: o.sncuCategory,
      estimatedQuantityKg: o.estimatedQuantityKg,
      observations: o.observations,
      status: o.status,
      createdAt: (o as any).createdAt,
      estimatedCost: o.estimatedCost,
    }));
  }
}
