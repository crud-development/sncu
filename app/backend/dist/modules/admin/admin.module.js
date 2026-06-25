"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminModule = void 0;
const common_1 = require("@nestjs/common");
const clients_module_1 = require("../clients/clients.module");
const auth_module_1 = require("../auth/auth.module");
const contracts_module_1 = require("../contracts/contracts.module");
const orders_module_1 = require("../orders/orders.module");
const settings_module_1 = require("../settings/settings.module");
const admin_service_1 = require("./admin.service");
const seed_service_1 = require("./seed.service");
const admin_controller_1 = require("./admin.controller");
let AdminModule = class AdminModule {
};
exports.AdminModule = AdminModule;
exports.AdminModule = AdminModule = __decorate([
    (0, common_1.Module)({
        imports: [
            clients_module_1.ClientsModule,
            auth_module_1.AuthModule,
            contracts_module_1.ContractsModule,
            orders_module_1.OrdersModule,
            settings_module_1.SettingsModule,
        ],
        controllers: [
            admin_controller_1.AdminClientsController,
            admin_controller_1.AdminOrdersController,
            admin_controller_1.AdminContractsController,
            admin_controller_1.AdminSettingsController,
        ],
        providers: [admin_service_1.AdminService, seed_service_1.SeedService],
    })
], AdminModule);
//# sourceMappingURL=admin.module.js.map