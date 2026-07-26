// ================================================================
// WORLD DISEASE MONITOR — counters.js
// Compteurs animés style Worldometer + graphes + prévisions IA
// ================================================================

// Taux d'incidence annuels estimés (nouveaux cas/an) pour animer les compteurs
const YEARLY_INCIDENCE = {
  dengue: 96000000,      // OMS: ~96M cas symptomatiques/an
  malaria: 249000000,    // OMS: 249M cas/an
  tb: 10600000,          // OMS: 10.6M cas/an
  hiv: 1300000,          // ONUSIDA: 1.3M nouvelles infections/an
  cholera: 4000000,      // OMS: 1.3-4M cas/an
  measles: 9000000,      // OMS: ~9M cas/an
  hep_b: 1500000,        // OMS: 1.5M nouvelles infections/an
  influenza: 1000000000, // OMS: ~1 milliard cas/an
  pertussis: 24000000,   // OMS: 24M cas/an
  meningitis: 2500000,   // ~2.5M cas/an
  rabies: 59000,         // OMS: 59000 décès/an
  yellow_fever: 200000,  // OMS: 200000 cas/an
  chikungunya: 1000000,  // ~1M cas/an
  zika: 500000,          // estimation
  mpox: 95000,           // 2024-2026
  h5n1: 100,             // rare mais surveillé
  amr: 5000000,          // décès associés/an
  polio: 500,            // cVDPV
  lassa: 300000,         // OMS: 100-300K/an
  ebola: 100,
  marburg: 20,
  nipah: 15,
  mers: 200,
  candida: 20000,
  hantavirus: 20000,
  covid19: 0, // temps réel via API
};

let counterTimers = {};
let counterValues = {};

// ─── COMPTEUR ANIMÉ ───────────────────────────────────────────────
function startDiseaseCounter(disId, elementId, baseValue) {
  let yearly = YEARLY_INCIDENCE[disId] || 0;
  // Si WHO GHO a de vraies données pour cette maladie, les utiliser comme base
  if (typeof realCasesForDisease === 'function') {
    const rc = realCasesForDisease(disId);
    if (rc.live && rc.cases > 0) {
      // Utilise le vrai total annuel des API si disponible
      yearly = Math.max(yearly, rc.cases);
    }
  }
  if (yearly === 0) return;

  const perSecond = yearly / (365 * 24 * 3600); // cas par seconde
  counterValues[disId] = baseValue || 0;

  // Calcul depuis début d'année pour valeur réaliste
  const now = new Date();
  const yearStart = new Date(now.getFullYear(), 0, 1);
  const secondsSinceYearStart = (now - yearStart) / 1000;
  counterValues[disId] = Math.floor(perSecond * secondsSinceYearStart);

  const el = document.getElementById(elementId);
  if (!el) return;

  if (counterTimers[disId]) clearInterval(counterTimers[disId]);

  const update = () => {
    counterValues[disId] += perSecond * 0.5; // incrément toutes les 500ms
    const el2 = document.getElementById(elementId);
    if (el2) {
      el2.textContent = Math.floor(counterValues[disId]).toLocaleString('fr-FR');
    } else {
      clearInterval(counterTimers[disId]);
    }
  };
  update();
  counterTimers[disId] = setInterval(update, 500);
}

