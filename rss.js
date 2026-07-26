// ================================================================
// WORLD DISEASE MONITOR — rss.js
// Flux RSS OMS + ReliefWeb en temps réel
// Actualisation toutes les 15 minutes
// ================================================================

const RSS_SOURCES = [
  {
    name: 'OMS Disease Outbreak News',
    url: 'https://www.who.int/feeds/entity/csr/don/en/rss.xml',
    type: 'WHO',
    color: '#3b82f6',
    icon: '🌐'
  },
  {
    name: 'OMS Emergencies',
    url: 'https://www.who.int/feeds/entity/emergencies/en/rss.xml',
    type: 'WHO',
    color: '#3b82f6',
    icon: '🚨'
  },
  {
    name: 'ReliefWeb Épidémies',
    url: 'https://reliefweb.int/disasters/rss.xml?primary_country=0&secondary_country=0&type=EP',
    type: 'ReliefWeb',
    color: '#f97316',
    icon: '🔔'
  },
  {
    name: 'ReliefWeb Alertes Santé',
    url: 'https://reliefweb.int/updates/rss.xml?primary_type=OT&theme=2649',
    type: 'ReliefWeb',
    color: '#f97316',
    icon: '🏥'
  },
  {
    name: 'CDC Emerging Infectious Diseases',
    url: 'https://wwwnc.cdc.gov/eid/rss/ahead-of-print.xml',
    type: 'CDC',
    color: '#22c55e',
    icon: '🏛️'
  },
  {
    name: 'CDC Outbreaks',
    url: 'https://tools.cdc.gov/api/v2/resources/media/rss?max=30&q=outbreak',
    type: 'CDC',
    color: '#22c55e',
    icon: '⚕️'
  },
  {
    name: 'CIDRAP News',
    url: 'https://www.cidrap.umn.edu/rss.xml',
    type: 'CIDRAP',
    color: '#8b5cf6',
    icon: '🔬'
  },
  {
    name: 'ECDC Menaces Sanitaires',
    url: 'https://www.ecdc.europa.eu/en/taxonomy/term/2942/feed',
    type: 'ECDC',
    color: '#06b6d4',
    icon: '🇪🇺'
  },
  {
    name: 'ProMED Alertes',
    url: 'https://promedmail.org/feed/',
    type: 'ProMED',
    color: '#ef4444',
    icon: '📡'
  },
  {
    name: 'Google News — Épidémies',
    url: 'https://news.google.com/rss/search?q=disease+outbreak+epidemic&hl=en-US&gl=US&ceid=US:en',
    type: 'GoogleNews',
    color: '#4285f4',
    icon: '🔍'
  },
  {
    name: 'Google News — Foyers OMS',
    url: 'https://news.google.com/rss/search?q=WHO+outbreak+cases+when:7d&hl=en-US&gl=US&ceid=US:en',
    type: 'GoogleNews',
    color: '#4285f4',
    icon: '🌐'
  },
  {
    name: 'Google News — Ebola/Marburg/Mpox',
    url: 'https://news.google.com/rss/search?q=ebola+OR+marburg+OR+mpox+OR+cholera+cases+when:14d&hl=en-US&gl=US&ceid=US:en',
    type: 'GoogleNews',
    color: '#4285f4',
    icon: '🦠'
  },
  {
    name: 'Google Actualités FR — Épidémies',
    url: 'https://news.google.com/rss/search?q=%C3%A9pid%C3%A9mie+foyer+maladie&hl=fr&gl=FR&ceid=FR:fr',
    type: 'GoogleNews',
    color: '#4285f4',
    icon: '🇫🇷'
  },
  {
    name: 'CIDRAP Flu',
    url: 'https://news.google.com/rss/search?q=CIDRAP+influenza+H5N1+when:7d&hl=en-US&gl=US&ceid=US:en',
    type: 'GoogleNews',
    color: '#8b5cf6',
    icon: '🐦'
  }
];

// Proxy CORS gratuit pour lire les RSS depuis le navigateur
const CORS_PROXIES = [
  'https://api.allorigins.win/get?url=',
  'https://api.codetabs.com/v1/proxy/?quest=',
  'https://corsproxy.io/?url=',
  'https://api.allorigins.win/raw?url=',
  'https://proxy.cors.sh/',
  'https://thingproxy.freeboard.io/fetch/'
];

let rssAlerts = [];   // Alertes RSS en temps réel
let rssLastFetch = null;
let rssTimer = null;

// ─── FETCH RSS ────────────────────────────────────────────────────
async function fetchRSSFeed(source) {
  for (const proxy of CORS_PROXIES) {
    try {
      let url;
      // allorigins/get renvoie du JSON, les autres du texte brut
      if (proxy.includes('allorigins.win/get')) {
        url = proxy + encodeURIComponent(source.url);
      } else {
        url = proxy + encodeURIComponent(source.url);
      }
      const r = await fetch(url, { signal: AbortSignal.timeout(12000) });
      if (!r.ok) continue;

      let txt;
      // Si c'est le proxy JSON allorigins/get, extraire le champ contents
      if (proxy.includes('allorigins.win/get')) {
        const json = await r.json();
        txt = json.contents || '';
      } else {
        txt = await r.text();
      }

      if (!txt || txt.length < 50) continue;
      const alerts = parseRSS(txt, source);
      if (alerts && alerts.length > 0) return alerts;
    } catch(e) {
      // Essaie le proxy suivant
    }
  }
  return [];
}

function parseRSS(xml, source) {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xml, 'text/xml');
    const items = doc.querySelectorAll('item');
    const alerts = [];

    items.forEach(item => {
      const title = item.querySelector('title')?.textContent || '';
      const desc = item.querySelector('description')?.textContent || '';
      const link = item.querySelector('link')?.textContent || '';
      const pubDate = item.querySelector('pubDate')?.textContent || '';
      const guid = item.querySelector('guid')?.textContent || link;

      if (!title) return;

      // Détecte la maladie dans le titre/description
      const disease = detectDisease(title + ' ' + desc);
      const location = detectLocation(title + ' ' + desc);
      const severity = detectSeverity(title + ' ' + desc);

      alerts.push({
        id: guid,
        title: title.trim(),
        desc: cleanHTML(desc).slice(0, 200),
        link,
        pubDate: pubDate ? new Date(pubDate) : new Date(),
        source: source.name,
        sourceType: source.type,
        sourceColor: source.color,
        sourceIcon: source.icon,
        disease,
        location,
        severity,
        color: getSeverityColor(severity),
        isNew: true
      });
    });

    return alerts;
  } catch(e) {
    return [];
  }
}

