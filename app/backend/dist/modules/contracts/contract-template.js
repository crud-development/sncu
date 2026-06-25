"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_CONTRACT_TEMPLATE = void 0;
exports.renderContract = renderContract;
exports.DEFAULT_CONTRACT_TEMPLATE = `CONTRACT CADRU DE PRESTĂRI SERVICII
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
function workpointsBlock(contract) {
    return contract.snapshot.workpoints
        .map((wp, i) => {
        const name = wp.denumire ? `${wp.denumire} — ` : '';
        return `  ${i + 1}. ${name}${wp.address}\n     Activitate: ${wp.tipActivitate}\n     Nr. autorizație/document sanitar-veterinar: ${wp.sanitaryAuthNumber}`;
    })
        .join('\n');
}
function fmtDate(d) {
    return d ? new Date(d).toLocaleDateString('ro-RO') : '__________';
}
function renderContract(template, contract) {
    const s = contract.snapshot;
    const map = {
        contractNo: contract.contractNo ?? '(draft)',
        contractDate: fmtDate(contract.signedAt ?? contract.createdAt),
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
//# sourceMappingURL=contract-template.js.map