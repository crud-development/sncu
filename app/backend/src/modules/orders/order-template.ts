import { OrderDocument } from './schemas/order.schema';

export interface OrderTemplateExtra {
  regCom: string;
  judet: string;
  localitate: string;
  adminCI: string;
  adminName: string;
  /** Adresa sediu social (pentru antetul cererii). */
  companyAddress: string;
  /** Ex: „CF-12 din 01.01.2026”. */
  contractNoAndDate: string;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function fmtDate(d?: Date | string | null): string {
  if (!d) return '';
  return new Date(d).toLocaleDateString('ro-RO');
}

function fmtDateTime(d?: Date | string | null, interval?: string): string {
  if (!d) return interval ?? '';
  const date = fmtDate(d);
  return interval ? `${date} ${interval}` : date;
}

/** Placeholderele `<...>` din template-ul Google Doc. */
function orderValues(
  order: OrderDocument,
  extra: OrderTemplateExtra,
): Record<string, string> {
  const createdAt = (order as any).createdAt as Date | undefined;
  return {
    'nume firma': order.companyName ?? '',
    telefon: order.contactPhone ?? '',
    cui: order.cui ?? '',
    // În antet: Str. <adresa> = sediu social; ridicarea se completează pe linia cu puncte.
    adresa: extra.companyAddress || order.exactAddress || '',
    reprezentant: extra.adminName || order.contactPerson || '',
    'nr reg com': extra.regCom,
    judet: extra.judet,
    localitate: extra.localitate,
    'serie si nr CI': extra.adminCI,
    'numar contract si data': extra.contractNoAndDate,
    'data constatare': fmtDateTime(order.desiredDate, order.timeInterval),
    // Aliasuri utile dacă template-ul e actualizat ulterior.
    'nr comanda': order.orderNo ?? '',
    'data plasare': fmtDate(createdAt),
    'denumire deseu': order.wasteName ?? '',
    origine: order.origin ?? '',
    categorie: order.sncuCategory ?? '',
    cantitate: order.estimatedQuantityKg != null
      ? String(order.estimatedQuantityKg)
      : '',
    'adresa colectare': order.exactAddress ?? '',
    ambalare: order.packagingType ?? '',
    'stare produs': order.productState ?? '',
  };
}

/**
 * Completează liniile cu puncte din template-ul oficial (TXT sau HTML exportat),
 * unde majoritatea câmpurilor comenzii NU sunt placeholdere `<...>`.
 */
function fillDottedBlanks(content: string, order: OrderDocument): string {
  const createdAt = (order as any).createdAt as Date | undefined;
  const qty = order.estimatedQuantityKg != null
    ? String(order.estimatedQuantityKg)
    : '';
  const val = order.accountingValue != null ? String(order.accountingValue) : '';

  const categoryMark = (label: string, match: RegExp) => {
    if (!order.sncuCategory || !match.test(order.sncuCategory)) return label;
    return `[X] ${label}`;
  };

  let out = content;

  // Nr. înregistrare / data comenzii (antet).
  out = out.replace(
    /Nr\.\s*inreg\.\s*\/\s*Data\s*\.{5,}\/\s*\.{5,}/gi,
    `Nr. inreg. / Data ${order.orderNo || '..........'} / ${fmtDate(createdAt) || '....................'}`,
  );

  out = out.replace(
    /Denumirea Deseului\/Produsului\s*\.{5,}/gi,
    `Denumirea Deseului/Produsului ${order.wasteName || '........................'}`,
  );

  out = out.replace(
    /Produse de Origine:\s*Animala\s*\/\s*Nonanimala\s*\/\s*Industrial\s*\/\s*\.{5,}/gi,
    `Produse de Origine: ${order.origin || 'Animala / Nonanimala / Industrial / ..........'}`,
  );

  out = out.replace(
    /Cantitatea Totala BRUTA\s*\/\s*NETA\s*\/\s*\.{5,}\/\s*\.{5,}\s*\/\s*Tone\s*\/\s*Kg\./gi,
    `Cantitatea Totala BRUTA / NETA / ${qty || '....'} / ${qty || '....'} / Kg.`,
  );

  out = out.replace(
    /Adresa Colectarii Exacte\s*\.{5,}/gi,
    `Adresa Colectarii Exacte ${order.exactAddress || '........................'}`,
  );

  out = out.replace(
    /Motiv Depreciere\/Incadrare Deseu\s*\/\s*\.{5,}/gi,
    `Motiv Depreciere/Incadrare Deseu / ${order.observations || '........................'}`,
  );

  out = out.replace(
    /Valoarea contabila\.{5,}\s*Lei/gi,
    `Valoarea contabila ${val || '..........'} Lei`,
  );

  // Marchează categoria SNCU selectată.
  out = out.replace(
    /\*a-I\s*-a\s*\/\s*\*a-II\s*-a\s*\/\s*\*a-III\s*-a/gi,
    [
      categoryMark('a-I-a', /1|I\b/i),
      categoryMark('a-II-a', /2|II\b/i),
      categoryMark('a-III-a', /3|III\b/i),
    ].join(' / '),
  );

  out = out.replace(
    /Tara de origine\s*\.{5,}/gi,
    `Tara de origine ${order.countryOfOrigin || '..........'}`,
  );

  out = out.replace(
    /Producator\s*\.{5,}/gi,
    `Producator ${order.producer || '..........'}`,
  );

  out = out.replace(
    /Distribuitor\.{5,}/gi,
    `Distribuitor ${order.distributor || '..........'}`,
  );

  out = out.replace(
    /Deseurile\/Produsele sunt ambalate in\s*\.{5,}/gi,
    `Deseurile/Produsele sunt ambalate in ${order.packagingType || '..........'}`,
  );

  out = out.replace(
    /Activitatea Desfasurata Unitate\/Institutie\s*\.{5,}/gi,
    `Activitatea Desfasurata Unitate/Institutie ${order.activity || '..........'}`,
  );

  out = out.replace(
    /Document Sanitar-Veterinar,\s*Nr\.\s*\.{5,}\/\s*\.{5,}/gi,
    `Document Sanitar-Veterinar, Nr. ${order.sanitaryAuthNumber || '..........'}`,
  );

  out = out.replace(
    /Persoana direct Responsabila Procedura 24\/24:\s*\.{5,}\s*\/\s*Tel\.\s*Contact:\s*\.{5,}\s*\/\s*Adresa E-mail\s*\.{5,}/gi,
    `Persoana direct Responsabila Procedura 24/24: ${order.contactPerson || '..........'} / Tel. Contact: ${order.contactPhone || '..........'} / Adresa E-mail ${order.contactEmail || '..........'}`,
  );

  out = out.replace(
    /Nr\.\s*Certificat CSV[^:]*:\s*\.{5,}/gi,
    `Nr. Certificat CSV / Document Sechestru – Retinere / Proces Verbal / Nr. Sigiliu / Emis de: ${order.csvDoc || '..........'}`,
  );

  // Prima linie din anexă.
  out = out.replace(
    /1\.\s*Subprodus:\s*[.…\s]+\s*\/\s*Cantitatea\s*[.…\s]+\s*\/\s*Valoarea\s*[.…\s]*/i,
    `1. Subprodus: ${order.wasteName || '..........'} / Cantitatea ${qty || '....'} / Valoarea ${val || '....'}`,
  );

  // Data de la finalul formularului (prima apariție după „Reprezentant legal”).
  out = out.replace(
    /(Reprezentant legal[\s\S]{0,80}?)Data:\s*\.{5,}/i,
    `$1Data: ${fmtDate(createdAt) || '..........'}`,
  );

  // Marchează starea produsului dacă apare în listă.
  if (order.productState) {
    const state = order.productState;
    // Înlocuire exactă a fragmentului din listă, dacă e regăsit.
    const escaped = state.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    out = out.replace(new RegExp(escaped, 'i'), `[X] ${state}`);
  }

  return out;
}

function applyTemplate(
  content: string,
  order: OrderDocument,
  extra: OrderTemplateExtra,
  replacePlaceholders: (src: string, map: Record<string, string>) => string,
): string {
  const map = orderValues(order, extra);
  return fillDottedBlanks(replacePlaceholders(content, map), order);
}

/** Randează template-ul „Cerere de ridicare" ca TEXT (placeholdere `<...>`). */
export function renderOrderDriveTemplate(
  text: string,
  order: OrderDocument,
  extra: OrderTemplateExtra,
): string {
  return applyTemplate(text, order, extra, (src, map) =>
    src.replace(/<([^<>]{1,60})>/g, (full, key) =>
      Object.prototype.hasOwnProperty.call(map, key) ? map[key] : full,
    ),
  );
}

/** Randează template-ul HTML „Cerere de ridicare" (placeholdere `&lt;...&gt;`). */
export function renderOrderDriveHtml(
  html: string,
  order: OrderDocument,
  extra: OrderTemplateExtra,
): string {
  return applyTemplate(html, order, extra, (src, map) =>
    src.replace(/&lt;([^&]{1,60})&gt;/g, (full, key) =>
      Object.prototype.hasOwnProperty.call(map, key) ? escapeHtml(map[key]) : full,
    ),
  );
}