function cleanHTML(html) {
  const div = document.createElement('div');
  div.innerHTML = html;
  return div.textContent || div.innerText || '';
}

// ─── DÉTECTION MALADIE ────────────────────────────────────────────
const DISEASE_KEYWORDS = {
  dengue: ['dengue', 'dengue fever', 'dengue hémorragique'],
  mpox: ['mpox', 'monkeypox', 'variole du singe', 'orthopoxvirus'],
  h5n1: ['h5n1', 'avian influenza', 'bird flu', 'grippe aviaire', 'h5', 'avian flu'],
  cholera: ['cholera', 'choléra', 'vibrio'],
  covid19: ['covid', 'sars-cov-2', 'coronavirus'],
  measles: ['measles', 'rougeole', 'morbillivirus', 'rubeola'],
  malaria: ['malaria', 'paludisme', 'plasmodium', 'falciparum'],
  marburg: ['marburg'],
  ebola: ['ebola', 'ebolavirus'],
  nipah: ['nipah'],
  hiv: ['hiv', 'aids', 'vih', 'sida'],
  tb: ['tuberculosis', 'tuberculose', 'tb ', 'mdr-tb', 'xdr-tb'],
  pertussis: ['pertussis', 'whooping cough', 'coqueluche', 'bordetella'],
  yellow_fever: ['yellow fever', 'fièvre jaune', 'amaril'],
  lassa: ['lassa'],
  mers: ['mers', 'middle east respiratory'],
  plague: ['plague', 'peste', 'yersinia'],
  zika: ['zika'],
  chikungunya: ['chikungunya'],
  meningitis: ['meningitis', 'méningite', 'meningococcal'],
  polio: ['polio', 'poliovirus'],
  rabies: ['rabies', 'rage'],
  hantavirus: ['hantavirus', 'hanta'],
  influenza: ['influenza', 'grippe', 'flu ', 'h3n2', 'h1n1'],
  amr: ['antimicrobial resistance', 'résistance antimicrobienne', 'antibiotic resistance'],
  anthrax: ['anthrax', 'charbon', 'bacillus anthracis'],
  brucellosis: ['brucellosis', 'brucellose', 'brucella'],
  buruli: ['buruli', 'mycobacterium ulcerans'],
  candida: ['candida auris', 'candidémie', 'candidiasis'],
  chagas: ['chagas', 'trypanosoma cruzi'],
  crimean_congo: ['crimean-congo', 'crimée-congo', 'cchf', 'haemorrhagic fever'],
  diphtheria: ['diphtheria', 'diphtérie', 'corynebacterium diphtheriae'],
  disease_x: ['disease x', 'maladie x', 'unknown pathogen', 'pathogène inconnu'],
  enterovirus_d68: ['enterovirus', 'ev-d68', 'd68'],
  group_a_strep: ['group a strep', 'streptococcus pyogenes', 'strep a', 'scarlet fever', 'scarlatine'],
  guinea_worm: ['guinea worm', 'dracunculiasis', 'ver de guinée'],
  hep_b: ['hepatitis b', 'hépatite b', 'hbv'],
  hepatitis_a: ['hepatitis a', 'hépatite a', 'hav'],
  hepatitis_c: ['hepatitis c', 'hépatite c', 'hcv'],
  hepatitis_e: ['hepatitis e', 'hépatite e', 'hev'],
  acute_hepatitis_unknown: ['acute hepatitis unknown', 'hépatite aiguë inconnue', 'hepatitis of unknown'],
  hib: ['haemophilus influenzae', 'hib'],
  hpv: ['hpv', 'papillomavirus', 'human papilloma'],
  japanese_encephalitis: ['japanese encephalitis', 'encéphalite japonaise'],
  leishmaniasis: ['leishmaniasis', 'leishmaniose', 'kala-azar', 'leishmania'],
  leprosy: ['leprosy', 'lèpre', 'hansen', 'mycobacterium leprae'],
  leptospirosis: ['leptospirosis', 'leptospirose', 'leptospira'],
  legionnaires: ['legionnaires', 'legionella', 'légionellose', "legionnaire's"],
  lymphatic_filariasis: ['lymphatic filariasis', 'filariose', 'elephantiasis'],
  melioidosis: ['melioidosis', 'mélioïdose', 'burkholderia pseudomallei'],
  norovirus: ['norovirus', 'norwalk'],
  onchocerciasis: ['onchocerciasis', 'onchocercose', 'river blindness', 'cécité des rivières'],
  oropouche: ['oropouche', 'orov'],
  pneumococcus: ['pneumococcal', 'pneumocoque', 'streptococcus pneumoniae'],
  rift_valley: ['rift valley', 'vallée du rift', 'rvf'],
  rotavirus: ['rotavirus'],
  rsv: ['rsv', 'respiratory syncytial', 'virus respiratoire syncytial'],
  schistosomiasis: ['schistosomiasis', 'bilharzia', 'schistosomiase', 'bilharziose'],
  scrub_typhus: ['scrub typhus', 'typhus des broussailles', 'orientia'],
  sleeping_sickness: ['sleeping sickness', 'maladie du sommeil', 'trypanosomiasis', 'trypanosomiase'],
  tetanus: ['tetanus', 'tétanos', 'clostridium tetani'],
  trachoma: ['trachoma', 'trachome'],
  typhoid: ['typhoid', 'typhoïde', 'salmonella typhi', 'enteric fever'],
  west_nile: ['west nile', 'virus du nil', 'nil occidental'],
  botulism: ['botulism', 'botulisme', 'clostridium botulinum'],
  legionella: ['legionella', 'legionnaires', 'légionellose'],
  gonorrhea: ['gonorrhea', 'gonorrhée', 'gonococcal', 'super gonorrhea'],
  syphilis: ['syphilis', 'treponema'],
  chlamydia: ['chlamydia'],
  lyme: ['lyme', 'borrelia', 'borréliose'],
  varicella: ['varicella', 'chickenpox', 'varicelle', 'shingles', 'zona'],
  herpes: ['herpes', 'herpès', 'hsv'],
  q_fever: ['q fever', 'fièvre q', 'coxiella'],
  hendra: ['hendra'],
  sars: ['sars-cov-1', 'sars 2003'],
  swine_flu_h1n2: ['h1n2', 'swine flu', 'grippe porcine', 'variant influenza'],
  epstein_barr: ['epstein-barr', 'ebv', 'mononucleosis', 'mononucléose'],
  cmv: ['cytomegalovirus', 'cmv', 'cytomégalovirus'],
  adenovirus: ['adenovirus', 'adénovirus'],
  coxsackie: ['coxsackie', 'hand foot mouth', 'pieds-mains-bouche', 'ev71'],
  shigellosis: ['shigella', 'shigellose', 'dysentery'],
  campylobacteriosis: ['campylobacter', 'campylobactériose'],
  giardiasis: ['giardia', 'giardiase', 'giardiasis'],
  cryptosporidiosis: ['cryptosporidium', 'cryptosporidiose', 'crypto'],
  amoebiasis: ['amoebiasis', 'amibiase', 'entamoeba', 'amebic'],
  ascariasis: ['ascaris', 'ascaridiase', 'roundworm'],
  hookworm: ['hookworm', 'ankylostome', 'necator', 'ancylostoma'],
  trichuriasis: ['trichuris', 'trichocéphalose', 'whipworm'],
  taeniasis: ['taenia', 'téniase', 'tapeworm', 'cysticercosis', 'cysticercose'],
  echinococcosis: ['echinococcus', 'échinococcose', 'hydatid'],
  parainfluenza: ['parainfluenza', 'hpiv'],
  metapneumovirus: ['metapneumovirus', 'hmpv', 'métapneumovirus'],
  parvovirus_b19: ['parvovirus', 'fifth disease', 'cinquième maladie', 'erythema infectiosum'],
  trichomoniasis: ['trichomonas', 'trichomonase', 'trichomoniasis'],
  tularemia: ['tularemia', 'tularémie', 'francisella'],
  ehrlichiosis: ['ehrlichia', 'ehrlichiose'],
  babesiosis: ['babesia', 'babésiose', 'babesiosis'],
  rocky_mountain: ['rocky mountain spotted fever', 'rmsf', 'fièvre pourprée', 'rickettsia rickettsii'],
  marburg_hemorrhagic: ['mediterranean spotted fever', 'boutonneuse', 'rickettsia conorii'],
  monkeypox_clade2: ['mpox clade ii', 'clade 2', 'clade iib'],
};

