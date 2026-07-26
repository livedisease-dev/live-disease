// ================================================================
// LIVE DISEASE — Noms de pays traduits AUTOMATIQUEMENT
// Utilise Intl.DisplayNames : TOUS les 195+ pays, dans TOUTES les langues
// + les 50 États américains
// ================================================================

// Noms courts préférés (pour éviter les noms trop longs sur la carte)
const SHORT_NAMES = {
  US: {en:'USA',fr:'États-Unis',es:'EE.UU.',de:'USA',pt:'EUA',ru:'США',it:'USA',nl:'VS',pl:'USA',tr:'ABD'},
  GB: {en:'UK',fr:'Royaume-Uni',es:'Reino Unido',de:'UK',pt:'Reino Unido',ru:'Великобритания'},
  CD: {en:'DR Congo',fr:'RD Congo',es:'RD Congo',de:'DR Kongo',pt:'RD Congo',ru:'ДР Конго',ar:'الكونغو'},
  CF: {en:'CAR',fr:'Centrafrique',es:'Rep. Centroafricana',de:'Zentralafrika'},
  AE: {en:'UAE',fr:'Émirats A.U.',es:'EAU',de:'VAE'},
  KR: {en:'S. Korea',fr:'Corée du Sud',es:'Corea del Sur',de:'Südkorea'},
  KP: {en:'N. Korea',fr:'Corée du Nord',es:'Corea del Norte',de:'Nordkorea'},
  PG: {en:'Papua N.G.',fr:'Papouasie-N.G.',es:'Papúa N.G.'},
  DO: {en:'Dom. Rep.',fr:'Rép. dominicaine',es:'Rep. Dominicana'},
  BA: {en:'Bosnia',fr:'Bosnie',es:'Bosnia'},
  MK: {en:'N. Macedonia',fr:'Macédoine du N.',es:'Macedonia del N.'},
  GQ: {en:'Eq. Guinea',fr:'Guinée Éq.',es:'Guinea Ec.'},
  TL: {en:'Timor-Leste',fr:'Timor oriental',es:'Timor Oriental'},
  ST: {en:'São Tomé',fr:'Sao Tomé',es:'Santo Tomé'},
  VC: {en:'St. Vincent',fr:'St-Vincent',es:'S. Vicente'},
  KN: {en:'St. Kitts',fr:'St-Kitts',es:'S. Cristóbal'},
  TT: {en:'Trinidad',fr:'Trinité',es:'Trinidad'},
  AG: {en:'Antigua',fr:'Antigua',es:'Antigua'},
};

// Cache des instances Intl.DisplayNames par langue
const _dnCache = {};
function _getDN(lang) {
  if (!_dnCache[lang]) {
    try { _dnCache[lang] = new Intl.DisplayNames([lang], { type: 'region' }); }
    catch(e) { _dnCache[lang] = null; }
  }
  return _dnCache[lang];
}

// Récupère le nom traduit d'un pays (TOUS les pays, TOUTES les langues)
function countryName(iso2) {
  const lang = (typeof currentLang !== 'undefined') ? currentLang : 'en';
  // 1. Nom court préféré si défini
  if (SHORT_NAMES[iso2] && SHORT_NAMES[iso2][lang]) return SHORT_NAMES[iso2][lang];
  // 2. Traduction automatique du navigateur
  const dn = _getDN(lang);
  if (dn) {
    try {
      const n = dn.of(iso2);
      if (n && n !== iso2) return n;
    } catch(e) {}
  }
  // 3. Secours : anglais
  const dnEn = _getDN('en');
  if (dnEn) { try { const n = dnEn.of(iso2); if (n && n !== iso2) return n; } catch(e) {} }
  return null;
}

