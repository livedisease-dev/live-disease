// ================================================================
// LIVE DISEASE — Système de traduction multilingue
// 12 langues majeures (~4,5 milliards de personnes couvertes)
// ================================================================

const TRANSLATIONS = {
  fr: {
    map:'🗺️ Carte mondiale', dash:'📊 Tableau de bord', counters:'🔢 Compteurs',
    ai:'🤖 Assistant IA', covid:'🦠 COVID', flu:'🤧 Grippe', diseases:'🦟 Maladies',
    alerts:'⚠️ Alertes', countries:'🌍 Pays', vaccines:'💉 Vaccins', economic:'💰 Économie',
    science:'🔬 Science', livefeed:'📡 Flux en direct', cdc:'🏛️ CDC USA',
    export:'⬇ Exporter les données', search:'Rechercher une maladie...', loading:'Chargement...',
    subtitle:'Surveillance épidémique mondiale en temps réel'
  },
  en: {
    map:'🗺️ World Map', dash:'📊 Dashboard', counters:'🔢 Counters',
    ai:'🤖 AI Assistant', covid:'🦠 COVID', flu:'🤧 Flu', diseases:'🦟 Diseases',
    alerts:'⚠️ Alerts', countries:'🌍 Countries', vaccines:'💉 Vaccines', economic:'💰 Economy',
    science:'🔬 Science', livefeed:'📡 Live Feed', cdc:'🏛️ CDC USA',
    export:'⬇ Export data', search:'Search a disease...', loading:'Loading...',
    subtitle:'Real-time global epidemic surveillance'
  },
  es: {
    map:'🗺️ Mapa mundial', dash:'📊 Panel', counters:'🔢 Contadores',
    ai:'🤖 Asistente IA', covid:'🦠 COVID', flu:'🤧 Gripe', diseases:'🦟 Enfermedades',
    alerts:'⚠️ Alertas', countries:'🌍 Países', vaccines:'💉 Vacunas', economic:'💰 Economía',
    science:'🔬 Ciencia', livefeed:'📡 En vivo', cdc:'🏛️ CDC EEUU',
    export:'⬇ Exportar datos', search:'Buscar una enfermedad...', loading:'Cargando...',
    subtitle:'Vigilancia epidémica mundial en tiempo real'
  },
  de: {
    map:'🗺️ Weltkarte', dash:'📊 Übersicht', counters:'🔢 Zähler',
    ai:'🤖 KI-Assistent', covid:'🦠 COVID', flu:'🤧 Grippe', diseases:'🦟 Krankheiten',
    alerts:'⚠️ Warnungen', countries:'🌍 Länder', vaccines:'💉 Impfstoffe', economic:'💰 Wirtschaft',
    science:'🔬 Wissenschaft', livefeed:'📡 Live', cdc:'🏛️ CDC USA',
    export:'⬇ Daten exportieren', search:'Krankheit suchen...', loading:'Laden...',
    subtitle:'Weltweite Echtzeit-Epidemieüberwachung'
  },
  pt: {
    map:'🗺️ Mapa mundial', dash:'📊 Painel', counters:'🔢 Contadores',
    ai:'🤖 Assistente IA', covid:'🦠 COVID', flu:'🤧 Gripe', diseases:'🦟 Doenças',
    alerts:'⚠️ Alertas', countries:'🌍 Países', vaccines:'💉 Vacinas', economic:'💰 Economia',
    science:'🔬 Ciência', livefeed:'📡 Ao vivo', cdc:'🏛️ CDC EUA',
    export:'⬇ Exportar dados', search:'Buscar uma doença...', loading:'Carregando...',
    subtitle:'Vigilância epidêmica global em tempo real'
  },
  ar: {
    map:'🗺️ خريطة العالم', dash:'📊 لوحة القيادة', counters:'🔢 العدادات',
    ai:'🤖 مساعد ذكي', covid:'🦠 كوفيد', flu:'🤧 إنفلونزا', diseases:'🦟 الأمراض',
    alerts:'⚠️ تنبيهات', countries:'🌍 الدول', vaccines:'💉 اللقاحات', economic:'💰 الاقتصاد',
    science:'🔬 العلوم', livefeed:'📡 مباشر', cdc:'🏛️ CDC',
    export:'⬇ تصدير البيانات', search:'ابحث عن مرض...', loading:'جار التحميل...',
    subtitle:'مراقبة الأوبئة العالمية في الوقت الفعلي'
  },
  zh: {
    map:'🗺️ 世界地图', dash:'📊 仪表板', counters:'🔢 计数器',
    ai:'🤖 AI助手', covid:'🦠 新冠', flu:'🤧 流感', diseases:'🦟 疾病',
    alerts:'⚠️ 警报', countries:'🌍 国家', vaccines:'💉 疫苗', economic:'💰 经济',
    science:'🔬 科学', livefeed:'📡 实时', cdc:'🏛️ CDC',
    export:'⬇ 导出数据', search:'搜索疾病...', loading:'加载中...',
    subtitle:'全球实时疫情监测'
  },
  hi: {
    map:'🗺️ विश्व मानचित्र', dash:'📊 डैशबोर्ड', counters:'🔢 काउंटर',
    ai:'🤖 AI सहायक', covid:'🦠 कोविड', flu:'🤧 फ्लू', diseases:'🦟 रोग',
    alerts:'⚠️ अलर्ट', countries:'🌍 देश', vaccines:'💉 टीके', economic:'💰 अर्थव्यवस्था',
    science:'🔬 विज्ञान', livefeed:'📡 लाइव', cdc:'🏛️ CDC',
    export:'⬇ डेटा निर्यात', search:'रोग खोजें...', loading:'लोड हो रहा है...',
    subtitle:'वास्तविक समय वैश्विक महामारी निगरानी'
  },
  ru: {
    map:'🗺️ Карта мира', dash:'📊 Панель', counters:'🔢 Счётчики',
    ai:'🤖 ИИ-помощник', covid:'🦠 COVID', flu:'🤧 Грипп', diseases:'🦟 Болезни',
    alerts:'⚠️ Оповещения', countries:'🌍 Страны', vaccines:'💉 Вакцины', economic:'💰 Экономика',
    science:'🔬 Наука', livefeed:'📡 Прямой эфир', cdc:'🏛️ CDC',
    export:'⬇ Экспорт данных', search:'Поиск болезни...', loading:'Загрузка...',
    subtitle:'Глобальный эпиднадзор в реальном времени'
  },
  ja: {
    map:'🗺️ 世界地図', dash:'📊 ダッシュボード', counters:'🔢 カウンター',
    ai:'🤖 AIアシスタント', covid:'🦠 COVID', flu:'🤧 インフルエンザ', diseases:'🦟 疾患',
    alerts:'⚠️ 警報', countries:'🌍 国', vaccines:'💉 ワクチン', economic:'💰 経済',
    science:'🔬 科学', livefeed:'📡 ライブ', cdc:'🏛️ CDC',
    export:'⬇ データ出力', search:'病気を検索...', loading:'読み込み中...',
    subtitle:'リアルタイム世界疫病監視'
  },
  id: {
    map:'🗺️ Peta Dunia', dash:'📊 Dasbor', counters:'🔢 Penghitung',
    ai:'🤖 Asisten AI', covid:'🦠 COVID', flu:'🤧 Flu', diseases:'🦟 Penyakit',
    alerts:'⚠️ Peringatan', countries:'🌍 Negara', vaccines:'💉 Vaksin', economic:'💰 Ekonomi',
    science:'🔬 Sains', livefeed:'📡 Langsung', cdc:'🏛️ CDC',
    export:'⬇ Ekspor data', search:'Cari penyakit...', loading:'Memuat...',
    subtitle:'Pengawasan epidemi global waktu nyata'
  },
  sw: {
    map:'🗺️ Ramani ya Dunia', dash:'📊 Dashibodi', counters:'🔢 Vihesabu',
    ai:'🤖 Msaidizi wa AI', covid:'🦠 COVID', flu:'🤧 Mafua', diseases:'🦟 Magonjwa',
    alerts:'⚠️ Tahadhari', countries:'🌍 Nchi', vaccines:'💉 Chanjo', economic:'💰 Uchumi',
    science:'🔬 Sayansi', livefeed:'📡 Moja kwa moja', cdc:'🏛️ CDC',
    export:'⬇ Hamisha data', search:'Tafuta ugonjwa...', loading:'Inapakia...',
    subtitle:'Ufuatiliaji wa magonjwa duniani wakati halisi'
  },
  bn: {
    map:'🗺️ বিশ্ব মানচিত্র', dash:'📊 ড্যাশবোর্ড', counters:'🔢 কাউন্টার',
    ai:'🤖 AI সহায়ক', covid:'🦠 কোভিড', flu:'🤧 ফ্লু', diseases:'🦟 রোগ',
    alerts:'⚠️ সতর্কতা', countries:'🌍 দেশ', vaccines:'💉 টিকা', economic:'💰 অর্থনীতি',
    science:'🔬 বিজ্ঞান', livefeed:'📡 লাইভ', cdc:'🏛️ CDC',
    export:'⬇ ডেটা রপ্তানি', search:'রোগ খুঁজুন...', loading:'লোড হচ্ছে...',
    subtitle:'রিয়েল-টাইম বৈশ্বিক মহামারী নজরদারি'
  },
  ur: {
    map:'🗺️ عالمی نقشہ', dash:'📊 ڈیش بورڈ', counters:'🔢 کاؤنٹر',
    ai:'🤖 AI اسسٹنٹ', covid:'🦠 کووڈ', flu:'🤧 فلو', diseases:'🦟 بیماریاں',
    alerts:'⚠️ الرٹس', countries:'🌍 ممالک', vaccines:'💉 ویکسین', economic:'💰 معیشت',
    science:'🔬 سائنس', livefeed:'📡 لائیو', cdc:'🏛️ CDC',
    export:'⬇ ڈیٹا برآمد', search:'بیماری تلاش کریں...', loading:'لوڈ ہو رہا ہے...',
    subtitle:'حقیقی وقت عالمی وبائی نگرانی'
  },
  tr: {
    map:'🗺️ Dünya Haritası', dash:'📊 Kontrol Paneli', counters:'🔢 Sayaçlar',
    ai:'🤖 AI Asistanı', covid:'🦠 COVID', flu:'🤧 Grip', diseases:'🦟 Hastalıklar',
    alerts:'⚠️ Uyarılar', countries:'🌍 Ülkeler', vaccines:'💉 Aşılar', economic:'💰 Ekonomi',
    science:'🔬 Bilim', livefeed:'📡 Canlı', cdc:'🏛️ CDC',
    export:'⬇ Verileri dışa aktar', search:'Hastalık ara...', loading:'Yükleniyor...',
    subtitle:'Gerçek zamanlı küresel salgın gözetimi'
  },
  ko: {
    map:'🗺️ 세계 지도', dash:'📊 대시보드', counters:'🔢 카운터',
    ai:'🤖 AI 도우미', covid:'🦠 코로나', flu:'🤧 독감', diseases:'🦟 질병',
    alerts:'⚠️ 경보', countries:'🌍 국가', vaccines:'💉 백신', economic:'💰 경제',
    science:'🔬 과학', livefeed:'📡 라이브', cdc:'🏛️ CDC',
    export:'⬇ 데이터 내보내기', search:'질병 검색...', loading:'로딩 중...',
    subtitle:'실시간 글로벌 전염병 감시'
  },
  it: {
    map:'🗺️ Mappa mondiale', dash:'📊 Cruscotto', counters:'🔢 Contatori',
    ai:'🤖 Assistente IA', covid:'🦠 COVID', flu:'🤧 Influenza', diseases:'🦟 Malattie',
    alerts:'⚠️ Allerte', countries:'🌍 Paesi', vaccines:'💉 Vaccini', economic:'💰 Economia',
    science:'🔬 Scienza', livefeed:'📡 In diretta', cdc:'🏛️ CDC USA',
    export:'⬇ Esporta dati', search:'Cerca una malattia...', loading:'Caricamento...',
    subtitle:'Sorveglianza epidemica globale in tempo reale'
  },
  vi: {
    map:'🗺️ Bản đồ thế giới', dash:'📊 Bảng điều khiển', counters:'🔢 Bộ đếm',
    ai:'🤖 Trợ lý AI', covid:'🦠 COVID', flu:'🤧 Cúm', diseases:'🦟 Bệnh',
    alerts:'⚠️ Cảnh báo', countries:'🌍 Quốc gia', vaccines:'💉 Vắc-xin', economic:'💰 Kinh tế',
    science:'🔬 Khoa học', livefeed:'📡 Trực tiếp', cdc:'🏛️ CDC',
    export:'⬇ Xuất dữ liệu', search:'Tìm bệnh...', loading:'Đang tải...',
    subtitle:'Giám sát dịch bệnh toàn cầu thời gian thực'
  },
  fa: {
    map:'🗺️ نقشه جهان', dash:'📊 داشبورد', counters:'🔢 شمارنده‌ها',
    ai:'🤖 دستیار هوش مصنوعی', covid:'🦠 کووید', flu:'🤧 آنفلوانزا', diseases:'🦟 بیماری‌ها',
    alerts:'⚠️ هشدارها', countries:'🌍 کشورها', vaccines:'💉 واکسن‌ها', economic:'💰 اقتصاد',
    science:'🔬 علم', livefeed:'📡 زنده', cdc:'🏛️ CDC',
    export:'⬇ خروجی داده', search:'جستجوی بیماری...', loading:'در حال بارگذاری...',
    subtitle:'نظارت جهانی بیماری‌های همه‌گیر در زمان واقعی'
  },
  th: {
    map:'🗺️ แผนที่โลก', dash:'📊 แดชบอร์ด', counters:'🔢 ตัวนับ',
    ai:'🤖 ผู้ช่วย AI', covid:'🦠 โควิด', flu:'🤧 ไข้หวัด', diseases:'🦟 โรค',
    alerts:'⚠️ การแจ้งเตือน', countries:'🌍 ประเทศ', vaccines:'💉 วัคซีน', economic:'💰 เศรษฐกิจ',
    science:'🔬 วิทยาศาสตร์', livefeed:'📡 สด', cdc:'🏛️ CDC',
    export:'⬇ ส่งออกข้อมูล', search:'ค้นหาโรค...', loading:'กำลังโหลด...',
    subtitle:'การเฝ้าระวังโรคระบาดทั่วโลกแบบเรียลไทม์'
  },
  pl: {
    map:'🗺️ Mapa świata', dash:'📊 Panel', counters:'🔢 Liczniki',
    ai:'🤖 Asystent AI', covid:'🦠 COVID', flu:'🤧 Grypa', diseases:'🦟 Choroby',
    alerts:'⚠️ Alerty', countries:'🌍 Kraje', vaccines:'💉 Szczepionki', economic:'💰 Gospodarka',
    science:'🔬 Nauka', livefeed:'📡 Na żywo', cdc:'🏛️ CDC',
    export:'⬇ Eksportuj dane', search:'Szukaj choroby...', loading:'Ładowanie...',
    subtitle:'Globalny nadzór epidemiczny w czasie rzeczywistym'
  },
  uk: {
    map:'🗺️ Карта світу', dash:'📊 Панель', counters:'🔢 Лічильники',
    ai:'🤖 ШІ-помічник', covid:'🦠 COVID', flu:'🤧 Грип', diseases:'🦟 Хвороби',
    alerts:'⚠️ Сповіщення', countries:'🌍 Країни', vaccines:'💉 Вакцини', economic:'💰 Економіка',
    science:'🔬 Наука', livefeed:'📡 Наживо', cdc:'🏛️ CDC',
    export:'⬇ Експорт даних', search:'Пошук хвороби...', loading:'Завантаження...',
    subtitle:'Глобальний епіднагляд у реальному часі'
  },
  nl: {
    map:'🗺️ Wereldkaart', dash:'📊 Dashboard', counters:'🔢 Tellers',
    ai:'🤖 AI-assistent', covid:'🦠 COVID', flu:'🤧 Griep', diseases:'🦟 Ziekten',
    alerts:'⚠️ Waarschuwingen', countries:'🌍 Landen', vaccines:'💉 Vaccins', economic:'💰 Economie',
    science:'🔬 Wetenschap', livefeed:'📡 Live', cdc:'🏛️ CDC',
    export:'⬇ Gegevens exporteren', search:'Zoek een ziekte...', loading:'Laden...',
    subtitle:'Wereldwijde real-time epidemiebewaking'
  },
  ha: {
    map:'🗺️ Taswirar Duniya', dash:'📊 Dashboard', counters:'🔢 Kantoci',
    ai:'🤖 Mataimakin AI', covid:'🦠 COVID', flu:'🤧 Mura', diseases:'🦟 Cututtuka',
    alerts:'⚠️ Faɗakarwa', countries:'🌍 Ƙasashe', vaccines:'💉 Alluran rigakafi', economic:'💰 Tattalin arziki',
    science:'🔬 Kimiyya', livefeed:'📡 Kai tsaye', cdc:'🏛️ CDC',
    export:'⬇ Fitar da bayanai', search:'Nemi cuta...', loading:'Ana lodi...',
    subtitle:'Sa ido kan annoba a duniya cikin lokaci-lokaci'
  },
  ta: {
    map:'🗺️ உலக வரைபடம்', dash:'📊 டாஷ்போர்டு', counters:'🔢 கவுண்டர்கள்',
    ai:'🤖 AI உதவியாளர்', covid:'🦠 கோவிட்', flu:'🤧 காய்ச்சல்', diseases:'🦟 நோய்கள்',
    alerts:'⚠️ எச்சரிக்கைகள்', countries:'🌍 நாடுகள்', vaccines:'💉 தடுப்பூசிகள்', economic:'💰 பொருளாதாரம்',
    science:'🔬 அறிவியல்', livefeed:'📡 நேரலை', cdc:'🏛️ CDC',
    export:'⬇ தரவை ஏற்றுமதி', search:'நோயைத் தேடு...', loading:'ஏற்றுகிறது...',
    subtitle:'நிகழ்நேர உலகளாவிய தொற்றுநோய் கண்காணிப்பு'
  },
  fil: {
    map:'🗺️ Mapa ng Mundo', dash:'📊 Dashboard', counters:'🔢 Mga Counter',
    ai:'🤖 AI Assistant', covid:'🦠 COVID', flu:'🤧 Trangkaso', diseases:'🦟 Mga Sakit',
    alerts:'⚠️ Mga Alerto', countries:'🌍 Mga Bansa', vaccines:'💉 Mga Bakuna', economic:'💰 Ekonomiya',
    science:'🔬 Agham', livefeed:'📡 Live', cdc:'🏛️ CDC',
    export:'⬇ I-export ang data', search:'Maghanap ng sakit...', loading:'Naglo-load...',
    subtitle:'Real-time na pandaigdigang pagsubaybay sa epidemya'
  },
};

