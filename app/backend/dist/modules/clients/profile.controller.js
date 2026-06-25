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
exports.ProfileController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
const clients_service_1 = require("./clients.service");
const profile_dto_1 = require("./dto/profile.dto");
let ProfileController = class ProfileController {
    constructor(clients) {
        this.clients = clients;
    }
    async get(user) {
        return this.serialize(await this.clients.getOrFail(user.id));
    }
    async update(user, dto) {
        return this.serialize(await this.clients.updateProfile(user.id, dto));
    }
    serialize(c) {
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
            adminComplete: Boolean(c.adminName && c.adminIdSeries && c.adminIdNumber),
        };
    }
};
exports.ProfileController = ProfileController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ProfileController.prototype, "get", null);
__decorate([
    (0, common_1.Patch)(),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, profile_dto_1.UpdateProfileDto]),
    __metadata("design:returntype", Promise)
], ProfileController.prototype, "update", null);
exports.ProfileController = ProfileController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('profile'),
    __metadata("design:paramtypes", [clients_service_1.ClientsService])
], ProfileController);
//# sourceMappingURL=profile.controller.js.map