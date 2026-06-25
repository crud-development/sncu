"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const mongoose_1 = require("@nestjs/mongoose");
const serve_static_1 = require("@nestjs/serve-static");
const path_1 = require("path");
const configuration_1 = __importDefault(require("./config/configuration"));
const health_controller_1 = require("./health.controller");
const mail_module_1 = require("./modules/mail/mail.module");
const clients_module_1 = require("./modules/clients/clients.module");
const auth_module_1 = require("./modules/auth/auth.module");
const workpoints_module_1 = require("./modules/workpoints/workpoints.module");
const settings_module_1 = require("./modules/settings/settings.module");
const contracts_module_1 = require("./modules/contracts/contracts.module");
const orders_module_1 = require("./modules/orders/orders.module");
const admin_module_1 = require("./modules/admin/admin.module");
const payments_module_1 = require("./modules/payments/payments.module");
const invoicing_module_1 = require("./modules/invoicing/invoicing.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({ isGlobal: true, load: [configuration_1.default] }),
            mongoose_1.MongooseModule.forRootAsync({
                inject: [config_1.ConfigService],
                useFactory: (config) => ({
                    uri: config.get('mongoUri'),
                }),
            }),
            serve_static_1.ServeStaticModule.forRoot({
                rootPath: (0, path_1.join)(__dirname, '..', '..', 'frontend', 'dist'),
                serveRoot: '/app',
                exclude: ['/api/{*splat}'],
            }),
            mail_module_1.MailModule,
            clients_module_1.ClientsModule,
            auth_module_1.AuthModule,
            workpoints_module_1.WorkpointsModule,
            settings_module_1.SettingsModule,
            contracts_module_1.ContractsModule,
            orders_module_1.OrdersModule,
            admin_module_1.AdminModule,
            invoicing_module_1.InvoicingModule,
            payments_module_1.PaymentsModule,
        ],
        controllers: [health_controller_1.HealthController],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map