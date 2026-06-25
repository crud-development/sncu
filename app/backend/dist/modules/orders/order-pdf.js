"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildOrderPdf = buildOrderPdf;
const pdfkit_1 = __importDefault(require("pdfkit"));
const path_1 = require("path");
const FONT_DIR = (0, path_1.join)(__dirname, '..', '..', 'assets', 'fonts');
function buildOrderPdf(order) {
    return new Promise((resolve, reject) => {
        const doc = new pdfkit_1.default({ size: 'A4', margin: 56 });
        const chunks = [];
        doc.on('data', (c) => chunks.push(c));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);
        doc.registerFont('body', (0, path_1.join)(FONT_DIR, 'DejaVuSans.ttf'));
        doc.registerFont('bold', (0, path_1.join)(FONT_DIR, 'DejaVuSans-Bold.ttf'));
        doc.font('bold').fontSize(18).fillColor('#0a2116').text('BIOECOLAB');
        doc
            .font('body')
            .fontSize(9)
            .fillColor('#16a34a')
            .text('Operator autorizat ANSVSA · Conform Reg. (CE) 1069/2009');
        doc.moveDown(1);
        doc
            .font('bold')
            .fontSize(14)
            .fillColor('#0f172a')
            .text(`Cerere de ridicare SNCU — ${order.orderNo}`);
        doc.moveDown(1);
        const row = (label, value) => {
            if (value === undefined || value === null || value === '')
                return;
            doc.font('bold').fontSize(10).fillColor('#334155').text(`${label}: `, {
                continued: true,
            });
            doc.font('body').fillColor('#0f172a').text(String(value));
        };
        row('Status', order.status);
        row('Firmă', order.companyName);
        row('CUI', order.cui);
        row('Data dorită', new Date(order.desiredDate).toLocaleDateString('ro-RO'));
        row('Interval orar', order.timeInterval);
        row('Adresă ridicare', order.exactAddress);
        row('Denumire deșeu/produs', order.wasteName);
        row('Origine', order.origin);
        row('Categorie SNCU', order.sncuCategory);
        row('Cantitate estimată (kg)', order.estimatedQuantityKg);
        row('Starea produsului', order.productState);
        row('Tip ambalare', order.packagingType);
        row('Valoare contabilă (lei)', order.accountingValue);
        row('Țara de origine', order.countryOfOrigin);
        row('Producător', order.producer);
        row('Distribuitor', order.distributor);
        row('Activitatea desfășurată', order.activity);
        row('Nr. autorizație sanitar-veterinară', order.sanitaryAuthNumber);
        row('Persoană de contact', order.contactPerson);
        row('Telefon', order.contactPhone);
        row('Email', order.contactEmail);
        row('Document CSV/Sechestru/PV/Sigiliu', order.csvDoc);
        row('Observații', order.observations);
        doc.end();
    });
}
//# sourceMappingURL=order-pdf.js.map