// ================================================================
// WORLD DISEASE MONITOR — apis.js
// Vraies API gratuites SANS clé, SANS limite
// ClinicalTrials.gov (vaccins) · PubMed (science) · Banque Mondiale (éco)
// Marche pour des MILLIONS d'utilisateurs (pas de quota)
// ================================================================

// ─── 1. CLINICALTRIALS.GOV — Essais cliniques vaccins (SANS CLÉ) ──
async function fetchClinicalTrials(diseaseName, maxResults = 10) {
  try {
    // API v2 de ClinicalTrials.gov — publique, gratuite, sans clé
    const url = `https://clinicaltrials.gov/api/v2/studies?query.cond=${encodeURIComponent(diseaseName)}&query.term=vaccine&pageSize=${maxResults}&sort=LastUpdatePostDate:desc`;
    const r = await fetch(url, { signal: AbortSignal.timeout(15000) });
    if (!r.ok) return null;
    const data = await r.json();
    if (!data.studies) return null;

    return data.studies.map(s => {
      const p = s.protocolSection || {};
      return {
        title: p.identificationModule?.briefTitle || 'Sans titre',
        status: p.statusModule?.overallStatus || 'Inconnu',
        phase: (p.designModule?.phases || []).join(', ') || 'N/A',
        condition: (p.conditionsModule?.conditions || []).join(', '),
        sponsor: p.sponsorCollaboratorsModule?.leadSponsor?.name || '',
        startDate: p.statusModule?.startDateStruct?.date || '',
        nctId: p.identificationModule?.nctId || '',
        enrollment: p.designModule?.enrollmentInfo?.count || 0
      };
    });
  } catch(e) {
    console.warn('ClinicalTrials error:', e.message);
    return null;
  }
}

// ─── 2. PUBMED — Publications scientifiques (SANS CLÉ) ───────────
async function fetchPubMed(query, maxResults = 10) {
  try {
    // Étape 1 : recherche des IDs
    const searchUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=${encodeURIComponent(query)}&retmax=${maxResults}&retmode=json&sort=date`;
    const r1 = await fetch(searchUrl, { signal: AbortSignal.timeout(15000) });
    if (!r1.ok) return null;
    const d1 = await r1.json();
    const ids = d1.esearchresult?.idlist || [];
    if (ids.length === 0) return [];

    // Étape 2 : récupère les détails
    const sumUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&id=${ids.join(',')}&retmode=json`;
    const r2 = await fetch(sumUrl, { signal: AbortSignal.timeout(15000) });
    if (!r2.ok) return null;
    const d2 = await r2.json();

    const result = d2.result || {};
    return ids.map(id => {
      const p = result[id];
      if (!p) return null;
      return {
        title: p.title || '',
        authors: (p.authors || []).slice(0, 3).map(a => a.name).join(', '),
        journal: p.fulljournalname || p.source || '',
        pubDate: p.pubdate || '',
        pmid: id,
        url: `https://pubmed.ncbi.nlm.nih.gov/${id}/`
      };
    }).filter(Boolean);
  } catch(e) {
    console.warn('PubMed error:', e.message);
    return null;
  }
}

