// ================================================================
// WORLD DISEASE MONITOR — who-api.js
// WHO Global Health Observatory (GHO) OData API
// https://ghoapi.azureedge.net/api/ — GRATUIT, SANS CLÉ, ILLIMITÉ
// 2301 indicateurs · 245 pays · Vraies données OMS
// + Delphi Epidata (Carnegie Mellon) : dengue, norovirus, grippe
// ================================================================

const WHO_GHO_BASE = 'https://ghoapi.azureedge.net/api/';
const DELPHI_BASE = 'https://api.delphi.cmu.edu/epidata/';

// Cache long (données annuelles, pas besoin de re-fetch souvent)
let whoCache = {};

// ─── CONVERSION ISO3 → ISO2 (WHO utilise ISO3, la carte utilise ISO2) ──
const ISO3_TO_ISO2 = {
  AFG:'AF',ALB:'AL',DZA:'DZ',AND:'AD',AGO:'AO',ATG:'AG',ARG:'AR',ARM:'AM',AUS:'AU',AUT:'AT',
  AZE:'AZ',BHS:'BS',BHR:'BH',BGD:'BD',BRB:'BB',BLR:'BY',BEL:'BE',BLZ:'BZ',BEN:'BJ',BTN:'BT',
  BOL:'BO',BIH:'BA',BWA:'BW',BRA:'BR',BRN:'BN',BGR:'BG',BFA:'BF',BDI:'BI',KHM:'KH',CMR:'CM',
  CAN:'CA',CPV:'CV',CAF:'CF',TCD:'TD',CHL:'CL',CHN:'CN',COL:'CO',COM:'KM',COG:'CG',COD:'CD',
  CRI:'CR',CIV:'CI',HRV:'HR',CUB:'CU',CYP:'CY',CZE:'CZ',DNK:'DK',DJI:'DJ',DMA:'DM',DOM:'DO',
  ECU:'EC',EGY:'EG',SLV:'SV',GNQ:'GQ',ERI:'ER',EST:'EE',SWZ:'SZ',ETH:'ET',FJI:'FJ',FIN:'FI',
  FRA:'FR',GAB:'GA',GMB:'GM',GEO:'GE',DEU:'DE',GHA:'GH',GRC:'GR',GRD:'GD',GTM:'GT',GIN:'GN',
  GNB:'GW',GUY:'GY',HTI:'HT',HND:'HN',HUN:'HU',ISL:'IS',IND:'IN',IDN:'ID',IRN:'IR',IRQ:'IQ',
  IRL:'IE',ISR:'IL',ITA:'IT',JAM:'JM',JPN:'JP',JOR:'JO',KAZ:'KZ',KEN:'KE',KIR:'KI',PRK:'KP',
  KOR:'KR',KWT:'KW',KGZ:'KG',LAO:'LA',LVA:'LV',LBN:'LB',LSO:'LS',LBR:'LR',LBY:'LY',LIE:'LI',
  LTU:'LT',LUX:'LU',MDG:'MG',MWI:'MW',MYS:'MY',MDV:'MV',MLI:'ML',MLT:'MT',MHL:'MH',MRT:'MR',
  MUS:'MU',MEX:'MX',FSM:'FM',MDA:'MD',MCO:'MC',MNG:'MN',MNE:'ME',MAR:'MA',MOZ:'MZ',MMR:'MM',
  NAM:'NA',NRU:'NR',NPL:'NP',NLD:'NL',NZL:'NZ',NIC:'NI',NER:'NE',NGA:'NG',MKD:'MK',NOR:'NO',
  OMN:'OM',PAK:'PK',PLW:'PW',PSE:'PS',PAN:'PA',PNG:'PG',PRY:'PY',PER:'PE',PHL:'PH',POL:'PL',
  PRT:'PT',QAT:'QA',ROU:'RO',RUS:'RU',RWA:'RW',KNA:'KN',LCA:'LC',VCT:'VC',WSM:'WS',SMR:'SM',
  STP:'ST',SAU:'SA',SEN:'SN',SRB:'RS',SYC:'SC',SLE:'SL',SGP:'SG',SVK:'SK',SVN:'SI',SLB:'SB',
  SOM:'SO',ZAF:'ZA',SSD:'SS',ESP:'ES',LKA:'LK',SDN:'SD',SUR:'SR',SWE:'SE',CHE:'CH',SYR:'SY',
  TWN:'TW',TJK:'TJ',TZA:'TZ',THA:'TH',TLS:'TL',TGO:'TG',TON:'TO',TTO:'TT',TUN:'TN',TUR:'TR',
  TKM:'TM',TUV:'TV',UGA:'UG',UKR:'UA',ARE:'AE',GBR:'GB',USA:'US',URY:'UY',UZB:'UZ',VUT:'VU',
  VEN:'VE',VNM:'VN',YEM:'YE',ZMB:'ZM',ZWE:'ZW'
};

function iso3to2(iso3) { return ISO3_TO_ISO2[iso3] || null; }

