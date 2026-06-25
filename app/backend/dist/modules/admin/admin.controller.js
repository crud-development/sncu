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
exports.AdminSettingsController = exports.AdminContractsController = exports.AdminOrdersController = exports.AdminClientsController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const client_schema_1 = require("../clients/schemas/client.schema");
const auth_service_1 = require("../auth/auth.service");
const orders_service_1 = require("../orders/orders.service");
const contracts_service_1 = require("../contracts/contracts.service");
const settings_service_1 = require("../settings/settings.service");
const admin_service_1 = require("./admin.service");
const admin_dto_1 = require("./dto/admin.dto");
let AdminClientsController = class AdminClientsController {
    constructor(admin, auth) {
        this.admin = admin;
        this.auth = auth;
    }
    list() {
        return this.admin.listClients();
    }
    async create(dto) {
        const client = await this.auth.createManagedClient(dto);
        return { id: client.id, status: client.status };
    }
    impersonate(id) {
        return this.auth.tokenForClient(id);
    }
};
exports.AdminClientsController = AdminClientsController;
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AdminClientsController.prototype, "list", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [admin_dto_1.AdminCreateClientDto]),
    __metadata("design:returntype", Promise)
], AdminClientsController.prototype, "create", null);
__decorate([
    (0, common_1.Post)(':id/impersonate'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AdminClientsController.prototype, "impersonate", null);
exports.AdminClientsController = AdminClientsController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_schema_1.UserRole.ADMIN),
    (0, common_1.Controller)('admin/clients'),
    __metadata("design:paramtypes", [admin_service_1.AdminService,
        auth_service_1.AuthService])
], AdminClientsController);
let AdminOrdersController = class AdminOrdersController {
    constructor(admin, orders) {
        this.admin = admin;
        this.orders = orders;
    }
    list() {
        return this.admin.listOrders();
    }
    status(id, dto) {
        return this.orders.adminChangeStatus(id, dto.status, dto.note);
    }
    cost(id, dto) {
        return this.orders.adminSetCost(id, dto.estimatedCost);
    }
    async pdf(id, res) {
        const order = await this.orders.getOrFail(id);
        const { buffer, filename } = await this.orders.pdf(order);
        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="${filename}"`,
            'Content-Length': buffer.length,
        });
        res.end(buffer);
    }
};
exports.AdminOrdersController = AdminOrdersController;
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AdminOrdersController.prototype, "list", null);
__decorate([
    (0, common_1.Patch)(':id/status'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, admin_dto_1.UpdateOrderStatusDto]),
    __metadata("design:returntype", void 0)
], AdminOrdersController.prototype, "status", null);
__decorate([
    (0, common_1.Patch)(':id/cost'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, admin_dto_1.SetOrderCostDto]),
    __metadata("design:returntype", void 0)
], AdminOrdersController.prototype, "cost", null);
__decorate([
    (0, common_1.Get)(':id/pdf'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AdminOrdersController.prototype, "pdf", null);
exports.AdminOrdersController = AdminOrdersController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_schema_1.UserRole.ADMIN),
    (0, common_1.Controller)('admin/orders'),
    __metadata("design:paramtypes", [admin_service_1.AdminService,
        orders_service_1.OrdersService])
], AdminOrdersController);
let AdminContractsController = class AdminContractsController {
    constructor(admin, contracts) {
        this.admin = admin;
        this.contracts = contracts;
    }
    list() {
        return this.admin.listContracts();
    }
    cancel(id) {
        return this.contracts.adminCancel(id);
    }
    async pdf(id, res) {
        const contract = await this.contracts.getAnyOrFail(id);
        const { buffer, filename } = await this.contracts.pdfByDoc(contract);
        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="${filename}"`,
            'Content-Length': buffer.length,
        });
        res.end(buffer);
    }
};
exports.AdminContractsController = AdminContractsController;
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AdminContractsController.prototype, "list", null);
__decorate([
    (0, common_1.Post)(':id/cancel'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AdminContractsController.prototype, "cancel", null);
__decorate([
    (0, common_1.Get)(':id/pdf'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AdminContractsController.prototype, "pdf", null);
exports.AdminContractsController = AdminContractsController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_schema_1.UserRole.ADMIN),
    (0, common_1.Controller)('admin/contracts'),
    __metadata("design:paramtypes", [admin_service_1.AdminService,
        contracts_service_1.ContractsService])
], AdminContractsController);
let AdminSettingsController = class AdminSettingsController {
    constructor(settings) {
        this.settings = settings;
    }
    get() {
        return this.settings.get();
    }
    update(dto) {
        const data = { ...dto };
        if (dto.contractStartDate)
            data.contractStartDate = new Date(dto.contractStartDate);
        return this.settings.update(data);
    }
};
exports.AdminSettingsController = AdminSettingsController;
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AdminSettingsController.prototype, "get", null);
__decorate([
    (0, common_1.Patch)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [admin_dto_1.UpdateSettingsDto]),
    __metadata("design:returntype", void 0)
], AdminSettingsController.prototype, "update", null);
exports.AdminSettingsController = AdminSettingsController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_schema_1.UserRole.ADMIN),
    (0, common_1.Controller)('admin/settings'),
    __metadata("design:paramtypes", [settings_service_1.SettingsService])
], AdminSettingsController);
//# sourceMappingURL=admin.controller.js.map