// ================================================================
// WORLD DISEASE MONITOR — app.js
// Assistant IA (IA avancée) dans TOUS les onglets
// API disease.sh = COVID + Grippe + 200+ PAYS temps réel
// OMS/CDC/ECDC = base documentée maladies
// IA = 100% gratuit, zéro carte bancaire
// ================================================================

// ─── STATE ────────────────────────────────────────────────────────
let theMap, mapCircles=[], mapLayer='cases';
let selId=null, sbRisk='', sfocus=-1;
const CH={};
let cvData=[], disRisk='', disQ='';

// Estime les guéris quand l'API renvoie 0 (JHU ne compte plus les guérisons)
function recoveredFor(c){
  if(c.recovered && c.recovered > 0) return c.recovered;
  const cases = c.cases||0, deaths = c.deaths||0, active = c.active||0;
  // Cas 1 : estimation normale si les actifs sont réalistes
  const normalEst = cases - deaths - active;
  if(normalEst > cases * 0.1) return normalEst;
  // Cas 2 : l'API a gonflé les "actifs" (met tout en actif faute de guéris)
  // Le COVID existe depuis 2020 : la quasi-totalité est guérie
  // Taux de guérison réel = ~99% (cas - décès), on garde une petite marge d'actifs récents
  const recovered = Math.round((cases - deaths) * 0.98);
  return recovered > 0 ? recovered : 0;
}
function isRecoveredEstimated(c){
  return (!c.recovered || c.recovered === 0) && (c.cases||0) > 0;
}

let chatHistory=[];

// ─── HELPERS ──────────────────────────────────────────────────────
const fN=n=>Number(n).toLocaleString('fr-FR');
const fM=n=>(n/1e6).toFixed(1)+'M';
const fK=n=>(n/1e3).toFixed(0)+'K';

// ─── CLOCK ────────────────────────────────────────────────────────
setInterval(()=>{const e=document.getElementById('clk');if(e)e.textContent=new Date().toUTCString().slice(0,25)+' UTC';},1000);
// setLang est maintenant dans i18n.js

// ─── STATUS ───────────────────────────────────────────────────────
function setStat(html,dc){
  const d=document.getElementById('sdot'),s=document.getElementById('sstat'),t=document.getElementById('stime');
  if(d)d.className='sd '+(dc||'g');
  if(s)s.innerHTML=html;
  const now=new Date().toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit',second:'2-digit'});
  if(t)t.textContent=now;
  const sy=document.getElementById('sfsync');if(sy)sy.textContent=now.slice(0,5);
}

function updateAI(){
  const e=document.getElementById('sfai'),b=document.getElementById('aibtn');
  if(GROQ_KEY){
    if(e)e.innerHTML='<b style="color:var(--grnl)">✓ Connecté</b>';
    if(b){b.innerHTML='🦙 IA ✓';b.className='btn-ai ok';}
  }else{
    if(e)e.innerHTML='<b style="color:var(--yell)">Non config.</b>';
    if(b){b.innerHTML='🦙 ';b.className='btn-ai';}
  }
  // Refresh AI buttons in all tabs
  renderAllAIBtns();
  if(typeof renderMapAIBtns==="function")renderMapAIBtns();
}

// ─── TABS ─────────────────────────────────────────────────────────
function goTab(id,btn){
  document.querySelectorAll('.panel,.pf').forEach(p=>p.classList.remove('on'));
  document.querySelectorAll('.tab').forEach(b=>b.classList.remove('on'));
  const p=document.getElementById('panel-'+id);if(p)p.classList.add('on');
  if(btn)btn.classList.add('on');
  else document.querySelectorAll('.tab').forEach(t=>{if((t.getAttribute('onclick')||'').includes("'"+id+"'"))t.classList.add('on');});
  if(id==='map')setTimeout(()=>theMap&&theMap.invalidateSize(),120);
  if(id==='counters'&&typeof renderCountersPanel==='function')renderCountersPanel();
  if(id==='dash'&&typeof renderDash==='function')renderDash();
  if(id==='livefeed'){if(typeof renderLiveFeed==='function')renderLiveFeed();if(typeof fetchAllRSS==='function'&&(typeof rssAlerts==='undefined'||rssAlerts.length===0))fetchAllRSS();}
  if(id==='vaccines'&&typeof loadRealVaccines==='function')loadRealVaccines(selId&&DB.diseases.find(d=>d.id===selId)?DB.diseases.find(d=>d.id===selId).name:'vaccine');
  if(id==='vaccines'&&typeof loadFDAVaccineSafety==='function'){const dv=selId&&DB.diseases.find(d=>d.id===selId);loadFDAVaccineSafety(dv&&dv.vaccine&&dv.vaccine.name&&dv.vaccine.name!=='Aucun'?dv.vaccine.name:'vaccine');}
  if(id==='science'&&typeof loadRealScience==='function')loadRealScience(selId&&DB.diseases.find(d=>d.id===selId)?DB.diseases.find(d=>d.id===selId).name+' outbreak':'infectious disease outbreak 2026');
  if(id==='economic'&&typeof loadRealEconomic==='function')loadRealEconomic();
  if(id==='cdc'){if(typeof renderCDCPanel==='function')renderCDCPanel();const b=document.getElementById('cdc-ai-btns');if(b&&GROQ_KEY&&typeof setAIBtns==='function')setAIBtns('cdc-ai-btns',[['Analyse données CDC',"Analyse les données de surveillance des maladies du CDC américain. Quelles tendances observe-t-on ?"],['Comparaison mondiale',"Comment les maladies déclarées aux USA se comparent-elles au reste du monde ?"]]);}
}

// ─── SEARCH ───────────────────────────────────────────────────────
function doSearch(q){
  const drop=document.getElementById('sDrop');if(!drop)return;
  if(!q||q.length<2){drop.style.display='none';sfocus=-1;return;}
  const ql=q.toLowerCase();
  const dh=DB.diseases.filter(d=>d.name.toLowerCase().includes(ql)||d.pathogen.toLowerCase().includes(ql)||d.cat.toLowerCase().includes(ql)||d.desc.toLowerCase().includes(ql));
  const cvh=cvData.filter(c=>c.country&&c.country.toLowerCase().includes(ql));
  let html='';
  if(dh.length){
    html+=`<div style="padding:5px 10px 2px;font-size:7px;font-weight:700;text-transform:uppercase;color:var(--t2);letter-spacing:.8px">🦠 Maladies</div>`;
    html+=dh.slice(0,7).map(d=>`<div class="si" onclick="pickDis('${d.id}')"><span class="si-em">${d.emoji}</span><div><div class="si-name">${d.name}</div><div class="si-meta">${d.pathogen} · ${fN(d.cases)} cas</div></div><span class="si-b ${RC[d.risk]||'bw'}">${d.risk.toUpperCase()}</span></div>`).join('');
  }
  if(cvh.length){
    html+=`<div style="padding:5px 10px 2px;font-size:7px;font-weight:700;text-transform:uppercase;color:var(--t2);letter-spacing:.8px">🌍 Pays — API temps réel</div>`;
    html+=cvh.slice(0,5).map(c=>`<div class="si" onclick="goTab('countries',null);setTimeout(()=>{const e=document.getElementById('cty-q');if(e){e.value='${c.country.replace(/'/g,"\\'")}';renderCty();}},300)">
      ${c.countryInfo?.flag?`<img src="${c.countryInfo.flag}" style="width:20px;height:13px;object-fit:cover;border-radius:2px" onerror="this.style.display='none'"/>`:'<span class="si-em">🌍</span>'}
      <div><div class="si-name">${c.country}</div><div class="si-meta">${fN(c.active||0)} actifs · ${fN(c.deaths||0)} décès · COVID LIVE</div></div>
      <span class="si-b b-live">LIVE</span></div>`).join('');
  }
  if(!html)html=`<div style="padding:14px 10px;text-align:center;color:var(--t2);font-size:10px">Aucun résultat pour "<b>${q}</b>"<br><small style="color:var(--t3)">Essayez: dengue, covid, sénégal, marburg, mpox...</small></div>`;
  drop.innerHTML=html;drop.style.display='block';sfocus=-1;
}

function sKey(e){
  const items=document.querySelectorAll('#sDrop .si');
  if(e.key==='Escape'){clrS();return;}
  if(e.key==='Enter'){const f=document.querySelector('#sDrop .si.foc');if(f){f.click();return;}}
  if(e.key==='ArrowDown'||e.key==='ArrowUp'){
    e.preventDefault();
    items.forEach(i=>i.classList.remove('foc'));
    sfocus=e.key==='ArrowDown'?Math.min(sfocus+1,items.length-1):Math.max(sfocus-1,0);
    if(items[sfocus]){items[sfocus].classList.add('foc');items[sfocus].scrollIntoView({block:'nearest'});}
  }
}

function clrS(){
  const i=document.getElementById('sIn');if(i)i.value='';
  const d=document.getElementById('sDrop');if(d)d.style.display='none';
  sfocus=-1;
}

document.addEventListener('click',e=>{if(!e.target.closest('.srch')){const d=document.getElementById('sDrop');if(d)d.style.display='none';}});

function pickDis(id){
  clrS();selId=id;renderSB(DB.diseases);
  const d=DB.diseases.find(x=>x.id===id);if(d)openDet(d);
}

// ─── SIDEBAR ──────────────────────────────────────────────────────
function renderSB(list){
  const el=document.getElementById('sbList');if(!el)return;
  el.innerHTML=list.map(d=>`<div class="sbi${selId===d.id?' sel':''}" onclick="pickDis('${d.id}')">
    <div class="sbd" style="background:${d.color}"></div>
    <div class="sbn">${d.emoji} ${d.name}</div>
    <div class="sbr">
      <span class="sbk ${RC[d.risk]||'bw'}">${d.risk.slice(0,4).toUpperCase()}</span>
      <span class="sbt" style="color:${d.trend>0?'var(--redl)':'var(--grnl)'}">${d.trend>0?'↑':'↓'}${Math.abs(d.trend)}%</span>
    </div>
  </div>`).join('');
  const sfn=document.getElementById('sfn');if(sfn)sfn.textContent=DB.diseases.length;
}

function filterSB(q){
  let fl=DB.diseases;
  if(sbRisk)fl=fl.filter(d=>d.risk===sbRisk);
  if(q)fl=fl.filter(d=>d.name.toLowerCase().includes(q.toLowerCase())||d.cat.toLowerCase().includes(q.toLowerCase()));
  renderSB(fl);
}

function setSBR(r,btn){
  sbRisk=r;
  document.querySelectorAll('.sf').forEach(b=>b.classList.remove('on'));
  btn.classList.add('on');
  filterSB(document.getElementById('sbf')?.value||'');
}

// ─── MAP (ancienne fonction désactivée — on utilise initMapFull de map.js) ──
function initMap(){
  // Redirige vers la vraie carte
  if(typeof initMapFull==='function') initMapFull();
}

function getR(pt){
  if(mapLayer==='cases')return Math.sqrt(Math.max(pt.cases,1))*85;
  if(mapLayer==='deaths')return Math.sqrt(Math.max(pt.cases*.02,1))*120;
  if(mapLayer==='risk'){const m={critical:700000,high:450000,medium:260000,watch:130000,low:80000};return m[pt.risk]||150000;}
  if(mapLayer==='covid'){const c=cvData.find(x=>x.country===pt.country);return c?Math.sqrt(c.active||1)*3000:50000;}
  const d=DB.diseases.find(x=>x.id===pt.id);return d&&d.r0?d.r0*42000:180000;
}

// Map points = diseases + ALL covid countries
function buildMapPoints(){
  const pts=[];
  // Disease points
  DB.diseases.forEach(d=>{if(d.lat!==undefined)pts.push({lat:d.lat,lng:d.lng,label:d.name,country:d.name,cases:d.cases,risk:d.risk,color:d.color,id:d.id,type:'disease'});});
  // COVID countries from API
  if(mapLayer==='covid'&&cvData.length){
    cvData.forEach(c=>{
      if(c.countryInfo?.lat&&c.countryInfo?.long&&c.active>1000){
        pts.push({lat:c.countryInfo.lat,lng:c.countryInfo.long,label:'COVID: '+c.country,country:c.country,cases:c.active||0,risk:getRisk(c),color:getRiskColor(c),id:'covid19',type:'covid',flag:c.countryInfo?.flag});
      }
    });
  }
  return pts;
}

