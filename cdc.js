// ================================================================
// WORLD DISEASE MONITOR — cdc.js
// Data.CDC.gov — API publique GRATUITE (données CDC officielles)
// Aucune clé requise · Socrata Open Data API
// ================================================================

// Datasets CDC publics (Socrata SODA API — gratuit, sans clé)
const CDC_DATASETS = {
  // Maladies à déclaration obligatoire (NNDSS) — hebdomadaire
  nndss: 'https://data.cdc.gov/resource/x9gk-5huc.json',
  // Surveillance grippe
  flu: 'https://data.cdc.gov/resource/kvib-3txy.json',
};

let cdcData = { nndss: [], flu: [] };
let cdcLastFetch = null;

// ─── FETCH CDC NNDSS (maladies déclarées USA) ────────────────────
async function fetchCDCData() {
  updateCDCStatus('loading');
  try {
    // NNDSS : dernières données maladies à déclaration obligatoire
    const url = CDC_DATASETS.nndss + '?$limit=2000';
    const r = await fetch(url, { signal: AbortSignal.timeout(15000) });
    if (r.ok) {
      cdcData.nndss = await r.json();
    }

    cdcLastFetch = new Date();
    updateCDCStatus('ok');
    renderCDCPanel();
    // Connecte les vraies données CDC à la carte (points USA réels)
    if (typeof applyCDCToMap === 'function') applyCDCToMap();
    return true;
  } catch(e) {
    updateCDCStatus('error');
    return false;
  }
}

function updateCDCStatus(status) {
  const el = document.getElementById('cdc-status');
  if (!el) return;
  if (status === 'loading') {
    el.innerHTML = '<span class="spin"></span> Chargement Data.CDC.gov...';
    el.style.color = 'var(--oral)';
  } else if (status === 'ok') {
    const cnt = cdcData.nndss.length;
    el.innerHTML = `✅ ${cnt} enregistrements CDC NNDSS · ${cdcLastFetch.toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'})}`;
    el.style.color = 'var(--grnl)';
  } else {
    el.innerHTML = '⚠️ Data.CDC.gov inaccessible (réseau/CORS)';
    el.style.color = 'var(--yell)';
  }
}

// ─── AGRÈGE LES DONNÉES CDC PAR MALADIE ──────────────────────────
function aggregateCDCByDisease() {
  const byDisease = {};
  cdcData.nndss.forEach(row => {
    // Le nom de la maladie peut être dans plusieurs colonnes selon la version
    const label = (row.label || row.disease || row.condition || row.reporting_area && row.label || '').toLowerCase();
    // Le nombre de cas peut être dans plusieurs colonnes
    const count = parseInt(
      row.m1 || row.current_week || row.cases_current_week ||
      row.count || row.value || 0
    ) || 0;
    if (count > 0 && label && label !== 'total') {
      if (!byDisease[label]) byDisease[label] = 0;
      byDisease[label] += count;
    }
  });
  // Trie par nombre décroissant
  return Object.entries(byDisease).sort((a,b) => b[1]-a[1]).slice(0, 30);
}

// ─── PANEL CDC ───────────────────────────────────────────────────
function renderCDCPanel() {
  const grid = document.getElementById('cdc-grid');
  if (!grid) return;

  const agg = aggregateCDCByDisease();

  if (agg.length === 0) {
    grid.innerHTML = '<div style="grid-column:span 3;text-align:center;padding:20px;color:var(--t2);font-size:10px">⚠️ Données CDC en cours de chargement ou inaccessibles.<br>Ces données proviennent de Data.CDC.gov (USA uniquement).</div>';
    return;
  }

  grid.innerHTML = agg.map(([disease, count]) => `
    <div style="background:var(--card);border:1px solid var(--brd);border-left:3px solid var(--blu);border-radius:var(--r);padding:10px 12px">
      <div style="font-size:10px;font-weight:600;color:var(--t1);text-transform:capitalize;margin-bottom:4px">${disease}</div>
      <div style="font-size:18px;font-weight:800;color:var(--blul)">${count.toLocaleString('fr-FR')}</div>
      <div style="font-size:8px;color:var(--t3)">cas déclarés (CDC USA)</div>
    </div>
  `).join('');
}