// ═══════════════════════════════════════════════════════════════
// LES 50 ÉTATS AMÉRICAINS (+ DC)
// ═══════════════════════════════════════════════════════════════
const US_STATES = {
  AL:{n:'Alabama',lat:32.8,lng:-86.8}, AK:{n:'Alaska',lat:64.0,lng:-152.0},
  AZ:{n:'Arizona',lat:34.3,lng:-111.7}, AR:{n:'Arkansas',lat:34.9,lng:-92.4},
  CA:{n:'California',lat:37.2,lng:-119.5}, CO:{n:'Colorado',lat:39.0,lng:-105.5},
  CT:{n:'Connecticut',lat:41.6,lng:-72.7}, DE:{n:'Delaware',lat:39.0,lng:-75.5},
  FL:{n:'Florida',lat:28.6,lng:-82.4}, GA:{n:'Georgia',lat:32.6,lng:-83.4},
  HI:{n:'Hawaii',lat:20.3,lng:-156.4}, ID:{n:'Idaho',lat:44.4,lng:-114.6},
  IL:{n:'Illinois',lat:40.0,lng:-89.2}, IN:{n:'Indiana',lat:39.9,lng:-86.3},
  IA:{n:'Iowa',lat:42.1,lng:-93.5}, KS:{n:'Kansas',lat:38.5,lng:-98.4},
  KY:{n:'Kentucky',lat:37.5,lng:-85.3}, LA:{n:'Louisiana',lat:31.1,lng:-92.0},
  ME:{n:'Maine',lat:45.4,lng:-69.2}, MD:{n:'Maryland',lat:39.0,lng:-76.8},
  MA:{n:'Massachusetts',lat:42.3,lng:-71.8}, MI:{n:'Michigan',lat:44.3,lng:-85.4},
  MN:{n:'Minnesota',lat:46.3,lng:-94.3}, MS:{n:'Mississippi',lat:32.7,lng:-89.7},
  MO:{n:'Missouri',lat:38.4,lng:-92.5}, MT:{n:'Montana',lat:47.0,lng:-109.6},
  NE:{n:'Nebraska',lat:41.5,lng:-99.8}, NV:{n:'Nevada',lat:39.4,lng:-116.6},
  NH:{n:'New Hampshire',lat:43.7,lng:-71.6}, NJ:{n:'New Jersey',lat:40.2,lng:-74.7},
  NM:{n:'New Mexico',lat:34.4,lng:-106.1}, NY:{n:'New York',lat:43.0,lng:-75.5},
  NC:{n:'North Carolina',lat:35.5,lng:-79.4}, ND:{n:'North Dakota',lat:47.4,lng:-100.5},
  OH:{n:'Ohio',lat:40.3,lng:-82.8}, OK:{n:'Oklahoma',lat:35.6,lng:-97.5},
  OR:{n:'Oregon',lat:43.9,lng:-120.6}, PA:{n:'Pennsylvania',lat:40.9,lng:-77.8},
  RI:{n:'Rhode Island',lat:41.7,lng:-71.6}, SC:{n:'South Carolina',lat:33.9,lng:-80.9},
  SD:{n:'South Dakota',lat:44.4,lng:-100.2}, TN:{n:'Tennessee',lat:35.8,lng:-86.4},
  TX:{n:'Texas',lat:31.5,lng:-99.3}, UT:{n:'Utah',lat:39.3,lng:-111.7},
  VT:{n:'Vermont',lat:44.1,lng:-72.7}, VA:{n:'Virginia',lat:37.5,lng:-78.9},
  WA:{n:'Washington',lat:47.4,lng:-120.5}, WV:{n:'West Virginia',lat:38.6,lng:-80.6},
  WI:{n:'Wisconsin',lat:44.6,lng:-89.7}, WY:{n:'Wyoming',lat:43.0,lng:-107.6},
  DC:{n:'Washington DC',lat:38.9,lng:-77.0},
};

if (typeof window !== 'undefined') {
  window.SHORT_NAMES = SHORT_NAMES;
  window.countryName = countryName;
  window.US_STATES = US_STATES;
}