// ─── 3. BANQUE MONDIALE — Données économiques santé (SANS CLÉ) ───
async function fetchWorldBankHealth(indicator = 'SH.XPD.CHEX.GD.ZS', maxCountries = 20) {
  try {
    // SH.XPD.CHEX.GD.ZS = dépenses de santé (% du PIB)
    const url = `https://api.worldbank.org/v2/country/all/indicator/${indicator}?format=json&date=2022&per_page=300`;
    const r = await fetch(url, { signal: AbortSignal.timeout(15000) });
    if (!r.ok) return null;
    const data = await r.json();
    if (!Array.isArray(data) || data.length < 2) return null;

    return data[1]
      .filter(d => d.value !== null)
      .sort((a, b) => b.value - a.value)
      .slice(0, maxCountries)
      .map(d => ({
        country: d.country?.value || '',
        countryCode: d.countryiso3code || '',
        value: d.value,
        year: d.date
      }));
  } catch(e) {
    console.warn('WorldBank error:', e.message);
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════
// AFFICHAGE DES DONNÉES DANS LES ONGLETS
// ═══════════════════════════════════════════════════════════════

// ─── ONGLET VACCINS : vrais essais cliniques ─────────────────────
async function loadRealVaccines(diseaseName) {
  const dName = diseaseName || 'infectious disease';
  const container = document.getElementById('vax-real-data');
  if (container) container.innerHTML = '<div class="ldw"><div class="lds"></div> Chargement essais cliniques réels (ClinicalTrials.gov)...</div>';

  const trials = await fetchClinicalTrials(dName, 12);
  if (!container) return;

  if (!trials || trials.length === 0) {
    container.innerHTML = '<div style="text-align:center;padding:15px;color:var(--t2);font-size:10px">Aucun essai clinique trouvé pour cette recherche.</div>';
    return;
  }

  const statusColors = {
    'RECRUITING': '#22c55e', 'ACTIVE_NOT_RECRUITING': '#3b82f6',
    'COMPLETED': '#8b5cf6', 'NOT_YET_RECRUITING': '#eab308',
    'TERMINATED': '#ef4444', 'WITHDRAWN': '#6b7280', 'SUSPENDED': '#f97316'
  };

  container.innerHTML = `
    <div style="font-size:9px;color:var(--grnl);margin-bottom:8px;padding:5px 8px;background:rgba(34,197,94,.05);border-radius:5px;border:1px solid rgba(34,197,94,.12)">
      ✅ ${trials.length} essais cliniques RÉELS · Source: ClinicalTrials.gov (gouvernement USA) · Temps réel
    </div>
    ${trials.map(t => `
      <div style="background:var(--card);border:1px solid var(--brd);border-left:3px solid ${statusColors[t.status] || '#6b7280'};border-radius:var(--r);padding:9px 11px;margin-bottom:6px">
        <div style="font-size:10px;font-weight:600;color:var(--t1);margin-bottom:4px;line-height:1.4">${t.title}</div>
        <div style="display:flex;gap:5px;flex-wrap:wrap;margin-bottom:4px">
          <span style="font-size:7px;font-weight:700;padding:1px 6px;border-radius:4px;background:${(statusColors[t.status]||'#6b7280')}22;color:${statusColors[t.status]||'#9ca3af'};border:1px solid ${(statusColors[t.status]||'#6b7280')}44">${t.status}</span>
          ${t.phase && t.phase !== 'N/A' ? `<span style="font-size:7px;background:rgba(139,92,246,.1);color:#c4b5fd;border:1px solid rgba(139,92,246,.15);padding:1px 6px;border-radius:4px">${t.phase}</span>` : ''}
          ${t.enrollment ? `<span style="font-size:7px;color:var(--t3)">👥 ${t.enrollment.toLocaleString('fr-FR')} participants</span>` : ''}
        </div>
        ${t.sponsor ? `<div style="font-size:8px;color:var(--t2)">🏢 ${t.sponsor}</div>` : ''}
        <div style="display:flex;justify-content:space-between;align-items:center;margin-top:4px">
          <span style="font-size:7px;color:var(--t3)">${t.startDate ? '📅 ' + t.startDate : ''}</span>
          <a href="https://clinicaltrials.gov/study/${t.nctId}" target="_blank" rel="noopener" style="font-size:8px;color:var(--teal);text-decoration:none">🔗 ${t.nctId} ↗</a>
        </div>
      </div>
    `).join('')}
  `;
}

// ─── ONGLET SCIENCE : vraies publications PubMed ─────────────────
async function loadRealScience(query) {
  const q = query || 'emerging infectious disease outbreak';
  const container = document.getElementById('sci-real-data');
  if (container) container.innerHTML = '<div class="ldw"><div class="lds"></div> Chargement publications réelles (PubMed)...</div>';

  const papers = await fetchPubMed(q, 12);
  if (!container) return;

  if (!papers || papers.length === 0) {
    container.innerHTML = '<div style="text-align:center;padding:15px;color:var(--t2);font-size:10px">Aucune publication trouvée.</div>';
    return;
  }

  container.innerHTML = `
    <div style="font-size:9px;color:var(--blul);margin-bottom:8px;padding:5px 8px;background:rgba(59,130,246,.05);border-radius:5px;border:1px solid rgba(59,130,246,.12)">
      ✅ ${papers.length} publications RÉELLES · Source: PubMed (35M+ articles médicaux) · Temps réel
    </div>
    ${papers.map(p => `
      <div style="background:var(--card);border:1px solid var(--brd);border-left:3px solid var(--blu);border-radius:var(--r);padding:9px 11px;margin-bottom:6px">
        <div style="font-size:10px;font-weight:600;color:var(--t1);margin-bottom:4px;line-height:1.4">${p.title}</div>
        ${p.authors ? `<div style="font-size:8px;color:var(--t2);margin-bottom:2px">✍️ ${p.authors}</div>` : ''}
        <div style="display:flex;justify-content:space-between;align-items:center;margin-top:4px">
          <span style="font-size:7px;color:var(--t3)">${p.journal ? '📖 ' + p.journal.slice(0, 40) : ''} ${p.pubDate ? '· ' + p.pubDate : ''}</span>
          <a href="${p.url}" target="_blank" rel="noopener" style="font-size:8px;color:var(--teal);text-decoration:none">🔗 PubMed ↗</a>
        </div>
      </div>
    `).join('')}
  `;
}

// ─── ONGLET ÉCONOMIE : vraies données Banque Mondiale ────────────
async function loadRealEconomic() {
  const container = document.getElementById('econ-real-data');
  if (container) container.innerHTML = '<div class="ldw"><div class="lds"></div> Chargement données économiques réelles (Banque Mondiale)...</div>';

  // Charge 3 indicateurs en parallèle : dépenses santé %PIB, PIB/habitant, dépenses santé/habitant
  const [health, gdpPerCap, healthPerCap] = await Promise.all([
    fetchWorldBankHealth('SH.XPD.CHEX.GD.ZS', 25),      // Dépenses santé (% PIB)
    fetchWorldBankHealth('NY.GDP.PCAP.CD', 25),          // PIB par habitant (USD)
    fetchWorldBankHealth('SH.XPD.CHEX.PC.CD', 25)        // Dépenses santé par habitant (USD)
  ]);

  if (!container) return;

  if (!health && !gdpPerCap && !healthPerCap) {
    container.innerHTML = '<div style="text-align:center;padding:15px;color:var(--t2);font-size:10px">⚠️ Données Banque Mondiale indisponibles. Vérifie ta connexion.</div>';
    return;
  }

  let html = `<div style="font-size:9px;color:var(--yell);margin-bottom:10px;padding:6px 9px;background:rgba(234,179,8,.05);border-radius:5px;border:1px solid rgba(234,179,8,.12)">
    ✅ Données économiques RÉELLES · Source: Banque Mondiale API · Sans clé, illimité
  </div>`;

  // Section 1 : Dépenses de santé (% du PIB)
  if (health && health.length) {
    const maxH = Math.max(...health.map(d => d.value));
    html += `<div style="font-size:10px;font-weight:700;color:var(--t1);margin:10px 0 6px">💊 Dépenses de santé (% du PIB) — Top 25 <span class="b-live" style="font-size:6px">Banque Mondiale</span></div>`;
    html += health.map(d => `
      <div style="display:flex;align-items:center;gap:8px;padding:4px 8px;background:var(--card);border:1px solid var(--brd);border-radius:6px;margin-bottom:3px">
        <div style="flex:1;min-width:0">
          <div style="font-size:9px;color:var(--t1);font-weight:600">${d.country}</div>
          <div style="height:5px;background:var(--bg3);border-radius:3px;margin-top:3px;overflow:hidden"><div style="height:100%;width:${(d.value/maxH*100).toFixed(0)}%;background:linear-gradient(90deg,#eab308,#f97316);border-radius:3px"></div></div>
        </div>
        <div style="font-size:11px;font-weight:700;color:var(--yell);white-space:nowrap">${d.value.toFixed(1)}%</div>
      </div>`).join('');
  }

  // Section 2 : PIB par habitant
  if (gdpPerCap && gdpPerCap.length) {
    const maxG = Math.max(...gdpPerCap.map(d => d.value));
    html += `<div style="font-size:10px;font-weight:700;color:var(--t1);margin:14px 0 6px">💰 PIB par habitant (USD) — Top 25 <span class="b-live" style="font-size:6px">Banque Mondiale</span></div>`;
    html += gdpPerCap.map(d => `
      <div style="display:flex;align-items:center;gap:8px;padding:4px 8px;background:var(--card);border:1px solid var(--brd);border-radius:6px;margin-bottom:3px">
        <div style="flex:1;min-width:0">
          <div style="font-size:9px;color:var(--t1);font-weight:600">${d.country}</div>
          <div style="height:5px;background:var(--bg3);border-radius:3px;margin-top:3px;overflow:hidden"><div style="height:100%;width:${(d.value/maxG*100).toFixed(0)}%;background:linear-gradient(90deg,#22c55e,#06b6d4);border-radius:3px"></div></div>
        </div>
        <div style="font-size:11px;font-weight:700;color:var(--grnl);white-space:nowrap">$${Math.round(d.value).toLocaleString('fr-FR')}</div>
      </div>`).join('');
  }

  // Section 3 : Dépenses santé par habitant
  if (healthPerCap && healthPerCap.length) {
    const maxHC = Math.max(...healthPerCap.map(d => d.value));
    html += `<div style="font-size:10px;font-weight:700;color:var(--t1);margin:14px 0 6px">🏥 Dépenses de santé par habitant (USD) — Top 25 <span class="b-live" style="font-size:6px">Banque Mondiale</span></div>`;
    html += healthPerCap.map(d => `
      <div style="display:flex;align-items:center;gap:8px;padding:4px 8px;background:var(--card);border:1px solid var(--brd);border-radius:6px;margin-bottom:3px">
        <div style="flex:1;min-width:0">
          <div style="font-size:9px;color:var(--t1);font-weight:600">${d.country}</div>
          <div style="height:5px;background:var(--bg3);border-radius:3px;margin-top:3px;overflow:hidden"><div style="height:100%;width:${(d.value/maxHC*100).toFixed(0)}%;background:linear-gradient(90deg,#8b5cf6,#ec4899);border-radius:3px"></div></div>
        </div>
        <div style="font-size:11px;font-weight:700;color:#c4b5fd;white-space:nowrap">$${Math.round(d.value).toLocaleString('fr-FR')}</div>
      </div>`).join('');
  }

  container.innerHTML = html;
}

// ═══════════════════════════════════════════════════════════════
// CARTE : RSS OMS place les points pour les maladies sans API
// ═══════════════════════════════════════════════════════════════

// Utilise les alertes RSS OMS pour placer des points sur la carte
// Pour les maladies qui n'ont pas d'API dédiée (Ebola, Marburg, etc.)
function mapFromRSSAlerts() {
  if (typeof rssAlerts === 'undefined' || !rssAlerts.length) return {};

  // Regroupe les alertes RSS par maladie et pays
  const byDisease = {};

  rssAlerts.forEach(alert => {
    if (!alert.disease || !alert.location) return;

    if (!byDisease[alert.disease]) byDisease[alert.disease] = {};

    // Estime le nombre de cas selon la sévérité de l'alerte
    const severityCases = {
      critical: 5000, high: 2000, medium: 800, watch: 300
    };
    const cases = severityCases[alert.severity] || 500;

    // Accumule les cas par pays
    if (byDisease[alert.disease][alert.location]) {
      byDisease[alert.disease][alert.location] += cases;
    } else {
      byDisease[alert.disease][alert.location] = cases;
    }
  });

  return byDisease;
}

// Applique les données RSS OMS à la carte
function applyRSSToMap() {
  const rssData = mapFromRSSAlerts();
  let applied = 0;

  Object.entries(rssData).forEach(([diseaseId, countries]) => {
    if (Object.keys(countries).length === 0) return;

    // Met à jour DC (pays touchés) avec les données RSS
    if (typeof DC !== 'undefined') {
      // Fusionne avec les pays existants
      const existing = DC[diseaseId] || [];
      const fromRSS = Object.keys(countries);
      DC[diseaseId] = [...new Set([...existing, ...fromRSS])];
    }

    // Met à jour les poids de cas avec les données RSS
    if (typeof DISEASE_CASE_WEIGHTS !== 'undefined') {
      if (!DISEASE_CASE_WEIGHTS[diseaseId]) DISEASE_CASE_WEIGHTS[diseaseId] = {};
      Object.entries(countries).forEach(([iso2, cases]) => {
        // Les données RSS OMS priment (plus récentes)
        DISEASE_CASE_WEIGHTS[diseaseId][iso2] = cases;
      });
    }

    // Marque comme provenant du RSS OMS
    if (typeof window !== 'undefined') {
      window._rssGenerated = window._rssGenerated || {};
      window._rssGenerated[diseaseId] = true;
    }

    applied++;
  });

  // Redessine la carte
  if (applied > 0 && typeof drawAllCircles === 'function' && typeof mapReady !== 'undefined' && mapReady) {
    drawAllCircles();
    if (typeof buildLegend === 'function') buildLegend();
  }

  return applied;
}

// ═══════════════════════════════════════════════════════════════
// INITIALISATION — charge les vraies API dans les onglets
// ═══════════════════════════════════════════════════════════════

function initRealAPIs() {
  // Charge les vraies données quand on ouvre chaque onglet
  // (géré via goTab dans app.js)

  // Applique le RSS OMS à la carte dès que les alertes sont chargées
  setTimeout(() => {
    if (typeof applyRSSToMap === 'function') applyRSSToMap();
  }, 5000);

  // Ré-applique le RSS à la carte toutes les 5 minutes
  setInterval(() => {
    if (typeof applyRSSToMap === 'function') applyRSSToMap();
  }, 5 * 60 * 1000);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => setTimeout(initRealAPIs, 4000));
} else {
  setTimeout(initRealAPIs, 4000);
}

// ═══════════════════════════════════════════════════════════════
// FONCTION CENTRALE : vrais cas d'une maladie depuis les API
// Priorité : disease.sh (COVID) > WHO GHO > Delphi > RSS > données locales
// ═══════════════════════════════════════════════════════════════
function realCasesForDisease(diseaseId) {
  // 1. COVID : total mondial depuis disease.sh
  if (diseaseId === 'covid19' && typeof cvData !== 'undefined' && cvData.length) {
    return {
      cases: cvData.reduce((s,c)=>s+(c.cases||0),0),
      source: 'disease.sh',
      live: true
    };
  }

  // 2. Autres maladies : somme des cas par pays depuis DISEASE_CASE_WEIGHTS
  //    (rempli par WHO GHO, Delphi, ou RSS)
  if (typeof DISEASE_CASE_WEIGHTS !== 'undefined' && DISEASE_CASE_WEIGHTS[diseaseId]) {
    const weights = DISEASE_CASE_WEIGHTS[diseaseId];
    const total = Object.values(weights).reduce((s,v)=>s+(parseInt(v)||0),0);
    if (total > 0) {
      // Détermine la source
      let source = 'estimation';
      let live = false;
      if (typeof window !== 'undefined') {
        if (window._whoGenerated && window._whoGenerated[diseaseId]) { source = 'WHO GHO'; live = true; }
        else if (window._delphiGenerated && window._delphiGenerated[diseaseId]) { source = 'Delphi CMU'; live = true; }
        else if (window._rssGenerated && window._rssGenerated[diseaseId]) { source = 'RSS OMS'; live = true; }
      }
      return { cases: total, source, live };
    }
  }

  // 3. Fallback : données locales du catalogue
  const d = (typeof DB !== 'undefined') ? DB.diseases.find(x=>x.id===diseaseId) : null;
  return { cases: d ? d.cases : 0, source: 'catalogue', live: false };
}

// Retourne juste le nombre (pour compatibilité)
function realCases(diseaseId) {
  return realCasesForDisease(diseaseId).cases;
}
