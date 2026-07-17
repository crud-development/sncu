import { ContractDocument } from './schemas/contract.schema';

/**
 * Template implicit de contract cadru (folosit când Settings.contractTemplateText
 * e gol). Placeholderele {{...}} sunt înlocuite la randare. Editabil din admin.
 */
export const DEFAULT_CONTRACT_TEMPLATE = `CONTRACT CADRU DE PRESTĂRI SERVICII
de colectare, transport și neutralizare a subproduselor de origine animală
ce nu sunt destinate consumului uman (SNCU)

Nr. {{contractNo}} din data {{contractDate}}

1. PĂRȚILE CONTRACTANTE

1.1. PRESTATOR: BIOECOLAB, operator autorizat ANSVSA pentru gestionarea SNCU
conform Regulamentului (CE) nr. 1069/2009, denumit în continuare „Prestatorul".

1.2. BENEFICIAR: {{companyName}}, cu sediul în {{address}}, {{city}}, județ {{judet}},
CUI {{cui}}{{regComLine}}, reprezentată de {{adminName}}, legitimat cu CI seria
{{adminIdSeries}} nr. {{adminIdNumber}}, denumit în continuare „Beneficiarul".

2. OBIECTUL CONTRACTULUI

2.1. Prestatorul se obligă să colecteze, transporte și neutralizeze subprodusele
de origine animală nedestinate consumului uman (Categoriile 1, 2 și 3) generate de
Beneficiar la punctele de lucru declarate, conform legislației în vigoare.

3. PUNCTELE DE LUCRU DESERVITE

{{workpointsBlock}}

4. DURATA CONTRACTULUI

4.1. Prezentul contract se încheie pe o perioadă de 12 luni de la data semnării,
respectiv până la data de {{expiresDate}}, cu posibilitatea de prelungire.

5. OBLIGAȚIILE BENEFICIARULUI

5.1. Să colecteze și depoziteze SNCU în recipiente etanșe, etichetate, refrigerate
când este necesar; să solicite ridicarea la timp; să pună la dispoziție documentele
de însoțire; să asigure accesul vehiculului autorizat; să arhiveze documentele de
predare minimum 2 ani.

6. TARIFE

6.1. Contractul cadru anual: 330 lei + TVA. Fiecare preluare efectivă se tarifează
distinct, în funcție de tip, categorie și cantitate, comunicat la confirmarea comenzii.

7. DISPOZIȚII FINALE

7.1. Prezentul contract a fost semnat electronic de către Beneficiar, semnătura având
valoare juridică conform legislației privind semnătura electronică.`;

/** Construiește blocul text cu punctele de lucru. */
function workpointsBlock(contract: ContractDocument): string {
  return contract.snapshot.workpoints
    .map((wp, i) => {
      const name = wp.denumire ? `${wp.denumire} — ` : '';
      return `  ${i + 1}. ${name}${wp.address}\n     Activitate: ${wp.tipActivitate}\n     Nr. autorizație/document sanitar-veterinar: ${wp.sanitaryAuthNumber}`;
    })
    .join('\n');
}

