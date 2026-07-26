// ================================================================
// WORLD DISEASE MONITOR — reliefweb-api.js
// API JSON DIRECTE ReliefWeb (ONU/OCHA) — SANS PROXY, SANS CLÉ
// La carte se base sur les VRAIES alertes temps réel de l'ONU
// https://api.reliefweb.int/v1/ — mis à jour en temps réel
// ================================================================

const RW_API = 'https://api.reliefweb.int/v1/';
const RW_APPNAME = 'rwint-user';

let rwDisasters = [];
let rwReports = [];

// ─── RÉCUPÈRE LES CATASTROPHES/ÉPIDÉMIES EN COURS ────────────────
async function fetchReliefWebDisasters() {
  try {
    // Endpoint disasters : catastrophes actives, filtré sur épidémies
    const url = `${RW_API}disasters?appname=${RW_APPNAME}&filter[field]=status&filter[value]=current&fields[include][]=name&fields[include][]=country&fields[include][]=type&fields[include][]=date&limit=100&sort[]=date:desc`;
    const r = await fetch(url, { signal: AbortSignal.timeout(15000) });
    if (!r.ok) return null;
    const data = await r.json();
    if (!data.data) return null;
    return data.data;
  } catch(e) {
    console.warn('ReliefWeb disasters error:', (e && e.message ? e.message : e));
    return null;
  }
}

// ─── RÉCUPÈRE LES RAPPORTS SANTÉ RÉCENTS (épidémies) ─────────────
async function fetchReliefWebHealthReports() {
  try {
    // Endpoint reports : filtré thème Santé, récents
    const url = `${RW_API}reports?appname=${RW_APPNAME}&filter[field]=theme.name&filter[value]=Health&fields[include][]=title&fields[include][]=country&fields[include][]=date&fields[include][]=url&fields[include][]=body-html&limit=60&sort[]=date:desc`;
    const r = await fetch(url, { signal: AbortSignal.timeout(15000) });
    if (!r.ok) return null;
    const data = await r.json();
    if (!data.data) return null;
    return data.data;
  } catch(e) {
    console.warn('ReliefWeb reports error:', (e && e.message ? e.message : e));
    return null;
  }
}

// ─── CONVERTIT NOM PAYS ReliefWeb → ISO2 ─────────────────────────
function rwCountryToISO2(countryName) {
  if (!countryName) return null;
  const name = countryName.toLowerCase();
  // Mapping précis EN PREMIER (évite congo→CG au lieu de CD, niger→NE au lieu de NG)
  const extra = {
    'democratic republic of the congo':'CD','dr congo':'CD','drc':'CD',
    'united republic of tanzania':'TZ','tanzania':'TZ',
    'sudan':'SD','south sudan':'SS','ethiopia':'ET','nigeria':'NG',
    'niger':'NE','mali':'ML','chad':'TD','somalia':'SO','kenya':'KE',
    'uganda':'UG','angola':'AO','mozambique':'MZ','zambia':'ZM',
    'zimbabwe':'ZW','malawi':'MW','madagascar':'MG','cameroon':'CM',
    'yemen':'YE','syria':'SY','afghanistan':'AF','haiti':'HT',
    'bangladesh':'BD','pakistan':'PK','india':'IN','myanmar':'MM',
    'philippines':'PH','indonesia':'ID','brazil':'BR','colombia':'CO',
    'peru':'PE','venezuela':'VE','ukraine':'UA','burkina faso':'BF',
    'guinea':'GN','sierra leone':'SL','liberia':'LR','ghana':'GH',
    'senegal':'SN','togo':'TG','benin':'BJ','burundi':'BI','rwanda':'RW',
    'central african republic':'CF','congo':'CG','gabon':'GA',
    'ivory coast':'CI',"cote d'ivoire":'CI','mauritania':'MR',
  };
  // Cherche d'abord dans le mapping précis (trié par longueur pour matcher le plus spécifique)
  const sortedExtra = Object.entries(extra).sort((a,b) => b[0].length - a[0].length);
  for (const [n, iso2] of sortedExtra) {
    if (name.includes(n)) return iso2;
  }
  // Fallback COUNTRY_NAMES de rss.js
  if (typeof COUNTRY_NAMES !== 'undefined') {
    const sortedCN = Object.entries(COUNTRY_NAMES).sort((a,b) => b[0].length - a[0].length);
    for (const [n, iso2] of sortedCN) {
      if (name.includes(n)) return iso2;
    }
  }
  return null;
}

