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
exports.ClientsService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const client_schema_1 = require("./schemas/client.schema");
let ClientsService = class ClientsService {
    constructor(model) {
        this.model = model;
    }
    create(data) {
        return this.model.create(data);
    }
    findByEmail(email) {
        return this.model.findOne({ email: email.toLowerCase().trim() }).exec();
    }
    findById(id) {
        return this.model.findById(id).exec();
    }
    findByActivationToken(token) {
        return this.model.findOne({ activationToken: token }).exec();
    }
    async getOrFail(id) {
        const doc = await this.findById(id);
        if (!doc) {
            throw new common_1.NotFoundException('Client inexistent');
        }
        return doc;
    }
    findAll() {
        return this.model.find().sort({ createdAt: -1 }).exec();
    }
    async updateProfile(id, data) {
        const client = await this.getOrFail(id);
        Object.assign(client, data);
        await client.save();
        return client;
    }
};
exports.ClientsService = ClientsService;
exports.ClientsService = ClientsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(client_schema_1.Client.name)),
    __metadata("design:paramtypes", [mongoose_2.Model])
], ClientsService);
//# sourceMappingURL=clients.service.js.map