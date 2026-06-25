export const JUDETE = [
  'Alba', 'Arad', 'Argeș', 'Bacău', 'Bihor', 'Bistrița-Năsăud', 'Botoșani',
  'Brașov', 'Brăila', 'București', 'Buzău', 'Caraș-Severin', 'Călărași',
  'Cluj', 'Constanța', 'Covasna', 'Dâmbovița', 'Dolj', 'Galați', 'Giurgiu',
  'Gorj', 'Harghita', 'Hunedoara', 'Ialomița', 'Iași', 'Ilfov', 'Maramureș',
  'Mehedinți', 'Mureș', 'Neamț', 'Olt', 'Prahova', 'Satu Mare', 'Sălaj',
  'Sibiu', 'Suceava', 'Teleorman', 'Timiș', 'Tulcea', 'Vaslui', 'Vâlcea',
  'Vrancea',
];

export const TIP_ACTIVITATE = [
  'Abator / unitate de tăiere',
  'Carmangerie / procesare carne',
  'Restaurant / HoReCa / catering',
  'Magazin alimentar cu raion carne',
  'Fermă de creștere animale',
  'Unitate avicolă',
  'Procesare pește',
  'Procesare lapte / lactate',
  'Altele (industrie alimentară)',
];

// Listă extinsă de tipuri de activitate la nivel de punct de lucru (US-05).
export const TIP_ACTIVITATE_PUNCT_LUCRU = [
  'Restaurant', 'Fast-food', 'Pizzerie', 'Cafenea', 'Bar', 'Pub', 'Cofetărie',
  'Patiserie', 'Brutărie', 'Gelaterie', 'Catering', 'Cantină', 'Food Truck',
  'Hotel cu restaurant', 'Pensiune cu restaurant', 'Magazin alimentar',
  'Minimarket', 'Supermarket', 'Hypermarket', 'Măcelărie', 'Carmangerie',
  'Pescărie', 'Magazin produse congelate', 'Laborator de cofetărie',
  'Laborator de patiserie', 'Fabrică de produse alimentare',
  'Fabrică de panificație', 'Fabrică de produse din carne',
  'Fabrică de produse lactate', 'Fabrică de produse din pește',
  'Fabrică de băuturi', 'Abator', 'Centru de sacrificare',
  'Depozit produse alimentare', 'Distribuitor produse alimentare',
  'Transportator produse alimentare', 'Fermă bovine', 'Fermă porcine',
  'Fermă ovine', 'Fermă caprine', 'Fermă avicolă', 'Fermă piscicolă',
  'Centru de colectare lapte', 'Cabinet veterinar', 'Clinică veterinară',
  'Spital veterinar', 'Farmacie veterinară', 'Pet Shop',
  'Adăpost pentru animale', 'Pensiune pentru animale',
  'Salon de toaletaj animale', 'Spital', 'Clinică medicală', 'Centru medical',
  'Cămin de bătrâni', 'Grădiniță cu bucătărie', 'Școală cu cantină',
  'Universitate cu cantină', 'Unitate militară cu bloc alimentar',
  'Firmă de catering pentru evenimente',
  'Organizator de evenimente cu servicii alimentare',
  'Bucătărie centralizată (central kitchen)',
  'Dark Kitchen / Ghost Kitchen', 'Altă activitate (specificați)',
];

export const CATEGORII_SNCU = ['Categoria 1', 'Categoria 2', 'Categoria 3'];

export const ORIGINE_PRODUS = [
  'Animala', 'Nonanimala', 'Industriala', 'Alimentatie publica',
];

export const STARE_PRODUS = [
  'Temp. Necontrolata (+25/+40°C)',
  'Temp. Ambientala (+15/+25°C)',
  'Temp. Controlata (+5/+15°C)',
  'Temp. Refrigerata (+0/+4°C)',
  'Temp. Inghetare (0/-12°C)',
  'Temp. Congelare (-18/-25°C)',
];

export const TIP_AMBALARE = ['Saci Plastic', 'Vrac', 'Recipient plastic'];

export const ORDER_STATUS = ['Plasată', 'Confirmată', 'Onorată', 'Anulată'];

// Prețuri (lei, fără TVA) — trebuie să corespundă config-ului backend.
export const PRICING = {
  base: 330,
  extraWorkpoint: 49.49,
  includedWorkpoints: 3,
  vatRate: 0.19,
};

/** Preț fără TVA pentru un număr dat de puncte de lucru. */
export function priceNoVat(workpoints: number): number {
  const extra = Math.max(0, workpoints - PRICING.includedWorkpoints);
  return PRICING.base + extra * PRICING.extraWorkpoint;
}

export function formatLei(value: number): string {
  return value.toLocaleString('ro-RO', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' lei';
}
