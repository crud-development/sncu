import { OrderDocument } from './schemas/order.schema';

export interface OrderTemplateExtra {
  regCom: string;
  judet: string;
  localitate: string;
  adminCI: string;
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function orderValues(order: OrderDocument, extra: OrderTemplateExtra): Record<string, string> {
  return {
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
}

/** Randează template-ul „Cerere de ridicare" ca TEXT (placeholdere `<...>`). */
export function renderOrderDriveTemplate(
  text: string,
  order: OrderDocument,
  extra: OrderTemplateExtra,
): string {
  const map = orderValues(order, extra);
  return text.replace(/<([^<>]{1,40})>/g, (full, key) =>
    Object.prototype.hasOwnProperty.call(map, key) ? map[key] : full,
  );
}

/** Randează template-ul HTML „Cerere de ridicare" (placeholdere `&lt;...&gt;`). */
export function renderOrderDriveHtml(
  html: string,
  order: OrderDocument,
  extra: OrderTemplateExtra,
): string {
  const map = orderValues(order, extra);
  return html.replace(/&lt;([^&]{1,40})&gt;/g, (full, key) =>
    Object.prototype.hasOwnProperty.call(map, key) ? escapeHtml(map[key]) : full,
  );
}
