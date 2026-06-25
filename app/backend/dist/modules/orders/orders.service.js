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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrdersService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const clients_service_1 = require("../clients/clients.service");
const workpoints_service_1 = require("../workpoints/workpoints.service");
const contracts_service_1 = require("../contracts/contracts.service");
const settings_service_1 = require("../settings/settings.service");
const mail_service_1 = require("../mail/mail.service");
const order_schema_1 = require("./schemas/order.schema");
const order_pdf_1 = require("./order-pdf");
const TRANSITIONS = {
    [order_schema_1.OrderStatus.PLASATA]: [order_schema_1.OrderStatus.CONFIRMATA, order_schema_1.OrderStatus.ANULATA],
    [order_schema_1.OrderStatus.CONFIRMATA]: [order_schema_1.OrderStatus.ONORATA, order_schema_1.OrderStatus.ANULATA],
    [order_schema_1.OrderStatus.ONORATA]: [],
    [order_schema_1.OrderStatus.ANULATA]: [],
};
let OrdersService = class OrdersService {
    constructor(model, clients, workpoints, contracts, settings, mail) {
        this.model = model;
        this.clients = clients;
        this.workpoints = workpoints;
        this.contracts = contracts;
        this.settings = settings;
        this.mail = mail;
    }
    list(clientId) {
        return this.model.find({ clientId }).sort({ createdAt: -1 }).exec();
    }
    listAll() {
        return this.model.find().sort({ createdAt: -1 }).exec();
    }
    async getOwned(clientId, id) {
        const o = await this.model.findById(id).exec();
        if (!o)
            throw new common_1.NotFoundException('Comandă inexistentă');
        if (o.clientId.toString() !== clientId) {
            throw new common_1.ForbiddenException('Acces interzis');
        }
        return o;
    }
    getById(id) {
        return this.model.findById(id).exec();
    }
    async create(clientId, dto, autoConfirm = false) {
        const client = await this.clients.getOrFail(clientId);
        if (!(await this.contracts.hasActiveContract(clientId))) {
            throw new common_1.BadRequestException('Ai nevoie de un contract activ pentru a plasa o comandă.');
        }
        const wp = await this.workpoints.getOwned(clientId, dto.workpointId);
        const { series, number } = await this.settings.allocateOrderNumber();
        const orderNo = `${series}-${number}`;
        const order = await this.model.create({
            ...dto,
            clientId: new mongoose_2.Types.ObjectId(clientId),
            workpointId: wp._id,
            orderNo,
            status: autoConfirm ? order_schema_1.OrderStatus.CONFIRMATA : order_schema_1.OrderStatus.PLASATA,
            desiredDate: new Date(dto.desiredDate),
            exactAddress: dto.exactAddress || wp.address,
            activity: dto.activity || wp.tipActivitate,
            sanitaryAuthNumber: dto.sanitaryAuthNumber || wp.sanitaryAuthNumber,
            contactPerson: dto.contactPerson || wp.contactPerson,
            contactPhone: dto.contactPhone || wp.contactPhone,
            contactEmail: dto.contactEmail || client.email,
            companyName: client.companyName,
            cui: client.cui,
        });
        const details = `Punct de lucru: ${wp.denumire || wp.address} · ${order.sncuCategory} · ${order.estimatedQuantityKg} kg · data ${new Date(order.desiredDate).toLocaleDateString('ro-RO')}`;
        await this.mail
            .sendOrderPlaced(order.contactEmail, orderNo, details)
            .catch(() => undefined);
        return order;
    }
    async cancelByClient(clientId, id, reason) {
        const order = await this.getOwned(clientId, id);
        if (order.status !== order_schema_1.OrderStatus.PLASATA) {
            throw new common_1.BadRequestException('Poți anula doar comenzile cu status „Plasată".');
        }
        return this.changeStatus(order, order_schema_1.OrderStatus.ANULATA, reason);
    }
    async changeStatus(order, next, note) {
        if (!TRANSITIONS[order.status].includes(next)) {
            throw new common_1.BadRequestException(`Tranziție invalidă: ${order.status} → ${next}`);
        }
        order.status = next;
        if (note)
            order.cancelReason = note;
        await order.save();
        if (order.contactEmail) {
            await this.mail
                .sendOrderStatus(order.contactEmail, order.orderNo, next, note)
                .catch(() => undefined);
        }
        return order;
    }
    async pdf(order) {
        const buffer = await (0, order_pdf_1.buildOrderPdf)(order);
        return { buffer, filename: `Cerere_ridicare_${order.orderNo}.pdf` };
    }
    async getOrFail(id) {
        const o = await this.model.findById(id).exec();
        if (!o)
            throw new common_1.NotFoundException('Comandă inexistentă');
        return o;
    }
    async adminChangeStatus(id, next, note) {
        return this.changeStatus(await this.getOrFail(id), next, note);
    }
    async adminSetCost(id, estimatedCost) {
        const order = await this.getOrFail(id);
        order.estimatedCost = estimatedCost;
        await order.save();
        return order;
    }
};
exports.OrdersService = OrdersService;
exports.OrdersService = OrdersService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(order_schema_1.Order.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        clients_service_1.ClientsService,
        workpoints_service_1.WorkpointsService,
        contracts_service_1.ContractsService,
        settings_service_1.SettingsService,
        mail_service_1.MailService])
], OrdersService);
//# sourceMappingURL=orders.service.js.map