// ================================================================
// WORLD DISEASE MONITOR — tavily.js
// Recherche web temps réel via WebSearch → alimente IA
// 1000 crédits gratuits/mois · Économise les crédits intelligemment
// ================================================================

// Cache pour économiser les crédits (ne re-cherche pas la même chose)
let tavilyCache = {};
let tavilyCreditsUsed = parseInt(localStorage.getItem('wdm_tavily_credits') || '0');

// ─── RECHERCHE WEB TAVILY ─────────────────────────────────────────
async function tavilySearch(query, maxResults = 5) {
  if (!TAVILY_KEY) return null;

  // Vérifie le cache (30 min de validité pour économiser)
  const cacheKey = query.toLowerCase().trim();
  if (tavilyCache[cacheKey] && (Date.now() - tavilyCache[cacheKey].time < 30 * 60 * 1000)) {
    return tavilyCache[cacheKey].data;
  }

  try {
    const resp = await fetch(TAVILY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: TAVILY_KEY,
        query: query,
        search_depth: 'basic',       // 1 crédit (basic) au lieu de 2 (advanced)
        max_results: maxResults,
        include_answer: true,        // WebSearch donne une réponse synthétique
        topic: 'news',               // Priorité aux news récentes
        days: 7                      // Derniers 7 jours
      }),
      signal: AbortSignal.timeout(20000)
    });

    if (!resp.ok) {
      if (resp.status === 401) console.warn('WebSearch: clé invalide');
      if (resp.status === 429) console.warn('WebSearch: crédits épuisés');
      return null;
    }

    const data = await resp.json();

    // Compte les crédits
    tavilyCreditsUsed++;
    localStorage.setItem('wdm_tavily_credits', String(tavilyCreditsUsed));
    updateWebBadge();

    // Met en cache
    tavilyCache[cacheKey] = { time: Date.now(), data: data };

    return data;
  } catch(e) {
    console.warn('WebSearch error:', e.message);
    return null;
  }
}

// ─── GROQ + TAVILY : ANALYSE AVEC VRAIES DONNÉES WEB ─────────────
// IA analyse les résultats web frais de WebSearch
async function groqWithWebSearch(question) {
  if (!TAVILY_KEY || !GROQ_KEY) {
    // Fallback : IA seul
    return typeof callGroq === 'function' ? callGroq(question) : null;
  }

  // 1. WebSearch cherche les vraies infos sur le web
  const searchResults = await tavilySearch(question, 5);

  if (!searchResults) {
    return typeof callGroq === 'function' ? callGroq(question) : null;
  }

  // 2. Prépare le contexte web pour IA
  let webContext = '';
  if (searchResults.answer) {
    webContext += `Réponse synthétique web: ${searchResults.answer}\n\n`;
  }
  if (searchResults.results && searchResults.results.length) {
    webContext += 'Sources web récentes:\n';
    searchResults.results.forEach((r, i) => {
      webContext += `${i+1}. ${r.title}\n${r.content?.slice(0, 300)}\n(${r.url})\n\n`;
    });
  }

  // 3. IA analyse les vraies données web
  const q = `En te basant sur ces données web RÉELLES et RÉCENTES:\n\n${webContext}\n\nQuestion: ${question}\n\nRéponds en français avec les chiffres et faits les plus récents trouvés ci-dessus. Cite les sources.`;

  return typeof callGroq === 'function' ? callGroq(q) : searchResults.answer;
}

