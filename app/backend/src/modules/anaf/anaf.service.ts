import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

const ANAF_URL = 'https://webservicesp.anaf.ro/api/PlatitorTvaRest/v9/tva';

/** Cod auto județ → denumire (lista folosită în formularele platformei). */
const JUDET_BY_AUTO: Record<string, string> = {
  AB: 'Alba', AR: 'Arad', AG: 'Argeș', BC: 'Bacău', BH: 'Bihor',
  BN: 'Bistrița-Năsăud', BT: 'Botoșani', BV: 'Brașov', BR: 'Brăila',
  B: 'București', BZ: 'Buzău', CS: 'Caraș-Severin', CL: 'Călărași',
  CJ: 'Cluj', CT: 'Constanța', CV: 'Covasna', DB: 'Dâmbovița', DJ: 'Dolj',
  GL: 'Galați', GR: 'Giurgiu', GJ: 'Gorj', HR: 'Harghita', HD: 'Hunedoara',
  IL: 'Ialomița', IS: 'Iași', IF: 'Ilfov', MM: 'Maramureș', MH: 'Mehedinți',
  MS: 'Mureș', NT: 'Neamț', OT: 'Olt', PH: 'Prahova', SM: 'Satu Mare',
  SJ: 'Sălaj', SB: 'Sibiu', SV: 'Suceava', TR: 'Teleorman', TM: 'Timiș',
  TL: 'Tulcea', VS: 'Vaslui', VL: 'Vâlcea', VN: 'Vrancea',
};

export interface AnafCompany {
  cui: string;
  companyName: string;
  regCom: string;
  address: string;
  city: string;
  judet: string;
  codPostal: string;
}

function titleCase(s: string): string {
  return s
    .toLowerCase()
    .replace(/(^|\s|-)\p{L}/gu, (m) => m.toUpperCase());
}

/** Curăță prefixele și sufixele de localitate (Mun., Oraș, „Com. X", Sat). */
function cleanLocalitate(s?: string): string {
  if (!s) return '';
  return s
    .replace(/\s+com\.?\s+.*$/i, '') // „Tunari Com. Tunari" -> „Tunari"
    .replace(/^(mun\.?|municipiul|ora[sș]\.?|ora[sș]ul|com\.?|comuna|sat)\s+/i, '')
    .trim();
}

@Injectable()
export class AnafService {
  private readonly logger = new Logger(AnafService.name);

  /** Caută datele firmei după CUI la ANAF și le normalizează pentru formular. */
  async lookup(rawCui: string): Promise<AnafCompany> {
    const cui = parseInt(String(rawCui).replace(/[^0-9]/g, ''), 10);
    if (!cui) {
      throw new BadRequestException('CUI invalid.');
    }

    const data = new Date().toISOString().slice(0, 10);
    let payload: any;
    try {
      const res = await axios.post(ANAF_URL, [{ cui, data }], {
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'BioEcoLab-SNCU/1.0',
        },
        timeout: 9000,
      });
      payload = res.data;
    } catch (err: any) {
      this.logger.warn(`ANAF indisponibil pentru CUI ${cui}: ${err.message}`);
      throw new BadRequestException(
        'Serviciul ANAF este indisponibil momentan. Completează manual.',
      );
    }

    const found = payload?.found?.[0];
    if (!found) {
      throw new BadRequestException('CUI-ul nu a fost găsit la ANAF.');
    }

    const dg = found.date_generale ?? {};
    const ad = found.adresa_sediu_social ?? {};

    const street = [
      ad.sdenumire_Strada,
      ad.snumar_Strada ? `nr. ${ad.snumar_Strada}` : '',
      ad.sdetalii_Adresa,
    ]
      .filter(Boolean)
      .join(' ')
      .trim();

    const auto = String(ad.scod_JudetAuto ?? '').toUpperCase();
    const judet =
      JUDET_BY_AUTO[auto] ||
      (ad.sdenumire_Judet ? titleCase(String(ad.sdenumire_Judet)) : '');

    return {
      cui: String(cui),
      companyName: dg.denumire ?? '',
      regCom: dg.nrRegCom ?? '',
      address: street || dg.adresa || '',
      city: cleanLocalitate(ad.sdenumire_Localitate),
      judet,
      codPostal: String(ad.scod_Postal ?? dg.codPostal ?? ''),
    };
  }
}
