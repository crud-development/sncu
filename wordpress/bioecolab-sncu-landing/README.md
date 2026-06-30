# BioEcoLab — Landing SNCU (plugin WordPress)

Template de pagină pentru landing page-ul **„Colectare deșeuri alimentare SNCU”**
(`/colectare-deseuri-alimentare-sncu`), cu **toate textele editabile din admin** prin ACF.

Plugin portabil: nu modifică tema existentă. Adaugă un template de pagină selectabil
și randează landing-ul cu CSS/JS proprii (design „verde eco + dark professional”).

## Cerințe

- WordPress 6.x, PHP 7.4+
- **Advanced Custom Fields** — versiunea **gratuită** este suficientă. Listele de
  carduri sunt câmpuri *Group* numerotate (cu câteva sloturi-tampon pentru elemente noi),
  nu *Repeater*, deci nu necesită ACF PRO.
  Fără ACF, pagina funcționează cu textele implicite, dar nu sunt editabile din admin.

## Instalare

1. Copiază folderul `bioecolab-sncu-landing/` în `wp-content/plugins/`
   (sau arhivează-l ca `.zip` și încarcă-l din **Plugins → Add New → Upload**).
2. Activează pluginul **„BioEcoLab — Landing SNCU”**.
3. Creează (sau editează) pagina cu slug-ul `colectare-deseuri-alimentare-sncu`.
4. În panoul **Page Attributes → Template**, alege **„Landing SNCU (BioEcoLab)”**.
5. Publică. Sub editor apare grupul de câmpuri **„Conținut Landing SNCU”**, cu
   taburi pentru fiecare secțiune. Editezi orice text/card; gol = text implicit.

## Structură

```
bioecolab-sncu-landing/
├── bioecolab-sncu-landing.php   # bootstrap: template, asset-uri, notice ACF
├── includes/
│   ├── config.php               # schema de conținut + default-uri (sursă unică)
│   ├── icons.php                # iconițe SVG inline
│   └── acf-fields.php           # înregistrare câmpuri ACF din schemă
├── templates/
│   ├── template-sncu-landing.php
│   └── parts/                   # câte un fișier per secțiune
└── assets/
    ├── css/landing.css
    └── js/landing.js
```

## Editarea conținutului

Toate secțiunile din analiză sunt acoperite: Hero, statistici, industrii,
categorii SNCU, riscuri, avantaje, echipă, testimoniale, obligații, preț, pași,
footer CTA. Fiecare are titluri/texte editabile, iar listele (carduri, pași,
testimoniale, statistici) au câte un câmp *Group* numerotat per element. Un element
lăsat complet gol nu apare în pagină — așa „ștergi” un card. Numărul de sloturi =
elementele implicite + un tampon (`BSL_LIST_BUFFER`, implicit 2) pentru adăugări.

### Legătura cu aplicația (plată + înregistrare)

Toate butoanele „Generează contract" duc la pagina de **înregistrare + plată** din
aplicație, iar „Autentificare" la **login**. URL-urile se configurează în tab-ul
*General*:

- **URL aplicație (bază)** — lasă gol dacă aplicația e pe același domeniu (linkuri
  relative: `/inregistrare`, `/login`); sau pune domeniul aplicației, ex.
  `https://app.bioecolab.ro`, și toate butoanele se actualizează automat.
- **Cale înregistrare + plată** — implicit `/inregistrare` (fluxul cu Stripe).
- **Cale autentificare** — implicit `/login`.

> Aplicația (Task 2) servește SPA-ul din root, deci `/inregistrare` și
> `/login` sunt rutele reale ale portalului.

## Personalizarea designului

Paleta și spațierile sunt variabile CSS în `assets/css/landing.css`, sub `.bsl`.
Modifică `--green-*`, `--ink*`, `--radius`, `--maxw` pentru a ajusta brandul.