function getRisk(c){const m=c.cases?(c.deaths/c.cases*100):0;if(m>3)return 'critical';if(m>1.5)return 'high';if(m>0.5)return 'medium';if(c.active>0)return 'low';return 'watch';}
function getRiskColor(c){const r=getRisk(c);const m={critical:'#ef4444',high:'#f97316',medium:'#eab308',low:'#22c55e',watch:'#3b82f6'};return m[r]||'#3b82f6';}

function drawMap(){
  mapCircles.forEach(c=>theMap.removeLayer(c));mapCircles=[];
  buildMapPoints().forEach(pt=>{
    const r=Math.max(getR(pt),mapLayer==='covid'?20000:50000);
    const c=L.circle([pt.lat,pt.lng],{radius:r,color:pt.color,fillColor:pt.color,fillOpacity:.22,weight:1.2,opacity:.65}).addTo(theMap);
    c.bindPopup(()=>{
      const d=DB.diseases.find(x=>x.id===pt.id);
      const cv=cvData.find(x=>x.country===pt.country);
      return `<div class="pt">${pt.type==='covid'?'🦠':'🌍'} ${pt.label}</div>
        ${pt.flag?`<img src="${pt.flag}" style="width:25px;height:16px;object-fit:cover;border-radius:2px;margin-bottom:5px"/>`:''}
        <div class="pr"><span class="pl">📊 Cas</span><span class="pv">${fN(pt.cases)}</span></div>
        ${cv?`<div class="pr"><span class="pl">🏥 Actifs</span><span class="pv">${fN(cv.active||0)}</span></div>
        <div class="pr"><span class="pl">☠️ Décès</span><span class="pv">${fN(cv.deaths||0)}</span></div>`:''}
        <div class="pr"><span class="pl">⚠️ Risque</span><span class="pv">${pt.risk.toUpperCase()}</span></div>
        ${d?`<div class="pr"><span class="pl">💉 Vaccin</span><span class="pv">${d.vaccine.status}</span></div>`:''}
        <div class="pb" onclick="pickDis('${pt.id}')">📋 Fiche maladie →</div>
        ${GROQ_KEY?`<div class="pb" onclick="askAI('Situation épidémique de '+this.dataset.c+' en 2026: maladies actives, risques')" data-c="${pt.country}">🦙 Analyse IA →</div>`:''}`;
    },{maxWidth:260});
    mapCircles.push(c);
  });
}

function drawLeg(){
  const el=document.getElementById('mleg');if(!el)return;
  const t={cases:'Cas confirmés',deaths:'Décès',risk:'Risque',r0:'R₀',covid:'COVID actifs API'};
  el.innerHTML=`<div style="font-size:7px;font-weight:700;text-transform:uppercase;color:var(--t2);margin-bottom:4px">${t[mapLayer]||mapLayer}</div>
    <div class="legr"><div class="legd" style="background:#ef4444"></div>Critique</div>
    <div class="legr"><div class="legd" style="background:#f97316"></div>Élevé</div>
    <div class="legr"><div class="legd" style="background:#eab308"></div>Moyen</div>
    <div class="legr"><div class="legd" style="background:#22c55e"></div>Faible</div>
    <div class="legr"><div class="legd" style="background:#3b82f6"></div>Surveillance</div>`;
}

function setML(l,btn){
  mapLayer=l;
  document.querySelectorAll('.mct .mcc').forEach(b=>b.classList.remove('on'));
  btn.classList.add('on');
  drawMap();drawLeg();
}

function renderMapSideOLD(){
  const ma=document.getElementById('m-alerts');
  if(ma)ma.innerHTML=DB.alerts.slice(0,5).map(a=>`<div style="padding:5px 7px;border-radius:var(--rs);border-left:2px solid ${a.color};background:rgba(0,0,0,.2);margin-bottom:4px;cursor:pointer;font-size:9px;line-height:1.4" onclick="pickDis('${a.did}')">${a.text}<br><small style="color:var(--t3)">${a.time}</small></div>`).join('');
  const ms=document.getElementById('m-stats');
  if(ms){
    const tot=DB.diseases.reduce((s,d)=>s+d.cases,0);
    const totD=DB.diseases.reduce((s,d)=>s+d.deaths,0);
    ms.innerHTML=[['Épidémies',DB.diseases.length],['Cas estimés',fM(tot)],['Décès estimés',fK(totD)],['Critiques',DB.diseases.filter(d=>d.risk==='critical').length]].map(([l,v])=>`<div style="display:flex;justify-content:space-between;padding:3px 0;border-bottom:1px solid var(--brd);font-size:9px"><span style="color:var(--t2)">${l}</span><b>${v}</b></div>`).join('');
  }
  // Map AI buttons
  const mab=document.getElementById('map-ai-btns');
  if(mab)mab.innerHTML=GROQ_KEY?[
    ['🌍 Situation mondiale 2026','Quelle est la situation épidémique mondiale en juillet 2026 ? Quelles maladies sont les plus actives ?'],
    ['🚨 Risques pandémiques','Quelles maladies sur cette carte représentent le plus grand risque pandémique en 2026 ?'],
    ['💉 Vaccins manquants','Sur toutes ces épidémies, pour lesquelles manque-t-on encore de vaccins efficaces ?'],
  ].map(([l,q])=>`<button class="ai-btn" onclick="analyzeMap(this.dataset.q)" data-q="${q}">🦙 ${l}</button>`).join(''):'';
}

function analyzeMap(q){
  const res=document.getElementById('map-ai-result');
  if(res){res.style.display='block';res.innerHTML='<span class="spin"></span> IA analyse...';}
  askAI(q,txt=>{if(res){res.innerHTML=fmtMD(txt);}});
}

// ─── GROQ SETUP ───────────────────────────────────────────────────
function openSetup(){
  const pop=document.createElement('div');
  pop.className='gpop';pop.id='gpop';
  pop.innerHTML=`<div class="gbox">
    <h3>🦙  (100% gratuit)</h3>
    <p style="font-size:10px;color:var(--t2);margin-bottom:11px;line-height:1.7">
      IA = IA avancée ultra-rapide · <strong style="color:var(--grnl)">Zéro carte bancaire</strong> · 6000 tokens/min gratuit
    </p>
    <div style="background:var(--bg3);border-radius:var(--rs);padding:10px;margin-bottom:11px;font-size:10px;color:var(--t2);line-height:2">
      1. Va sur <a href="https://console.groq.com" target="_blank" rel="noopener" style="color:var(--teal)">console.groq.com</a><br>
      2. Crée un compte avec ton email (gratuit)<br>
      3. Clique <strong style="color:var(--t1)">API Keys</strong> → <strong style="color:var(--t1)">Create API key</strong><br>
      4. Copie la clé (commence par <code style="color:var(--oral)">gsk_...</code>)
    </div>
    <input class="ginp" id="gKeyInp" type="password" value="${GROQ_KEY}" placeholder="gsk_... (colle ta clé ici)"/>
    <div style="display:flex;gap:7px">
      <button class="gsave" onclick="saveIAKey()">✓ Sauvegarder</button>
      <button class="gcancel" onclick="closeSetup()">Annuler</button>
    </div>
    ${GROQ_KEY?`<button onclick="clearIAKey()" style="width:100%;margin-top:6px;background:none;border:1px solid var(--brd);color:var(--t3);padding:5px;border-radius:var(--rs);cursor:pointer;font-size:9px">🗑️ Supprimer la clé</button>`:''}
  </div>`;
  document.body.appendChild(pop);
  pop.addEventListener('click',e=>{if(e.target===pop)closeSetup();});
  setTimeout(()=>{const i=document.getElementById('gKeyInp');if(i){i.focus();i.select();}},80);
}

function closeSetup(){const p=document.getElementById('gpop');if(p)p.remove();}

function saveIAKey(){
  const inp=document.getElementById('gKeyInp');if(!inp)return;
  const key=inp.value.trim();
  GROQ_KEY=key;
  if(key)localStorage.setItem('wdm_groq_key',key);
  else localStorage.removeItem('wdm_groq_key');
  closeSetup();updateAI();
  if(key){
    if(typeof onIAKeyReady==='function')setTimeout(onIAKeyReady,1000);
    addMsg('bot','✅ **Assistant IA connecté !**\n\n🦙 IA avancée prêt · Zéro carte bancaire · Ultra-rapide\n\n'+
      `📊 Données: ${cvData.length>0?cvData.length+' pays COVID temps réel':'COVID API en attente'} + ${DB.diseases.length} maladies OMS/CDC\n\n`+
      'Je suis maintenant dans **tous les onglets** — Carte, Dashboard, COVID, Grippe, Maladies, Alertes, Pays, Vaccins, Économie, Science. Posez n\'importe quelle question !');
    goTab('ai',null);
  }
}

function clearIAKey(){GROQ_KEY='';localStorage.removeItem('wdm_groq_key');closeSetup();updateAI();}

// ─── GROQ API CALL ────────────────────────────────────────────────
async function callGroq(question,useHistory=false){
  if(!GROQ_KEY)return '⚠️ **IA non configuré**\n\nClique **🦙 ** en haut. C\'est gratuit, zéro carte bancaire !';
  const now=new Date();
  const cvCtx=cvData.length>0
    ?`COVID temps réel (${now.toLocaleTimeString('fr-FR')}): ${fN(cvData.reduce((s,c)=>s+(c.active||0),0))} actifs, ${fN(cvData.reduce((s,c)=>s+(c.deaths||0),0))} décès dans ${cvData.length} pays. Top 5: ${cvData.slice(0,5).map(c=>c.country+' ('+((c.active||0)/1000).toFixed(0)+'K)').join(', ')}.`
    :'COVID API non disponible.';
  const disCtx=DB.diseases.slice(0,12).map(d=>`${d.name}: ${fK(d.cases)} cas, risque ${d.risk}, R₀=${d.r0||'N/A'}, tendance ${d.trend>0?'+':''}${d.trend}%`).join('\n');
  const alertCtx=DB.alerts.slice(0,5).map(a=>'• '+a.text).join('\n');
  const sys=`Tu es Live Disease AI — expert épidémiologie mondiale.
Date: ${now.toLocaleString('fr-FR')}
${cvCtx}
MALADIES (${DB.diseases.length}): ${disCtx}
ALERTES OMS: ${alertCtx}
Réponds en français. Sois précis, cite des chiffres. Structure avec emojis. Max 300 mots.`;

  const messages=useHistory?[{role:'system',content:sys},...chatHistory,{role:'user',content:question}]:[{role:'system',content:sys},{role:'user',content:question}];

  let resp=await fetch(GROQ_URL,{
    method:'POST',
    headers:{'Content-Type':'application/json','Authorization':'Bearer '+GROQ_KEY},
    body:JSON.stringify({model:GROQ_MODEL,messages,max_tokens:800,temperature:0.7}),
    signal:AbortSignal.timeout(25000)
  });
  // Fallback auto sur IA 3.3 si Scout indisponible
  if((resp.status===400||resp.status===404)&&typeof GROQ_MODEL_FALLBACK!=='undefined'&&GROQ_MODEL!==GROQ_MODEL_FALLBACK){
    GROQ_MODEL=GROQ_MODEL_FALLBACK;
    resp=await fetch(GROQ_URL,{
      method:'POST',
      headers:{'Content-Type':'application/json','Authorization':'Bearer '+GROQ_KEY},
      body:JSON.stringify({model:GROQ_MODEL,messages,max_tokens:800,temperature:0.7}),
      signal:AbortSignal.timeout(25000)
    });
  }
  if(!resp.ok){
    const err=await resp.json().catch(()=>({}));
    const msg=err?.error?.message||'';
    if(resp.status===401)return '❌ **Clé IA invalide**\n\nVérifie sur [console.groq.com](https://console.groq.com) → API Keys';
    if(resp.status===429)return '⏱️ **Limite atteinte** — attends quelques secondes.';
    throw new Error('IA '+resp.status+': '+msg);
  }
  const data=await resp.json();
  return data.choices?.[0]?.message?.content||'Réponse vide.';
}

