import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

export interface InvoiceResult {
  series: string;
  number: string;
  total: number;
  mock: boolean;
  link?: string;
  pdf?: Buffer;
}

export interface InvoiceInput {
  companyName: string;
  cui: string;
  noVat: number;
  vat: number;
  total: number;
  /** Ani / cantitate pe linie (default 1). */
  quantity?: number;
  /** Preț unitar fără TVA (default = noVat / quantity). */
  unitPriceNoVat?: number;
  productName?: string;
  /** Date client (opțional — Oblio autocomplete pe CIF dacă lipsesc). */
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  judet?: string;
  regCom?: string;
  contactPerson?: string;
}

/**
 * Facturare prin Oblio. Dacă lipsesc credențialele, rulează în mod mock
 * (emite o factură simulată) astfel încât fluxul de plată să meargă local.
 */
@Injectable()
export class OblioService {
  private readonly logger = new Logger(OblioService.name);

  constructor(private readonly config: ConfigService) {}

  get isConfigured(): boolean {
    const o = this.config.get('oblio');
    return Boolean(o?.email && o?.apiToken && o?.cif && o?.invoiceSeries);
  }

  async issueInvoice(input: InvoiceInput): Promise<InvoiceResult> {
    const quantity = Math.max(1, input.quantity ?? 1);
    const unitPrice =
      input.unitPriceNoVat ?? round2(input.noVat / quantity);
    const vatPercentage = Math.round(
      (this.config.get<number>('pricing.vatRate') ?? 0.21) * 100,
    );
    const vatName =
      this.config.get<string>('oblio.vatName')?.trim() || 'Normala';
    const productName =
      input.productName ?? 'Abonament anual gestionare SNCU';

    if (!this.isConfigured) {
      const number = String(Math.floor(1000 + Math.random() * 9000));
      this.logger.warn(
        `Oblio neconfigurat — factură MOCK ${input.cui}: total ${input.total} lei (serie MOCK nr ${number}).`,
      );
      return { series: 'MOCK', number, total: input.total, mock: true };
    }

    const o = this.config.get('oblio');
    const issuerCif = normalizeCif(o.cif);
    const clientCif = normalizeCif(input.cui);

    const payload = {
      cif: issuerCif,
      client: {
        cif: clientCif,
        name: input.companyName,
        rc: input.regCom ?? '',
        address: input.address ?? '',
        state: input.judet ?? '',
        city: input.city ?? '',
        country: 'Romania',
        email: input.email ?? '',
        phone: input.phone ?? '',
        contact: input.contactPerson ?? '',
        vatPayer: clientCif.toUpperCase().startsWith('RO') ? 1 : 0,
        // Completează automat datele firmei din ANAF când CIF-ul e valid.
        autocomplete: 1,
        save: 1,
      },
      issueDate: new Date().toISOString().slice(0, 10),
      seriesName: String(o.invoiceSeries).trim(),
      language: 'RO',
      precision: 2,
      currency: 'RON',
      products: [
        {
          name: productName,
          description: '',
          price: unitPrice,
          measuringUnit: 'buc',
          currency: 'RON',
          vatName,
          vatPercentage,
          // Prețul nostru e fără TVA.
          vatIncluded: 0,
          quantity,
          productType: 'Serviciu',
        },
      ],
      useStock: 0,
    };

    try {
      const auth = await axios.post(
        'https://www.oblio.eu/api/authorize/token',
        { client_id: o.email, client_secret: o.apiToken },
      );
      const accessToken = auth.data.access_token;

      const res = await axios.post(
        'https://www.oblio.eu/api/docs/invoice',
        payload,
        { headers: { Authorization: `Bearer ${accessToken}` } },
      );

      const data = res.data?.data;
      if (!data) {
        throw new BadRequestException(
          `Răspuns Oblio invalid: ${JSON.stringify(res.data)}`,
        );
      }

      let pdf: Buffer | undefined;
      if (data.link) {
        try {
          const pdfRes = await axios.get(data.link, {
            responseType: 'arraybuffer',
            headers: { Authorization: `Bearer ${accessToken}` },
          });
          pdf = Buffer.from(pdfRes.data);
        } catch {
          /* fără PDF dacă descărcarea eșuează */
        }
      }

      return {
        series: data.seriesName,
        number: String(data.number),
        total: input.total,
        mock: false,
        link: data.link,
        pdf,
      };
    } catch (err: any) {
      const detail = oblioErrorDetail(err);
      this.logger.error(`Eroare Oblio: ${detail}`);
      this.logger.debug(
        `Payload Oblio (fără secrete): ${JSON.stringify({
          ...payload,
          client: { ...payload.client, email: !!payload.client.email },
        })}`,
      );
      throw new BadRequestException(`Oblio: ${detail}`);
    }
  }
}

/** Normalizează CUI/CIF: spații eliminate; păstrează prefixul RO dacă există. */
function normalizeCif(raw: string): string {
  return String(raw ?? '')
    .trim()
    .replace(/\s+/g, '')
    .toUpperCase();
}

function oblioErrorDetail(err: any): string {
  const data = err?.response?.data;
  if (data == null) return err?.message ?? String(err);
  if (typeof data === 'string') return data;
  const msg =
    data.statusMessage ||
    data.message ||
    data.error ||
    (Array.isArray(data.errors) ? data.errors.join('; ') : null);
  if (msg) return String(msg);
  try {
    return JSON.stringify(data);
  } catch {
    return err?.message ?? 'eroare necunoscută';
  }
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
