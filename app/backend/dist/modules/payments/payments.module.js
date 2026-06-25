"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentsModule = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const clients_module_1 = require("../clients/clients.module");
const auth_module_1 = require("../auth/auth.module");
const invoicing_module_1 = require("../invoicing/invoicing.module");
const pending_registration_schema_1 = require("./schemas/pending-registration.schema");
const payments_service_1 = require("./payments.service");
const payments_controller_1 = require("./payments.controller");
let PaymentsModule = class PaymentsModule {
};
exports.PaymentsModule = PaymentsModule;
exports.PaymentsModule = PaymentsModule = __decorate([
    (0, common_1.Module)({
        imports: [
            mongoose_1.MongooseModule.forFeature([
                { name: pending_registration_schema_1.PendingRegistration.name, schema: pending_registration_schema_1.PendingRegistrationSchema },
            ]),
            clients_module_1.ClientsModule,
            auth_module_1.AuthModule,
            invoicing_module_1.InvoicingModule,
        ],
        controllers: [payments_controller_1.PaymentsController],
        providers: [payments_service_1.PaymentsService],
    })
], PaymentsModule);
//# sourceMappingURL=payments.module.js.map