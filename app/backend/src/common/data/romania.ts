/**
 * Liste de referință folosite în formulare și validări.
 */

export const JUDETE = [
  'Alba', 'Arad', 'Argeș', 'Bacău', 'Bihor', 'Bistrița-Năsăud', 'Botoșani',
  'Brașov', 'Brăila', 'București', 'Buzău', 'Caraș-Severin', 'Călărași',
  'Cluj', 'Constanța', 'Covasna', 'Dâmbovița', 'Dolj', 'Galați', 'Giurgiu',
  'Gorj', 'Harghita', 'Hunedoara', 'Ialomița', 'Iași', 'Ilfov', 'Maramureș',
  'Mehedinți', 'Mureș', 'Neamț', 'Olt', 'Prahova', 'Satu Mare', 'Sălaj',
  'Sibiu', 'Suceava', 'Teleorman', 'Timiș', 'Tulcea', 'Vaslui', 'Vâlcea',
  'Vrancea',
] as const;

/** Tip activitate la înregistrare (formular de cumpărare) — listă scurtă. */
export const TIP_ACTIVITATE_INREGISTRARE = [
  'Abator / unitate de tăiere',
  'Carmangerie / procesare carne',
  'Restaurant / HoReCa / catering',
  'Magazin alimentar cu raion carne',
  'Fermă de creștere animale',
  'Unitate avicolă',
  'Procesare pește',
  'Procesare lapte / lactate',
  'Altele (industrie alimentară)',
] as const;

/** Tip activitate la nivel de punct de lucru (listă extinsă, US-05). */
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
] as const;

/** Categorii SNCU conform Reg. CE 1069/2009. */
export const CATEGORII_SNCU = ['Categoria 1', 'Categoria 2', 'Categoria 3'] as const;

/** Originea produsului (la comandă). */
export const ORIGINE_PRODUS = [
  'Animala', 'Nonanimala', 'Industriala', 'Alimentatie publica',
] as const;

/** Starea produsului (regim termic, la comandă). */
export const STARE_PRODUS = [
  'Temp. Necontrolata (+25/+40°C)',
  'Temp. Ambientala (+15/+25°C)',
  'Temp. Controlata (+5/+15°C)',
  'Temp. Refrigerata (+0/+4°C)',
  'Temp. Inghetare (0/-12°C)',
  'Temp. Congelare (-18/-25°C)',
] as const;

/** Tip ambalare (la comandă). */
export const TIP_AMBALARE = ['Saci Plastic', 'Vrac', 'Recipient plastic'] as const;