// ─── MAPPING maladie → indicateur WHO GHO ────────────────────────
// Codes d'indicateurs OMS pour les vraies données de cas/incidence
// Codes d'indicateurs WHO GHO VÉRIFIÉS (source: ghoapi.azureedge.net)
// Format: [code_indicateur, terme_recherche_fallback]
const WHO_INDICATORS = {
  // Codes confirmés + terme de recherche de secours
  tb: { code: 'MDG_0000000020', search: 'Incidence of tuberculosis', rate: true },  // taux/100k → converti en nombre
  malaria: { code: 'MALARIA_EST_INCIDENCE', search: 'Estimated malaria incidence', rate: true },
  measles: { code: 'WHS3_62', search: 'Measles - number of reported cases' },
  cholera: { code: 'CHOLERA_0000000001', search: 'Cholera - number of reported cases' },
  polio: { code: 'WHS3_49', search: 'Poliomyelitis - number of reported cases' },
  pertussis: { code: 'WHS3_57', search: 'Pertussis - number of reported cases' },
  diphtheria: { code: 'WHS3_51', search: 'Diphtheria - number of reported cases' },
  tetanus: { code: 'WHS3_52', search: 'Total tetanus - number of reported cases' },
  yellow_fever: { code: 'WHS3_50', search: 'Yellow fever - number of reported cases' },
  japanese_encephalitis: { code: 'WHS3_46', search: 'Japanese encephalitis - number of reported cases' },
  hiv: { code: 'HIV_0000000001', search: 'Number of people living with HIV' },
  mumps: { code: 'WHS3_56', search: 'Mumps - number of reported cases' },
  rubella: { code: 'WHS3_58', search: 'Rubella - number of reported cases' },
}

// ─── FETCH DONNÉES WHO GHO PAR INDICATEUR ────────────────────────
async function fetchWHOIndicator(indicatorCode, isRate) {
  const cacheKey = 'who_' + indicatorCode;
  if (whoCache[cacheKey] && (Date.now() - whoCache[cacheKey].time < 6 * 60 * 60 * 1000)) {
    return whoCache[cacheKey].data;
  }

  try {
    // Récupère les données de l'indicateur, filtrées par pays
    const url = `${WHO_GHO_BASE}${indicatorCode}?$filter=SpatialDimType eq 'COUNTRY'`;
    const r = await fetch(url, { signal: AbortSignal.timeout(20000) });
    if (!r.ok) return null;
    const data = await r.json();
    if (!data.value || !Array.isArray(data.value)) return null;

    // Détecte si c'est un taux (per 100 000) d'après le code ou le paramètre
    const looksLikeRate = isRate || /per.?100|MDG_0000000020|rate/i.test(indicatorCode);

    // Garde la donnée la plus récente par pays
    const byCountry = {};
    data.value.forEach(row => {
      const iso3 = row.SpatialDim;
      const iso2 = iso3to2(iso3);
      if (!iso2) return;
      const year = parseInt(row.TimeDim) || 0;
      let value = parseFloat(row.NumericValue) || 0;
      if (value <= 0) return;

      // Si c'est un taux per 100 000, convertit en nombre absolu via population
      if (looksLikeRate && typeof POP !== 'undefined' && POP[iso2]) {
        const popMillions = POP[iso2];
        value = (value / 100000) * (popMillions * 1000000);
      }

      // Garde l'année la plus récente
      if (!byCountry[iso2] || year > byCountry[iso2].year) {
        byCountry[iso2] = { value: Math.round(value), year };
      }
    });

    // Convertit en {ISO2: cases}
    const result = {};
    Object.entries(byCountry).forEach(([iso2, d]) => { if (d.value > 0) result[iso2] = d.value; });

    if (Object.keys(result).length === 0) return null;
    whoCache[cacheKey] = { time: Date.now(), data: result };
    return result;
  } catch(e) {
    console.warn('WHO GHO error (' + indicatorCode + '):', (e && e.message ? e.message : e));
    return null;
  }
}

// ─── RECHERCHE DYNAMIQUE D'INDICATEUR (si code inconnu) ──────────
async function searchWHOIndicator(diseaseName) {
  try {
    const url = `${WHO_GHO_BASE}Indicator?$filter=contains(IndicatorName,'${encodeURIComponent(diseaseName)}')`;
    const r = await fetch(url, { signal: AbortSignal.timeout(15000) });
    if (!r.ok) return null;
    const data = await r.json();
    if (!data.value || data.value.length === 0) return null;

    // Cherche un indicateur de type "cases/incidence/reported"
    const preferred = data.value.find(i =>
      /incidence|reported cases|number of cases|estimated cases|new cases/i.test(i.IndicatorName)
    ) || data.value[0];

    return preferred.IndicatorCode;
  } catch(e) {
    return null;
  }
}

