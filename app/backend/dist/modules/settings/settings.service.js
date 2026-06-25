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
exports.SettingsService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const settings_schema_1 = require("./schemas/settings.schema");
let SettingsService = class SettingsService {
    constructor(model) {
        this.model = model;
    }
    async get() {
        const existing = await this.model.findOne().exec();
        if (existing) {
            return existing;
        }
        return this.model.create({});
    }
    async update(data) {
        const settings = await this.get();
        Object.assign(settings, data);
        await settings.save();
        return settings;
    }
    async allocateContractNumber() {
        await this.get();
        const updated = await this.model
            .findOneAndUpdate({}, { $inc: { contractNextNumber: 1 } }, { new: false })
            .exec();
        return {
            series: updated.contractSeries,
            number: updated.contractNextNumber,
        };
    }
    async allocateOrderNumber() {
        await this.get();
        const updated = await this.model
            .findOneAndUpdate({}, { $inc: { orderNextNumber: 1 } }, { new: false })
            .exec();
        return {
            series: updated.orderSeries,
            number: updated.orderNextNumber,
        };
    }
};
exports.SettingsService = SettingsService;
exports.SettingsService = SettingsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(settings_schema_1.Settings.name)),
    __metadata("design:paramtypes", [mongoose_2.Model])
], SettingsService);
//# sourceMappingURL=settings.service.js.map