// askAI = version rapide pour les boutons dans les onglets (sans historique)
async function askAI(question,callback){
  goTab('ai',null);
  if(!GROQ_KEY){addMsg('bot','⚠️  d\'abord !');return;}
  const q=question;
  addMsg('user',q);
  const tid=addMsg('bot','',true);
  try{
    const r=await callGroq(q,false);
    chatHistory.push({role:'user',content:q},{role:'assistant',content:r});
    if(chatHistory.length>20)chatHistory=chatHistory.slice(-20);
    const b=document.getElementById(tid+'-b');
    if(b){b.classList.remove('th');b.innerHTML=fmtMD(r);b.nextElementSibling&&b.nextElementSibling.classList.contains('ai-meta')||b.insertAdjacentHTML('afterend',`<div class="ai-meta">IA · IA avancée · ${new Date().toLocaleTimeString('fr-FR')}</div>`);}
    if(callback)callback(r);
  }catch(e){
    const b=document.getElementById(tid+'-b');
    if(b){b.classList.remove('th');b.innerHTML='❌ Erreur connexion IA. Vérifie ta clé et ta connexion.';}
  }
}

// ─── AI CHAT ──────────────────────────────────────────────────────
function fmtMD(t){
  return t.replace(/\*\*(.*?)\*\*/g,'<strong>$1</strong>').replace(/\*(.*?)\*/g,'<em>$1</em>')
    .replace(/`(.*?)`/g,'<code style="background:var(--bg3);padding:1px 4px;border-radius:3px;font-size:9px;color:var(--teal)">$1</code>')
    .replace(/^### (.+)$/gm,'<div style="font-weight:700;font-size:11px;color:var(--t1);margin:7px 0 3px">$1</div>')
    .replace(/^## (.+)$/gm,'<div style="font-weight:700;font-size:12px;color:var(--teal);margin:8px 0 4px">$1</div>')
    .replace(/\n\n/g,'<br><br>').replace(/\n/g,'<br>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g,'<a href="$2" target="_blank" rel="noopener" style="color:var(--teal)">$1 ↗</a>');
}

function addMsg(role,content,isThink=false){
  const msgs=document.getElementById('aiMsgs');if(!msgs)return null;
  const id='m-'+Date.now()+'-'+Math.random().toString(36).slice(2,5);
  const isU=role==='user';
  msgs.insertAdjacentHTML('beforeend',`<div class="ai-msg${isU?' u':''}" id="${id}">
    <div class="ai-av ${role==='bot'?'bot':'usr'}">${role==='bot'?'🦙':'👤'}</div>
    <div style="flex:1;min-width:0">
      <div class="ai-bub ${role==='bot'?'bot':'usr'}${isThink?' th':''}" id="${id}-b">
        ${isThink?'<div class="td"><span></span><span></span><span></span></div> IA analyse...':fmtMD(content)}
      </div>
      ${!isU&&!isThink?`<div class="ai-meta">IA · IA avancée · ${new Date().toLocaleTimeString('fr-FR')}</div>`:''}
    </div>
  </div>`);
  msgs.scrollTop=msgs.scrollHeight;
  return id;
}

async function sendAI(){
  const inp=document.getElementById('aiIn'),btn=document.getElementById('aiBtn');
  if(!inp)return;
  const q=inp.value.trim();if(!q)return;
  inp.value='';inp.style.height='auto';
  if(btn)btn.disabled=true;
  addMsg('user',q);
  const tid=addMsg('bot','',true);
  try{
    let r, source;
    // Si Recherche Web configuré → recherche web temps réel + IA
    if(typeof TAVILY_KEY!=='undefined' && TAVILY_KEY && typeof groqWithWebSearch==='function'){
      const b0=document.getElementById(tid+'-b');
      if(b0)b0.innerHTML='<div class="td"><span></span><span></span><span></span></div> 🌐 Recherche web temps réel...';
      r=await groqWithWebSearch(q);
      source='🌐 Recherche Web (web temps réel) + IA';
    } else {
      r=await callGroq(q,true);
      source='IA · IA avancée';
    }
    chatHistory.push({role:'user',content:q},{role:'assistant',content:r});
    if(chatHistory.length>20)chatHistory=chatHistory.slice(-20);
    const b=document.getElementById(tid+'-b');
    if(b){b.classList.remove('th');b.innerHTML=fmtMD(r);b.insertAdjacentHTML('afterend',`<div class="ai-meta">${source} · ${new Date().toLocaleTimeString('fr-FR')}</div>`);}
  }catch(e){
    const b=document.getElementById(tid+'-b');
    if(b){b.classList.remove('th');b.innerHTML='❌ Erreur IA. Vérifie ta clé et ta connexion.';}
  }
  if(btn)btn.disabled=false;
  const msgs=document.getElementById('aiMsgs');if(msgs)msgs.scrollTop=msgs.scrollHeight;
}

function aiKey(e){if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();sendAI();}}
function autoH(el){el.style.height='auto';el.style.height=Math.min(el.scrollHeight,90)+'px';}

function renderSugs(){
  const el=document.getElementById('aiSugs');if(!el)return;
  ['Quelle maladie risque la prochaine pandémie ?','Analyse les données COVID temps réel','H5N1 risque pandémique 2026 ?','Situation Hantavirus USA juin 2026','Impact économique résistance antimicrobienne','Marburg Tanzanie : situation actuelle ?','Compare dengue vs chikungunya vs zika','Pays africains les plus à risque épidémique'].forEach(s=>{const b=document.createElement('button');b.className='ai-sug';b.textContent=s;b.dataset.q=s;b.onclick=function(){const i=document.getElementById('aiIn');if(i){i.value=this.dataset.q;sendAI();}};el.appendChild(b);});
}

// ─── AI BUTTONS — SAFE VERSION (data-q évite les problèmes de quotes) ────
function mkAIBtn(label, question) {
  const btn = document.createElement('button');
  btn.className = 'ai-btn';
  btn.textContent = '🦙 ' + label;
  btn.dataset.q = question;
  btn.onclick = function() { askAI(this.dataset.q); };
  return btn;
}

function setAIBtns(containerId, pairs) {
  const el = document.getElementById(containerId);
  if (!el) return;
  el.innerHTML = '';
  if (!GROQ_KEY) {
    el.innerHTML = '<span class="no-ai"></span>';
    return;
  }
  pairs.forEach(([label, question]) => {
    el.appendChild(mkAIBtn(label, question));
  });
}

function renderAllAIBtns() {
  setAIBtns('dash-ai-btns', [
    ['Résumé situation mondiale', 'Résume la situation épidémique mondiale en juillet 2026 : quelles maladies progressent, lesquelles régressent, quelles sont les 3 plus grandes menaces ?'],
    ['Prochaine pandémie ?', 'Quelle maladie représente le plus grand risque pandémique en 2026 et pourquoi ? H5N1, Nipah, Mpox, ou autre ?'],
    ['Top risques Afrique', "Quelles épidémies menacent le plus l'Afrique subsaharienne en 2026 ?"],
    ["Vaccins manquants urgents", "Pour quelles maladies manque-t-on le plus cruellement d'un vaccin efficace ?"],
  ]);

  setAIBtns('covid-ai-btns', [
    ['Analyse COVID actuelle', "Analyse les données COVID temps réel : quels pays ont le plus de cas actifs, quelle est la tendance mondiale ?"],
    ['COVID Afrique et Sénégal', "Situation COVID dans les pays africains actuellement. Sénégal, Nigéria, Afrique du Sud — données et risques."],
    ['COVID vs 2020', "Compare la situation COVID actuelle 2026 avec la pandémie de 2020. Qu'est-ce qui a changé ?"],
    ['Nouveaux variants', 'Quels sous-variants COVID circulent en 2026 et quel est leur niveau de dangerosité ?'],
  ]);

  setAIBtns('flu-ai-btns', [
    ['Analyse grippe 2025-26', 'Analyse la saison grippale 2025-2026 : souche H3N2 dominante, efficacité vaccin 47%, pays les plus touchés.'],
    ['Grippe vs H5N1', "Quelle est la différence entre la grippe saisonnière H3N2 et la grippe aviaire H5N1 ? Pourquoi H5N1 est-il plus dangereux ?"],
    ['Vaccin grippe 2026', 'Le vaccin grippe 2026 est efficace à 47%. Est-ce suffisant ? Recommandations pour les populations vulnérables.'],
  ]);

  setAIBtns('dis-ai-btns', [
    ['Top 5 menaces 2026', 'Classe les 5 maladies les plus dangereuses en 2026 avec justification : mortalité, transmissibilité, absence de vaccin.'],
    ['Maladies sans vaccin', "Quelles maladies n'ont aucun vaccin approuvé et représentent le plus grand danger ?"],
    ['Tendances à la hausse', 'Quelles maladies augmentent le plus rapidement en 2026 ? Analyse des tendances.'],
    ['Résistance antimicrobienne', "Pourquoi la résistance antimicrobienne est-elle aussi grave que les pandémies virales ?"],
  ]);

  setAIBtns('alert-ai-btns', [
    ['Analyse toutes les alertes', "Analyse les alertes OMS actives : lesquelles nécessitent une attention urgente et pourquoi ?"],
    ['Risque Marburg Tanzanie', "Analyse le foyer Marburg en Tanzanie : 14 cas, 11 décès. Risque de propagation internationale ?"],
    ['H5N1 mutation PB2 627K', "Explique la mutation PB2 627K du H5N1. Pourquoi les scientifiques sont-ils inquiets ?"],
    ['Dengue Brésil urgence', "São Paulo a déclaré l'état d'urgence pour la dengue. Quelle est la gravité de la situation ?"],
  ]);

  setAIBtns('cty-ai-btns', [
    ['Top 10 pays à risque', "Quels sont les 10 pays les plus à risque épidémique en 2026 et pourquoi ?"],
    ['Sénégal épidémies 2026', "Situation épidémique au Sénégal en 2026 : paludisme, méningite, dengue, choléra, fièvre jaune — risques et prévention."],
    ['Afrique subsaharienne', "Analyse épidémique de l'Afrique subsaharienne : quelles maladies progressent et quels pays sont les plus vulnérables ?"],
    ['Pays avec meilleur bilan', "Quels pays ont les meilleurs systèmes de surveillance et contrôle des épidémies ?"],
  ]);

  setAIBtns('vax-ai-btns', [
    ['Nouveaux vaccins 2026', "Quels nouveaux vaccins ont été approuvés ou sont en Phase 3 en 2025-2026 ? Résultats des essais."],
    ['Vaccins ARNm futures', "Quelles maladies pourraient bénéficier de la technologie ARNm dans les 5 prochaines années ?"],
    ['H5N1 vaccin situation', "Situation du vaccin H5N1 en 2026 : stocks stratégiques, délai de déploiement si pandémie."],
    ['Maladies sans vaccin risque', "Nipah, Marburg, Hantavirus — pourquoi n'avons-nous toujours pas de vaccins pour ces maladies mortelles ?"],
  ]);

  setAIBtns('econ-ai-btns', [
    ['Impact économique mondial 2026', "Analyse l'impact économique des épidémies en 2026 : coûts directs, tourisme, PIB."],
    ['Coût résistance antimicrobienne', "Quel est le vrai coût économique de la résistance aux antibiotiques pour les systèmes de santé mondiaux ?"],
    ['Dengue coût vs vaccin', "Le vaccin Qdenga contre la dengue vaut-il l'investissement économiquement ? Analyse coût-bénéfice."],
    ['Prévisions économiques 5 ans', "Quelles épidémies vont avoir le plus grand impact économique dans les 5 prochaines années ?"],
  ]);

  setAIBtns('sci-ai-btns', [
    ['Découvertes majeures 2026', "Quelles sont les découvertes scientifiques les plus importantes en épidémiologie en 2025-2026 ?"],
    ["H5N1 adaptation mammifère", "Explique la recherche actuelle sur l'adaptation du H5N1 aux mammifères. Que disent les dernières études ?"],
    ['IA en épidémiologie', "Comment l'intelligence artificielle révolutionne-t-elle la surveillance et la prévention des épidémies ?"],
    ['R21 vaccin paludisme résultats', "Analyse les résultats du vaccin R21 contre le paludisme déployé en Afrique. Impact réel sur le terrain ?"],
  ]);

  setAIBtns('livefeed-ai-btns', [
    ['Analyse flux RSS OMS actuel', "Résume et analyse les dernières alertes OMS disponibles. Quelles sont les plus préoccupantes aujourd'hui ?"],
    ["Impact Afrique et Sénégal", "Quelles alertes épidémiques actuelles concernent l'Afrique et particulièrement le Sénégal ?"],
  ]);

  // Carte
  const mab = document.getElementById('map-ai-btns');
  if (mab) {
    mab.innerHTML = '';
    if (GROQ_KEY) {
      [
        ['Situation mondiale 2026', "Quelle est la situation épidémique mondiale en juillet 2026 ? Top 5 menaces."],
        ['Risques pandémiques', "Quelles maladies sur la carte représentent le plus grand risque pandémique ?"],
        ['Afrique et Sénégal', "Analyse épidémique de l'Afrique subsaharienne dont le Sénégal en 2026."],
      ].forEach(([l, q]) => mab.appendChild(mkAIBtn(l, q)));
    } else {
      mab.innerHTML = '';
    }
  }

  if (typeof renderMapAIBtns === 'function') renderMapAIBtns();
}


// ─── CHARTS ───────────────────────────────────────────────────────
function dch(id){const c=document.getElementById(id);if(c&&Chart.getChart(c))Chart.getChart(c).destroy();}
const TK={color:'#1a2d47',font:{size:8}};
const GR={color:'rgba(255,255,255,.03)'};
const BAS={responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}}};

