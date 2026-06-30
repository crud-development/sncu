import PDFDocument from 'pdfkit';
import { join } from 'path';
import { OrderDocument } from './schemas/order.schema';

const ASSETS_DIR = join(__dirname, '..', '..', 'assets');
const FONT_DIR = join(ASSETS_DIR, 'fonts');
const LOGO = join(ASSETS_DIR, 'bioecolab-logo.png');

/** Generează PDF-ul cererii din textul randat al template-ului (Google Docs). */
export function buildOrderPdfFromTemplate(rendered: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 56 });
    const chunks: Buffer[] = [];
    doc.on('data', (c) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    doc.registerFont('body', join(FONT_DIR, 'DejaVuSans.ttf'));
    doc.registerFont('bold', join(FONT_DIR, 'DejaVuSans-Bold.ttf'));

    const headerTop = doc.y;
    try {
      doc.image(LOGO, doc.x, headerTop, { fit: [120, 96] });
      doc.y = headerTop + 90;
    } catch {
      /* fără logo */
    }

    doc.font('body').fontSize(10).fillColor('#0f172a');
    rendered.split('\n').forEach((line) => {
      const isHeading = /^\d+\.\s/.test(line) || (line.trim().length > 0 && line === line.toUpperCase());
      doc.font(isHeading ? 'bold' : 'body').text(line, { align: 'left' });
    });

    doc.end();
  });
}

/** Generează PDF-ul „Cerere de ridicare SNCU" pentru o comandă (layout intern). */
export function buildOrderPdf(order: OrderDocument): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 56 });
    const chunks: Buffer[] = [];
    doc.on('data', (c) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    doc.registerFont('body', join(FONT_DIR, 'DejaVuSans.ttf'));
    doc.registerFont('bold', join(FONT_DIR, 'DejaVuSans-Bold.ttf'));

    const headerTop = doc.y;
    try {
      doc.image(LOGO, doc.x, headerTop, { fit: [120, 96] });
      doc.y = headerTop + 100;
    } catch {
      doc.font('bold').fontSize(18).fillColor('#0a2116').text('BIOECOLAB');
    }
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

    const row = (label: string, value?: string | number) => {
      if (value === undefined || value === null || value === '') return;
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