function detectDisease(text) {
  const t = text.toLowerCase();
  for (const [id, keywords] of Object.entries(DISEASE_KEYWORDS)) {
    if (keywords.some(k => t.includes(k))) return id;
  }
  return null;
}

// ─── DÉTECTION LOCALISATION ───────────────────────────────────────
const COUNTRY_NAMES = {
  'senegal': 'SN', 'sénégal': 'SN', 'mali': 'ML', 'niger': 'NE',
  'nigeria': 'NG', 'nigéria': 'NG', 'ghana': 'GH', 'cameroon': 'CM',
  'cameroun': 'CM', 'congo': 'CG', 'democratic republic': 'CD',
  'ethiopia': 'ET', 'éthiopie': 'ET', 'kenya': 'KE', 'tanzania': 'TZ',
  'tanzanie': 'TZ', 'uganda': 'UG', 'sudan': 'SD', 'somalia': 'SO',
  'brazil': 'BR', 'brésil': 'BR', 'india': 'IN', 'inde': 'IN',
  'indonesia': 'ID', 'indonesia': 'ID', 'philippines': 'PH',
  'vietnam': 'VN', 'thailand': 'TH', 'china': 'CN', 'chine': 'CN',
  'pakistan': 'PK', 'bangladesh': 'BD', 'myanmar': 'MM',
  'united states': 'US', 'usa': 'US', 'france': 'FR',
  'germany': 'DE', 'allemagne': 'DE', 'ukraine': 'UA',
  'haiti': 'HT', 'haïti': 'HT', 'yemen': 'YE', 'yémen': 'YE',
  'syria': 'SY', 'syrie': 'SY', 'afghanistan': 'AF',
  'south africa': 'ZA', 'afrique du sud': 'ZA',
  'mozambique': 'MZ', 'zambia': 'ZM', 'zimbabwe': 'ZW',
  'angola': 'AO', 'madagascar': 'MG', 'burkina faso': 'BF',
  'ivory coast': 'CI', 'côte d\'ivoire': 'CI', 'guinea': 'GN',
  'liberia': 'LR', 'sierra leone': 'SL', 'togo': 'TG',
  'benin': 'BJ', 'bénin': 'BJ', 'chad': 'TD', 'tchad': 'TD',
  'central african': 'CF', 'gabon': 'GA', 'rwanda': 'RW',
  'burundi': 'BI', 'south sudan': 'SS', 'eritrea': 'ER',
  'colombia': 'CO', 'colombie': 'CO', 'peru': 'PE', 'pérou': 'PE',
  'venezuela': 'VE', 'ecuador': 'EC', 'équateur': 'EC',
  'malaysia': 'MY', 'malaisie': 'MY', 'cambodia': 'KH',
  'iraq': 'IQ', 'iran': 'IR', 'saudi arabia': 'SA',
  'egypt': 'EG', 'égypte': 'EG', 'morocco': 'MA', 'maroc': 'MA',
  'turkey': 'TR', 'turquie': 'TR', 'russia': 'RU', 'russie': 'RU',
};

function detectLocation(text) {
  const t = text.toLowerCase();
  for (const [name, iso2] of Object.entries(COUNTRY_NAMES)) {
    if (t.includes(name)) return iso2;
  }
  return null;
}

