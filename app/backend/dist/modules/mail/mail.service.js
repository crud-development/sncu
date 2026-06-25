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
var MailService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MailService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const nodemailer = __importStar(require("nodemailer"));
let MailService = MailService_1 = class MailService {
    constructor(config) {
        this.config = config;
        this.logger = new common_1.Logger(MailService_1.name);
        this.transporter = null;
        const host = this.config.get('mail.host');
        if (host) {
            this.transporter = nodemailer.createTransport({
                host,
                port: this.config.get('mail.port'),
                secure: this.config.get('mail.port') === 465,
                auth: {
                    user: this.config.get('mail.user'),
                    pass: this.config.get('mail.pass'),
                },
            });
        }
        else {
            this.logger.warn('SMTP neconfigurat — emailurile vor fi doar logate în consolă (mod dev).');
        }
    }
    async send(msg) {
        const from = this.config.get('mail.from');
        if (!this.transporter) {
            this.logger.log(`[MAIL→${msg.to}] ${msg.subject}`);
            return;
        }
        await this.transporter.sendMail({ from, ...msg });
    }
    async sendActivation(to, companyName, link) {
        await this.send({
            to,
            subject: 'Activează-ți contul BioEcoLab',
            html: this.layout('Activează-ți contul', `<p>Bună, ${companyName}!</p>
         <p>Plata a fost confirmată. Pentru a-ți activa contul și a-ți seta parola, apasă butonul de mai jos. Linkul este valabil 24 de ore.</p>
         ${this.button(link, 'Activează contul')}`),
        });
    }
    async sendPasswordReset(to, link) {
        await this.send({
            to,
            subject: 'Resetare parolă BioEcoLab',
            html: this.layout('Resetare parolă', `<p>Ai cerut resetarea parolei. Apasă butonul de mai jos pentru a seta o parolă nouă.</p>
         ${this.button(link, 'Setează parola nouă')}
         <p style="color:#64748b;font-size:13px">Dacă nu tu ai cerut acest lucru, ignoră emailul.</p>`),
        });
    }
    async notifyAdminContractSigned(adminEmail, companyName, link) {
        await this.send({
            to: adminEmail,
            subject: `${companyName} a semnat contractul`,
            html: this.layout('Contract semnat', `<p><strong>${companyName}</strong> a semnat contractul cadru.</p>
         ${this.button(link, 'Vezi contractul')}`),
        });
    }
    async sendInvoice(to, invoiceNo, total, pdf) {
        await this.send({
            to,
            subject: `Factura ${invoiceNo} — BioEcoLab`,
            html: this.layout('Factura ta', `<p>Îți mulțumim! Plata a fost confirmată.</p>
         <p>Am emis factura <strong>${invoiceNo}</strong> în valoare de <strong>${total.toFixed(2)} lei</strong>.</p>
         <p>Vei primi separat și emailul de activare a contului.</p>`),
            attachments: pdf
                ? [{ filename: `${invoiceNo}.pdf`, content: pdf, contentType: 'application/pdf' }]
                : undefined,
        });
    }
    async sendOrderPlaced(to, orderNo, details) {
        await this.send({
            to,
            subject: `Comandă ${orderNo} înregistrată`,
            html: this.layout(`Comanda ${orderNo} a fost plasată`, `<p>Am înregistrat comanda ta de ridicare SNCU. Statusul curent este <strong>Plasată</strong>.</p>
         <p>${details}</p>
         <p>Vei primi notificări pe email la fiecare schimbare de status.</p>`),
        });
    }
    async sendOrderStatus(to, orderNo, status, note) {
        await this.send({
            to,
            subject: `Comandă ${orderNo} — ${status}`,
            html: this.layout(`Comanda ${orderNo}: ${status}`, `<p>Statusul comenzii tale s-a schimbat în <strong>${status}</strong>.</p>
         ${note ? `<p>${note}</p>` : ''}`),
        });
    }
    button(href, label) {
        return `<p style="margin:28px 0">
      <a href="${href}" style="background:#16a34a;color:#04130c;font-weight:700;text-decoration:none;padding:14px 26px;border-radius:999px;display:inline-block">${label}</a>
    </p>`;
    }
    layout(title, body) {
        return `<div style="font-family:Inter,Arial,sans-serif;max-width:560px;margin:0 auto;color:#0f172a">
      <div style="background:#04130c;color:#fff;padding:22px 28px;border-radius:14px 14px 0 0;font-weight:800;font-size:18px">BIOECOLAB</div>
      <div style="border:1px solid #e2e8f0;border-top:0;border-radius:0 0 14px 14px;padding:28px">
        <h2 style="margin:0 0 12px">${title}</h2>
        ${body}
      </div>
    </div>`;
    }
};
exports.MailService = MailService;
exports.MailService = MailService = MailService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], MailService);
//# sourceMappingURL=mail.service.js.map