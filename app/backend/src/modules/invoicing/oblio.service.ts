import { Injectable, Logger } from '@nestjs/common';
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
    return Boolean(o?.email && o?.apiToken && o?.cif);
  }

  async issueInvoice(input: InvoiceInput): Promise<InvoiceResult> {
    const quantity = Math.max(1, input.quantity ?? 1);
    const unitPrice =
      input.unitPriceNoVat ?? round2(input.noVat / quantity);
    const vatPercentage = Math.round(
      (this.config.get<number>('pricing.vatRate') ?? 0.21) * 100,
    );
    const productName =
      input.productName ?? 'Abonament anual gestionare SNCU';

    if (!this.isConfigured) {
      const number = String(Math.floor(1000 + Math.random() * 9000));
      this.logger.warn(
        `Oblio neconfigurat — factură MOCK ${input.cui}: total ${input.total} lei (serie MOCK nr ${number}).`,
      );
      return { series: 'MOCK', number, total: input.total, mock: true };
    }

    try {
      const o = this.config.get('oblio');
      const auth = await axios.post(
        'https://www.oblio.eu/api/authorize/token',
        { client_id: o.email, client_secret: o.apiToken },
      );
      const accessToken = auth.data.access_token;

      const res = await axios.post(
        'https://www.oblio.eu/api/docs/invoice',
        {
          cif: o.cif,
          client: { cif: input.cui, name: input.companyName },
          seriesName: o.invoiceSeries,
          issueDate: new Date().toISOString().slice(0, 10),
          products: [
            {
              name: productName,
              price: unitPrice,
              measuringUnit: 'buc',
              quantity,
              vatName: 'Normala',
              vatPercentage,
            },
          ],
        },
        { headers: { Authorization: `Bearer ${accessToken}` } },
      );

      const data = res.data.data;

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
      this.logger.error(
        `Eroare Oblio: ${err?.response?.data?.statusMessage ?? err.message}`,
      );
      throw err;
    }
  }
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