function detectSeverity(text) {
  const t = text.toLowerCase();
  if (t.includes('outbreak') || t.includes('epidemic') || t.includes('urgent') ||
      t.includes('emergency') || t.includes('urgence') || t.includes('death') ||
      t.includes('décès') || t.includes('fatal') || t.includes('alert level')) {
    return 'critical';
  }
  if (t.includes('increase') || t.includes('augmentation') || t.includes('rising') ||
      t.includes('spread') || t.includes('propagation') || t.includes('warning')) {
    return 'high';
  }
  if (t.includes('update') || t.includes('mise à jour') || t.includes('report') ||
      t.includes('surveillance')) {
    return 'medium';
  }
  return 'watch';
}

function getSeverityColor(sev) {
  return { critical: '#ef4444', high: '#f97316', medium: '#eab308', watch: '#3b82f6' }[sev] || '#3b82f6';
}

function timeAgo(date) {
  const diff = (Date.now() - date.getTime()) / 1000;
  if (diff < 3600) return `Il y a ${Math.floor(diff/60)} min`;
  if (diff < 86400) return `Il y a ${Math.floor(diff/3600)}h`;
  return `Il y a ${Math.floor(diff/86400)}j`;
}

// ─── FETCH TOUTES LES SOURCES ─────────────────────────────────────
async function fetchAllRSS() {
  updateRSSStatus('loading');
  try {
    let gotData = false;

    // PRIORITÉ 1 : Méthode HealthMap — Google News (le plus fiable)
    if (typeof fetchGoogleNewsHealthMap === 'function') {
      gotData = await fetchGoogleNewsHealthMap();
    }

    // PRIORITÉ 2 : API ReliefWeb ONU directe
    if (!gotData && typeof fillLiveFeedFromReliefWeb === 'function') {
      gotData = await fillLiveFeedFromReliefWeb();
    }

    // PRIORITÉ 3 : tous les autres flux RSS via proxies
    if (!gotData) {
      const results = await Promise.allSettled(RSS_SOURCES.map(s => fetchRSSFeed(s)));
      const all = [];
      results.forEach(r => { if (r.status === 'fulfilled') all.push(...r.value); });
      all.sort((a, b) => b.pubDate - a.pubDate);
      const seen = new Set();
      rssAlerts = all.filter(a => {
        if (seen.has(a.id)) return false;
        seen.add(a.id);
        return true;
      }).slice(0, 50);
      rssLastFetch = new Date();
    }

    // Si toujours rien (ReliefWeb + proxies échoués), fallback IA
    if (rssAlerts.length === 0 && typeof GROQ_KEY !== 'undefined' && GROQ_KEY) {
      updateRSSStatus('groq');
      await groqGenerateAlerts();
    } else if (rssAlerts.length > 0) {
      updateRSSStatus('ok');
    } else {
      // Dernier recours : génère des alertes depuis les maladies critiques du catalogue
      if (typeof generateFallbackAlerts === 'function') {
        generateFallbackAlerts();
        updateRSSStatus('fallback');
      } else {
        updateRSSStatus('error');
      }
    }

    renderRSSAlerts();
    updateMapWithRSS();
    if (typeof applyAllRSSToMapData === 'function') applyAllRSSToMapData();
    updateSidebarWithRSS();
    updateDashWithRSS();
    if (typeof renderLiveFeed === 'function') renderLiveFeed();
    if (typeof renderDash === 'function' && document.getElementById('panel-dash') && document.getElementById('panel-dash').classList.contains('on')) renderDash();

  } catch(e) {
    // Fallback IA en cas d'erreur totale
    if (typeof GROQ_KEY !== 'undefined' && GROQ_KEY) {
      updateRSSStatus('groq');
      await groqGenerateAlerts();
      renderRSSAlerts();
      if (typeof renderLiveFeed === 'function') renderLiveFeed();
    } else {
      updateRSSStatus('error');
    }
  }
}

// ─── FALLBACK : GROQ GÉNÈRE LES ALERTES SI RSS BLOQUÉ ────────────
async function groqGenerateAlerts() {
  if (!GROQ_KEY) return;
  const q = `Date: ${new Date().toLocaleDateString('fr-FR')}.
Donne les 12 alertes épidémiques mondiales les plus importantes ACTUELLEMENT (comme un flux OMS Disease Outbreak News).
Réponds UNIQUEMENT en JSON:
[{"title":"Titre alerte épidémie","desc":"Description courte de la situation","disease":"id_maladie","location":"CODE_ISO2","severity":"critical","source":"OMS","link":"https://www.who.int/emergencies/disease-outbreak-news"},...]
severity: critical, high, medium, ou watch.
disease: dengue,mpox,h5n1,cholera,covid19,measles,malaria,marburg,ebola,mpox,nipah,lassa,etc.
Sois précis et réaliste sur les foyers actuels 2026.`;

  try {
    const resp = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + GROQ_KEY },
      body: JSON.stringify({ model: GROQ_MODEL, messages: [{ role: 'user', content: q }], max_tokens: 1800, temperature: 0.4 }),
      signal: AbortSignal.timeout(25000)
    });
    if (!resp.ok) return;
    const data = await resp.json();
    let txt = data.choices?.[0]?.message?.content || '';
    txt = txt.replace(/```json|```/g, '').trim();
    const match = txt.match(/\[[\s\S]*\]/);
    if (!match) return;
    const arr = JSON.parse(match[0]);

    rssAlerts = arr.map((a, i) => ({
      id: 'groq-' + i,
      title: a.title || '',
      desc: a.desc || '',
      link: a.link || 'https://www.who.int/emergencies/disease-outbreak-news',
      pubDate: new Date(Date.now() - i * 3600000),
      source: (a.source || 'Assistant IA') + ' (via IA)',
      sourceType: 'Assistant IA',
      sourceColor: '#f55036',
      sourceIcon: '🦙',
      disease: a.disease || detectDisease(a.title + ' ' + a.desc),
      location: a.location || detectLocation(a.title + ' ' + a.desc),
      severity: a.severity || 'medium',
      color: getSeverityColor(a.severity || 'medium'),
      isIA: true
    }));
  } catch(e) {
    console.log('IA alerts fallback error:', e.message);
  }
}

