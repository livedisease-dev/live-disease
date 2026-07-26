// ================================================================
// WORLD DISEASE MONITOR — extra-apis.js
// API gratuites SUPPLÉMENTAIRES — SANS CLÉ, SANS LIMITE
// OpenFDA (effets secondaires vaccins/médicaments, rappels)
// Our World in Data (données historiques maladies)
// ================================================================

const OPENFDA_BASE = 'https://api.fda.gov/';

// ─── OPENFDA : effets secondaires d'un médicament/vaccin ─────────
async function fetchFDAAdverseEvents(drugName, maxResults = 10) {
  try {
    // Compte les réactions indésirables les plus fréquentes pour ce produit
    const url = `${OPENFDA_BASE}drug/event.json?search=patient.drug.medicinalproduct:"${encodeURIComponent(drugName)}"&count=patient.reaction.reactionmeddrapt.exact&limit=${maxResults}`;
    const r = await fetch(url, { signal: AbortSignal.timeout(15000) });
    if (!r.ok) return null;
    const data = await r.json();
    if (!data.results) return null;
    return data.results.map(x => ({ reaction: x.term, count: x.count }));
  } catch(e) {
    console.warn('OpenFDA adverse error:', (e && e.message ? e.message : e));
    return null;
  }
}

// ─── OPENFDA : rappels de produits (recalls) ─────────────────────
async function fetchFDARecalls(searchTerm, maxResults = 8) {
  try {
    const url = `${OPENFDA_BASE}drug/enforcement.json?search=reason_for_recall:"${encodeURIComponent(searchTerm)}"&limit=${maxResults}&sort=recall_initiation_date:desc`;
    const r = await fetch(url, { signal: AbortSignal.timeout(15000) });
    if (!r.ok) return null;
    const data = await r.json();
    if (!data.results) return null;
    return data.results.map(x => ({
      product: x.product_description ? x.product_description.slice(0, 80) : '',
      reason: x.reason_for_recall ? x.reason_for_recall.slice(0, 100) : '',
      company: x.recalling_firm || '',
      date: x.recall_initiation_date || '',
      status: x.status || ''
    }));
  } catch(e) {
    console.warn('OpenFDA recall error:', (e && e.message ? e.message : e));
    return null;
  }
}

// ─── AFFICHAGE : effets secondaires dans l'onglet Vaccins ────────
async function loadFDAVaccineSafety(vaccineName) {
  const container = document.getElementById('fda-safety-data');
  if (!container) return;
  container.innerHTML = '<div class="ldw"><div class="lds"></div> Chargement données de sécurité (OpenFDA)...</div>';

  const events = await fetchFDAAdverseEvents(vaccineName || 'vaccine', 12);
  if (!events || events.length === 0) {
    container.innerHTML = '<div style="text-align:center;padding:12px;color:var(--t2);font-size:9px">Aucune donnée OpenFDA pour ce produit.</div>';
    return;
  }

  const maxCount = Math.max(...events.map(e => e.count));
  container.innerHTML = `
    <div style="font-size:9px;color:#c4b5fd;margin-bottom:8px;padding:5px 8px;background:rgba(139,92,246,.05);border-radius:5px;border:1px solid rgba(139,92,246,.12)">
      💊 Effets secondaires signalés · Source: OpenFDA (FAERS, gouvernement USA) · ${events.length} réactions
    </div>
    ${events.map(e => `
      <div style="display:flex;align-items:center;gap:8px;padding:4px 8px;background:var(--card);border:1px solid var(--brd);border-radius:6px;margin-bottom:3px">
        <div style="flex:1;min-width:0">
          <div style="font-size:9px;color:var(--t1)">${e.reaction}</div>
          <div style="height:4px;background:var(--bg3);border-radius:3px;margin-top:2px;overflow:hidden"><div style="height:100%;width:${(e.count/maxCount*100).toFixed(0)}%;background:linear-gradient(90deg,#8b5cf6,#ec4899);border-radius:3px"></div></div>
        </div>
        <div style="font-size:10px;font-weight:700;color:#c4b5fd;white-space:nowrap">${e.count.toLocaleString('fr-FR')}</div>
      </div>
    `).join('')}
    <div style="font-size:7px;color:var(--t3);margin-top:6px;text-align:center">⚠️ Ces signalements ne prouvent pas de lien de cause à effet (base FAERS brute)</div>
  `;
}

if (typeof window !== 'undefined') {
  window.fetchFDAAdverseEvents = fetchFDAAdverseEvents;
  window.fetchFDARecalls = fetchFDARecalls;
  window.loadFDAVaccineSafety = loadFDAVaccineSafety;
}

// ═══════════════════════════════════════════════════════════════
// OUR WORLD IN DATA — données historiques (SANS CLÉ)
// Vaccination, mortalité, tendances sur des décennies
// ═══════════════════════════════════════════════════════════════

// OWID publie des CSV/JSON via GitHub, accès direct sans clé
async function fetchOWIDVaccination() {
  try {
    // Couverture vaccinale mondiale (données OWID/OMS)
    const url = 'https://raw.githubusercontent.com/owid/owid-datasets/master/datasets/Vaccination%20coverage%20(WHO%202020)/Vaccination%20coverage%20(WHO%202020).csv';
    const r = await fetch(url, { signal: AbortSignal.timeout(15000) });
    if (!r.ok) return null;
    const txt = await r.text();
    return parseOWIDCsv(txt);
  } catch(e) {
    console.warn('OWID error:', (e && e.message ? e.message : e));
    return null;
  }
}

function parseOWIDCsv(txt) {
  const lines = txt.split('\n').filter(l => l.trim());
  if (lines.length < 2) return null;
  const headers = lines[0].split(',');
  return lines.slice(1, 100).map(line => {
    const vals = line.split(',');
    const obj = {};
    headers.forEach((h, i) => { obj[h.trim()] = vals[i]; });
    return obj;
  });
}

if (typeof window !== 'undefined') {
  window.fetchOWIDVaccination = fetchOWIDVaccination;
}

// ═══════════════════════════════════════════════════════════════
// NOMINATIM (OpenStreetMap) — géolocalisation précise (SANS CLÉ)
// Pour placer les foyers exactement où ils sont
// ═══════════════════════════════════════════════════════════════
async function geocodePlace(placeName) {
  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(placeName)}&format=json&limit=1`;
    const r = await fetch(url, {
      signal: AbortSignal.timeout(10000),
      headers: { 'User-Agent': 'world-disease-monitor' }
    });
    if (!r.ok) return null;
    const data = await r.json();
    if (!data || data.length === 0) return null;
    return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon), name: data[0].display_name };
  } catch(e) {
    return null;
  }
}

if (typeof window !== 'undefined') {
  window.geocodePlace = geocodePlace;
}
