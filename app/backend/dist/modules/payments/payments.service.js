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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var PaymentsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentsService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const crypto_1 = require("crypto");
const stripe_1 = __importDefault(require("stripe"));
const clients_service_1 = require("../clients/clients.service");
const auth_service_1 = require("../auth/auth.service");
const oblio_service_1 = require("../invoicing/oblio.service");
const mail_service_1 = require("../mail/mail.service");
const pending_registration_schema_1 = require("./schemas/pending-registration.schema");
let PaymentsService = PaymentsService_1 = class PaymentsService {
    constructor(pending, config, clients, auth, oblio, mail) {
        this.pending = pending;
        this.config = config;
        this.clients = clients;
        this.auth = auth;
        this.oblio = oblio;
        this.mail = mail;
        this.logger = new common_1.Logger(PaymentsService_1.name);
        const key = this.config.get('stripe.secretKey');
        this.stripe = key ? new stripe_1.default(key) : null;
        if (!this.stripe) {
            this.logger.warn('Stripe neconfigurat — plata rulează în mod MOCK.');
        }
    }
    get isMock() {
        return !this.stripe;
    }
    config_() {
        return {
            publishableKey: this.config.get('stripe.publishableKey') ?? '',
            mock: this.isMock,
        };
    }
    computeAmount(workpoints) {
        const p = this.config.get('pricing');
        const extra = Math.max(0, workpoints - p.includedWorkpoints);
        const noVat = round2(p.base + extra * p.extraWorkpoint);
        const total = round2(noVat * (1 + p.vatRate));
        return { noVat, vat: round2(total - noVat), total };
    }
    async createIntent(dto) {
        if (await this.clients.findByEmail(dto.email)) {
            throw new common_1.BadRequestException('Există deja un cont cu acest email');
        }
        const workpoints = dto.workpoints ?? 1;
        const { noVat, total } = this.computeAmount(workpoints);
        let paymentIntentId;
        let clientSecret;
        if (this.stripe) {
            const pi = await this.stripe.paymentIntents.create({
                amount: Math.round(total * 100),
                currency: 'ron',
                metadata: { email: dto.email, companyName: dto.companyName },
                automatic_payment_methods: { enabled: true },
            });
            paymentIntentId = pi.id;
            clientSecret = pi.client_secret;
        }
        else {
            paymentIntentId = 'pi_mock_' + (0, crypto_1.randomBytes)(8).toString('hex');
            clientSecret = paymentIntentId + '_secret_mock';
        }
        await this.pending.create({
            paymentIntentId,
            data: dto,
            amountNoVat: noVat,
            amountTotal: total,
        });
        return {
            clientSecret,
            paymentIntentId,
            publishableKey: this.config.get('stripe.publishableKey') ?? '',
            mock: this.isMock,
            amount: total,
        };
    }
    async provision(paymentIntentId) {
        const pending = await this.pending
            .findOneAndUpdate({ paymentIntentId, completed: false }, { $set: { completed: true } }, { new: true })
            .exec();
        if (!pending) {
            return { ok: true };
        }
        const dto = pending.data;
        try {
            await this.auth.registerClient(dto);
            const vat = round2(pending.amountTotal - pending.amountNoVat);
            const invoice = await this.oblio.issueInvoice({
                companyName: dto.companyName,
                cui: dto.cui,
                noVat: pending.amountNoVat,
                vat,
                total: pending.amountTotal,
            });
            await this.mail
                .sendInvoice(dto.email, `${invoice.series}-${invoice.number}`, invoice.total)
                .catch(() => undefined);
        }
        catch (err) {
            await this.pending
                .updateOne({ paymentIntentId }, { $set: { completed: false } })
                .exec();
            throw err;
        }
        return { ok: true, email: dto.email };
    }
    async handleWebhook(rawBody, signature) {
        if (!this.stripe) {
            throw new common_1.BadRequestException('Stripe neconfigurat.');
        }
        const secret = this.config.get('stripe.webhookSecret');
        const event = this.stripe.webhooks.constructEvent(rawBody, signature, secret);
        if (event.type === 'payment_intent.succeeded') {
            const pi = event.data.object;
            await this.provision(pi.id);
        }
        return { received: true };
    }
    async mockConfirm(paymentIntentId) {
        if (!this.isMock) {
            throw new common_1.BadRequestException('Confirmarea mock e disponibilă doar fără chei Stripe.');
        }
        return this.provision(paymentIntentId);
    }
};
exports.PaymentsService = PaymentsService;
exports.PaymentsService = PaymentsService = PaymentsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(pending_registration_schema_1.PendingRegistration.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        config_1.ConfigService,
        clients_service_1.ClientsService,
        auth_service_1.AuthService,
        oblio_service_1.OblioService,
        mail_service_1.MailService])
], PaymentsService);
function round2(n) {
    return Math.round(n * 100) / 100;
}
//# sourceMappingURL=payments.service.js.map