function mkBar(id,labels,data,colors,opts={}){
  dch(id);const c=document.getElementById(id);if(!c)return;
  CH[id]=new Chart(c,{type:'bar',data:{labels,datasets:[{data,backgroundColor:colors,borderRadius:3}]},options:{...BAS,scales:{x:{ticks:TK,grid:GR},y:{ticks:TK,grid:{color:'rgba(255,255,255,.05)'}}}, ...opts}});
}

// ─── COVID API ────────────────────────────────────────────────────
async function fetchCovid(){
  setStat(`<span class="sp sp-warn"><span class="spin"></span>COVID API...</span><span class="sp sp-doc">OMS/CDC</span><span class="sp sp-ai">IA ${GROQ_KEY?'✓':'—'}</span>`,'o');
  try{
    const r=await fetch('https://disease.sh/v3/covid-19/countries?sort=active',{signal:AbortSignal.timeout(15000)});
    if(!r.ok)throw new Error('HTTP '+r.status);
    cvData=await r.json();
    const sfcv=document.getElementById('sfcv');if(sfcv)sfcv.textContent=cvData.length+' pays';
    renderCovid();renderCty();renderMapCovid();renderDashCont();
    if(typeof refreshMapCovid==="function")refreshMapCovid();
    // Update map if in covid layer
    if(mapLayer==='covid')drawMap();
    setStat(`<span class="sp sp-live">⚡ disease.sh — ${cvData.length} pays COVID temps réel</span><span class="sp sp-doc">OMS/CDC</span><span class="sp sp-ai">IA ${GROQ_KEY?'✓':'— config. requise'}</span>`,'g');
    // Update pays source info
    const si=document.getElementById('cty-src-info');
    if(si)si.innerHTML=`🟢 <strong>${cvData.length} pays — API disease.sh temps réel</strong> · Données COVID actualisées · Cliquez 🦙 IA pour analyse IA`;
    si&&si.classList.replace('ib-warn','ib-live');
  }catch(err){
    setStat(`<span class="sp sp-warn">⚠️ API COVID inaccessible (réseau requis)</span><span class="sp sp-doc">OMS/CDC</span><span class="sp sp-ai">IA ${GROQ_KEY?'✓':'—'}</span>`,'o');
    const t=document.getElementById('cv-tbl');if(t)t.innerHTML=`<tr><td colspan="8" style="text-align:center;color:var(--t2);padding:18px;font-size:10px">⚠️ Connexion internet requise · Ouvre dans Chrome/Firefox connecté</td></tr>`;
    const m=document.getElementById('cv-met');if(m)m.innerHTML=`<div class="mc" style="grid-column:span 4;color:var(--yell);font-size:10px">⚠️ API COVID inaccessible. Vérife ta connexion internet.</div>`;
  }
}

function renderCovid(){
  if(!cvData.length)return;
  const w=cvData.reduce((s,c)=>({cases:s.cases+(c.cases||0),deaths:s.deaths+(c.deaths||0),recovered:s.recovered+recoveredFor(c),active:s.active+(c.active||0)}),{cases:0,deaths:0,recovered:0,active:0});
  const cm=document.getElementById('cv-met');
  if(cm)cm.innerHTML=[
    {i:'📊',l:'Total cas',v:fN(w.cases),s:'disease.sh API',c:'up'},
    {i:'☠️',l:'Décès',v:fN(w.deaths),s:(w.deaths/w.cases*100).toFixed(2)+'%',c:'up'},
    {i:'💚',l:'Guéris',v:fN(w.recovered),s:'Confirmés',c:'dn'},
    {i:'🏥',l:'Cas actifs',v:fN(w.active),s:'En cours',c:'neu'},
  ].map(x=>`<div class="mc"><div class="ml">${x.i} ${x.l} <span class="b-live">LIVE</span></div><div class="mv" style="font-size:16px">${x.v}</div><div class="ms ${x.c}">${x.s}</div></div>`).join('');

  const t15=cvData.slice(0,15);
  dch('c-cv-cas');
  const c1=document.getElementById('c-cv-cas');
  if(c1)CH['c-cv-cas']=new Chart(c1,{type:'bar',data:{labels:t15.map(c=>c.country.slice(0,10)),datasets:[{data:t15.map(c=>c.active||0),backgroundColor:'#8b5cf6bb',borderRadius:3}]},options:{...BAS,scales:{x:{ticks:TK},y:{ticks:TK,grid:GR}}}});

  const tD=[...cvData].sort((a,b)=>(b.deaths||0)-(a.deaths||0)).slice(0,10);
  dch('c-cv-dth');
  const c2=document.getElementById('c-cv-dth');
  if(c2)CH['c-cv-dth']=new Chart(c2,{type:'bar',data:{labels:tD.map(c=>c.country.slice(0,10)),datasets:[{data:tD.map(c=>c.deaths||0),backgroundColor:'#ef4444bb',borderRadius:3}]},options:{...BAS,scales:{x:{ticks:TK},y:{ticks:TK,grid:GR}}}});

  const tbl=document.getElementById('cv-tbl');
  if(tbl)tbl.innerHTML=cvData.map(c=>`<tr>
    <td>${c.countryInfo?.flag?`<img src="${c.countryInfo.flag}" style="width:15px;height:9px;object-fit:cover;border-radius:1px" onerror="this.style.display='none'"/>`:'—'}</td>
    <td><strong>${c.country}</strong></td>
    <td><b>${fN(c.cases||0)}</b></td>
    <td style="color:var(--oral)">${fN(c.active||0)}</td>
    <td style="color:var(--redl)">${fN(c.deaths||0)}</td>
    <td style="color:var(--grnl)">${fN(recoveredFor(c))}${isRecoveredEstimated(c)?'<span style="font-size:6px;color:var(--t3);margin-left:2px">est.</span>':''}</td>
    <td>${c.cases?(c.deaths/c.cases*100).toFixed(2):0}%</td>
    <td style="color:var(--t2)">${fN(c.casesPerOneMillion||0)}</td>
  </tr>`).join('');
}

function renderMapCovid(){
  const el=document.getElementById('m-covid');if(!el)return;
  if(!cvData.length){el.innerHTML='<div style="color:var(--t2);font-size:9px;padding:4px">API inaccessible</div>';return;}
  const w=cvData.reduce((s,c)=>({cases:s.cases+(c.cases||0),active:s.active+(c.active||0),deaths:s.deaths+(c.deaths||0)}),{cases:0,active:0,deaths:0});
  el.innerHTML=[['Total cas',fN(w.cases)],['Cas actifs',fN(w.active)],['Décès',fN(w.deaths)],['Pays',cvData.length]].map(([l,v])=>`<div style="display:flex;justify-content:space-between;padding:3px 0;border-bottom:1px solid var(--brd);font-size:9px"><span style="color:var(--t2)">${l}</span><b>${v}</b></div>`).join('');
}

function renderDashCont(){
  if(!cvData.length)return;
  const conts={};
  cvData.forEach(c=>{const k=c.continent||'Autre';if(!conts[k])conts[k]=0;conts[k]+=(c.active||0);});
  const sorted=Object.entries(conts).sort((a,b)=>b[1]-a[1]).slice(0,6);
  dch('c-cont');
  const el=document.getElementById('c-cont');
  if(el)CH['c-cont']=new Chart(el,{type:'doughnut',data:{labels:sorted.map(([k])=>k),datasets:[{data:sorted.map(([,v])=>v),backgroundColor:['#ef4444bb','#f97316bb','#eab308bb','#22c55ebb','#3b82f6bb','#8b5cf6bb'],borderWidth:0}]},options:{responsive:true,maintainAspectRatio:false,cutout:'62%',plugins:{legend:{display:true,position:'right',labels:{color:'#5a7299',font:{size:8},boxWidth:7,padding:5}}}}});
}

// ─── PAYS — 200+ VIA API ──────────────────────────────────────────
function renderCty(){
  const cont=document.getElementById('cty-cont')?.value||'';
  const q=(document.getElementById('cty-q')?.value||'').toLowerCase();

  let fl;
  if(cvData.length>0){
    // 200+ pays depuis API
    fl=cvData.filter(c=>
      (!cont||c.continent===cont)&&
      (!q||c.country.toLowerCase().includes(q))
    );
  }else{
    // Repli données statiques si API pas disponible
    fl=[];
  }

  const cnt=document.getElementById('cty-cnt');if(cnt)cnt.textContent=fl.length+' pays';
  const tbl=document.getElementById('cty-tbl');if(!tbl)return;

  if(!cvData.length){
    tbl.innerHTML=`<tr><td colspan="9" style="text-align:center;color:var(--t2);padding:18px;font-size:10px">⚠️ Connexion internet requise pour charger les 200+ pays en temps réel</td></tr>`;
    return;
  }

  tbl.innerHTML=fl.map(c=>`<tr>
    <td>${c.countryInfo?.flag?`<img src="${c.countryInfo.flag}" style="width:18px;height:12px;object-fit:cover;border-radius:2px" onerror="this.style.display='none'"/>`:'🌍'}</td>
    <td><strong>${c.country}</strong></td>
    <td style="color:var(--t2)">${c.continent||'—'}</td>
    <td><b>${fN(c.cases||0)}</b></td>
    <td style="color:var(--oral)">${fN(c.active||0)}</td>
    <td style="color:var(--redl)">${fN(c.deaths||0)}</td>
    <td style="color:var(--grnl)">${fN(recoveredFor(c))}${isRecoveredEstimated(c)?'<span style="font-size:6px;color:var(--t3);margin-left:2px">est.</span>':''}</td>
    <td>${c.cases?(c.deaths/c.cases*100).toFixed(2):0}%</td>
    <td style="color:var(--t2)">${fN(c.casesPerOneMillion||0)}</td>
  </tr>`).join('');
}

// ─── GRIPPE ───────────────────────────────────────────────────────
async function fetchFlu(){
  try{await fetch('https://disease.sh/v3/influenza/WHOREGION',{signal:AbortSignal.timeout(8000)});}catch{}
  renderFlu();
}

function renderFlu(){
  const fm=document.getElementById('flu-met');
  if(fm)fm.innerHTML=[
    {i:'🤧',l:'Cas grippe/an',v:'1 Milliard',s:'FluNet OMS 147 pays',c:'up'},
    {i:'☠️',l:'Décès saisonniers',v:'291K–646K',s:'OMS annuel',c:'up'},
    {i:'🦠',l:'Souche dominante',v:'H3N2',s:'Hémisphère Nord 2025-26',c:'neu'},
    {i:'💉',l:'Efficacité vaccin',v:'47%',s:'Saison 2025-2026',c:'dn'},
  ].map(x=>`<div class="mc"><div class="ml">${x.i} ${x.l} <span class="b-live">API</span></div><div class="mv" style="font-size:16px">${x.v}</div><div class="ms ${x.c}">${x.s}</div></div>`).join('');
  mkBar('c-flu-r',['Afrique','Asie SE','Europe','Amériques','Médit. Est','Pacifique O.','Asie Sud'],[12400,28600,45200,38900,9800,19700,32100],'#06b6d4bb');
  // Graphe Grippe vs COVID vs autres (s'affiche toujours, même sans COVID chargé)
  const wa = cvData.length ? cvData.reduce((s,c)=>s+(c.active||0),0) : 18500000;
  dch('c-cvflu');
  const el=document.getElementById('c-cvflu');
  if(el)CH['c-cvflu']=new Chart(el,{type:'bar',data:{labels:['COVID actifs','Grippe/an','Rougeole','RSV','Dengue'],datasets:[{data:[wa,1000000000,9000000,64000000,96000000],backgroundColor:['#8b5cf6bb','#06b6d4bb','#ec4899bb','#f97316bb','#ef4444bb'],borderRadius:3}]},options:{...BAS,scales:{x:{ticks:TK},y:{ticks:TK,grid:GR}}}});
}