// ─── TAVILY GÉNÈRE LES DONNÉES CARTE (vrais chiffres web) ────────
async function tavilyMapDataForDisease(diseaseId, diseaseName) {
  if (!TAVILY_KEY) return null;

  // Cherche les vrais cas de cette maladie
  const query = `${diseaseName} cases outbreak 2026 countries affected latest numbers`;
  const results = await tavilySearch(query, 3);

  if (!results || !results.answer) return null;

  // IA extrait les pays + cas depuis les résultats web
  if (!GROQ_KEY) return null;

  let webInfo = results.answer + '\n';
  if (results.results) {
    results.results.forEach(r => { webInfo += r.content?.slice(0, 200) + '\n'; });
  }

  const availableCodes = (typeof CC !== 'undefined') ? Object.keys(CC).join(',') : '';
  const q = `Données web réelles sur ${diseaseName}:\n${webInfo}\n\nExtrais les pays touchés et le nombre de cas. Réponds UNIQUEMENT en JSON (codes ISO2):
{"cases":{"US":45000,"BR":89000}}
Utilise UNIQUEMENT ces codes: ${availableCodes}`;

  try {
    const resp = await fetch(GROQ_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + GROQ_KEY },
      body: JSON.stringify({ model: GROQ_MODEL, messages: [{ role: 'user', content: q }], max_tokens: 800, temperature: 0.1 }),
      signal: AbortSignal.timeout(20000)
    });
    if (!resp.ok) return null;
    const data = await resp.json();
    let txt = (data.choices?.[0]?.message?.content || '').replace(/```json|```/g, '').trim();
    const match = txt.match(/\{[\s\S]*\}/);
    if (!match) return null;
    const parsed = JSON.parse(match[0]);
    const casesObj = parsed.cases || parsed;

    const clean = {};
    Object.entries(casesObj).forEach(([k, v]) => {
      const iso2 = k.toUpperCase().trim();
      const cases = parseInt(v);
      if (iso2.length === 2 && !isNaN(cases) && cases > 0 && (typeof CC === 'undefined' || CC[iso2])) {
        clean[iso2] = cases;
      }
    });
    return Object.keys(clean).length > 0 ? clean : null;
  } catch(e) {
    return null;
  }
}

// ─── BADGE CRÉDITS TAVILY ─────────────────────────────────────────
function updateWebBadge() {
  const el = document.getElementById('tavily-credits');
  if (el) {
    const remaining = 1000 - tavilyCreditsUsed;
    el.textContent = `${remaining} crédits WebSearch restants ce mois`;
    el.style.color = remaining < 100 ? 'var(--redl)' : remaining < 300 ? 'var(--yell)' : 'var(--grnl)';
  }
}

// ─── SETUP TAVILY ─────────────────────────────────────────────────
function openTavilySetup() {
  const pop = document.createElement('div');
  pop.className = 'gpop';
  pop.id = 'tavily-pop';
  pop.innerHTML = `<div class="gbox">
    <h3 style="background:linear-gradient(90deg,#14b8a6,#06b6d4);-webkit-background-clip:text;-webkit-text-fill-color:transparent">🌐 Configurer WebSearch (recherche web temps réel)</h3>
    <p style="font-size:10px;color:var(--t2);margin-bottom:11px;line-height:1.7">
      WebSearch donne à IA l'accès à internet en temps réel · <strong style="color:var(--grnl)">1000 recherches gratuites/mois, zéro carte bancaire</strong>
    </p>
    <div style="background:var(--bg3);border-radius:var(--rs);padding:10px;margin-bottom:11px;font-size:10px;color:var(--t2);line-height:2">
      1. Va sur <a href="https://tavily.com" target="_blank" rel="noopener" style="color:var(--teal)">tavily.com</a><br>
      2. Clique <strong style="color:var(--t1)">Sign Up</strong> (email ou Google)<br>
      3. Ta clé s'affiche sur le tableau de bord<br>
      4. Elle commence par <code style="color:var(--teal)">tvly-</code>
    </div>
    <input class="ginp" id="tavilyKeyInp" type="password" value="${TAVILY_KEY}" placeholder="tvly-... (colle ta clé ici)"/>
    <div style="display:flex;gap:7px">
      <button class="gsave" style="background:linear-gradient(135deg,#14b8a6,#06b6d4)" onclick="saveWebKey()">✓ Sauvegarder</button>
      <button class="gcancel" onclick="closeWebSetup()">Annuler</button>
    </div>
    ${TAVILY_KEY ? `<div style="margin-top:8px;font-size:9px;color:var(--t2);text-align:center" id="tavily-credits"></div>` : ''}
  </div>`;
  document.body.appendChild(pop);
  pop.addEventListener('click', e => { if (e.target === pop) closeWebSetup(); });
  setTimeout(() => { const i = document.getElementById('tavilyKeyInp'); if (i) { i.focus(); i.select(); } updateWebBadge(); }, 80);
}

