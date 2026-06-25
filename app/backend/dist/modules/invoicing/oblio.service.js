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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var OblioService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.OblioService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const axios_1 = __importDefault(require("axios"));
let OblioService = OblioService_1 = class OblioService {
    constructor(config) {
        this.config = config;
        this.logger = new common_1.Logger(OblioService_1.name);
    }
    get configured() {
        const o = this.config.get('oblio');
        return Boolean(o?.email && o?.apiToken && o?.cif);
    }
    async issueInvoice(input) {
        if (!this.configured) {
            const number = String(Math.floor(1000 + Math.random() * 9000));
            this.logger.warn(`Oblio neconfigurat — factură MOCK ${input.cui}: total ${input.total} lei (serie MOCK nr ${number}).`);
            return { series: 'MOCK', number, total: input.total, mock: true };
        }
        try {
            const o = this.config.get('oblio');
            const auth = await axios_1.default.post('https://www.oblio.eu/api/authorize/token', { client_id: o.email, client_secret: o.apiToken });
            const accessToken = auth.data.access_token;
            const res = await axios_1.default.post('https://www.oblio.eu/api/docs/invoice', {
                cif: o.cif,
                client: { cif: input.cui, name: input.companyName },
                seriesName: o.invoiceSeries,
                issueDate: new Date().toISOString().slice(0, 10),
                products: [
                    {
                        name: 'Contract cadru anual gestionare SNCU',
                        price: input.noVat,
                        measuringUnit: 'buc',
                        quantity: 1,
                        vatName: 'Normala',
                        vatPercentage: 19,
                    },
                ],
            }, { headers: { Authorization: `Bearer ${accessToken}` } });
            const data = res.data.data;
            return {
                series: data.seriesName,
                number: String(data.number),
                total: input.total,
                mock: false,
                link: data.link,
            };
        }
        catch (err) {
            this.logger.error(`Eroare Oblio: ${err?.response?.data?.statusMessage ?? err.message}`);
            throw err;
        }
    }
};
exports.OblioService = OblioService;
exports.OblioService = OblioService = OblioService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], OblioService);
//# sourceMappingURL=oblio.service.js.map