function fmtDate(d?: Date): string {
  return d ? new Date(d).toLocaleDateString('ro-RO') : '__________';
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

type SnapshotWorkpoint = ContractDocument['snapshot']['workpoints'][number];

/** Date afișate pe un rând din §2.4 (punct de lucru, nu sediu social). */
function workpointDisplay(contract: ContractDocument, wp: SnapshotWorkpoint) {
  return {
    address: wp.address ?? '',
    activity: wp.tipActivitate ?? '',
    representative:
      wp.contactPerson ||
      contract.snapshot.admin.name ||
      contract.snapshot.contact.person ||
      '',
    phone: wp.contactPhone || contract.snapshot.contact.phone || '',
  };
}

function formatWorkpointTextEntry(
  contract: ContractDocument,
  wp: SnapshotWorkpoint,
  index: number,
): string {
  const d = workpointDisplay(contract, wp);
  return (
    ` ${index + 1}.  Localitatea ${d.address}\n` +
    `Conf. Certificat Constatator, Leg.359/2004. \n` +
    ` Activitatea: ${d.activity} / Deseuri rezultate categoria a I; II; III-a. \n` +
    ` Reprezentant legal punct lucru: ${d.representative} / Tel: ${d.phone}.`
  );
}

/**
 * Doc-ul Google are 3 sloturi hardcodate în §2.4 cu aceleași placeholdere ca sediul
 * social. Le înlocuim cu câte un bloc per punct de lucru din snapshot.
 */
function fillSection24Text(text: string, contract: ContractDocument): string {
  const wps = contract.snapshot.workpoints ?? [];
  if (!wps.length) return text;

  const blocks = wps
    .map((wp, i) => formatWorkpointTextEntry(contract, wp, i))
    .join('\n\n\n');

  return text.replace(
    /(2\.4\.\s*PRESTATORUL[\s\S]*?BENEFICIAR\s*:?\s*)([\s\S]*?)(?=\s*3\.\s*VALOAREA)/i,
    (_m, intro: string) => `${intro}\n\n\n${blocks}\n\n\n\n\n\n\n`,
  );
}

/**
 * Reconstruiește lista din §2.4 în HTML-ul exportat din Google Docs: clonează primul
 * slot ca șablon, umple N puncte de lucru, elimină sloturile goale.
 */
function fillSection24Html(html: string, contract: ContractDocument): string {
  const wps = contract.snapshot.workpoints ?? [];
  if (!wps.length) return html;

  const start24 = html.search(/2\.4\./);
  const start3 = html.indexOf('3. VALOAREA', start24);
  if (start24 < 0 || start3 < 0) return html;

  const section = html.slice(start24, start3);
  // Un singur <p> — fără a traversa </p> (altfel match-ul începe pe paragrafe goale).
  const entryRe =
    /<p[^>]*>(?:(?!<\/p>)[\s\S])*Localitatea(?:(?!<\/p>)[\s\S])*&lt;adresa&gt;(?:(?!<\/p>)[\s\S])*<\/p>/g;
  const entryStarts: number[] = [];
  let m: RegExpExecArray | null;
  while ((m = entryRe.exec(section)) !== null) {
    entryStarts.push(m.index);
  }
  if (!entryStarts.length) return html;

  const firstStart = entryStarts[0];
  const lastTel = section.lastIndexOf('&lt;telefon&gt;');
  if (lastTel < 0) return html;
  const afterTel = section.indexOf('</p>', lastTel);
  if (afterTel < 0) return html;
  const entriesEnd = afterTel + 4;

  const secondStart = entryStarts.length > 1 ? entryStarts[1] : entriesEnd;
  const template = section.slice(firstStart, secondStart);

  const filled = wps
    .map((wp, i) => {
      const d = workpointDisplay(contract, wp);
      let entry = template;
      entry = entry.replace(/(>)(?:&nbsp;)?\d+(<\/span>)/, `$1${i + 1}$2`);
      entry = entry.replace(
        /&lt;adresa&gt;,\s*&lt;Localitate&gt;\s*,\s*&lt;judet&gt;/g,
        escapeHtml(d.address),
      );
      entry = entry.replace(/&lt;activitatea&gt;/g, escapeHtml(d.activity));
      entry = entry.replace(/&lt;reprezentant&gt;/g, escapeHtml(d.representative));
      entry = entry.replace(/&lt;telefon&gt;/g, escapeHtml(d.phone));
      return entry;
    })
    .join('');

  const newSection =
    section.slice(0, firstStart) + filled + section.slice(entriesEnd);
  return html.slice(0, start24) + newSection + html.slice(start3);
}

/** Actualizează mențiunea hardcodată „3(trei) puncte de lucru” din §3.1. */
function fillWorkpointCount(content: string, count: number): string {
  const label =
    count === 1 ? '1 punct de lucru' : `${count} puncte de lucru`;
  // În HTML, „/” și „3(trei)” pot fi în span-uri separate.
  return content.replace(
    /3\s*\(\s*trei\s*\)\s*puncte de lucru/gi,
    label,
  );
}

/** Valorile pentru placeholderele template-ului oficial BioEcoLab. */
function contractValues(contract: ContractDocument): Record<string, string> {
  const s = contract.snapshot;
  const date = fmtDate(contract.signedAt ?? (contract as any).createdAt);
  const activities = s.workpoints.map((w) => w.tipActivitate).filter(Boolean).join(', ');
  const sanitary = s.workpoints.map((w) => w.sanitaryAuthNumber).filter(Boolean).join(', ');
  const wpAddresses = s.workpoints.map((w) => w.address).filter(Boolean).join('; ');

  return {
    SERIE: contract.series ?? '',
    serie: contract.series ?? '',
    numar: contract.number != null ? String(contract.number) : '',
    Data: date,
    'data emiterii': date,
    'nume firma': s.company.companyName ?? '',
    'nume companie': s.company.companyName ?? '',
    cui: s.company.cui ?? '',
    'nr reg com': s.company.regCom ?? '',
    adresa: s.company.address ?? '',
    judet: s.company.judet ?? '',
    Localitate: s.company.city ?? '',
    localitate: s.company.city ?? '',
    telefon: s.contact.phone ?? '',
    'adresa email': s.contact.email ?? '',
    reprezentant: s.admin.name ?? '',
    administrator: s.admin.name ?? '',
    'nume si prenume': s.contact.person ?? '',
    'serie si nr CI Admin': [s.admin.idSeries, s.admin.idNumber].filter(Boolean).join(' '),
    activitatea: activities,
    'aut sanitar veterinara': sanitary,
    'punct de lucru': wpAddresses,
    pret: '330 lei + TVA',
    caen: '',
    'data start aut': '',
    'data stop aut': '',
  };
}

/** Randează template-ul din Google Docs ca TEXT (placeholdere `<...>`). */
export function renderDriveTemplate(text: string, contract: ContractDocument): string {
  const map = { ...contractValues(contract), semnatura: '(semnătură electronică — vezi mai jos)' };
  const wpCount = contract.snapshot.workpoints?.length ?? 0;
  let out = fillSection24Text(text, contract);
  out = fillWorkpointCount(out, wpCount);
  return out.replace(/<([^<>]{1,40})>/g, (full, key) =>
    Object.prototype.hasOwnProperty.call(map, key) ? map[key] : full,
  );
}

/**
 * Placeholderele din Google Doc sunt marcate cu roșu (#ff0000) doar ca ghid de editare.
 * La randare textul completat trebuie să fie negru.
 */
function neutralizePlaceholderRed(html: string): string {
  return html
    .replace(/color\s*:\s*#ff0000\b/gi, 'color:#000000')
    .replace(/color\s*:\s*red\b/gi, 'color:#000000')
    .replace(/color\s*:\s*rgb\(\s*255\s*,\s*0\s*,\s*0\s*\)/gi, 'color:#000000');
}

/**
 * Randează template-ul HTML din Google Docs (placeholdere `&lt;...&gt;`) cu datele
 * contractului. Semnătura electronică (PNG data URL) e încorporată ca imagine.
 */
export function renderDriveHtml(
  html: string,
  contract: ContractDocument,
  signatureDataUrl?: string,
): string {
  const values = contractValues(contract);
  const sig = signatureDataUrl
    ? `<img src="${signatureDataUrl}" style="height:80px" alt="semnătură" />`
    : '________________';

  const replace = (key: string): string | null => {
    if (key === 'semnatura') return sig;
    if (Object.prototype.hasOwnProperty.call(values, key)) return escapeHtml(values[key]);
    return null;
  };

  const wpCount = contract.snapshot.workpoints?.length ?? 0;
  let out = fillSection24Html(html, contract);
  out = fillWorkpointCount(out, wpCount);

  // În export-ul HTML, placeholderele apar mereu escapate: &lt;key&gt;.
  out = out.replace(/&lt;([^&]{1,40})&gt;/g, (full, key) => replace(key) ?? full);
  return neutralizePlaceholderRed(out);
}

/** Înlocuiește placeholderele din template cu datele contractului. */
export function renderContract(template: string, contract: ContractDocument): string {
  const s = contract.snapshot;
  const map: Record<string, string> = {
    contractNo: contract.contractNo ?? '(draft)',
    contractDate: fmtDate(contract.signedAt ?? (contract as any).createdAt),
    expiresDate: fmtDate(contract.expiresAt),
    companyName: s.company.companyName ?? '',
    cui: s.company.cui ?? '',
    regComLine: s.company.regCom ? `, Reg. Com. ${s.company.regCom}` : '',
    address: s.company.address ?? '',
    city: s.company.city ?? '',
    judet: s.company.judet ?? '',
    adminName: s.admin.name ?? '__________',
    adminIdSeries: s.admin.idSeries ?? '____',
    adminIdNumber: s.admin.idNumber ?? '______',
    workpointsBlock: workpointsBlock(contract),
  };

  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => map[key] ?? '');
}
