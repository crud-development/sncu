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
  quantity?: number;
  unitPriceNoVat?: number;
  productName?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  judet?: string;
  regCom?: string;
  contactPerson?: string;
}

/**
 * Facturare Oblio — auth aliniat cu SDK-ul oficial (@obliosoftware/oblioapi):
 * POST /api/authorize/token cu JSON { client_id, client_secret, grant_type }.
 * @see https://www.oblio.eu/api#docs_issue
 */
@Injectable()
export class OblioService {
  private readonly logger = new Logger(OblioService.name);
  private cachedToken: { value: string; expiresAt: number } | null = null;

  constructor(private readonly config: ConfigService) {}

  get isConfigured(): boolean {
    const { email, apiToken, cif, invoiceSeries } = this.credentials();
    return Boolean(email && apiToken && cif && invoiceSeries);
  }

  async issueInvoice(input: InvoiceInput): Promise<InvoiceResult> {
    const quantity = Math.max(1, input.quantity ?? 1);
    const unitPrice =
      input.unitPriceNoVat ?? round2(input.noVat / quantity);
    const vatPercentage = Math.round(
      (this.config.get<number>('pricing.vatRate') ?? 0.21) * 100,
    );
    const vatName =
      clean(this.config.get<string>('oblio.vatName')) || 'Normala';
    const productName =
      input.productName ?? 'Abonament anual gestionare SNCU';

    if (!this.isConfigured) {
      const number = String(Math.floor(1000 + Math.random() * 9000));
      this.logger.warn(
        `Oblio neconfigurat — factură MOCK ${input.cui}: total ${input.total} lei (serie MOCK nr ${number}).`,
      );
      return { series: 'MOCK', number, total: input.total, mock: true };
    }

    const { cif: issuerCifRaw, invoiceSeries } = this.credentials();
    const issuerCif = normalizeCif(issuerCifRaw);
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
        vatPayer: clientCif.startsWith('RO') ? 1 : 0,
        autocomplete: 1,
        save: 1,
      },
      issueDate: new Date().toISOString().slice(0, 10),
      seriesName: invoiceSeries,
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
          vatIncluded: 0,
          quantity,
          productType: 'Serviciu',
        },
      ],
      useStock: 0,
    };

    try {
      const accessToken = await this.getAccessToken();

      const res = await axios.post(
        'https://www.oblio.eu/api/docs/invoice',
        payload,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
        },
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
      if (err instanceof BadRequestException) throw err;
      const detail = oblioErrorDetail(err);
      this.logger.error(`Eroare Oblio: ${detail}`);
      this.logger.debug(
        `Payload Oblio: cif=${payload.cif} series=${payload.seriesName} clientCif=${payload.client.cif}`,
      );
      throw new BadRequestException(`Oblio: ${detail}`);
    }
  }

  /**
   * Token OAuth — exact ca SDK-ul oficial OblioApiJs:
   * JSON + grant_type=client_credentials.
   */
  private async getAccessToken(): Promise<string> {
    if (this.cachedToken && this.cachedToken.expiresAt > Date.now() + 30_000) {
      return this.cachedToken.value;
    }

    const { email, apiToken } = this.credentials();
    if (!email || !apiToken) {
      throw new BadRequestException(
        'Oblio: OBLIO_EMAIL / OBLIO_API_TOKEN lipsă. Tokenul e în Oblio → Setări → Date cont.',
      );
    }

    try {
      const res = await axios.post(
        'https://www.oblio.eu/api/authorize/token',
        {
          client_id: email,
          client_secret: apiToken,
          grant_type: 'client_credentials',
        },
        {
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
          validateStatus: () => true,
        },
      );

      if (res.status < 200 || res.status >= 300 || !res.data?.access_token) {
        const detail = oblioErrorDetail({ response: res });
        this.logger.error(
          `Oblio auth eșuat (HTTP ${res.status}) pentru client_id=${email}, secretLen=${apiToken.length}: ${detail}`,
        );
        throw new BadRequestException(
          `Oblio auth (${detail}). Verifică OBLIO_EMAIL (emailul de login Oblio) și OBLIO_API_TOKEN (Setări → Date cont; se regenerează la reset parolă).`,
        );
      }

      const expiresIn = Number(res.data.expires_in) || 3600;
      this.cachedToken = {
        value: res.data.access_token,
        expiresAt: Date.now() + expiresIn * 1000,
      };
      return this.cachedToken.value;
    } catch (err: any) {
      if (err instanceof BadRequestException) throw err;
      const detail = oblioErrorDetail(err);
      this.logger.error(`Oblio auth network/error: ${detail}`);
      throw new BadRequestException(`Oblio auth: ${detail}`);
    }
  }

  private credentials() {
    const o = this.config.get('oblio') ?? {};
    return {
      email: clean(o.email),
      apiToken: clean(o.apiToken),
      cif: clean(o.cif),
      invoiceSeries: clean(o.invoiceSeries),
    };
  }
}

/** Trim + elimină ghilimele puse greșit în env (Render / .env). */
function clean(raw: unknown): string {
  return String(raw ?? '')
    .trim()
    .replace(/^["']+|["']+$/g, '')
    .trim();
}

function normalizeCif(raw: string): string {
  let cif = clean(raw).toUpperCase().replace(/\s+/g, '');
  if (cif && !cif.startsWith('RO') && /^\d{2,10}$/.test(cif)) {
    cif = `RO${cif}`;
  }
  return cif;
}

function oblioErrorDetail(err: any): string {
  const data = err?.response?.data;
  if (data == null) return err?.message ?? String(err);
  if (typeof data === 'string') return data;
  const msg =
    data.statusMessage ||
    data.error_description ||
    data.error ||
    data.message ||
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