let currentLang = localStorage.getItem('ld_lang') || 'en';

function setLang(l) {
  currentLang = l;
  localStorage.setItem('ld_lang', l);
  document.documentElement.lang = l;
  document.dir = (['ar','ur','fa'].includes(l)) ? 'rtl' : 'ltr';
  applyTranslations();
}

function t(key) {
  return (TRANSLATIONS[currentLang] && TRANSLATIONS[currentLang][key]) ||
         (TRANSLATIONS['en'] && TRANSLATIONS['en'][key]) || key;
}

function applyTranslations() {
  const tr = TRANSLATIONS[currentLang] || TRANSLATIONS['en'];

  // Traduit les onglets (garde le tag LIVE/AI à la fin)
  document.querySelectorAll('[onclick^="goTab"]').forEach(btn => {
    const m = btn.getAttribute('onclick').match(/goTab\('([a-z]+)'/);
    if (m && tr[m[1]]) {
      const tag = btn.querySelector('.ttag');
      btn.childNodes[0].nodeValue = tr[m[1]] + ' ';
    }
  });

  // Traduit les éléments avec data-i18n
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (tr[key]) el.textContent = tr[key];
  });

  if (typeof drawCountryLabels === 'function') drawCountryLabels();

  // Placeholder de recherche
  const search = document.querySelector('input[type="search"], #dis-search, .search input');
  if (search && tr.search) search.placeholder = tr.search;
}

// Applique au chargement
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => setTimeout(() => { setLang(currentLang); }, 500));
} else {
  setTimeout(() => setLang(currentLang), 500);
}

if (typeof window !== 'undefined') {
  window.setLang = setLang;
  window.t = t;
  window.applyTranslations = applyTranslations;
}