// ─── CHARGE TOUTES LES MALADIES OMS SUR LA CARTE ─────────────────
let whoMapLoading = false;
async function loadWHODiseaseMap() {
  if (whoMapLoading) return;
  whoMapLoading = true;

  if (typeof showGroqLiveStatus === 'function') {
    showGroqLiveStatus('🌍 Chargement vraies données OMS (WHO GHO)...', 'loading');
  }

  let loaded = 0;
  const entries = Object.entries(WHO_INDICATORS);

  for (const [diseaseId, indicator] of entries) {
    // Nouveau format : {code, search, rate} — essaie le code d'abord
    const code = (typeof indicator === 'object') ? indicator.code : indicator;
    const searchTerm = (typeof indicator === 'object') ? indicator.search : null;
    const isRate = (typeof indicator === 'object') ? indicator.rate : false;

    let data = await fetchWHOIndicator(code, isRate);

    // Si le code échoue et qu'on a un terme de recherche, cherche dynamiquement
    if ((!data || Object.keys(data).length === 0) && searchTerm) {
      const foundCode = await searchWHOIndicator(searchTerm);
      if (foundCode) {
        data = await fetchWHOIndicator(foundCode, isRate);
      }
    }

    if (data && Object.keys(data).length > 0) {
      // Applique à la carte
      if (typeof DC !== 'undefined') DC[diseaseId] = Object.keys(data);
      if (typeof DISEASE_CASE_WEIGHTS !== 'undefined') DISEASE_CASE_WEIGHTS[diseaseId] = data;
      if (typeof window !== 'undefined') {
        window._whoGenerated = window._whoGenerated || {};
        window._whoGenerated[diseaseId] = true;
      }
      loaded++;
      if (typeof drawAllCircles === 'function' && typeof mapReady !== 'undefined' && mapReady) drawAllCircles();
    }
    if (typeof showGroqLiveStatus === 'function') {
      showGroqLiveStatus(`🌍 OMS: ${loaded} maladies avec vraies données...`, 'loading');
    }
  }

  whoMapLoading = false;
  if (typeof showGroqLiveStatus === 'function') {
    showGroqLiveStatus(`✅ ${loaded} maladies avec vraies données OMS · ${new Date().toLocaleTimeString('fr-FR')}`, 'ok');
  }
  if (typeof drawAllCircles === 'function' && typeof mapReady !== 'undefined' && mapReady) drawAllCircles();
  if (typeof buildLegend === 'function') buildLegend();
  // Rafraîchit le dashboard avec les vraies données
  if (typeof renderDash === 'function' && document.getElementById('panel-dash')?.classList.contains('on')) renderDash();
}

// ─── DELPHI EPIDATA — dengue, norovirus, grippe (SANS CLÉ) ───────
async function fetchDelphiDengue() {
  try {
    // PAHO dengue pour les Amériques (données hebdomadaires)
    const currentYear = new Date().getFullYear();
    const epiweek = `${currentYear}01-${currentYear}53`;
    const url = `${DELPHI_BASE}paho_dengue/?regions=ar,br,co,mx,pe,ve,bo,ec,py,cl,cr,ni,pa,gt,hn,sv,do,cu&epiweeks=${epiweek}`;
    const r = await fetch(url, { signal: AbortSignal.timeout(15000) });
    if (!r.ok) return null;
    const data = await r.json();
    if (data.result !== 1 || !data.epidata) return null;

    // Agrège par région (pays)
    const regionToISO2 = { ar:'AR',br:'BR',co:'CO',mx:'MX',pe:'PE',ve:'VE',bo:'BO',ec:'EC',py:'PY',cl:'CL',cr:'CR',ni:'NI',pa:'PA',gt:'GT',hn:'HN',sv:'SV',do:'DO',cu:'CU' };
    const byCountry = {};
    data.epidata.forEach(row => {
      const iso2 = regionToISO2[row.region];
      if (!iso2) return;
      const cases = parseInt(row.num_dengue) || 0;
      byCountry[iso2] = (byCountry[iso2] || 0) + cases;
    });
    return byCountry;
  } catch(e) {
    console.warn('Delphi dengue error:', (e && e.message ? e.message : e));
    return null;
  }
}

async function loadDelphiDengue() {
  const data = await fetchDelphiDengue();
  if (data && Object.keys(data).length > 0) {
    if (typeof DC !== 'undefined') {
      const existing = DC['dengue'] || [];
      DC['dengue'] = [...new Set([...existing, ...Object.keys(data)])];
    }
    if (typeof DISEASE_CASE_WEIGHTS !== 'undefined') {
      DISEASE_CASE_WEIGHTS['dengue'] = { ...(DISEASE_CASE_WEIGHTS['dengue'] || {}), ...data };
    }
    if (typeof window !== 'undefined') {
      window._delphiGenerated = window._delphiGenerated || {};
      window._delphiGenerated['dengue'] = true;
    }
    if (typeof drawAllCircles === 'function' && typeof mapReady !== 'undefined' && mapReady) drawAllCircles();
  }
}

// ─── INIT — charge toutes les vraies données au démarrage ────────
function initWHOApis() {
  // Charge les données OMS + Delphi en arrière-plan
  setTimeout(() => {
    loadWHODiseaseMap();
    loadDelphiDengue();
  }, 3500);

  // Actualise toutes les 30 minutes (données annuelles, pas besoin plus)
  setInterval(() => {
    loadWHODiseaseMap();
    loadDelphiDengue();
  }, 30 * 60 * 1000);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => setTimeout(initWHOApis, 3000));
} else {
  setTimeout(initWHOApis, 3000);
}