function updateRSSStatus(status) {
  const el = document.getElementById('rss-status');
  if (!el) return;
  if (status === 'loading') {
    el.innerHTML = '<span class="spin"></span> Chargement RSS OMS + ReliefWeb...';
    el.style.color = 'var(--oral)';
  } else if (status === 'ok') {
    el.innerHTML = `✅ ${rssAlerts.length} alertes RSS · OMS + ReliefWeb · ${rssLastFetch.toLocaleTimeString('fr-FR', {hour:'2-digit',minute:'2-digit'})}`;
    el.style.color = 'var(--grnl)';
  } else if (status === 'groq') {
    el.innerHTML = `🦙 ${rssAlerts.length} alertes générées par Assistant IA · ${new Date().toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'})}`;
    el.style.color = 'var(--oral)';
  } else if (status === 'fallback') {
    el.innerHTML = `📋 ${rssAlerts.length} maladies en surveillance (référence) · Flux live indisponible`;
    el.style.color = 'var(--blul)';
  } else {
    el.innerHTML = '📡 Chargement des alertes...';
    el.style.color = 'var(--yell)';
  }
  // Sync avec le status du Live Feed
  const live = document.getElementById('rss-status-live');
  if (live) live.innerHTML = el.innerHTML;
}

// ─── RENDU ALERTES RSS ────────────────────────────────────────────
function renderRSSAlerts(filterType = '') {
  const el = document.getElementById('alerts-list');
  if (!el) return;

  // Combine RSS + alertes IA
  let alerts = [];

  // Alertes RSS en premier (plus récentes)
  if (rssAlerts.length > 0) {
    const filtered = filterType ? rssAlerts.filter(a => a.severity === filterType) : rssAlerts;
    filtered.forEach(a => {
      alerts.push({
        isRSS: true,
        data: a
      });
    });
  }

  // Puis alertes IA/statiques
  const dbAlerts = filterType ? DB.alerts.filter(x => x.type === filterType) : DB.alerts;
  dbAlerts.forEach(a => alerts.push({ isRSS: false, data: a }));

  if (alerts.length === 0) {
    el.innerHTML = '<div style="text-align:center;color:var(--t2);padding:20px;font-size:10px">Aucune alerte</div>';
    return;
  }

  el.innerHTML = alerts.map(({ isRSS, data }) => {
    if (isRSS) {
      const a = data;
      const disName = a.disease ? (DB.diseases.find(x => x.id === a.disease)?.name || a.disease) : '';
      return `<div class="ac" style="border-left-color:${a.color};margin-bottom:7px" onclick="${a.link ? `window.open('${a.link}','_blank','noopener')` : ''}">
        <div style="display:flex;align-items:flex-start;gap:7px;margin-bottom:4px">
          <span style="font-size:14px;flex-shrink:0">${a.sourceIcon}</span>
          <div style="flex:1">
            <div style="font-size:10px;font-weight:600;color:var(--t1);line-height:1.4">${a.title}</div>
            <div style="display:flex;gap:5px;margin-top:3px;flex-wrap:wrap;align-items:center">
              <span style="font-size:7px;font-weight:700;padding:1px 5px;border-radius:4px;background:${a.color}22;color:${a.color};border:1px solid ${a.color}44">${a.severity?.toUpperCase()}</span>
              <span style="font-size:7px;background:rgba(59,130,246,.1);color:var(--blul);border:1px solid rgba(59,130,246,.15);padding:1px 5px;border-radius:4px">${a.sourceType}</span>
              ${disName ? `<span style="font-size:7px;color:var(--t3)">${disName}</span>` : ''}
              ${a.location ? `<span style="font-size:7px;color:var(--t3)">📍 ${a.location}</span>` : ''}
              <span style="font-size:7px;color:var(--t3);margin-left:auto">${timeAgo(a.pubDate)}</span>
            </div>
          </div>
        </div>
        ${a.desc ? `<div style="font-size:9px;color:var(--t2);line-height:1.5;margin-bottom:5px">${a.desc}...</div>` : ''}
        <div style="display:flex;gap:5px;align-items:center;flex-wrap:wrap">
          <a href="${a.link}" target="_blank" rel="noopener" onclick="event.stopPropagation()" style="color:var(--teal);font-size:8px;font-weight:600;text-decoration:none">🔗 Source OMS ↗</a>
          ${a.disease && typeof GROQ_KEY !== 'undefined' && GROQ_KEY ? `<button class="bsm" style="font-size:7px" onclick="event.stopPropagation();askAI('Analyse cette alerte OMS: ${a.title.replace(/'/g,"\\'").slice(0,80)}. Situation actuelle, risques, que faire ?')">🦙 Analyser</button>` : ''}
          <span style="font-size:7px;color:var(--t3);margin-left:auto">🌐 Temps réel RSS</span>
        </div>
      </div>`;
    } else {
      // Alerte IA/statique
      const a = data;
      const d = DB.diseases.find(x => x.id === a.did);
      return `<div class="ac" style="border-left-color:${a.color};margin-bottom:7px" onclick="pickDis('${a.did}')">
        <div style="display:flex;align-items:center;gap:7px;margin-bottom:3px">
          <span style="font-size:11px;font-weight:600;flex:1;color:var(--t1)">${a.text}</span>
          <span style="font-size:7px;color:var(--t3)">${a.time}</span>
        </div>
        ${d ? `<div style="font-size:9px;color:var(--t2);line-height:1.4;margin-bottom:4px">${d.desc?.slice(0,100)}...</div>
        <div style="display:flex;gap:4px;flex-wrap:wrap">
          <span style="font-size:7px;background:var(--bg3);border:1px solid var(--brd);padding:1px 5px;border-radius:4px;color:var(--t2)">💉 ${d.vaccine.status}</span>
          ${typeof GROQ_KEY !== 'undefined' && GROQ_KEY ? `<button class="bsm" style="font-size:7px" onclick="event.stopPropagation();askAI('${a.text.replace(/'/g,"\\'").slice(0,60)} — analyse complète situation, risques, recommandations')">🦙 IA</button>` : ''}
          <span style="font-size:7px;color:var(--t3);margin-left:auto">🦙 Assistant IA</span>
        </div>` : ''}
      </div>`;
    }
  }).join('');

  // Badge count
  const ac = document.getElementById('acnt');
  if (ac) ac.textContent = rssAlerts.length + DB.alerts.length;
}

