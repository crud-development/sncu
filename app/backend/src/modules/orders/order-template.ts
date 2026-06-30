import { OrderDocument } from './schemas/order.schema';

export interface OrderTemplateExtra {
  regCom: string;
  judet: string;
  localitate: string;
  adminCI: string;
}

/**
 * Randează template-ul „Cerere de ridicare" din Google Docs (placeholdere `<...>`)
 * cu datele comenzii + câteva date de firmă.
 */
export function renderOrderDriveTemplate(
  text: string,
  order: OrderDocument,
  extra: OrderTemplateExtra,
): string {
  const map: Record<string, string> = {
    'nume firma': order.companyName ?? '',
    telefon: order.contactPhone ?? '',
    cui: order.cui ?? '',
    adresa: order.exactAddress ?? '',
    reprezentant: order.contactPerson ?? '',
    'nr reg com': extra.regCom,
    judet: extra.judet,
    localitate: extra.localitate,
    'serie si nr CI': extra.adminCI,
    'numar contract si data': '',
    'data constatare': '',
  };

  return text.replace(/<([^<>]{1,40})>/g, (full, key) =>
    Object.prototype.hasOwnProperty.call(map, key) ? map[key] : full,
  );
}
