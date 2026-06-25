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
exports.ClientSchema = exports.Client = exports.UserRole = exports.PaymentType = exports.AccountStatus = void 0;
const mongoose_1 = require("@nestjs/mongoose");
var AccountStatus;
(function (AccountStatus) {
    AccountStatus["INACTIV"] = "inactiv";
    AccountStatus["ACTIV"] = "activ";
})(AccountStatus || (exports.AccountStatus = AccountStatus = {}));
var PaymentType;
(function (PaymentType) {
    PaymentType["CARD"] = "Card";
    PaymentType["OP"] = "OP";
})(PaymentType || (exports.PaymentType = PaymentType = {}));
var UserRole;
(function (UserRole) {
    UserRole["CLIENT"] = "client";
    UserRole["ADMIN"] = "admin";
})(UserRole || (exports.UserRole = UserRole = {}));
let Client = class Client {
};
exports.Client = Client;
__decorate([
    (0, mongoose_1.Prop)({ required: true, trim: true }),
    __metadata("design:type", String)
], Client.prototype, "companyName", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, trim: true, index: true }),
    __metadata("design:type", String)
], Client.prototype, "cui", void 0);
__decorate([
    (0, mongoose_1.Prop)({ trim: true }),
    __metadata("design:type", String)
], Client.prototype, "regCom", void 0);
__decorate([
    (0, mongoose_1.Prop)({ trim: true }),
    __metadata("design:type", String)
], Client.prototype, "address", void 0);
__decorate([
    (0, mongoose_1.Prop)({ trim: true }),
    __metadata("design:type", String)
], Client.prototype, "city", void 0);
__decorate([
    (0, mongoose_1.Prop)({ trim: true }),
    __metadata("design:type", String)
], Client.prototype, "judet", void 0);
__decorate([
    (0, mongoose_1.Prop)({ trim: true }),
    __metadata("design:type", String)
], Client.prototype, "tipActivitate", void 0);
__decorate([
    (0, mongoose_1.Prop)({ trim: true }),
    __metadata("design:type", String)
], Client.prototype, "ansvsaAuthorization", void 0);
__decorate([
    (0, mongoose_1.Prop)({ trim: true }),
    __metadata("design:type", String)
], Client.prototype, "contactFirstName", void 0);
__decorate([
    (0, mongoose_1.Prop)({ trim: true }),
    __metadata("design:type", String)
], Client.prototype, "contactLastName", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, lowercase: true, trim: true, unique: true, index: true }),
    __metadata("design:type", String)
], Client.prototype, "email", void 0);
__decorate([
    (0, mongoose_1.Prop)({ trim: true }),
    __metadata("design:type", String)
], Client.prototype, "phone", void 0);
__decorate([
    (0, mongoose_1.Prop)({ trim: true }),
    __metadata("design:type", String)
], Client.prototype, "adminName", void 0);
__decorate([
    (0, mongoose_1.Prop)({ trim: true }),
    __metadata("design:type", String)
], Client.prototype, "adminIdSeries", void 0);
__decorate([
    (0, mongoose_1.Prop)({ trim: true }),
    __metadata("design:type", String)
], Client.prototype, "adminIdNumber", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], Client.prototype, "passwordHash", void 0);
__decorate([
    (0, mongoose_1.Prop)({ enum: UserRole, default: UserRole.CLIENT }),
    __metadata("design:type", String)
], Client.prototype, "role", void 0);
__decorate([
    (0, mongoose_1.Prop)({ enum: AccountStatus, default: AccountStatus.INACTIV }),
    __metadata("design:type", String)
], Client.prototype, "status", void 0);
__decorate([
    (0, mongoose_1.Prop)({ enum: PaymentType, default: PaymentType.CARD }),
    __metadata("design:type", String)
], Client.prototype, "paymentType", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 1 }),
    __metadata("design:type", Number)
], Client.prototype, "workpointsAllowed", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", Date)
], Client.prototype, "contractExpiresAt", void 0);
__decorate([
    (0, mongoose_1.Prop)({ index: true }),
    __metadata("design:type", String)
], Client.prototype, "activationToken", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", Date)
], Client.prototype, "activationExpiresAt", void 0);
exports.Client = Client = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true })
], Client);
exports.ClientSchema = mongoose_1.SchemaFactory.createForClass(Client);
//# sourceMappingURL=client.schema.js.map