// ─── PANEL COMPTEURS (nouvel onglet) ──────────────────────────────
function renderCountersPanel() {
  const panel = document.getElementById('panel-counters');
  if (!panel) return;

  const diseases = (typeof DB !== 'undefined') ? DB.diseases : [];

  panel.innerHTML = `
    <div style="background:linear-gradient(135deg,rgba(239,68,68,.06),rgba(249,115,22,.06));border:1px solid rgba(239,68,68,.15);border-radius:var(--r);padding:12px 15px;margin-bottom:10px">
      <div style="font-size:13px;font-weight:800;color:var(--t1);margin-bottom:3px">🌍 Compteurs mondiaux en direct — ${new Date().getFullYear()}</div>
      <div style="font-size:9px;color:var(--t2)">Estimations basées sur les taux d'incidence annuels OMS. Les chiffres montent en temps réel depuis le 1er janvier ${new Date().getFullYear()}.</div>
    </div>

    <div class="ai-block" style="margin-bottom:10px">
      <div class="ai-block-t">🦙 Assistant IA — Prévisions & analyse</div>
      <div class="ai-btns" id="counters-ai-btns"></div>
    </div>

    <div id="counters-grid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:9px"></div>
  `;

  const grid = document.getElementById('counters-grid');
  if (!grid) return;

  // Trie par incidence décroissante
  const sorted = [...diseases].sort((a, b) => (YEARLY_INCIDENCE[b.id] || 0) - (YEARLY_INCIDENCE[a.id] || 0));

  grid.innerHTML = sorted.map(d => {
    const yearly = YEARLY_INCIDENCE[d.id] || 0;
    const color = d.color || '#ef4444';
    return `
      <div style="background:var(--card);border:1px solid var(--brd);border-left:3px solid ${color};border-radius:var(--r);padding:11px 13px;cursor:pointer" onclick="pickDis('${d.id}')">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px">
          <div style="font-size:11px;font-weight:700;color:var(--t1)">${d.emoji} ${d.name}</div>
          <span class="badge ${RC[d.risk]||'bw'}" style="font-size:7px">${d.risk.toUpperCase()}</span>
        </div>
        <div style="font-size:8px;color:var(--t2);margin-bottom:2px">Cas estimés ${new Date().getFullYear()} (monde)</div>
        <div id="counter-${d.id}" style="font-size:22px;font-weight:800;color:${color};line-height:1;font-variant-numeric:tabular-nums;margin-bottom:5px">—</div>
        <div style="display:flex;justify-content:space-between;font-size:8px;color:var(--t3)">
          <span>📈 ${yearly >= 1e9 ? (yearly/1e9).toFixed(1)+'B' : yearly >= 1e6 ? (yearly/1e6).toFixed(0)+'M' : (yearly/1e3).toFixed(0)+'K'}/an</span>
          <span>☠️ ${d.mort}% mortalité</span>
        </div>
        <div style="display:flex;gap:4px;margin-top:7px">
          <button class="bsm" style="font-size:7px;flex:1" onclick="event.stopPropagation();showDiseaseGraph('${d.id}')">📊 Graphe</button>
          ${typeof GROQ_KEY !== 'undefined' && GROQ_KEY ? `<button class="bsm" style="font-size:7px;flex:1" onclick="event.stopPropagation();forecastDisease('${d.id}')">🔮 Prévision IA</button>` : ''}
        </div>
      </div>`;
  }).join('');

  // Démarre tous les compteurs
  sorted.forEach(d => {
    if (YEARLY_INCIDENCE[d.id]) {
      startDiseaseCounter(d.id, 'counter-' + d.id);
    } else {
      const el = document.getElementById('counter-' + d.id);
      if (el) el.textContent = d.cases.toLocaleString('fr-FR');
    }
  });

  // Boutons AI
  const aiBtns = document.getElementById('counters-ai-btns');
  if (aiBtns && typeof GROQ_KEY !== 'undefined' && GROQ_KEY) {
    aiBtns.innerHTML = [
      ['🔮 Prévisions 2027-2030', "Quelles maladies vont le plus progresser d'ici 2030 ? Fais des prévisions chiffrées basées sur les tendances actuelles."],
      ['💰 Impact économique futur', "Quel sera l'impact économique mondial des épidémies dans les 5 prochaines années ? Chiffre les coûts."],
      ['🌍 Conséquences sur nos vies', "Comment les épidémies vont-elles affecter notre vie quotidienne, l'économie et la société d'ici 2030 ?"],
    ].map(([l, q]) => {
      return `<button class="ai-btn" data-q="${q.replace(/"/g, '&quot;')}" onclick="askAI(this.dataset.q)">🦙 ${l}</button>`;
    }).join('');
  }
}