function closeWebSetup() { const p = document.getElementById('tavily-pop'); if (p) p.remove(); }

function saveWebKey() {
  const inp = document.getElementById('tavilyKeyInp');
  if (!inp) return;
  const key = inp.value.trim();
  TAVILY_KEY = key;
  if (key) localStorage.setItem('wdm_tavily_key', key);
  else localStorage.removeItem('wdm_tavily_key');
  closeWebSetup();
  updateWebSearchStatus();

  if (key && typeof addMsg === 'function') {
    addMsg('bot', '✅ **WebSearch connecté !**\n\n🌐 IA a maintenant accès à internet en temps réel !\n\nQuand tu poses une question, IA cherche d\'abord les vraies infos sur le web, puis répond avec des données fraîches. La carte peut maintenant se mettre à jour avec de vrais chiffres.\n\n💡 Tu as 1000 recherches gratuites par mois.');
    // Lance une mise à jour carte avec WebSearch
    if (typeof tavilyLiveMapUpdate === 'function') setTimeout(tavilyLiveMapUpdate, 1000);
  }
}

function updateWebSearchStatus() {
  const btn = document.getElementById('tavily-btn');
  if (btn) {
    if (TAVILY_KEY) { btn.innerHTML = '🌐 Web ✓'; btn.style.background = 'rgba(20,184,166,.15)'; btn.style.color = '#5eead4'; }
    else { btn.innerHTML = '🌐 Web temps réel'; }
  }
}

// ─── MISE À JOUR CARTE AVEC TAVILY (vrais chiffres web) ──────────
let tavilyMapRunning = false;
async function tavilyLiveMapUpdate() {
  if (!TAVILY_KEY || !GROQ_KEY || tavilyMapRunning) return;
  tavilyMapRunning = true;

  const diseases = (typeof DB !== 'undefined') ? DB.diseases : [];
  // Pour économiser les crédits : seulement les maladies prioritaires (foyers actifs)
  const priorityDiseases = diseases.filter(d => ['critical', 'high'].includes(d.risk)).slice(0, 8);

  if (typeof showGroqLiveStatus === 'function') {
    showGroqLiveStatus(`🌐 WebSearch cherche les vrais chiffres (${priorityDiseases.length} maladies)...`, 'loading');
  }

  let done = 0;
  for (const d of priorityDiseases) {
    const data = await tavilyMapDataForDisease(d.id, d.name);
    if (data) {
      if (typeof DC !== 'undefined') DC[d.id] = Object.keys(data);
      if (typeof DISEASE_CASE_WEIGHTS !== 'undefined') DISEASE_CASE_WEIGHTS[d.id] = data;
      if (typeof window !== 'undefined') {
        window._tavilyGenerated = window._tavilyGenerated || {};
        window._tavilyGenerated[d.id] = true;
      }
    }
    done++;
    if (typeof showGroqLiveStatus === 'function') {
      showGroqLiveStatus(`🌐 WebSearch: ${done}/${priorityDiseases.length} maladies (vrais chiffres web)`, 'loading');
    }
    if (typeof drawAllCircles === 'function' && typeof mapReady !== 'undefined' && mapReady) drawAllCircles();
    // Pause pour ne pas épuiser les crédits trop vite
    await new Promise(res => setTimeout(res, 1500));
  }

  tavilyMapRunning = false;
  if (typeof showGroqLiveStatus === 'function') {
    showGroqLiveStatus(`✅ ${done} maladies avec vrais chiffres web · ${new Date().toLocaleTimeString('fr-FR')}`, 'ok');
  }
}

// Init badge au chargement
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => setTimeout(updateWebSearchStatus, 1500));
} else {
  setTimeout(updateWebSearchStatus, 1500);
}
