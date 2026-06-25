"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminService = void 0;
const common_1 = require("@nestjs/common");
const clients_service_1 = require("../clients/clients.service");
const contracts_service_1 = require("../contracts/contracts.service");
const orders_service_1 = require("../orders/orders.service");
const contract_schema_1 = require("../contracts/schemas/contract.schema");
let AdminService = class AdminService {
    constructor(clients, contracts, orders) {
        this.clients = clients;
        this.contracts = contracts;
        this.orders = orders;
    }
    async listClients() {
        const [clients, allContracts] = await Promise.all([
            this.clients.findAll(),
            this.contracts.listAll(),
        ]);
        const latest = new Map();
        for (const c of allContracts) {
            const key = c.clientId.toString();
            if (!latest.has(key))
                latest.set(key, c);
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
                    ? contracts_service_1.ContractsService.effectiveStatus(contract)
                    : null,
                accountStatus: cl.status,
                paymentType: cl.paymentType,
                createdAt: cl.createdAt,
                contractExpiresAt: cl.contractExpiresAt,
            };
        });
    }
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
            status: contracts_service_1.ContractsService.effectiveStatus(c),
            signedAt: c.signedAt,
            createdAt: c.createdAt,
            expiresAt: c.expiresAt,
            canCancel: contracts_service_1.ContractsService.effectiveStatus(c) === contract_schema_1.ContractStatus.SEMNAT,
        }));
    }
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
            createdAt: o.createdAt,
            estimatedCost: o.estimatedCost,
        }));
    }
};
exports.AdminService = AdminService;
exports.AdminService = AdminService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [clients_service_1.ClientsService,
        contracts_service_1.ContractsService,
        orders_service_1.OrdersService])
], AdminService);
//# sourceMappingURL=admin.service.js.map