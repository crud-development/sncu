import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

export interface InvoiceResult {
  series: string;
  number: string;
  total: number;
  mock: boolean;
  link?: string;
}

export interface InvoiceInput {
  companyName: string;
  cui: string;
  noVat: number;
  vat: number;
  total: number;
}

/**
 * Facturare prin Oblio. Dacă lipsesc credențialele, rulează în mod mock
 * (emite o factură simulată) astfel încât fluxul de plată să meargă local.
 */
@Injectable()
export class OblioService {
  private readonly logger = new Logger(OblioService.name);

  constructor(private readonly config: ConfigService) {}

  private get configured(): boolean {
    const o = this.config.get('oblio');
    return Boolean(o?.email && o?.apiToken && o?.cif);
  }

  async issueInvoice(input: InvoiceInput): Promise<InvoiceResult> {
    if (!this.configured) {
      const number = String(Math.floor(1000 + Math.random() * 9000));
      this.logger.warn(
        `Oblio neconfigurat — factură MOCK ${input.cui}: total ${input.total} lei (serie MOCK nr ${number}).`,
      );
      return { series: 'MOCK', number, total: input.total, mock: true };
    }

    try {
      const o = this.config.get('oblio');
      // 1. Autentificare (token de acces).
      const auth = await axios.post(
        'https://www.oblio.eu/api/authorize/token',
        { client_id: o.email, client_secret: o.apiToken },
      );
      const accessToken = auth.data.access_token;

      // 2. Emitere factură.
      const res = await axios.post(
        'https://www.oblio.eu/api/docs/invoice',
        {
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
        },
        { headers: { Authorization: `Bearer ${accessToken}` } },
      );

      const data = res.data.data;
      return {
        series: data.seriesName,
        number: String(data.number),
        total: input.total,
        mock: false,
        link: data.link,
      };
    } catch (err: any) {
      this.logger.error(
        `Eroare Oblio: ${err?.response?.data?.statusMessage ?? err.message}`,
      );
      throw err;
    }
  }
}