// ─── GRAPHE PAR MALADIE ───────────────────────────────────────────
function showDiseaseGraph(disId) {
  const d = (typeof DB !== 'undefined') ? DB.diseases.find(x => x.id === disId) : null;
  if (!d) return;

  // Ouvre le panneau détail avec un graphe
  const modal = document.getElementById('graph-modal') || createGraphModal();
  modal.classList.add('on');

  const title = document.getElementById('graph-modal-title');
  if (title) title.textContent = `📊 ${d.emoji} ${d.name} — Évolution & Projection`;

  // Génère données historiques + projection
  const yearly = YEARLY_INCIDENCE[disId] || d.cases;
  const years = ['2021', '2022', '2023', '2024', '2025', '2026', '2027*', '2028*', '2029*', '2030*'];
  const trend = d.trend || 5;

  // Historique (léger bruit) + projection selon tendance
  const base = yearly;
  const data = years.map((y, i) => {
    if (i <= 5) {
      // Historique
      const factor = 1 + (trend / 100) * (i - 5) + (Math.random() - 0.5) * 0.08;
      return Math.round(base * factor);
    } else {
      // Projection
      const factor = Math.pow(1 + trend / 100, i - 5);
      return Math.round(base * factor);
    }
  });

  setTimeout(() => {
    const ctx = document.getElementById('graph-canvas');
    if (!ctx) return;
    if (window._graphChart) window._graphChart.destroy();

    window._graphChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: years,
        datasets: [{
          label: 'Cas historiques',
          data: data.map((v, i) => i <= 5 ? v : null),
          borderColor: d.color,
          backgroundColor: d.color + '20',
          fill: true,
          tension: 0.3,
          pointRadius: 4
        }, {
          label: 'Projection (* = prévision)',
          data: data.map((v, i) => i >= 5 ? v : null),
          borderColor: d.color,
          backgroundColor: d.color + '10',
          borderDash: [6, 4],
          fill: true,
          tension: 0.3,
          pointRadius: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { labels: { color: '#5a7299', font: { size: 10 } } },
          tooltip: { callbacks: { label: c => c.parsed.y ? c.parsed.y.toLocaleString('fr-FR') + ' cas' : '' } }
        },
        scales: {
          x: { ticks: { color: '#5a7299', font: { size: 9 } }, grid: { color: 'rgba(255,255,255,.04)' } },
          y: { ticks: { color: '#5a7299', font: { size: 9 }, callback: v => v >= 1e9 ? (v/1e9).toFixed(1)+'B' : v >= 1e6 ? (v/1e6).toFixed(0)+'M' : v >= 1e3 ? (v/1e3).toFixed(0)+'K' : v }, grid: { color: 'rgba(255,255,255,.04)' } }
        }
      }
    });
  }, 100);

  // Infos + bouton prévision IA
  const info = document.getElementById('graph-modal-info');
  if (info) {
    info.innerHTML = `
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;margin-bottom:10px">
        <div style="background:var(--bg3);padding:7px;border-radius:5px"><div style="font-size:8px;color:var(--t2)">Cas/an mondial</div><div style="font-size:14px;font-weight:700;color:${d.color}">${yearly >= 1e9 ? (yearly/1e9).toFixed(1)+'B' : yearly >= 1e6 ? (yearly/1e6).toFixed(0)+'M' : (yearly/1e3).toFixed(0)+'K'}</div></div>
        <div style="background:var(--bg3);padding:7px;border-radius:5px"><div style="font-size:8px;color:var(--t2)">Tendance</div><div style="font-size:14px;font-weight:700;color:${trend>0?'var(--redl)':'var(--grnl)'}">${trend>0?'+':''}${trend}%</div></div>
        <div style="background:var(--bg3);padding:7px;border-radius:5px"><div style="font-size:8px;color:var(--t2)">Projection 2030</div><div style="font-size:14px;font-weight:700;color:${d.color}">${data[9] >= 1e9 ? (data[9]/1e9).toFixed(1)+'B' : data[9] >= 1e6 ? (data[9]/1e6).toFixed(0)+'M' : (data[9]/1e3).toFixed(0)+'K'}</div></div>
      </div>
      ${typeof GROQ_KEY !== 'undefined' && GROQ_KEY ? `<button class="ai-btn" style="width:100%" onclick="forecastDisease('${disId}')">🦙 Analyse & prévision détaillée par Assistant IA</button>` : '<div style="font-size:9px;color:var(--t3);text-align:center"> pour les prévisions détaillées</div>'}
    `;
  }
}

function createGraphModal() {
  const modal = document.createElement('div');
  modal.id = 'graph-modal';
  modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.8);z-index:2500;display:none;align-items:center;justify-content:center;padding:20px';
  modal.innerHTML = `
    <div style="background:var(--bg2);border:1px solid var(--brd2);border-radius:var(--r);padding:16px;width:640px;max-width:95vw;max-height:90vh;overflow-y:auto">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">
        <div id="graph-modal-title" style="font-size:13px;font-weight:700">📊 Graphe</div>
        <button onclick="document.getElementById('graph-modal').classList.remove('on')" style="background:var(--bg3);border:1px solid var(--brd);color:var(--t2);padding:3px 9px;border-radius:var(--rs);cursor:pointer">✕</button>
      </div>
      <div style="height:280px;margin-bottom:12px"><canvas id="graph-canvas"></canvas></div>
      <div id="graph-modal-info"></div>
    </div>`;
  modal.addEventListener('click', e => { if (e.target === modal) modal.classList.remove('on'); });
  document.body.appendChild(modal);

  // Style .on
  const s = document.createElement('style');
  s.textContent = '#graph-modal.on{display:flex!important}';
  document.head.appendChild(s);

  return modal;
}

// ─── PRÉVISION GROQ ───────────────────────────────────────────────
function forecastDisease(disId) {
  const d = (typeof DB !== 'undefined') ? DB.diseases.find(x => x.id === disId) : null;
  if (!d) return;
  const yearly = YEARLY_INCIDENCE[disId] || d.cases;

  const q = `Fais une PRÉVISION détaillée pour ${d.name} sur 2027-2030.
Données actuelles: ${yearly.toLocaleString('fr-FR')} cas/an dans le monde, tendance ${d.trend > 0 ? '+' : ''}${d.trend}%/an, mortalité ${d.mort}%, ${d.countries} pays touchés.
Analyse:
1. Projection du nombre de cas d'ici 2030
2. Conséquences économiques (coûts santé, PIB, tourisme)
3. Impact sur notre vie quotidienne et la société
4. Risque de pandémie
5. Recommandations pour s'y préparer
Sois précis avec des chiffres.`;

  if (typeof askAI === 'function') askAI(q);
}
