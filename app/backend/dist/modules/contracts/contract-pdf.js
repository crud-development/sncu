"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildContractPdf = buildContractPdf;
const pdfkit_1 = __importDefault(require("pdfkit"));
const path_1 = require("path");
const FONT_DIR = (0, path_1.join)(__dirname, '..', '..', 'assets', 'fonts');
const FONT_REGULAR = (0, path_1.join)(FONT_DIR, 'DejaVuSans.ttf');
const FONT_BOLD = (0, path_1.join)(FONT_DIR, 'DejaVuSans-Bold.ttf');
function buildContractPdf(rendered, contract) {
    return new Promise((resolve, reject) => {
        const doc = new pdfkit_1.default({ size: 'A4', margin: 56 });
        const chunks = [];
        doc.on('data', (c) => chunks.push(c));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);
        doc.registerFont('body', FONT_REGULAR);
        doc.registerFont('bold', FONT_BOLD);
        doc.font('bold').fontSize(18).fillColor('#0a2116').text('BIOECOLAB');
        doc
            .font('body')
            .fontSize(9)
            .fillColor('#16a34a')
            .text('Operator autorizat ANSVSA · Conform Reg. (CE) 1069/2009');
        doc.moveDown(1);
        doc
            .moveTo(56, doc.y)
            .lineTo(539, doc.y)
            .strokeColor('#cbd5e1')
            .stroke();
        doc.moveDown(1);
        doc.fillColor('#0f172a').fontSize(10.5);
        rendered.split('\n').forEach((line) => {
            const isHeading = /^\d+\.\s[A-ZĂÂÎȘȚ]/.test(line) || line === line.toUpperCase();
            doc
                .font(isHeading && line.trim() ? 'bold' : 'body')
                .text(line, { align: 'left' });
        });
        doc.moveDown(2);
        doc.font('bold').fontSize(11).text('Semnătura Beneficiarului:');
        doc.moveDown(0.5);
        if (contract.signatureDataUrl) {
            const base64 = contract.signatureDataUrl.split(',')[1];
            if (base64) {
                try {
                    const img = Buffer.from(base64, 'base64');
                    doc.image(img, { fit: [220, 90] });
                }
                catch {
                }
            }
        }
        doc.moveDown(0.5);
        doc
            .font('body')
            .fontSize(9)
            .fillColor('#475569')
            .text(`Semnat electronic la ${contract.signedAt
            ? new Date(contract.signedAt).toLocaleString('ro-RO')
            : '—'}`);
        doc.end();
    });
}
//# sourceMappingURL=contract-pdf.js.map