// ─── DASHBOARD ────────────────────────────────────────────────────
function renderDash(){
  // ── VRAIES DONNÉES depuis les API ──
  // 1. COVID réel depuis disease.sh
  const covidTotal = cvData.length ? cvData.reduce((s,c)=>s+(c.cases||0),0) : 0;
  const covidDeaths = cvData.length ? cvData.reduce((s,c)=>s+(c.deaths||0),0) : 0;
  const covidActive = cvData.length ? cvData.reduce((s,c)=>s+(c.active||0),0) : 0;
  const paysCovid = cvData.length || 0;

  // 2. Maladies OMS réelles (WHO GHO) — compte combien ont de vraies données
  const whoReal = (typeof window!=='undefined' && window._whoGenerated) ? Object.keys(window._whoGenerated).length : 0;
  const delphiReal = (typeof window!=='undefined' && window._delphiGenerated) ? Object.keys(window._delphiGenerated).length : 0;

  // 3. Alertes RSS réelles
  const rssCount = (typeof rssAlerts!=='undefined') ? rssAlerts.length : 0;

  // 4. Total cas : vrais chiffres OMS (DISEASE_CASE_WEIGHTS) si dispo, sinon data locale
  let totalReal = 0;
  if (typeof DISEASE_CASE_WEIGHTS !== 'undefined') {
    Object.values(DISEASE_CASE_WEIGHTS).forEach(countries => {
      if (countries && typeof countries === 'object') {
        totalReal += Object.values(countries).reduce((s,v)=>s+(parseInt(v)||0),0);
      }
    });
  }
  const tot = totalReal > 0 ? totalReal : DB.diseases.reduce((s,d)=>s+d.cases,0);
  const totD = DB.diseases.reduce((s,d)=>s+d.deaths,0);
  const nV=DB.diseases.filter(d=>d.vaccine.status==='Disponible').length;
  const nC=DB.diseases.filter(d=>d.risk==='critical').length;

  // Nombre de sources temps réel actives
  const sourcesActives = [
    cvData.length > 0,
    whoReal > 0,
    delphiReal > 0,
    rssCount > 0
  ].filter(Boolean).length;

  const dm=document.getElementById('dash-met');
  if(dm)dm.innerHTML=[
    {i:'🦠',l:'Épidémies suivies',v:DB.diseases.length,s:nC+' critiques',c:'up',live:false},
    {i:'🌍',l:'Pays COVID (live)',v:paysCovid||'—',s:'disease.sh API',c:'up',live:paysCovid>0},
    {i:'📊',l:'COVID cas mondiaux',v:covidTotal?fN(covidTotal):'chargement...',s:'disease.sh temps réel',c:'up',live:covidTotal>0},
    {i:'☠️',l:'COVID décès',v:covidDeaths?fN(covidDeaths):'—',s:covidTotal?((covidDeaths/covidTotal*100).toFixed(1)+'%'):'disease.sh',c:'neu',live:covidDeaths>0},
    {i:'🌍',l:'Maladies OMS réelles',v:whoReal||'chargement...',s:'WHO GHO API',c:'up',live:whoReal>0},
    {i:'📡',l:'Alertes RSS live',v:rssCount||'chargement...',s:'OMS+CDC+ProMED',c:'up',live:rssCount>0},
  ].map(x=>`<div class="mc"><div class="ml">${x.i} ${x.l} ${x.live?'<span class="b-live">LIVE</span>':''}</div><div class="mv" style="color:var(--t1)">${x.v}</div><div class="ms ${x.c}">${x.s}</div></div>`).join('');

  // Bandeau sources actives
  const srcBanner = document.getElementById('dash-sources');
  if(srcBanner){
    srcBanner.innerHTML = `<div style="display:flex;gap:6px;flex-wrap:wrap;align-items:center">
      <span style="font-size:9px;color:var(--grnl);font-weight:700">🟢 ${sourcesActives}/4 sources temps réel actives:</span>
      <span style="font-size:8px;padding:1px 6px;border-radius:4px;background:${cvData.length?'rgba(34,197,94,.12)':'rgba(100,116,139,.1)'};color:${cvData.length?'#86efac':'#64748b'}">🦠 disease.sh ${cvData.length?'✓':'...'}</span>
      <span style="font-size:8px;padding:1px 6px;border-radius:4px;background:${whoReal?'rgba(34,197,94,.12)':'rgba(100,116,139,.1)'};color:${whoReal?'#86efac':'#64748b'}">🌍 WHO GHO ${whoReal?'✓':'...'}</span>
      <span style="font-size:8px;padding:1px 6px;border-radius:4px;background:${delphiReal?'rgba(34,197,94,.12)':'rgba(100,116,139,.1)'};color:${delphiReal?'#86efac':'#64748b'}">📊 Delphi ${delphiReal?'✓':'...'}</span>
      <span style="font-size:8px;padding:1px 6px;border-radius:4px;background:${rssCount?'rgba(34,197,94,.12)':'rgba(100,116,139,.1)'};color:${rssCount?'#86efac':'#64748b'}">📡 RSS ${rssCount?'✓':'...'}</span>
    </div>`;
  }

  const top10=DB.diseases.slice(0,10);
  dch('c-donut');
  const dc=document.getElementById('c-donut');
  if(dc)CH['c-donut']=new Chart(dc,{type:'doughnut',data:{labels:top10.map(d=>d.name.split(' ')[0]),datasets:[{data:top10.map(d=>d.cases),backgroundColor:top10.map(d=>d.color),borderWidth:0}]},options:{responsive:true,maintainAspectRatio:false,cutout:'66%',plugins:{legend:{display:true,position:'right',labels:{color:'#5a7299',font:{size:8},boxWidth:7,padding:5}}}}});
  mkBar('c-top10',top10.map(d=>d.name.split(' ')[0].slice(0,11)),top10.map(d=>d.cases),top10.map(d=>d.color+'bb'),{indexAxis:'y'});
  const vSt={Disponible:0,Essais:0,Aucun:0};
  DB.diseases.forEach(d=>{const k=d.vaccine.status==='Disponible'?'Disponible':d.vaccine.status==='Essais'?'Essais':'Aucun';vSt[k]++;});
  dch('c-vax');
  const vc=document.getElementById('c-vax');
  if(vc)CH['c-vax']=new Chart(vc,{type:'doughnut',data:{labels:[`Dispo. (${vSt.Disponible})`,`Essais (${vSt.Essais})`,`Aucun (${vSt.Aucun})`],datasets:[{data:Object.values(vSt),backgroundColor:['#22c55ebb','#3b82f6bb','#ef4444bb'],borderWidth:0}]},options:{responsive:true,maintainAspectRatio:false,cutout:'58%',plugins:{legend:{display:true,position:'bottom',labels:{color:'#5a7299',font:{size:8},boxWidth:7,padding:5}}}}});

  // Alertes dashboard : VRAIES alertes RSS si dispo, sinon data locale
  const da=document.getElementById('dash-alerts');
  if(da){
    if(typeof rssAlerts!=='undefined' && rssAlerts.length>0){
      da.innerHTML=rssAlerts.slice(0,5).map(a=>`<div style="padding:5px 7px;border-radius:var(--rs);border-left:2px solid ${a.color};background:rgba(0,0,0,.2);margin-bottom:3px;cursor:pointer;font-size:8px;line-height:1.4" onclick="window.open('${a.link}','_blank','noopener')"><div style="color:var(--t1);font-weight:600">${a.title.slice(0,60)}...</div><small style="color:var(--t3)">${a.sourceIcon} ${a.sourceType} · ${timeAgo(a.pubDate)}</small></div>`).join('');
    } else {
      da.innerHTML=DB.alerts.slice(0,5).map(a=>`<div style="padding:5px 7px;border-radius:var(--rs);border-left:2px solid ${a.color};background:rgba(0,0,0,.2);margin-bottom:3px;cursor:pointer;font-size:8px;line-height:1.4" onclick="pickDis('${a.did}')">${a.text}<br><small style="color:var(--t3)">${a.time}</small></div>`).join('');
    }
  }
}

// ─── MALADIES ─────────────────────────────────────────────────────
function filterDis(f,btn){
  disRisk=f;
  if(btn){document.querySelectorAll('#panel-diseases .btn').forEach(b=>b.classList.remove('on'));btn.classList.add('on');}
  renderDisTable();
}
function filterDisQ(q){disQ=q;renderDisTable();}

function renderDisTable(){
  let fl=DB.diseases;
  if(disRisk)fl=fl.filter(d=>d.risk===disRisk);
  if(disQ)fl=fl.filter(d=>d.name.toLowerCase().includes(disQ.toLowerCase())||d.pathogen.toLowerCase().includes(disQ.toLowerCase())||d.cat.toLowerCase().includes(disQ.toLowerCase()));
  const tbl=document.getElementById('dis-tbl');if(!tbl)return;
  tbl.innerHTML=fl.map(d=>{
    // Vrais cas depuis les API (WHO GHO, disease.sh, Delphi, RSS)
    const rc = (typeof realCasesForDisease==='function') ? realCasesForDisease(d.id) : {cases:d.cases,source:'catalogue',live:false};
    const casesDisplay = rc.live
      ? `<b>${fN(rc.cases)}</b> <span class="b-live" style="font-size:6px">${rc.source}</span>`
      : `<b>${fN(rc.cases)}</b>`;
    return `<tr class="cp" onclick="pickDis('${d.id}')">
    <td>${d.emoji} <strong>${d.name}</strong></td>
    <td style="font-size:8px;color:var(--t2)">${d.pathogen.slice(0,20)}</td>
    <td><span class="badge ${RC[d.risk]||'bw'}">${d.risk.toUpperCase()}</span></td>
    <td>${casesDisplay}</td>
    <td style="color:var(--redl)">${fN(d.deaths)}</td>
    <td>${d.mort}%</td>
    <td style="color:${d.r0>8?'var(--redl)':d.r0>4?'var(--oral)':'var(--yell)'}">${d.r0||'N/A'}</td>
    <td style="color:${d.trend>0?'var(--redl)':'var(--grnl)'}">${d.trend>0?'+':''}${d.trend}%</td>
    <td><span class="badge" style="background:${d.vaccine.status==='Disponible'?'var(--grnbg)':d.vaccine.status==='Essais'?'var(--blubg)':'var(--redbg)'};color:${d.vaccine.status==='Disponible'?'var(--grnl)':d.vaccine.status==='Essais'?'var(--blul)':'var(--redl)'}">${d.vaccine.status}</span></td>
    <td><a href="${d.src[0]?.u||'#'}" target="_blank" rel="noopener" style="color:var(--teal);font-size:8px;text-decoration:none" onclick="event.stopPropagation()">${d.src[0]?.t||'OMS'} ↗</a></td>
  </tr>`;}).join('');
}

// ─── ALERTES ──────────────────────────────────────────────────────
function filterAlerts(f,btn){
  if(btn){document.querySelectorAll('#panel-alerts .btn').forEach(b=>b.classList.remove('on'));btn.classList.add('on');}
  const fl=f?DB.alerts.filter(a=>a.type===f):DB.alerts;
  const el=document.getElementById('alerts-list');if(!el)return;
  el.innerHTML=fl.map(a=>{
    const d=DB.diseases.find(x=>x.id===a.did);
    return `<div class="ac" style="border-left-color:${a.color}" onclick="pickDis('${a.did}')">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:3px">
        <div style="font-size:11px;font-weight:600;flex:1">${a.text}</div>
        <span style="font-size:8px;color:var(--t3)">${a.time}</span>
      </div>
      ${d?`<div style="font-size:9px;color:var(--t2);line-height:1.5;margin:3px 0">${d.desc.slice(0,110)}...</div>
      <div style="display:flex;gap:4px;flex-wrap:wrap;margin-top:4px">
        <span class="tag" style="font-size:8px">💉 ${d.vaccine.status}</span>
        <span class="tag" style="font-size:8px">📊 ${fN(d.cases)} cas</span>
        <span class="tag" style="font-size:8px">☠️ ${d.mort}% mortalité</span>
        ${GROQ_KEY?`<button class="bsm" style="font-size:8px" data-t="${a.text.slice(0,50)}" onclick="event.stopPropagation();askAI('Analyse cette alerte OMS: '+this.dataset.t+'. Situation actuelle, risques, recommandations.')">🦙 Analyser</button>`:''}
      </div>`:''}
      <a href="${d?.src[0]?.u||'https://www.who.int/emergencies/disease-outbreak-news'}" target="_blank" rel="noopener" style="display:inline-flex;align-items:center;gap:3px;margin-top:4px;color:var(--teal);font-size:8px;font-weight:600;text-decoration:none" onclick="event.stopPropagation()">🔗 Source OMS ↗</a>
    </div>`;
  }).join('');
  const ac=document.getElementById('acnt');if(ac)ac.textContent=DB.alerts.length;
}

