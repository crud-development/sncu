"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const jwt_1 = require("@nestjs/jwt");
const crypto_1 = require("crypto");
const bcrypt = __importStar(require("bcryptjs"));
const clients_service_1 = require("../clients/clients.service");
const client_schema_1 = require("../clients/schemas/client.schema");
const mail_service_1 = require("../mail/mail.service");
let AuthService = class AuthService {
    constructor(clients, jwt, mail, config) {
        this.clients = clients;
        this.jwt = jwt;
        this.mail = mail;
        this.config = config;
    }
    async registerClient(dto, paymentType = client_schema_1.PaymentType.CARD) {
        const existing = await this.clients.findByEmail(dto.email);
        if (existing) {
            throw new common_1.BadRequestException('Există deja un cont cu acest email');
        }
        const [firstName, ...rest] = dto.contactPerson.trim().split(' ');
        const ttl = this.config.get('activationTtlHours') ?? 24;
        const client = await this.clients.create({
            companyName: dto.companyName,
            cui: dto.cui,
            address: dto.address,
            city: dto.city,
            judet: dto.judet,
            tipActivitate: dto.tipActivitate,
            ansvsaAuthorization: dto.ansvsaAuthorization,
            contactFirstName: firstName,
            contactLastName: rest.join(' '),
            email: dto.email,
            phone: dto.phone,
            paymentType,
            workpointsAllowed: dto.workpoints ?? 1,
            status: client_schema_1.AccountStatus.INACTIV,
            activationToken: (0, crypto_1.randomBytes)(32).toString('hex'),
            activationExpiresAt: new Date(Date.now() + ttl * 3600_000),
        });
        await this.sendActivation(client);
        return client;
    }
    async sendActivation(client) {
        const link = `${this.config.get('appUrl')}/app/activare?token=${client.activationToken}`;
        await this.mail.sendActivation(client.email, client.companyName, link);
    }
    async createManagedClient(data) {
        if (await this.clients.findByEmail(data.email)) {
            throw new common_1.BadRequestException('Există deja un cont cu acest email');
        }
        const ttl = this.config.get('activationTtlHours') ?? 24;
        const client = await this.clients.create({
            ...data,
            paymentType: client_schema_1.PaymentType.OP,
            status: client_schema_1.AccountStatus.INACTIV,
            workpointsAllowed: data.workpoints ?? 1,
            contractExpiresAt: new Date(data.contractExpiresAt),
            activationToken: (0, crypto_1.randomBytes)(32).toString('hex'),
            activationExpiresAt: new Date(Date.now() + ttl * 3600_000),
        });
        await this.sendActivation(client);
        return client;
    }
    async tokenForClient(clientId) {
        const client = await this.clients.getOrFail(clientId);
        return this.issueToken(client);
    }
    async activate(token, password) {
        const client = await this.clients.findByActivationToken(token);
        if (!client ||
            !client.activationExpiresAt ||
            client.activationExpiresAt.getTime() < Date.now()) {
            throw new common_1.BadRequestException('Link de activare invalid sau expirat');
        }
        client.passwordHash = await bcrypt.hash(password, 10);
        client.status = client_schema_1.AccountStatus.ACTIV;
        client.activationToken = undefined;
        client.activationExpiresAt = undefined;
        await client.save();
        return this.issueToken(client);
    }
    async login(email, password) {
        const client = await this.clients.findByEmail(email);
        const ok = client?.passwordHash &&
            (await bcrypt.compare(password, client.passwordHash));
        if (!client || !ok) {
            throw new common_1.UnauthorizedException('Email sau parolă incorecte');
        }
        if (client.status !== client_schema_1.AccountStatus.ACTIV) {
            throw new common_1.UnauthorizedException('Contul nu este activat');
        }
        return this.issueToken(client);
    }
    async requestPasswordReset(email) {
        const client = await this.clients.findByEmail(email);
        if (!client) {
            return;
        }
        const ttl = this.config.get('activationTtlHours') ?? 24;
        client.activationToken = (0, crypto_1.randomBytes)(32).toString('hex');
        client.activationExpiresAt = new Date(Date.now() + ttl * 3600_000);
        await client.save();
        const link = `${this.config.get('appUrl')}/app/reset-parola?token=${client.activationToken}`;
        await this.mail.sendPasswordReset(client.email, link);
    }
    async resetPassword(token, password) {
        const client = await this.clients.findByActivationToken(token);
        if (!client ||
            !client.activationExpiresAt ||
            client.activationExpiresAt.getTime() < Date.now()) {
            throw new common_1.BadRequestException('Link invalid sau expirat');
        }
        client.passwordHash = await bcrypt.hash(password, 10);
        client.activationToken = undefined;
        client.activationExpiresAt = undefined;
        await client.save();
        return this.issueToken(client);
    }
    issueToken(client) {
        const payload = {
            sub: client.id,
            email: client.email,
            role: client.role,
        };
        return {
            accessToken: this.jwt.sign(payload),
            user: {
                id: client.id,
                email: client.email,
                role: client.role,
                companyName: client.companyName,
                status: client.status,
            },
        };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [clients_service_1.ClientsService,
        jwt_1.JwtService,
        mail_service_1.MailService,
        config_1.ConfigService])
], AuthService);
//# sourceMappingURL=auth.service.js.map