// ─── MISE À JOUR CARTE AVEC RSS ───────────────────────────────────
function updateMapWithRSS() {
  if (typeof MAP === 'undefined' || !MAP) return;

  // Ajoute des marqueurs RSS sur la carte
  if (window._rssMarkers) {
    window._rssMarkers.forEach(m => MAP.removeLayer(m));
  }
  window._rssMarkers = [];

  rssAlerts.slice(0, 20).forEach(a => {
    if (!a.location || typeof CC === 'undefined') return;
    const coord = CC[a.location];
    if (!coord) return;

    const marker = L.circleMarker([coord.lat, coord.lng], {
      radius: 10,
      color: a.color,
      fillColor: a.color,
      fillOpacity: 0.9,
      weight: 2,
      opacity: 1
    }).addTo(MAP);

    // Pulse animation via CSS
    marker.bindTooltip(`<b>🌐 RSS OMS</b><br>${a.title.slice(0, 60)}...<br><small>${timeAgo(a.pubDate)}</small>`, {
      sticky: true, className: 'map-tip'
    });

    marker.on('click', () => {
      if (a.link) window.open(a.link, '_blank', 'noopener');
    });

    window._rssMarkers.push(marker);
  });
}

// ─── MISE À JOUR SIDEBAR AVEC RSS ────────────────────────────────
function updateSidebarWithRSS() {
  const ma = document.getElementById('m-alerts');
  if (!ma) return;

  const topAlerts = rssAlerts.slice(0, 4);
  if (topAlerts.length === 0) {
    // Repli sur alertes statiques
    if (typeof DB !== 'undefined') {
      ma.innerHTML = DB.alerts.slice(0, 4).map(a =>
        `<div onclick="pickDis && pickDis('${a.did}')" style="padding:4px 6px;border-radius:4px;border-left:2px solid ${a.color};background:rgba(0,0,0,.2);margin-bottom:3px;cursor:pointer;font-size:8px;line-height:1.4;color:#e0e8f5">${a.text}<br><span style="color:#1a2d47">${a.time}</span></div>`
      ).join('');
    }
    return;
  }

  ma.innerHTML = topAlerts.map(a =>
    `<div onclick="window.open('${a.link}','_blank','noopener')" style="padding:4px 6px;border-radius:4px;border-left:2px solid ${a.color};background:rgba(0,0,0,.2);margin-bottom:3px;cursor:pointer;font-size:8px;line-height:1.4">
      <div style="color:#e0e8f5;font-weight:600">${a.title.slice(0, 55)}...</div>
      <div style="color:#1a2d47;margin-top:1px">${a.sourceIcon} ${a.sourceType} · ${timeAgo(a.pubDate)}</div>
    </div>`
  ).join('');
}

// ─── MISE À JOUR DASHBOARD AVEC RSS ──────────────────────────────
function updateDashWithRSS() {
  const da = document.getElementById('dash-alerts');
  if (!da) return;

  const topAlerts = rssAlerts.slice(0, 5);
  if (topAlerts.length === 0) return;

  da.innerHTML = topAlerts.map(a =>
    `<div onclick="window.open('${a.link}','_blank','noopener')" style="padding:5px 7px;border-radius:var(--rs);border-left:2px solid ${a.color};background:rgba(0,0,0,.2);margin-bottom:3px;cursor:pointer;font-size:8px;line-height:1.4">
      <div style="color:var(--t1);font-weight:600">${a.title.slice(0, 60)}...</div>
      <div style="color:var(--t3);margin-top:1px">${a.sourceIcon} ${timeAgo(a.pubDate)}</div>
    </div>`
  ).join('');
}

// ─── ONGLET ALERTES COMPLET ───────────────────────────────────────
function buildAlertsPanel() {
  const panel = document.getElementById('panel-alerts');
  if (!panel) return;

  // Ajoute en-tête RSS si pas encore fait
  if (!document.getElementById('rss-header')) {
    const header = document.createElement('div');
    header.id = 'rss-header';
    header.innerHTML = `
      <div style="background:rgba(34,197,94,.05);border:1px solid rgba(34,197,94,.12);border-radius:var(--rs);padding:8px 11px;margin-bottom:8px;font-size:9px">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:5px">
          <div style="font-weight:700;color:var(--grnl)">🌐 Sources en temps réel</div>
          <button onclick="fetchAllRSS()" style="background:none;border:1px solid rgba(34,197,94,.25);color:var(--grnl);padding:2px 7px;border-radius:4px;cursor:pointer;font-size:8px">🔄 Actualiser</button>
        </div>
        <div id="rss-status" style="font-size:8px;color:var(--t2)"><span class="spin"></span> Connexion RSS...</div>
        <div style="display:flex;gap:4px;flex-wrap:wrap;margin-top:5px">
          ${RSS_SOURCES.map(s => `<span style="font-size:7px;background:${s.color}15;color:${s.color};border:1px solid ${s.color}30;padding:1px 5px;border-radius:3px">${s.icon} ${s.name}</span>`).join('')}
        </div>
      </div>`;
    panel.insertBefore(header, panel.firstChild);
  }
}

// ─── FILTRE ALERTES (override) ────────────────────────────────────
window._origFilterAlerts = window.filterAlerts;
window.filterAlerts = function(f, btn) {
  if (btn) {
    document.querySelectorAll('#panel-alerts .btn').forEach(b => b.classList.remove('on'));
    btn.classList.add('on');
  }
  renderRSSAlerts(f);
};

// ─── INIT RSS ─────────────────────────────────────────────────────
function initRSS() {
  buildAlertsPanel();
  fetchAllRSS();

  // Actualisation toutes les 15 minutes
  if (rssTimer) clearInterval(rssTimer);
  rssTimer = setInterval(fetchAllRSS, 15 * 60 * 1000);
}

// Lance dès que le DOM est prêt
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => setTimeout(initRSS, 1000));
} else {
  setTimeout(initRSS, 1000);
}

