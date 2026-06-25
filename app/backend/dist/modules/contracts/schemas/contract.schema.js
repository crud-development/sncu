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
exports.ContractSchema = exports.Contract = exports.ContractStatus = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
var ContractStatus;
(function (ContractStatus) {
    ContractStatus["DRAFT"] = "Draft";
    ContractStatus["SEMNAT"] = "Semnat";
    ContractStatus["ANULAT"] = "Anulat";
    ContractStatus["EXPIRAT"] = "Expirat";
})(ContractStatus || (exports.ContractStatus = ContractStatus = {}));
let Contract = class Contract {
};
exports.Contract = Contract;
__decorate([
    (0, mongoose_1.Prop)({
        type: mongoose_2.Schema.Types.ObjectId,
        ref: 'Client',
        required: true,
        index: true,
    }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], Contract.prototype, "clientId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [mongoose_2.Schema.Types.ObjectId], ref: 'Workpoint', default: [] }),
    __metadata("design:type", Array)
], Contract.prototype, "workpointIds", void 0);
__decorate([
    (0, mongoose_1.Prop)({ enum: ContractStatus, default: ContractStatus.DRAFT, index: true }),
    __metadata("design:type", String)
], Contract.prototype, "status", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], Contract.prototype, "series", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", Number)
], Contract.prototype, "number", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], Contract.prototype, "contractNo", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", Date)
], Contract.prototype, "signedAt", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", Date)
], Contract.prototype, "expiresAt", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], Contract.prototype, "signatureDataUrl", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Object, required: true }),
    __metadata("design:type", Object)
], Contract.prototype, "snapshot", void 0);
exports.Contract = Contract = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true })
], Contract);
exports.ContractSchema = mongoose_1.SchemaFactory.createForClass(Contract);
//# sourceMappingURL=contract.schema.js.map