// ─── INIT ─────────────────────────────────────────────────────────
function initCDC() {
  fetchCDCData();
  // Actualise toutes les 30 minutes
  setInterval(fetchCDCData, 30 * 60 * 1000);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => setTimeout(initCDC, 3000));
} else {
  setTimeout(initCDC, 3000);
}

// ═══════════════════════════════════════════════════════════════
// CONNECTE LES DONNÉES CDC (NNDSS, vraies données USA) À LA CARTE
// Donne un point réel aux USA pour chaque maladie que le CDC suit
// ═══════════════════════════════════════════════════════════════

// Mappe les noms de maladies CDC vers les IDs de notre catalogue
const CDC_TO_DISEASE_ID = {
  'measles': 'measles', 'rubeola': 'measles',
  'mumps': 'mumps', 'rubella': 'rubella',
  'pertussis': 'pertussis', 'whooping cough': 'pertussis',
  'hepatitis a': 'hepatitis_a', 'hepatitis b': 'hep_b', 'hepatitis c': 'hepatitis_c',
  'west nile': 'west_nile', 'lyme': 'lyme',
  'salmonellosis': 'salmonellosis', 'salmonella': 'salmonellosis',
  'shigellosis': 'shigellosis', 'giardiasis': 'giardiasis',
  'legionellosis': 'legionnaires', 'legionnaires': 'legionnaires',
  'malaria': 'malaria', 'dengue': 'dengue', 'zika': 'zika',
  'chikungunya': 'chikungunya', 'tuberculosis': 'tb',
  'meningococcal': 'meningitis', 'meningitis': 'meningitis',
  'tetanus': 'tetanus', 'diphtheria': 'diphtheria',
  'cholera': 'cholera', 'typhoid': 'typhoid',
  'mpox': 'mpox', 'monkeypox': 'mpox',
  'hiv': 'hiv', 'gonorrhea': 'gonorrhea', 'syphilis': 'syphilis',
  'rabies': 'rabies', 'anthrax': 'anthrax', 'brucellosis': 'brucellosis',
  'leptospirosis': 'leptospirosis', 'plague': 'plague',
  'rotavirus': 'rotavirus', 'norovirus': 'norovirus',
  'campylobacter': 'campylobacteriosis', 'lassa': 'lassa',
  'ebola': 'ebola', 'marburg': 'marburg', 'nipah': 'nipah',
};

function applyCDCToMap() {
  if (!cdcData.nndss || cdcData.nndss.length === 0) return 0;

  const aggregated = aggregateCDCByDisease();
  let applied = 0;

  aggregated.forEach(([cdcLabel, count]) => {
    if (count <= 0) return;
    // Cherche l'ID de maladie correspondant
    let diseaseId = null;
    for (const [cdcName, id] of Object.entries(CDC_TO_DISEASE_ID)) {
      if (cdcLabel.includes(cdcName)) { diseaseId = id; break; }
    }
    if (!diseaseId) return;

    // Ajoute les USA avec les vraies données CDC
    if (typeof DC !== 'undefined') {
      const existing = DC[diseaseId] || [];
      if (!existing.includes('US')) DC[diseaseId] = [...existing, 'US'];
    }
    if (typeof DISEASE_CASE_WEIGHTS !== 'undefined') {
      if (!DISEASE_CASE_WEIGHTS[diseaseId]) DISEASE_CASE_WEIGHTS[diseaseId] = {};
      DISEASE_CASE_WEIGHTS[diseaseId]['US'] = count;
    }
    if (typeof window !== 'undefined') {
      window._cdcGenerated = window._cdcGenerated || {};
      window._cdcGenerated[diseaseId] = true;
    }
    applied++;
  });

  if (applied > 0 && typeof drawAllCircles === 'function' && typeof mapReady !== 'undefined' && mapReady) {
    drawAllCircles();
    if (typeof buildLegend === 'function') buildLegend();
  }

  return applied;
}

if (typeof window !== 'undefined') {
  window.applyCDCToMap = applyCDCToMap;
}