// ─── LIVE FEED PANEL ─────────────────────────────────────────────
function renderLiveFeed() {
  const grid = document.getElementById('livefeed-grid');
  const statusLive = document.getElementById('rss-status-live');

  if (statusLive) {
    statusLive.innerHTML = rssAlerts.length > 0
      ? `✅ ${rssAlerts.length} alertes · Dernière MAJ: ${rssLastFetch?.toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'})} · Actualisation auto toutes les 15 min`
      : '<span class="spin"></span> Chargement...';
    statusLive.style.color = rssAlerts.length > 0 ? 'var(--grnl)' : 'var(--oral)';
  }

  if (!grid) return;

  if (rssAlerts.length === 0) {
    const hasIA = (typeof GROQ_KEY !== 'undefined' && GROQ_KEY);
    grid.innerHTML = `<div style="grid-column:span 2;text-align:center;padding:25px;color:var(--t2);font-size:10px;line-height:1.8">
      <div style="font-size:24px;margin-bottom:8px">📡</div>
      <strong style="color:var(--yell)">Flux RSS temporairement inaccessible</strong><br>
      <span style="font-size:9px">Les proxies gratuits qui lisent les flux OMS/CDC sont parfois surchargés.</span><br><br>
      <button onclick="fetchAllRSS()" style="background:rgba(34,197,94,.1);border:1px solid rgba(34,197,94,.25);color:var(--grnl);padding:5px 12px;border-radius:6px;cursor:pointer;font-size:10px;margin-bottom:8px">🔄 Réessayer maintenant</button><br>
      ${hasIA ? '<span style="font-size:9px;color:var(--oral)">🦙 IA génère les alertes en attendant...</span>' : '<span style="font-size:9px;color:var(--t3)">💡  (bouton en haut) pour avoir les alertes même quand le RSS est indisponible.</span>'}
    </div>`;
    return;
  }

  grid.innerHTML = rssAlerts.slice(0, 20).map(a => `
    <div style="background:var(--card);border:1px solid var(--brd);border-left:3px solid ${a.color};border-radius:var(--r);padding:10px 12px;cursor:pointer;transition:border-color .15s" onclick="window.open('${a.link}','_blank','noopener')" onmouseover="this.style.borderColor='${a.color}'" onmouseout="this.style.borderColor='var(--brd)'">
      <div style="display:flex;align-items:flex-start;gap:7px;margin-bottom:5px">
        <span style="font-size:16px;flex-shrink:0">${a.sourceIcon}</span>
        <div style="flex:1;min-width:0">
          <div style="font-size:10px;font-weight:600;color:var(--t1);line-height:1.4;margin-bottom:3px">${a.title}</div>
          <div style="display:flex;gap:4px;flex-wrap:wrap;align-items:center">
            <span style="font-size:7px;font-weight:700;padding:1px 5px;border-radius:4px;background:${a.color}22;color:${a.color};border:1px solid ${a.color}44">${a.severity?.toUpperCase()}</span>
            <span style="font-size:7px;background:rgba(59,130,246,.1);color:var(--blul);border:1px solid rgba(59,130,246,.12);padding:1px 5px;border-radius:4px">${a.sourceType}</span>
            ${a.disease ? `<span style="font-size:7px;color:var(--t2)">${DB.diseases.find(x=>x.id===a.disease)?.emoji||''} ${a.disease}</span>` : ''}
            ${a.location ? `<span style="font-size:7px;color:var(--t3)">📍 ${a.location}</span>` : ''}
          </div>
        </div>
        <span style="font-size:7px;color:var(--t3);white-space:nowrap;flex-shrink:0">${timeAgo(a.pubDate)}</span>
      </div>
      ${a.desc ? `<div style="font-size:9px;color:var(--t2);line-height:1.5;margin-bottom:6px">${a.desc}</div>` : ''}
      <div style="display:flex;gap:6px;align-items:center">
        <a href="${a.link}" target="_blank" rel="noopener" onclick="event.stopPropagation()" style="color:var(--teal);font-size:8px;font-weight:600;text-decoration:none">🔗 Source originale ↗</a>
        ${a.disease && typeof GROQ_KEY !== 'undefined' && GROQ_KEY
          ? `<button class="bsm" style="font-size:7px" onclick="event.stopPropagation();askAI('Analyse cette alerte OMS en temps réel: ${a.title.replace(/'/g,"\\'").slice(0,80)}. Que signifie-t-elle ? Quels sont les risques ? Que recommande l\\'OMS ?')">🦙 IA</button>`
          : ''}
        <span style="margin-left:auto;font-size:7px;color:var(--t3)">RSS ${a.sourceType}</span>
      </div>
    </div>`).join('');

  // Boutons AI Live Feed
  const lf = document.getElementById('livefeed-ai-btns');
  if (lf && typeof GROQ_KEY !== 'undefined' && GROQ_KEY) {
    const topTitles = rssAlerts.slice(0,3).map(a=>a.title.slice(0,50)).join(' | ');
    lf.innerHTML = [
      ['🌐 Résume le flux RSS actuel', `Résume ces alertes OMS en temps réel: ${topTitles}. Quelles sont les plus préoccupantes ?`],
      ['🚨 Analyse les urgences', 'Parmi les alertes OMS actuelles, lesquelles représentent le plus grand risque pour la santé publique mondiale ?'],
      ['🌍 Impact Afrique', "Quelles alertes OMS actuelles concernent l'Afrique et le Sénégal en particulier ?"],
    ].map(([l,q]) => `<button class="ai-btn" onclick="askAI('${q.replace(/'/g,"\\'")}')" style="margin-bottom:3px">🦙 ${l}</button>`).join('');
  }
}

// Override de updateDashWithRSS et updateSidebarWithRSS pour inclure LiveFeed
const _origFetchAllRSS = fetchAllRSS;
// Ajoute renderLiveFeed à chaque fetch
const origRender = renderRSSAlerts;
window.renderRSSAlerts = function(f) {
  origRender(f);
  renderLiveFeed();
  // Sync rss-count
  const cnt = document.getElementById('rss-count');
  if (cnt) cnt.textContent = rssAlerts.length ? `(${rssAlerts.length} RSS + ${DB.alerts.length} IA)` : '';
};

