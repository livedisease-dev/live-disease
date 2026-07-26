// ================================================================
// WORLD DISEASE MONITOR — groq-live.js
// IA génère les POINTS de la carte en temps réel
// Analyse chaque maladie → pays touchés + nombre de cas
// Actualisation automatique toutes les 2 minutes
// ================================================================

let groqLiveTimer = null;
let groqMapData = {};      // { diseaseId: { ISO2: cases } }
let groqLiveRunning = false;
let groqLiveProgress = 0;

// ─── GROQ GÉNÈRE LES DONNÉES CARTE PAR MALADIE ───────────────────
async function groqGenerateMapData(diseaseId, diseaseName) {
  if (!GROQ_KEY) return null;

  // Liste des codes pays disponibles pour guider IA
  const availableCodes = (typeof CC !== 'undefined') ? Object.keys(CC).join(',') : '';

  const q = `Tu es épidémiologiste OMS/CDC. Date: ${new Date().toLocaleDateString('fr-FR')}.
Maladie: "${diseaseName}".

ÉTAPE 1 - Détermine si cette maladie est:
- MONDIALE (présente dans presque tous les pays: VIH, tuberculose, grippe, hépatites, COVID, rougeole, etc.)
- RÉGIONALE (limitée à certaines zones: dengue tropicale, Marburg, Ebola, fièvre de Lassa, etc.)

ÉTAPE 2 - Donne les pays touchés avec estimation de cas 2026.
- Si MONDIALE: inclus TOUS les pays de cette liste avec des cas proportionnels à la population.
- Si RÉGIONALE: seulement les pays réellement touchés.

Pays disponibles (codes ISO2): ${availableCodes}

Réponds UNIQUEMENT en JSON strict, rien d'autre:
{"scope":"mondiale","cases":{"US":45000,"IN":120000,"NG":89000,...}}
ou
{"scope":"regionale","cases":{"BR":89000,"TH":34000,...}}

Utilise UNIQUEMENT les codes ISO2 de la liste fournie. Estimations réalistes.`;

  try {
    const resp = await fetch(GROQ_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + GROQ_KEY },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [{ role: 'user', content: q }],
        max_tokens: 2500,  // Assez pour tous les pays si mondiale
        temperature: 0.2
      }),
      signal: AbortSignal.timeout(25000)
    });
    if (!resp.ok) return null;
    const data = await resp.json();
    let txt = data.choices?.[0]?.message?.content || '';
    txt = txt.replace(/```json|```/g, '').trim();

    // Extrait le JSON (peut être gros maintenant)
    const jsonMatch = txt.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;
    const parsed = JSON.parse(jsonMatch[0]);

    // Récupère les cas (nouveau format avec scope, ou ancien format direct)
    const casesObj = parsed.cases || parsed;
    const scope = parsed.scope || 'regionale';

    // Valide et nettoie
    const clean = {};
    Object.entries(casesObj).forEach(([k, v]) => {
      const iso2 = k.toUpperCase().trim();
      const cases = parseInt(v);
      if (iso2.length === 2 && !isNaN(cases) && cases > 0 && (typeof CC === 'undefined' || CC[iso2])) {
        clean[iso2] = cases;
      }
    });

    // Si IA dit MONDIALE mais a oublié des pays, complète avec population
    if (scope === 'mondiale' && typeof CC !== 'undefined') {
      const covered = Object.keys(clean).length;
      const total = Object.keys(CC).length;
      // Si moins de 80% des pays couverts, complète le reste
      if (covered < total * 0.8) {
        const yearly = (typeof YEARLY_INCIDENCE !== 'undefined' && YEARLY_INCIDENCE[diseaseId]) ? YEARLY_INCIDENCE[diseaseId] : 100000;
        Object.keys(CC).forEach(iso2 => {
          if (!clean[iso2]) {
            const pop = (typeof POP !== 'undefined' && POP[iso2]) ? POP[iso2] : 2;
            const totalPop = (typeof POP !== 'undefined') ? Object.values(POP).reduce((s,p)=>s+p,0) : 8000;
            clean[iso2] = Math.max(50, Math.round(yearly * (pop/totalPop)));
          }
        });
      }
    }

    return Object.keys(clean).length > 0 ? clean : null;
  } catch(e) {
    return null;
  }
}