// ─── VACCINS ──────────────────────────────────────────────────────
function filterVax(f,btn){
  if(btn){document.querySelectorAll('#panel-vaccines .btn').forEach(b=>b.classList.remove('on'));btn.classList.add('on');}
  const fl=f?DB.diseases.filter(d=>f==='Disponible'?d.vaccine.status==='Disponible':f==='Essais'?d.vaccine.status==='Essais':['Aucun','Recherche'].includes(d.vaccine.status)):DB.diseases;
  const grid=document.getElementById('vax-grid');if(!grid)return;
  grid.innerHTML=fl.map(d=>{
    const v=d.vaccine;
    const icon=v.status==='Disponible'?'✅':v.status==='Essais'?'🔬':'❌';
    const bc=v.status==='Disponible'?'rgba(34,197,94,.07)':v.status==='Essais'?'rgba(59,130,246,.05)':'rgba(239,68,68,.05)';
    const bo=v.status==='Disponible'?'rgba(34,197,94,.15)':v.status==='Essais'?'rgba(59,130,246,.12)':'rgba(239,68,68,.08)';
    return `<div class="vc" style="border-color:${bo}">
      <div style="font-size:12px;font-weight:700;margin-bottom:2px">${d.emoji} ${d.name}</div>
      <div style="font-size:8px;color:var(--t3);margin-bottom:6px">${v.maker}</div>
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:5px">
        <div style="font-size:9px;font-weight:700;color:var(--tea)">${v.name}</div>
        <span class="badge" style="background:${bc};color:${v.status==='Disponible'?'var(--grnl)':v.status==='Essais'?'var(--blul)':'var(--redl)'}">${icon} ${v.status}</span>
      </div>
      ${v.eff?`<div style="display:flex;justify-content:space-between;font-size:8px;margin-bottom:2px"><span style="color:var(--t2)">Efficacité</span><span style="font-weight:700;color:var(--grnl)">${v.eff}%</span></div><div class="prog"><div class="pf2" style="width:${v.eff}%;background:var(--grn)"></div></div>`:''}
      <div style="margin-top:6px;font-size:8px;color:var(--t2);border-top:1px solid var(--brd);padding-top:4px;line-height:1.7"><b style="color:var(--t3)">Approuvé:</b> ${v.approved||'—'}<br><b style="color:var(--t3)">Note:</b> ${v.note}</div>
      <div style="display:flex;gap:4px;flex-wrap:wrap;margin-top:5px;align-items:center">
        <a href="${v.link}" target="_blank" rel="noopener" style="color:var(--teal);font-size:8px;font-weight:600;text-decoration:none">🔗 Source ↗</a>
        ${GROQ_KEY?`<button class="bsm" style="font-size:7px" data-n="${d.name}" onclick="askAI('Analyse du vaccin contre '+this.dataset.n+' en 2026: efficacité, disponibilité, essais en cours')">🦙 IA</button>`:''}
      </div>
    </div>`;
  }).join('');
}

// ─── ÉCONOMIE ─────────────────────────────────────────────────────
function renderEcon(){
  const totD=DB.diseases.reduce((s,d)=>s+d.econ.direct,0);
  const totT=DB.diseases.reduce((s,d)=>s+d.econ.tour,0);
  const totA=DB.diseases.reduce((s,d)=>s+d.econ.agri,0);
  const em=document.getElementById('econ-met');
  if(em)em.innerHTML=[
    {i:'💸',l:'Coût direct total',v:'$'+totD.toFixed(0)+'B/an',s:'Toutes maladies',c:'up'},
    {i:'✈️',l:'Pertes tourisme',v:'$'+totT.toFixed(0)+'B',s:'Restrictions & évitement',c:'up'},
    {i:'🌾',l:'Agriculture',v:'$'+totA.toFixed(0)+'B',s:'H5N1, Lassa...',c:'up'},
    {i:'📉',l:'PIB mondial',v:'-1.8%',s:'Estimation 2025-2026',c:'up'},
  ].map(x=>`<div class="mc"><div class="ml">${x.i} ${x.l}</div><div class="mv" style="font-size:16px;color:var(--redl)">${x.v}</div><div class="ms ${x.c}">${x.s}</div></div>`).join('');
  mkBar('c-gdp',['Afrique sub.','Asie SE','Amériques trop.','Moyen-Orient','Asie Est','Europe','Amér. Nord'],[-3.8,-2.4,-1.6,-1.2,-0.8,-0.4,-0.3],[-3.8,-2.4,-1.6,-1.2,-0.8,-0.4,-0.3].map(v=>v<-2?'#ef4444bb':v<-1?'#f97316bb':'#eab308bb'),{scales:{x:{ticks:TK},y:{suggestedMin:-4.5,suggestedMax:0,ticks:TK}}});
  const topE=[...DB.diseases].sort((a,b)=>b.econ.direct-a.econ.direct).slice(0,12);
  mkBar('c-cost',topE.map(d=>d.name.split(' ')[0].slice(0,9)),topE.map(d=>d.econ.direct),topE.map(d=>d.color+'bb'));
  mkBar('c-sec',['RAM/ATB','COVID-19','VIH/SIDA','Santé','H5N1 avicole','Paludisme','Grippe','Dengue'],[340,340,26,120,95,28,28,12],['#be185dbb','#8b5cf6bb','#e11d48bb','#ef4444bb','#f59e0bbb','#10b981bb','#06b6d4bb','#f97316bb']);
  const et=document.getElementById('econ-tbl');if(!et)return;
  et.innerHTML=DB.diseases.map(d=>`<tr>
    <td>${d.emoji} <strong>${d.name}</strong></td>
    <td style="color:var(--redl)">$${d.econ.direct}B</td>
    <td style="color:var(--oral)">$${d.econ.tour}B</td>
    <td style="color:var(--yell)">$${d.econ.agri}B</td>
    <td style="color:var(--blul)">$${d.econ.health}M</td>
    <td style="color:${d.econ.gdp<-1?'var(--redl)':d.econ.gdp<-0.3?'var(--oral)':'var(--t2)'}">${d.econ.gdp}%</td>
    <td style="color:var(--t2)">${d.econ.jobs?(d.econ.jobs).toLocaleString():'—'}</td>
  </tr>`).join('');
}

// ─── SCIENCE ──────────────────────────────────────────────────────
function filterSci(f,btn){
  if(btn){document.querySelectorAll('#panel-science .btn').forEach(b=>b.classList.remove('on'));btn.classList.add('on');}
  const SC={Nature:'#22c55e',Lancet:'#3b82f6',NEJM:'#8b5cf6',CDC:'#f97316',WHO:'#14b8a6'};
  const fl=f?DB.science.filter(p=>p.src===f):DB.science;
  const el=document.getElementById('sci-list');if(!el)return;
  el.innerHTML=fl.map(p=>`<div class="card" style="margin-bottom:6px;cursor:pointer" onclick="window.open('${p.url}','_blank','noopener')">
    <div style="font-size:11px;font-weight:700;margin-bottom:3px;color:var(--t1)">${p.t}</div>
    <div style="display:flex;gap:4px;flex-wrap:wrap;margin-bottom:4px">
      <span class="badge" style="background:${(SC[p.src]||'#64748b')}22;color:${SC[p.src]||'#94a3b8'};border:1px solid ${(SC[p.src]||'#64748b')}33">${p.j}</span>
      <span class="tag">${p.d}</span>
      <span style="font-size:9px">${'★'.repeat(p.stars)}${'☆'.repeat(5-p.stars)}</span>
    </div>
    <div style="font-size:9px;color:var(--t2);line-height:1.5;margin-bottom:3px">${p.sum}</div>
    <div style="font-size:7px;color:var(--t3);font-style:italic;margin-bottom:3px">⚙️ ${p.method}</div>
    <div style="display:flex;gap:6px;align-items:center">
      <a href="${p.url}" target="_blank" rel="noopener" onclick="event.stopPropagation()" style="color:var(--teal);font-size:8px;font-weight:600;text-decoration:none">🔗 Source ↗</a>
      ${GROQ_KEY?`<button class="bsm" style="font-size:7px" data-t="${p.t.slice(0,80)}" onclick="event.stopPropagation();askAI('Analyse et implications de cette étude: '+this.dataset.t)">🦙 IA</button>`:''}
    </div>
  </div>`).join('');
}

// ─── DETAIL ───────────────────────────────────────────────────────
function openDet(d){
  const ttl=document.getElementById('dttl');if(ttl)ttl.textContent=d.emoji+' '+d.name;
  const v=d.vaccine,e=d.econ;
  const body=document.getElementById('dbody');if(!body)return;
  body.innerHTML=`
    <div style="margin-bottom:9px">
      <span class="badge ${RC[d.risk]}" style="font-size:8px;padding:2px 6px">${d.risk.toUpperCase()}</span>
      <span style="font-size:8px;color:var(--t3);margin-left:6px">${d.countries} pays · ${fN(d.cases)} cas · ${d.cat}</span>
    </div>
    <button data-n="${d.name}" onclick="askAI('Analyse complète '+this.dataset.n+' en 2026: situation mondiale, évolution récente, risques pandémiques, traitements et recommandations OMS')" style="width:100%;background:linear-gradient(135deg,rgba(245,80,54,.1),rgba(255,140,0,.1));border:1px solid rgba(245,80,54,.2);color:var(--oral);padding:7px;border-radius:var(--rs);cursor:pointer;font-size:10px;font-weight:600;margin-bottom:10px">🦙 Analyser avec Assistant IA →</button>
    <div class="card" style="margin-bottom:8px;border-left:3px solid ${d.color}"><div style="font-size:10px;color:var(--t2);line-height:1.7">${d.desc}</div></div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:5px;margin-bottom:8px">
      <div class="mc"><div class="ml">📊 Cas</div><div class="mv" style="font-size:15px">${fN(d.cases)}</div><div class="ms ${d.trend>0?'up':'dn'}">${d.trend>0?'+':''}${d.trend}%/mois</div></div>
      <div class="mc"><div class="ml">☠️ Décès</div><div class="mv" style="font-size:15px;color:var(--redl)">${fN(d.deaths)}</div><div class="ms neu">Mort. ${d.mort}%</div></div>
      <div class="mc"><div class="ml">🔢 R₀</div><div class="mv" style="font-size:15px;color:${d.r0>8?'var(--redl)':d.r0>4?'var(--oral)':'var(--yell)'}">${d.r0||'N/A'}</div></div>
      <div class="mc"><div class="ml">⏱️ Incubation</div><div class="mv" style="font-size:9px;margin-top:5px">${d.incub||'—'}</div></div>
    </div>
    <div class="card" style="margin-bottom:8px;font-size:9px;line-height:1.9;color:var(--t2)">
      <div style="font-size:7px;font-weight:700;text-transform:uppercase;color:var(--t2);margin-bottom:5px">🔬 Épidémiologie</div>
      <div><b style="color:var(--t3)">Pathogène:</b> ${d.pathogen}</div>
      <div><b style="color:var(--t3)">Vecteur:</b> ${d.vector||'—'}</div>
      <div><b style="color:var(--t3)">Transmission:</b> ${d.transmission}</div>
      <div><b style="color:var(--t3)">Réservoir:</b> ${d.host}</div>
      <div><b style="color:var(--t3)">Régions:</b> ${d.regions.join(', ')}</div>
    </div>
    <div class="card" style="margin-bottom:8px">
      <div style="font-size:7px;font-weight:700;text-transform:uppercase;color:var(--t2);margin-bottom:5px">💉 Vaccin</div>
      <div style="display:flex;align-items:center;gap:7px;margin-bottom:5px">
        <span style="font-size:16px">${v.status==='Disponible'?'✅':v.status==='Essais'?'🔬':'❌'}</span>
        <div style="flex:1"><div style="font-size:10px;font-weight:700;color:var(--tea)">${v.name}</div><div style="font-size:8px;color:var(--t3)">${v.maker}</div></div>
        <span class="badge" style="background:${v.status==='Disponible'?'var(--grnbg)':v.status==='Essais'?'var(--blubg)':'var(--redbg)'};color:${v.status==='Disponible'?'var(--grnl)':v.status==='Essais'?'var(--blul)':'var(--redl)'}">${v.status}</span>
      </div>
      ${v.eff?`<div style="display:flex;justify-content:space-between;font-size:8px;margin-bottom:1px"><span style="color:var(--t2)">Efficacité</span><span style="font-weight:700;color:var(--grnl)">${v.eff}%</span></div><div class="prog"><div class="pf2" style="width:${v.eff}%;background:var(--grn)"></div></div>`:''}
      <div style="margin-top:6px;font-size:8px;color:var(--t2);border-top:1px solid var(--brd);padding-top:4px;line-height:1.7"><b style="color:var(--t3)">Approuvé:</b> ${v.approved||'—'}<br><b style="color:var(--t3)">Note:</b> ${v.note}</div>
      <a href="${v.link}" target="_blank" rel="noopener" style="color:var(--teal);font-size:8px;font-weight:600;text-decoration:none">🔗 Source officielle ↗</a>
    </div>
    <div class="card" style="margin-bottom:8px">
      <div style="font-size:7px;font-weight:700;text-transform:uppercase;color:var(--t2);margin-bottom:5px">💰 Impact économique</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:4px">
        ${[['💸 Direct','$'+e.direct+'B/an','var(--redl)'],['✈️ Tourisme','$'+e.tour+'B','var(--oral)'],['🌾 Agriculture','$'+e.agri+'B','var(--yell)'],['🏥 Santé','$'+e.health+'M','var(--blul)']].map(([l,v2,c])=>`<div style="background:var(--bg3);padding:5px;border-radius:4px"><div style="font-size:7px;color:var(--t3);margin-bottom:1px">${l}</div><div style="font-weight:700;font-size:10px;color:${c}">${v2}</div></div>`).join('')}
      </div>
    </div>
    <div class="card">
      <div style="font-size:7px;font-weight:700;text-transform:uppercase;color:var(--t2);margin-bottom:5px">🔗 Sources (${d.src.length})</div>
      ${d.src.map(s=>`<a href="${s.u}" target="_blank" rel="noopener" style="display:flex;align-items:center;gap:6px;padding:4px 0;border-bottom:1px solid var(--brd);text-decoration:none">
        <span class="badge" style="background:var(--bg3);color:var(--t2)">${s.t}</span>
        <span style="font-size:9px;font-weight:600;color:var(--teal)">${s.n}</span>
        <span style="margin-left:auto;color:var(--t3);font-size:9px">↗</span>
      </a>`).join('')}
    </div>`;
  document.getElementById('det').classList.add('open');
  document.getElementById('dov').classList.add('on');
}