// ═══════════════════════════════════════════════════════════════
// MÉTHODE HEALTHMAP : chaque news détectée → point sur la carte
// Applique TOUTES les alertes RSS aux données de la carte
// ═══════════════════════════════════════════════════════════════
function applyAllRSSToMapData() {
  if (typeof rssAlerts === 'undefined' || rssAlerts.length === 0) return 0;

  // Regroupe par maladie + pays, compte les alertes (comme HealthMap)
  const byDisease = {};

  rssAlerts.forEach(alert => {
    if (!alert.disease || !alert.location) return;
    if (!byDisease[alert.disease]) byDisease[alert.disease] = {};

    // Poids selon la sévérité (plus d'alertes = foyer plus important)
    const severityWeight = {
      critical: 8000, high: 4000, medium: 1500, watch: 500
    };
    const weight = severityWeight[alert.severity] || 1000;

    // Accumule (plusieurs news sur le même foyer = signal plus fort)
    byDisease[alert.disease][alert.location] =
      (byDisease[alert.disease][alert.location] || 0) + weight;
  });

  // Applique à la carte
  let applied = 0;
  Object.entries(byDisease).forEach(([diseaseId, countries]) => {
    if (Object.keys(countries).length === 0) return;

    if (typeof DC !== 'undefined') {
      const existing = DC[diseaseId] || [];
      DC[diseaseId] = [...new Set([...existing, ...Object.keys(countries)])];
    }
    if (typeof DISEASE_CASE_WEIGHTS !== 'undefined') {
      if (!DISEASE_CASE_WEIGHTS[diseaseId]) DISEASE_CASE_WEIGHTS[diseaseId] = {};
      Object.entries(countries).forEach(([iso2, weight]) => {
        // Ne pas écraser les vraies données API (WHO/CDC) qui sont plus fiables
        const hasApiData = (typeof window !== 'undefined') &&
          ((window._whoGenerated && window._whoGenerated[diseaseId]) ||
           (window._cdcGenerated && window._cdcGenerated[diseaseId]));
        if (!hasApiData) {
          DISEASE_CASE_WEIGHTS[diseaseId][iso2] = weight;
        }
      });
    }
    if (typeof window !== 'undefined') {
      window._rssGenerated = window._rssGenerated || {};
      window._rssGenerated[diseaseId] = true;
    }
    applied++;
  });

  // Redessine
  if (applied > 0) {
    if (typeof drawAllCircles === 'function' && typeof mapReady !== 'undefined' && mapReady) drawAllCircles();
    if (typeof buildLegend === 'function') buildLegend();
  }

  return applied;
}

if (typeof window !== 'undefined') {
  window.applyAllRSSToMapData = applyAllRSSToMapData;
}


// ═══════════════════════════════════════════════════════════════
// FALLBACK : alertes depuis le catalogue si toutes les sources échouent
// Évite une page Live Feed complètement vide
// ═══════════════════════════════════════════════════════════════
function generateFallbackAlerts() {
  if (typeof DB === 'undefined') return;
  // Prend les maladies critiques/high avec tendance positive
  const active = DB.diseases
    .filter(d => (d.risk === 'critical' || d.risk === 'high') && d.trend > 0)
    .sort((a, b) => b.trend - a.trend)
    .slice(0, 15);

  rssAlerts = active.map((d, i) => {
    const country = (typeof DC !== 'undefined' && DC[d.id] && DC[d.id][0]) ? DC[d.id][0] : null;
    return {
      id: 'fb-' + d.id,
      title: `${d.name} — surveillance active (tendance ${d.trend > 0 ? '+' : ''}${d.trend}%)`,
      desc: d.desc || '',
      link: d.src && d.src[0] ? d.src[0].u : 'https://www.who.int/',
      pubDate: new Date(Date.now() - i * 3600000),
      source: 'Catalogue de référence',
      sourceType: 'Référence',
      sourceColor: d.color || '#6b7280',
      sourceIcon: d.emoji || '📋',
      disease: d.id,
      location: country,
      severity: d.risk === 'critical' ? 'critical' : 'high',
      color: d.color || '#f97316',
      isFallback: true
    };
  });
  rssLastFetch = new Date();
  renderRSSAlerts();
  if (typeof renderLiveFeed === 'function') renderLiveFeed();
}

if (typeof window !== 'undefined') window.generateFallbackAlerts = generateFallbackAlerts;

// ═══════════════════════════════════════════════════════════════
// MÉTHODE HEALTHMAP pour le LIVE FEED
// Google News RSS est TRÈS fiable via proxy (contrairement à ReliefWeb)
// C'est la source principale de HealthMap
// ═══════════════════════════════════════════════════════════════
async function fetchGoogleNewsHealthMap() {
  // Les flux Google News de RSS_SOURCES
  const googleFeeds = RSS_SOURCES.filter(s => s.type === 'GoogleNews');
  if (googleFeeds.length === 0) return false;

  const proxies = [
    'https://api.allorigins.win/raw?url=',
    'https://api.codetabs.com/v1/proxy/?quest=',
    'https://corsproxy.io/?url=',
  ];

  const allAlerts = [];

  // Pour chaque flux Google News, essaie les proxies
  for (const feed of googleFeeds) {
    for (const proxy of proxies) {
      try {
        const url = proxy + encodeURIComponent(feed.url);
        const r = await fetch(url, { signal: AbortSignal.timeout(10000) });
        if (!r.ok) continue;
        const txt = await r.text();
        if (!txt || txt.length < 100) continue;

        const alerts = parseRSS(txt, feed);
        if (alerts && alerts.length > 0) {
          allAlerts.push(...alerts);
          break; // Ce flux a marché, passe au suivant
        }
      } catch(e) {
        // Essaie le proxy suivant
      }
    }
  }

  if (allAlerts.length === 0) return false;

  // Déduplique et trie
  allAlerts.sort((a, b) => b.pubDate - a.pubDate);
  const seen = new Set();
  const unique = allAlerts.filter(a => {
    const key = a.title ? a.title.slice(0, 50) : a.id;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).slice(0, 50);

  rssAlerts = unique;
  rssLastFetch = new Date();
  return true;
}

if (typeof window !== 'undefined') window.fetchGoogleNewsHealthMap = fetchGoogleNewsHealthMap;
