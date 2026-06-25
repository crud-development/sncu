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
exports.ContractsService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const clients_service_1 = require("../clients/clients.service");
const workpoints_service_1 = require("../workpoints/workpoints.service");
const settings_service_1 = require("../settings/settings.service");
const mail_service_1 = require("../mail/mail.service");
const contract_schema_1 = require("./schemas/contract.schema");
const contract_template_1 = require("./contract-template");
const contract_pdf_1 = require("./contract-pdf");
let ContractsService = class ContractsService {
    constructor(model, clients, workpoints, settings, mail, config) {
        this.model = model;
        this.clients = clients;
        this.workpoints = workpoints;
        this.settings = settings;
        this.mail = mail;
        this.config = config;
    }
    list(clientId) {
        return this.model.find({ clientId }).sort({ createdAt: -1 }).exec();
    }
    async hasActiveContract(clientId) {
        const count = await this.model
            .countDocuments({
            clientId,
            status: contract_schema_1.ContractStatus.SEMNAT,
            expiresAt: { $gt: new Date() },
        })
            .exec();
        return count > 0;
    }
    async getOwned(clientId, id) {
        const c = await this.model.findById(id).exec();
        if (!c)
            throw new common_1.NotFoundException('Contract inexistent');
        if (c.clientId.toString() !== clientId) {
            throw new common_1.ForbiddenException('Acces interzis');
        }
        return c;
    }
    async generate(clientId, workpointIds) {
        if (!workpointIds?.length) {
            throw new common_1.BadRequestException('Selectează cel puțin un punct de lucru.');
        }
        const client = await this.clients.getOrFail(clientId);
        if (!client.adminName || !client.adminIdSeries || !client.adminIdNumber) {
            throw new common_1.BadRequestException('Completează datele administratorului (nume, serie și număr CI) înainte de a genera contractul.');
        }
        const wps = await Promise.all(workpointIds.map((id) => this.workpoints.getOwned(clientId, id)));
        const blocked = wps.filter((w) => w.hasContract);
        if (blocked.length) {
            throw new common_1.BadRequestException('Unele puncte de lucru au deja un contract. Reîncarcă pagina.');
        }
        const snapshot = {
            company: {
                companyName: client.companyName,
                cui: client.cui,
                regCom: client.regCom,
                address: client.address,
                city: client.city,
                judet: client.judet,
            },
            admin: {
                name: client.adminName,
                idSeries: client.adminIdSeries,
                idNumber: client.adminIdNumber,
            },
            contact: {
                person: [client.contactFirstName, client.contactLastName]
                    .filter(Boolean)
                    .join(' '),
                email: client.email,
                phone: client.phone,
            },
            workpoints: wps.map((w) => ({
                denumire: w.denumire,
                address: w.address,
                tipActivitate: w.tipActivitate,
                sanitaryAuthNumber: w.sanitaryAuthNumber,
                contactPerson: w.contactPerson,
                contactPhone: w.contactPhone,
            })),
        };
        const contract = await this.model.create({
            clientId: new mongoose_2.Types.ObjectId(clientId),
            workpointIds: wps.map((w) => w._id),
            status: contract_schema_1.ContractStatus.DRAFT,
            snapshot,
        });
        await this.workpoints.markContracted(wps.map((w) => w.id), true);
        return contract;
    }
    async renderText(clientId, id) {
        const contract = await this.getOwned(clientId, id);
        return this.renderDoc(contract);
    }
    async renderDoc(contract) {
        const settings = await this.settings.get();
        const template = settings.contractTemplateText?.trim() || contract_template_1.DEFAULT_CONTRACT_TEMPLATE;
        return (0, contract_template_1.renderContract)(template, contract);
    }
    static effectiveStatus(c) {
        if (c.status === contract_schema_1.ContractStatus.SEMNAT &&
            c.expiresAt &&
            c.expiresAt.getTime() < Date.now()) {
            return contract_schema_1.ContractStatus.EXPIRAT;
        }
        return c.status;
    }
    listAll() {
        return this.model.find().sort({ createdAt: -1 }).exec();
    }
    async getAnyOrFail(id) {
        const c = await this.model.findById(id).exec();
        if (!c)
            throw new common_1.NotFoundException('Contract inexistent');
        return c;
    }
    async adminCancel(id) {
        return this._cancel(await this.getAnyOrFail(id));
    }
    async pdfByDoc(contract) {
        const text = await this.renderDoc(contract);
        const buffer = await (0, contract_pdf_1.buildContractPdf)(text, contract);
        const safeCompany = contract.snapshot.company.companyName.replace(/[^a-zA-Z0-9]+/g, '_');
        const no = contract.contractNo ?? 'draft';
        return { buffer, filename: `Contract_BioEcoLab_${no}_${safeCompany}.pdf` };
    }
    async sign(clientId, id, signatureDataUrl) {
        const contract = await this.getOwned(clientId, id);
        if (contract.status !== contract_schema_1.ContractStatus.DRAFT) {
            throw new common_1.BadRequestException('Contractul nu este în starea Draft.');
        }
        if (!signatureDataUrl?.startsWith('data:image/')) {
            throw new common_1.BadRequestException('Semnătură invalidă.');
        }
        const { series, number } = await this.settings.allocateContractNumber();
        const signedAt = new Date();
        const expiresAt = new Date(signedAt);
        expiresAt.setFullYear(expiresAt.getFullYear() + 1);
        contract.status = contract_schema_1.ContractStatus.SEMNAT;
        contract.series = series;
        contract.number = number;
        contract.contractNo = `${series}-${number}`;
        contract.signedAt = signedAt;
        contract.expiresAt = expiresAt;
        contract.signatureDataUrl = signatureDataUrl;
        await contract.save();
        await this.clients.updateProfile(clientId, { contractExpiresAt: expiresAt });
        const link = `${this.config.get('appUrl')}/app/contracte`;
        await this.mail
            .notifyAdminContractSigned(this.config.get('mail.adminEmail') ?? '', contract.snapshot.company.companyName, link)
            .catch(() => undefined);
        return contract;
    }
    async cancel(clientId, id) {
        return this._cancel(await this.getOwned(clientId, id));
    }
    async _cancel(contract) {
        if (contract.status === contract_schema_1.ContractStatus.ANULAT) {
            return contract;
        }
        contract.status = contract_schema_1.ContractStatus.ANULAT;
        await contract.save();
        await this.workpoints.markContracted(contract.workpointIds.map((w) => w.toString()), false);
        return contract;
    }
    async pdf(clientId, id) {
        return this.pdfByDoc(await this.getOwned(clientId, id));
    }
};
exports.ContractsService = ContractsService;
exports.ContractsService = ContractsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(contract_schema_1.Contract.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        clients_service_1.ClientsService,
        workpoints_service_1.WorkpointsService,
        settings_service_1.SettingsService,
        mail_service_1.MailService,
        config_1.ConfigService])
], ContractsService);
//# sourceMappingURL=contracts.service.js.map