// ─── DÉTECTE LA MALADIE DANS UN TEXTE (réutilise rss.js) ─────────
function rwDetectDisease(text) {
  if (typeof detectDisease === 'function') return detectDisease(text);
  return null;
}

// ─── CONSTRUIT LES DONNÉES CARTE DEPUIS ReliefWeb ────────────────
async function buildMapFromReliefWeb() {
  if (typeof showGroqLiveStatus === 'function') {
    showGroqLiveStatus('🌐 Chargement alertes ONU temps réel (ReliefWeb)...', 'loading');
  }

  // Récupère catastrophes + rapports en parallèle
  const [disasters, reports] = await Promise.all([
    fetchReliefWebDisasters(),
    fetchReliefWebHealthReports()
  ]);

  if (!disasters && !reports) {
    if (typeof showGroqLiveStatus === 'function') {
      showGroqLiveStatus('⚠️ ReliefWeb inaccessible (réessai dans 5 min)', 'error');
    }
    return;
  }

  const mapData = {}; // { diseaseId: { ISO2: count } }
  let alertCount = 0;

  // Traite les catastrophes (épidémies déclarées)
  if (disasters) {
    rwDisasters = disasters;
    disasters.forEach(d => {
      const f = d.fields || {};
      const name = f.name || '';
      const types = (f.type || []).map(t => t.name).join(' ');
      // Ne garde que les épidémies
      if (!/epidemic|outbreak|disease|cholera|ebola|measles|health/i.test(name + ' ' + types)) return;

      const disease = rwDetectDisease(name);
      if (!disease) return;

      // Pays touchés
      const countries = f.country || [];
      countries.forEach(c => {
        const iso2 = rwCountryToISO2(c.name);
        if (!iso2) return;
        if (!mapData[disease]) mapData[disease] = {};
        // Une catastrophe déclarée = foyer important
        mapData[disease][iso2] = (mapData[disease][iso2] || 0) + 5000;
        alertCount++;
      });
    });
  }

  // Traite les rapports santé
  if (reports) {
    rwReports = reports;
    reports.forEach(r => {
      const f = r.fields || {};
      const title = f.title || '';
      const disease = rwDetectDisease(title);
      if (!disease) return;

      const countries = f.country || [];
      countries.forEach(c => {
        const iso2 = rwCountryToISO2(c.name);
        if (!iso2) return;
        if (!mapData[disease]) mapData[disease] = {};
        mapData[disease][iso2] = (mapData[disease][iso2] || 0) + 2000;
        alertCount++;
      });
    });
  }

  // Applique à la carte
  let applied = 0;
  Object.entries(mapData).forEach(([diseaseId, countries]) => {
    if (Object.keys(countries).length === 0) return;
    if (typeof DC !== 'undefined') {
      const existing = DC[diseaseId] || [];
      DC[diseaseId] = [...new Set([...existing, ...Object.keys(countries)])];
    }
    if (typeof DISEASE_CASE_WEIGHTS !== 'undefined') {
      if (!DISEASE_CASE_WEIGHTS[diseaseId]) DISEASE_CASE_WEIGHTS[diseaseId] = {};
      Object.entries(countries).forEach(([iso2, count]) => {
        DISEASE_CASE_WEIGHTS[diseaseId][iso2] = count;
      });
    }
    if (typeof window !== 'undefined') {
      window._reliefwebGenerated = window._reliefwebGenerated || {};
      window._reliefwebGenerated[diseaseId] = true;
    }
    applied++;
  });

  // Redessine la carte
  if (typeof drawAllCircles === 'function' && typeof mapReady !== 'undefined' && mapReady) drawAllCircles();
  if (typeof buildLegend === 'function') buildLegend();

  if (typeof showGroqLiveStatus === 'function') {
    showGroqLiveStatus(`✅ ${applied} maladies · ${alertCount} alertes ONU temps réel · ${new Date().toLocaleTimeString('fr-FR')}`, 'ok');
  }

  return { applied, alertCount };
}

