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
exports.WorkpointsService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const clients_service_1 = require("../clients/clients.service");
const workpoint_schema_1 = require("./schemas/workpoint.schema");
let WorkpointsService = class WorkpointsService {
    constructor(model, clients) {
        this.model = model;
        this.clients = clients;
    }
    list(clientId) {
        return this.model.find({ clientId }).sort({ createdAt: 1 }).exec();
    }
    count(clientId) {
        return this.model.countDocuments({ clientId }).exec();
    }
    async create(clientId, dto) {
        const client = await this.clients.getOrFail(clientId);
        const existing = await this.count(clientId);
        if (existing >= client.workpointsAllowed) {
            throw new common_1.BadRequestException(`Ai atins numărul maxim de puncte de lucru (${client.workpointsAllowed}). Contactează-ne pentru a adăuga puncte suplimentare.`);
        }
        const contactPerson = dto.contactPerson ??
            [client.contactFirstName, client.contactLastName]
                .filter(Boolean)
                .join(' ');
        return this.model.create({
            clientId: new mongoose_2.Types.ObjectId(clientId),
            ...dto,
            contactPerson,
            contactPhone: dto.contactPhone ?? client.phone,
        });
    }
    async getOwned(clientId, id) {
        const wp = await this.model.findById(id).exec();
        if (!wp) {
            throw new common_1.NotFoundException('Punct de lucru inexistent');
        }
        if (wp.clientId.toString() !== clientId) {
            throw new common_1.ForbiddenException('Acces interzis');
        }
        return wp;
    }
    async update(clientId, id, dto) {
        const wp = await this.getOwned(clientId, id);
        Object.assign(wp, dto);
        await wp.save();
        return wp;
    }
    async remove(clientId, id) {
        const wp = await this.getOwned(clientId, id);
        if (wp.hasContract) {
            throw new common_1.BadRequestException('Punctul are un contract asociat și nu poate fi șters.');
        }
        await wp.deleteOne();
    }
    listWithoutContract(clientId) {
        return this.model
            .find({ clientId, hasContract: false })
            .sort({ createdAt: 1 })
            .exec();
    }
    async markContracted(ids, value) {
        await this.model
            .updateMany({ _id: { $in: ids } }, { $set: { hasContract: value } })
            .exec();
    }
};
exports.WorkpointsService = WorkpointsService;
exports.WorkpointsService = WorkpointsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(workpoint_schema_1.Workpoint.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        clients_service_1.ClientsService])
], WorkpointsService);
//# sourceMappingURL=workpoints.service.js.map