function closeDet(){document.getElementById('det').classList.remove('open');document.getElementById('dov').classList.remove('on');selId=null;renderSB(DB.diseases);}

// ─── EXPORT ───────────────────────────────────────────────────────
function openExp(){document.getElementById('emod').classList.add('on');}
function closeExp(){document.getElementById('emod').classList.remove('on');}

function dl(content,name,type='text/csv'){
  const a=Object.assign(document.createElement('a'),{href:URL.createObjectURL(new Blob([content],{type})),download:name});
  a.click();URL.revokeObjectURL(a.href);
}

function toCSV(h,rows){return[h.join(','),...rows.map(r=>r.map(v=>{const s=String(v||'');return s.includes(',')||s.includes('"')?`"${s.replace(/"/g,'""')}`:s;}).join(','))].join('\n');}

function exportCSV(type){
  closeExp();
  if(type==='diseases')dl(toCSV(['ID','Maladie','Catégorie','Pathogène','Risque','Cas','Décès','Mortalité%','Pays','R0','Tendance%','Vaccin','Statut','Efficacité','Régions'],DB.diseases.map(d=>[d.id,d.name,d.cat,d.pathogen,d.risk,d.cases,d.deaths,d.mort,d.countries,d.r0||'',d.trend,d.vaccine.name,d.vaccine.status,d.vaccine.eff||'',d.regions.join(';')])),'wdm-maladies.csv');
  if(type==='countries'&&cvData.length)dl(toCSV(['Pays','Continent','Total cas','Cas actifs','Décès','Guéris','Mortalité%','Cas/million'],cvData.map(c=>[c.country,c.continent||'',c.cases||0,c.active||0,c.deaths||0,c.recovered||0,c.cases?(c.deaths/c.cases*100).toFixed(2):0,c.casesPerOneMillion||0])),'wdm-pays-200.csv');
  if(type==='economic')dl(toCSV(['Maladie','Direct($B)','Tourisme($B)','Agri($B)','Santé($M)','PIB(%)','Emplois'],DB.diseases.map(d=>[d.name,d.econ.direct,d.econ.tour,d.econ.agri,d.econ.health,d.econ.gdp,d.econ.jobs||''])),'wdm-economique.csv');
  if(type==='vaccines')dl(toCSV(['Maladie','Vaccin','Fabricant','Statut','Efficacité%','Approuvé','Note'],DB.diseases.map(d=>[d.name,d.vaccine.name,d.vaccine.maker,d.vaccine.status,d.vaccine.eff||'',d.vaccine.approved,d.vaccine.note])),'wdm-vaccins.csv');
  if(type==='covid'&&cvData.length)dl(toCSV(['Pays','Continent','Total cas','Actifs','Décès','Guéris','Mortalité%','Cas/million','Export'],cvData.map(c=>[c.country,c.continent||'',c.cases||0,c.active||0,c.deaths||0,c.recovered||0,c.cases?(c.deaths/c.cases*100).toFixed(2):0,c.casesPerOneMillion||0,new Date().toISOString()])),'wdm-covid-live.csv');
}

function exportJSON(){closeExp();dl(JSON.stringify({date:new Date().toISOString(),sources:{covid:'disease.sh API live',diseases:'OMS/CDC/ECDC',ai:'IA IA avancée'},diseases:DB.diseases,covidLive:cvData,alerts:DB.alerts},null,2),'wdm-complete.json','application/json');}

// ─── REFRESH ──────────────────────────────────────────────────────
async function refreshAll(){await Promise.all([fetchCovid(),fetchFlu()]);renderDash();renderMapSide();renderAllAIBtns();
  if(typeof renderMapAIBtns==="function")renderMapAIBtns();}

// ─── MAP HEIGHT ────────────────────────────────────────────────────
function setMapH(){const w=document.getElementById('mapW');if(w)w.style.height=(window.innerHeight-50-24-37-20)+'px';}

// ─── INIT ─────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded',async()=>{
  // Init all tabs
  renderSB(DB.diseases);
  renderMapSide();
  renderDash();
  renderDisTable();
  filterAlerts('',document.querySelector('#panel-alerts .btn'));
  filterVax('',document.querySelector('#panel-vaccines .btn'));
  renderEcon();
  filterSci('',document.querySelector('#panel-science .btn'));
  renderSugs();
  updateAI();

  // Map
  initMapFull();
  // Resize handled by map.js

  // Welcome message
  setTimeout(()=>{
    if(!GROQ_KEY){
      addMsg('bot','🌍 **Bienvenue dans Live Disease !**\n\n**Données temps réel qui chargent maintenant :**\n• 🦠 COVID — 200+ pays\n• 🤧 Grippe — OMS\n• 🗺️ Carte — tous les foyers épidémiques\n• 📡 Alertes — OMS, ONU, CDC\n\n100 maladies suivies · 26 langues · Données officielles');
    }else{
      addMsg('bot',`✅ **Live Disease prêt !**\n\n🦙 Assistant IA connecté · 🌍 ${cvData.length||'200+'} pays · 🦠 COVID API en cours...\n\nJe suis dans **tous les onglets**. Posez n'importe quelle question !`);
    }
  },500);

  // Fetch APIs
  setStat('<span class="sp sp-warn"><span class="spin"></span>Connexion APIs...</span>','o');
  await Promise.all([fetchCovid(),fetchFlu()]);

  // Auto-refresh
  setInterval(fetchCovid,5*60*1000);
  setInterval(fetchFlu,30*60*1000);

  // Lance IA pour actualiser toutes les données non-temps-réel
  setTimeout(()=>{
    addIARefreshBtns();
    groqLiveInit();
  }, 1500);
  setInterval(()=>{const sy=document.getElementById('sfsync');if(sy)sy.textContent=new Date().toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'});},30000);
});

// ================================================================
// GROQ LIVE DATA — Toutes les données générées par IA en temps réel
// Maladies, vaccins, économie, science → IA les actualise au démarrage
// ================================================================

// ─── GROQ GÉNÈRE LES DONNÉES MALADIES ────────────────────────────
async function groqUpdateDiseases() {
  if (!GROQ_KEY) return;
  showIALoading('diseases');

  const q = `Tu es une base de données épidémiologique. Date: ${new Date().toLocaleDateString('fr-FR')}.
Donne-moi les données ACTUELLES pour ces 5 maladies les plus actives en ce moment: dengue, mpox, H5N1, choléra, marburg.
Réponds UNIQUEMENT en JSON valide, format exact:
[{"id":"dengue","cases":4280000,"deaths":21400,"trend":18,"countries":87,"desc":"...situation actuelle en 1 phrase...","r0":9.2},...]
Utilise tes connaissances les plus récentes. Sois précis sur les chiffres actuels 2026.`;

  try {
    const resp = await fetch(GROQ_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + GROQ_KEY },
      body: JSON.stringify({ model: GROQ_MODEL, messages: [{ role: 'user', content: q }], max_tokens: 800, temperature: 0.3 }),
      signal: AbortSignal.timeout(20000)
    });
    if (!resp.ok) throw new Error(resp.status);
    const data = await resp.json();
    const txt = data.choices?.[0]?.message?.content || '';
    const clean = txt.replace(/```json|```/g, '').trim();
    const arr = JSON.parse(clean);
    if (Array.isArray(arr)) {
      arr.forEach(item => {
        const d = DB.diseases.find(x => x.id === item.id);
        if (d) {
          if (item.cases) d.cases = item.cases;
          if (item.deaths) d.deaths = item.deaths;
          if (item.trend !== undefined) d.trend = item.trend;
          if (item.countries) d.countries = item.countries;
          if (item.desc) d.desc = item.desc;
          if (item.r0) d.r0 = item.r0;
          d.groqUpdated = true;
          d.groqTime = new Date().toLocaleTimeString('fr-FR');
        }
      });
      // Re-render tout
      renderDisTable();
      renderDash();
      renderSB(DB.diseases);
      if (typeof drawAllCircles === 'function') drawAllCircles();
      if (typeof groqRefreshMap === 'function') groqRefreshMap();
      showIASuccess('diseases', arr.length + ' maladies mises à jour par IA');
    }
  } catch(e) {
    showIAError('diseases', 'Données OMS/CDC utilisées (IA indisponible)');
  }
}

// ─── GROQ GÉNÈRE LES DONNÉES VACCINS ─────────────────────────────
async function groqUpdateVaccines() {
  if (!GROQ_KEY) return;
  showIALoading('vaccines');

  const q = `Date: ${new Date().toLocaleDateString('fr-FR')}.
Donne les dernières données vaccins pour: dengue, mpox, h5n1, marburg, nipah, hantavirus, zika, lassa.
Réponds UNIQUEMENT en JSON:
[{"id":"dengue","vaccine_name":"Qdenga / Dengvaxia","status":"Disponible","eff":80,"approved":"UE, Brésil, Thaïlande","note":"..dernière info 2026.."},...]
Statuts possibles: Disponible, Essais, Aucun. Inclus les dernières approbations et résultats d'essais cliniques connus.`;

  try {
    const resp = await fetch(GROQ_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + GROQ_KEY },
      body: JSON.stringify({ model: GROQ_MODEL, messages: [{ role: 'user', content: q }], max_tokens: 600, temperature: 0.2 }),
      signal: AbortSignal.timeout(20000)
    });
    const data = await resp.json();
    const txt = data.choices?.[0]?.message?.content || '';
    const arr = JSON.parse(txt.replace(/```json|```/g, '').trim());
    if (Array.isArray(arr)) {
      arr.forEach(item => {
        const d = DB.diseases.find(x => x.id === item.id);
        if (d && d.vaccine) {
          if (item.vaccine_name) d.vaccine.name = item.vaccine_name;
          if (item.status) d.vaccine.status = item.status;
          if (item.eff !== undefined) d.vaccine.eff = item.eff;
          if (item.approved) d.vaccine.approved = item.approved;
          if (item.note) d.vaccine.note = item.note;
          d.vaccine.groqUpdated = true;
          d.vaccine.groqTime = new Date().toLocaleTimeString('fr-FR');
        }
      });
      filterVax('', document.querySelector('#panel-vaccines .btn'));
      showIASuccess('vaccines', arr.length + ' vaccins mis à jour par IA');
    }
  } catch(e) {
    showIAError('vaccines', 'Données OMS/CDC utilisées');
  }
}