// ─── INIT — charge ReliefWeb au démarrage + actualise ────────────
function initReliefWeb() {
  // Premier chargement
  setTimeout(buildMapFromReliefWeb, 2500);
  // Actualise toutes les 5 minutes (l'API est temps réel)
  setInterval(buildMapFromReliefWeb, 5 * 60 * 1000);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => setTimeout(initReliefWeb, 2000));
} else {
  setTimeout(initReliefWeb, 2000);
}

// ═══════════════════════════════════════════════════════════════
// ALIMENTE LE LIVE FEED depuis l'API ReliefWeb (ONU) — SANS PROXY
// Remplit rssAlerts directement, contourne les proxies CORS instables
// ═══════════════════════════════════════════════════════════════
async function fillLiveFeedFromReliefWeb() {
  // URL de l'API ReliefWeb (simple, GET direct)
  const rwUrl = `${RW_API}reports?appname=${RW_APPNAME}&filter[field]=theme.name&filter[value]=Health&fields[include][]=title&fields[include][]=country&fields[include][]=date&fields[include][]=url&fields[include][]=source&limit=40&sort[]=date:desc`;

  // Essaie plusieurs méthodes : directe, puis via proxies CORS
  const attempts = [
    rwUrl,  // Directe
    'https://api.allorigins.win/get?url=' + encodeURIComponent(rwUrl),  // Proxy JSON
    'https://corsproxy.io/?url=' + encodeURIComponent(rwUrl),  // Proxy 2
    'https://api.codetabs.com/v1/proxy/?quest=' + encodeURIComponent(rwUrl),  // Proxy 3
  ];

  for (let idx = 0; idx < attempts.length; idx++) {
    try {
      const r = await fetch(attempts[idx], { signal: AbortSignal.timeout(12000) });
      if (!r.ok) continue;

      let data;
      // Le proxy allorigins/get renvoie {contents: "..."}
      if (attempts[idx].includes('allorigins.win/get')) {
        const wrapper = await r.json();
        data = JSON.parse(wrapper.contents);
      } else {
        data = await r.json();
      }

      if (!data.data || data.data.length === 0) continue;

      // Convertit en format rssAlerts
      const alerts = data.data.map((item, i) => {
        const f = item.fields || {};
        const title = f.title || '';
        const disease = (typeof detectDisease === 'function') ? detectDisease(title) : null;
        const countries = f.country || [];
        const location = countries.length ? rwCountryToISO2(countries[0].name) : null;
        const dateStr = f.date?.created || f.date?.original || new Date().toISOString();
        const severity = (typeof detectSeverity === 'function') ? detectSeverity(title) : 'medium';
        const sourceName = (f.source && f.source[0]) ? f.source[0].name : 'ReliefWeb';
        return {
          id: 'rw-' + (item.id || i),
          title: title, desc: '',
          link: f.url || 'https://reliefweb.int',
          pubDate: new Date(dateStr),
          source: sourceName + ' (ONU)',
          sourceType: 'ReliefWeb', sourceColor: '#f97316', sourceIcon: '🌐',
          disease: disease, location: location, severity: severity,
          color: (typeof getSeverityColor === 'function') ? getSeverityColor(severity) : '#f97316',
          isReliefWeb: true
        };
      });

      if (typeof rssAlerts !== 'undefined') { rssAlerts = alerts; rssLastFetch = new Date(); }
      else { window.rssAlerts = alerts; }
      return true;  // Succès !
    } catch(e) {
      // Essaie la méthode suivante
    }
  }
  return false;  // Toutes les méthodes ont échoué
}