// ─── LANCE LA GÉNÉRATION POUR TOUTES LES MALADIES ────────────────
async function groqLiveMapUpdate() {
  if (!GROQ_KEY || groqLiveRunning) return;
  groqLiveRunning = true;
  groqLiveProgress = 0;

  const diseases = (typeof DB !== 'undefined') ? DB.diseases : [];
  showGroqLiveStatus(`🦙 IA analyse ${diseases.length} maladies...`, 'loading');

  // Traite les maladies par lots de 3 en parallèle (pour ne pas dépasser les limites)
  const batchSize = 3;
  let done = 0;

  for (let i = 0; i < diseases.length; i += batchSize) {
    const batch = diseases.slice(i, i + batchSize);
    const results = await Promise.allSettled(
      batch.map(d => groqGenerateMapData(d.id, d.name).then(data => ({ id: d.id, data })))
    );

    results.forEach(r => {
      if (r.status === 'fulfilled' && r.value?.data) {
        groqMapData[r.value.id] = r.value.data;
        // IA REMPLACE complètement les listes codées en dur
        if (typeof DC !== 'undefined') {
          DC[r.value.id] = Object.keys(r.value.data);
        }
        if (typeof DISEASE_CASE_WEIGHTS !== 'undefined') {
          DISEASE_CASE_WEIGHTS[r.value.id] = r.value.data;
        }
        // Marque comme généré par IA
        if (typeof window !== 'undefined') {
          window._groqGenerated = window._groqGenerated || {};
          window._groqGenerated[r.value.id] = true;
        }
      }
      done++;
    });

    groqLiveProgress = Math.round((done / diseases.length) * 100);
    showGroqLiveStatus(`🦙 IA: ${done}/${diseases.length} maladies analysées (${groqLiveProgress}%)`, 'loading');

    // Redessine la carte progressivement
    if (typeof drawAllCircles === 'function' && mapReady) drawAllCircles();
    if (typeof buildFilterList === 'function') buildFilterList();

    // Petite pause entre les lots
    await new Promise(res => setTimeout(res, 800));
  }

  groqLiveRunning = false;
  showGroqLiveStatus(`✅ ${done} maladies · Carte générée par IA · ${new Date().toLocaleTimeString('fr-FR')}`, 'ok');

  // Redessine tout
  if (typeof drawAllCircles === 'function' && mapReady) drawAllCircles();
  if (typeof buildLegend === 'function') buildLegend();
  if (typeof renderCountersPanel === 'function' && document.getElementById('panel-counters')?.classList.contains('on')) {
    renderCountersPanel();
  }
}

// ─── STATUT VISUEL ────────────────────────────────────────────────
function showGroqLiveStatus(msg, type) {
  // Badge dans la status bar
  let badge = document.getElementById('groq-live-badge');
  if (!badge) {
    const sb = document.querySelector('.statusbar') || document.querySelector('#sstat')?.parentElement;
    if (sb) {
      badge = document.createElement('span');
      badge.id = 'groq-live-badge';
      badge.style.cssText = 'font-size:8px;padding:2px 7px;border-radius:4px;font-weight:700;margin-left:6px';
      const ref = document.getElementById('sstat');
      if (ref && ref.parentNode) ref.parentNode.insertBefore(badge, ref.nextSibling);
      else sb.appendChild(badge);
    }
  }
  if (badge) {
    const colors = {
      loading: 'background:rgba(245,80,54,.15);color:#fdba74;border:1px solid rgba(245,80,54,.3)',
      ok: 'background:rgba(34,197,94,.12);color:#86efac;border:1px solid rgba(34,197,94,.25)',
      error: 'background:rgba(234,179,8,.1);color:#fde047;border:1px solid rgba(234,179,8,.2)'
    };
    badge.style.cssText += ';' + (colors[type] || colors.loading);
    badge.innerHTML = (type === 'loading' ? '<span class="spin"></span> ' : '') + msg;
  }

  // Aussi dans le panneau carte
  const mapStatus = document.getElementById('map-groq-status');
  if (mapStatus) {
    mapStatus.innerHTML = msg;
    mapStatus.style.color = type === 'ok' ? 'var(--grnl)' : type === 'error' ? 'var(--yell)' : 'var(--oral)';
  }
}

// ─── DÉMARRAGE + AUTO-REFRESH 2 MINUTES ──────────────────────────
function startGroqLive() {
  if (!GROQ_KEY) {
    showGroqLiveStatus('', 'error');
    return;
  }

  // Complète d'abord les données de base
  if (typeof completeDiseaseMapData === 'function') completeDiseaseMapData();

  // Première génération immédiate
  groqLiveMapUpdate();

  // Auto-refresh toutes les 2 minutes
  if (groqLiveTimer) clearInterval(groqLiveTimer);
  groqLiveTimer = setInterval(() => {
    if (GROQ_KEY && !groqLiveRunning) {
      groqLiveMapUpdate();
    }
  }, 2 * 60 * 1000); // 2 minutes
}

// Relance quand la clé IA est configurée
function onIAKeyReady() {
  if (GROQ_KEY) startGroqLive();
}

// Init au chargement
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    // Complète les données de base immédiatement (sans attendre IA)
    setTimeout(() => {
      if (typeof completeDiseaseMapData === 'function') completeDiseaseMapData();
      if (typeof drawAllCircles === 'function' && typeof mapReady !== 'undefined' && mapReady) drawAllCircles();
      if (typeof buildFilterList === 'function') buildFilterList();
      // Lance IA si clé dispo
      if (GROQ_KEY) setTimeout(startGroqLive, 2500);
    }, 2000);
  });
} else {
  setTimeout(() => {
    if (typeof completeDiseaseMapData === 'function') completeDiseaseMapData();
    if (GROQ_KEY) setTimeout(startGroqLive, 2500);
  }, 2000);
}