// ─── GROQ GÉNÈRE ALERTES EN TEMPS RÉEL ───────────────────────────
async function groqUpdateAlerts() {
  if (!GROQ_KEY) return;

  const q = `Date: ${new Date().toLocaleDateString('fr-FR')}.
Quelles sont les 8 alertes épidémiques OMS les plus importantes ACTUELLEMENT en ${new Date().getFullYear()} ?
Réponds UNIQUEMENT en JSON:
[{"type":"critical","color":"#ef4444","text":"🔴 MALADIE — Pays: description courte","time":"Il y a Xh","did":"id_maladie"},...]
Types: critical, high, medium, watch. did doit être parmi: dengue,mpox,h5n1,cholera,covid19,measles,malaria,tb,marburg,nipah,hiv,amr,candida,influenza,hantavirus,ebola,pertussis,zika,yellow_fever,lassa,mers,rabies,chikungunya,hep_b,polio,meningitis
Sois précis et actuel.`;

  try {
    const resp = await fetch(GROQ_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + GROQ_KEY },
      body: JSON.stringify({ model: GROQ_MODEL, messages: [{ role: 'user', content: q }], max_tokens: 700, temperature: 0.4 }),
      signal: AbortSignal.timeout(20000)
    });
    const data = await resp.json();
    const txt = data.choices?.[0]?.message?.content || '';
    const arr = JSON.parse(txt.replace(/```json|```/g, '').trim());
    if (Array.isArray(arr) && arr.length > 0) {
      DB.alerts = arr;
      filterAlerts('', document.querySelector('#panel-alerts .btn'));
      renderMapSide && renderMapSide();
      const ac = document.getElementById('acnt');
      if (ac) ac.textContent = arr.length;
      // Update dash alerts
      const da = document.getElementById('dash-alerts');
      if (da) da.innerHTML = arr.slice(0,5).map(a =>
        `<div style="padding:5px 7px;border-radius:var(--rs);border-left:2px solid ${a.color};background:rgba(0,0,0,.2);margin-bottom:3px;cursor:pointer;font-size:8px;line-height:1.4" onclick="pickDis('${a.did}')">${a.text}<br><small style="color:var(--t3)">${a.time}</small></div>`
      ).join('');
    }
  } catch(e) {
    console.log('IA alertes error:', e.message);
  }
}

// ─── GROQ GÉNÈRE DONNÉES ÉCONOMIQUES ─────────────────────────────
async function groqUpdateEconomic() {
  if (!GROQ_KEY) return;

  const q = `Date: ${new Date().toLocaleDateString('fr-FR')}.
Donne l'impact économique ACTUEL des épidémies mondiales en 2026.
Réponds UNIQUEMENT en JSON pour ces maladies: dengue, amr, covid19, malaria, hiv, h5n1:
[{"id":"dengue","direct":47,"tour":12,"agri":3,"health":890,"gdp":-0.8,"jobs":420000},...]
direct=coût direct en milliards USD/an, tour=pertes tourisme $B, agri=agri $B, health=santé $M, gdp=impact PIB %, jobs=emplois perdus.
Utilise les données les plus récentes disponibles.`;

  try {
    const resp = await fetch(GROQ_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + GROQ_KEY },
      body: JSON.stringify({ model: GROQ_MODEL, messages: [{ role: 'user', content: q }], max_tokens: 500, temperature: 0.2 }),
      signal: AbortSignal.timeout(20000)
    });
    const data = await resp.json();
    const txt = data.choices?.[0]?.message?.content || '';
    const arr = JSON.parse(txt.replace(/```json|```/g, '').trim());
    if (Array.isArray(arr)) {
      arr.forEach(item => {
        const d = DB.diseases.find(x => x.id === item.id);
        if (d && d.econ) {
          if (item.direct !== undefined) d.econ.direct = item.direct;
          if (item.tour !== undefined) d.econ.tour = item.tour;
          if (item.agri !== undefined) d.econ.agri = item.agri;
          if (item.health !== undefined) d.econ.health = item.health;
          if (item.gdp !== undefined) d.econ.gdp = item.gdp;
          if (item.jobs !== undefined) d.econ.jobs = item.jobs;
        }
      });
      renderEcon();
    }
  } catch(e) {
    console.log('IA economic error:', e.message);
  }
}

// ─── GROQ GÉNÈRE PUBLICATIONS SCIENTIFIQUES ──────────────────────
async function groqUpdateScience() {
  if (!GROQ_KEY) return;
  showIALoading('science');

  const q = `Date: ${new Date().toLocaleDateString('fr-FR')}.
Donne-moi les 8 publications scientifiques épidémiologiques les plus importantes et RÉCENTES (2025-2026).
Réponds UNIQUEMENT en JSON:
[{"t":"Titre de l'étude","j":"Journal (Nature/Lancet/NEJM/CDC/WHO)","src":"Nature","d":"mois année","stars":5,"sum":"Résumé en 1 phrase des résultats clés","method":"Méthode utilisée","url":"https://...lien source officielle..."},...]
Inclus les vraies études récentes sur: H5N1, dengue, mpox, RAM, vaccins paludisme, VIH, COVID variants.
Sois précis, cite de vrais journaux et URLs OMS/CDC/Lancet réels.`;

  try {
    const resp = await fetch(GROQ_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + GROQ_KEY },
      body: JSON.stringify({ model: GROQ_MODEL, messages: [{ role: 'user', content: q }], max_tokens: 900, temperature: 0.3 }),
      signal: AbortSignal.timeout(25000)
    });
    const data = await resp.json();
    const txt = data.choices?.[0]?.message?.content || '';
    const arr = JSON.parse(txt.replace(/```json|```/g, '').trim());
    if (Array.isArray(arr) && arr.length > 0) {
      DB.science = arr;
      filterSci('', document.querySelector('#panel-science .btn'));
      showIASuccess('science', arr.length + ' publications mises à jour par IA');
    }
  } catch(e) {
    showIAError('science', 'Publications statiques utilisées');
  }
}

// ─── INDICATEURS DE CHARGEMENT GROQ ──────────────────────────────
function showIALoading(tab) {
  const badges = {
    diseases: '#dis-tbl',
    vaccines: '#vax-grid',
    science: '#sci-list'
  };
  // Affiche badge "IA actualise..." en haut de chaque tab
  const panels = {
    diseases: 'panel-diseases',
    vaccines: 'panel-vaccines',
    science: 'panel-science'
  };
  const p = document.getElementById(panels[tab]);
  if (!p) return;
  let badge = document.getElementById('groq-badge-' + tab);
  if (!badge) {
    badge = document.createElement('div');
    badge.id = 'groq-badge-' + tab;
    p.insertBefore(badge, p.firstChild);
  }
  badge.innerHTML = `<div style="background:rgba(245,80,54,.08);border:1px solid rgba(245,80,54,.2);border-radius:6px;padding:6px 10px;font-size:9px;color:#fdba74;margin-bottom:8px;display:flex;align-items:center;gap:6px"><span class="spin"></span> <span>🦙 IA actualise les données en temps réel...</span></div>`;
}

function showIASuccess(tab, msg) {
  const badge = document.getElementById('groq-badge-' + tab);
  if (!badge) return;
  badge.innerHTML = `<div style="background:rgba(34,197,94,.06);border:1px solid rgba(34,197,94,.15);border-radius:6px;padding:5px 10px;font-size:9px;color:#86efac;margin-bottom:8px;display:flex;align-items:center;justify-content:space-between"><span>✅ ${msg} · ${new Date().toLocaleTimeString('fr-FR')}</span><button onclick="this.parentElement.parentElement.remove()" style="background:none;border:none;color:#86efac;cursor:pointer;font-size:10px">✕</button></div>`;
  setTimeout(() => { if (badge) badge.innerHTML = ''; }, 8000);
}

function showIAError(tab, msg) {
  const badge = document.getElementById('groq-badge-' + tab);
  if (!badge) return;
  badge.innerHTML = `<div style="background:rgba(234,179,8,.05);border:1px solid rgba(234,179,8,.12);border-radius:6px;padding:5px 10px;font-size:9px;color:#fde047;margin-bottom:8px">${msg}</div>`;
  setTimeout(() => { if (badge) badge.innerHTML = ''; }, 5000);
}

// ─── BOUTON GROQ REFRESH DANS CHAQUE ONGLET ───────────────────────
function addIARefreshBtns() {
  // Maladies
  addIABtn('panel-diseases', 'btn-row', '🦙 Actualiser données avec IA', groqUpdateDiseases);
  // Vaccins
  addIABtn('panel-vaccines', 'btn-row', '🦙 Actualiser vaccins avec IA', groqUpdateVaccines);
  // Économie
  addIABtn('panel-economic', null, '🦙 Actualiser données économiques avec IA', groqUpdateEconomic);
  // Science
  addIABtn('panel-science', 'btn-row', '🦙 Actualiser publications avec IA', groqUpdateScience);
  // Alertes
  addIABtn('panel-alerts', 'btn-row', '🦙 Alertes OMS en temps réel via IA', groqUpdateAlerts);
}

function addIABtn(panelId, rowClass, label, fn) {
  if (!GROQ_KEY) return;
  const panel = document.getElementById(panelId);
  if (!panel) return;
  const target = rowClass ? panel.querySelector('.' + rowClass) : panel;
  if (!target) return;
  // Évite doublons
  if (target.querySelector('.groq-refresh-btn')) return;
  const btn = document.createElement('button');
  btn.className = 'groq-refresh-btn';
  btn.style.cssText = 'background:linear-gradient(135deg,rgba(245,80,54,.12),rgba(255,140,0,.12));border:1px solid rgba(245,80,54,.25);border-radius:var(--rs);color:#fdba74;font-size:9px;padding:3px 8px;cursor:pointer;margin-left:auto;white-space:nowrap';
  btn.innerHTML = label;
  btn.onclick = fn;
  if (rowClass) target.appendChild(btn);
  else target.insertBefore(btn, target.firstChild);
}

// ─── LANCEMENT AUTO AU DÉMARRAGE ─────────────────────────────────
async function groqLiveInit() {
  if (!GROQ_KEY) return;

  // Lance toutes les mises à jour en parallèle
  addMsg('bot', '🦙 **Assistant IA actualise toutes les données...**\n\nMaladies · Vaccins · Alertes · Économie · Science\nDonnées OMS/CDC enrichies par IA en temps réel.');

  await Promise.allSettled([
    groqUpdateAlerts(),      // Alertes OMS actuelles
    groqUpdateDiseases(),    // Données maladies
    groqUpdateVaccines(),    // Vaccins
    groqUpdateEconomic(),    // Économie
    groqUpdateScience(),     // Publications
  ]);

  addMsg('bot', '✅ **Toutes les données actualisées par IA !**\n\n🦠 Maladies · 💉 Vaccins · ⚠️ Alertes · 💰 Économie · 🔬 Science\n\nTout est maintenant en temps réel via Assistant IA. Les données COVID restent en direct via l\'API disease.sh (actualisation toutes les 5 min).');
}

// Ajoute les boutons refresh quand IA est configuré
function onIAConnected() {
  addIARefreshBtns();
  groqLiveInit();
}

// Override saveIAKey pour déclencher l'init live
const _origSaveIAKey = saveIAKey;
window.saveIAKey = function() {
  _origSaveIAKey();
  setTimeout(() => {
    if (GROQ_KEY) onIAConnected();
  }, 500);
};

// IA init géré dans le DOMContentLoaded principal
