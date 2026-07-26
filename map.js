// ================================================================
// WORLD DISEASE MONITOR — map.js
// Carte mondiale complète avec cercles sur TOUS les pays
// Filtres par maladie → couleurs changent en temps réel
// Assistant IA sur chaque pays au clic
// AUCUN CDN externe nécessaire — fonctionne toujours
// ================================================================

// ─── COORDONNÉES DE TOUS LES PAYS ────────────────────────────────
const CC = {
  // Afrique de l'Ouest
  SN:{n:'Sénégal',lat:14.5,lng:-14.5},ML:{n:'Mali',lat:17.6,lng:-3.9},
  MR:{n:'Mauritanie',lat:20.3,lng:-10.9},GN:{n:'Guinée',lat:11.8,lng:-11.9},
  GM:{n:'Gambie',lat:13.5,lng:-15.5},GW:{n:'Guinée-Bissau',lat:11.8,lng:-15.2},
  SL:{n:'Sierra Leone',lat:8.5,lng:-11.8},LR:{n:'Liberia',lat:6.4,lng:-9.4},
  CI:{n:"Côte d'Ivoire",lat:7.5,lng:-5.6},GH:{n:'Ghana',lat:7.9,lng:-1.0},
  TG:{n:'Togo',lat:8.6,lng:0.8},BJ:{n:'Bénin',lat:9.3,lng:2.3},
  NG:{n:'Nigéria',lat:9.0,lng:8.7},NE:{n:'Niger',lat:17.6,lng:8.1},
  BF:{n:'Burkina Faso',lat:12.4,lng:-1.6},CV:{n:'Cap-Vert',lat:15.1,lng:-23.6},
  // Afrique Centrale
  CM:{n:'Cameroun',lat:3.8,lng:11.5},TD:{n:'Tchad',lat:15.5,lng:18.7},
  CF:{n:'RCA',lat:6.6,lng:20.9},CG:{n:'Congo',lat:-0.2,lng:15.8},
  CD:{n:'RD Congo',lat:-4.0,lng:21.7},GA:{n:'Gabon',lat:-0.8,lng:11.6},
  GQ:{n:'Guinée Éq.',lat:1.7,lng:10.3},ST:{n:'São Tomé',lat:0.2,lng:6.6},
  // Afrique de l'Est
  ET:{n:'Éthiopie',lat:9.1,lng:40.5},SO:{n:'Somalie',lat:5.2,lng:46.2},
  KE:{n:'Kenya',lat:0.0,lng:37.9},TZ:{n:'Tanzanie',lat:-6.4,lng:34.9},
  UG:{n:'Ouganda',lat:1.4,lng:32.3},RW:{n:'Rwanda',lat:-1.9,lng:29.9},
  BI:{n:'Burundi',lat:-3.4,lng:29.9},SS:{n:'Soudan du Sud',lat:6.9,lng:31.3},
  SD:{n:'Soudan',lat:15.6,lng:32.5},ER:{n:'Érythrée',lat:15.2,lng:39.8},
  DJ:{n:'Djibouti',lat:11.8,lng:42.6},
  // Afrique Australe
  AO:{n:'Angola',lat:-11.2,lng:17.9},ZM:{n:'Zambie',lat:-13.1,lng:27.8},
  ZW:{n:'Zimbabwe',lat:-19.0,lng:29.2},MZ:{n:'Mozambique',lat:-18.7,lng:35.5},
  MW:{n:'Malawi',lat:-13.3,lng:34.3},NA:{n:'Namibie',lat:-22.0,lng:17.1},
  BW:{n:'Botswana',lat:-22.3,lng:24.7},ZA:{n:'Afrique du Sud',lat:-30.6,lng:22.9},
  SZ:{n:'Eswatini',lat:-26.5,lng:31.5},LS:{n:'Lesotho',lat:-29.6,lng:28.2},
  MG:{n:'Madagascar',lat:-18.8,lng:46.9},MU:{n:'Maurice',lat:-20.3,lng:57.6},
  // Afrique du Nord
  EG:{n:'Égypte',lat:26.8,lng:30.8},LY:{n:'Libye',lat:26.3,lng:17.2},
  TN:{n:'Tunisie',lat:33.9,lng:9.5},DZ:{n:'Algérie',lat:28.0,lng:1.7},
  MA:{n:'Maroc',lat:31.8,lng:-7.1},
  // Asie du Sud / Sud-Est
  IN:{n:'Inde',lat:20.6,lng:79.0},PK:{n:'Pakistan',lat:29.9,lng:69.3},
  BD:{n:'Bangladesh',lat:23.7,lng:90.4},LK:{n:'Sri Lanka',lat:7.9,lng:80.8},
  NP:{n:'Népal',lat:28.4,lng:84.1},AF:{n:'Afghanistan',lat:33.9,lng:67.7},
  TH:{n:'Thaïlande',lat:15.9,lng:100.9},VN:{n:'Viêt Nam',lat:14.1,lng:108.3},
  PH:{n:'Philippines',lat:12.9,lng:121.8},ID:{n:'Indonésie',lat:-0.8,lng:113.9},
  MY:{n:'Malaisie',lat:2.5,lng:112.5},MM:{n:'Myanmar',lat:17.1,lng:96.1},
  KH:{n:'Cambodge',lat:12.6,lng:104.9},LA:{n:'Laos',lat:17.9,lng:102.5},
  SG:{n:'Singapour',lat:1.4,lng:103.8},TW:{n:'Taïwan',lat:23.7,lng:120.9},
  TL:{n:'Timor-Leste',lat:-8.9,lng:125.7},
  // Asie de l'Est
  CN:{n:'Chine',lat:35.9,lng:104.2},JP:{n:'Japon',lat:36.2,lng:138.3},
  KR:{n:'Corée du Sud',lat:35.9,lng:127.8},KP:{n:'Corée du Nord',lat:40.3,lng:127.5},
  MN:{n:'Mongolie',lat:46.9,lng:103.8},
  // Asie Centrale
  KZ:{n:'Kazakhstan',lat:48.0,lng:66.9},UZ:{n:'Ouzbékistan',lat:41.4,lng:64.6},
  TM:{n:'Turkménistan',lat:38.9,lng:59.6},KG:{n:'Kirghizstan',lat:41.2,lng:74.8},
  TJ:{n:'Tadjikistan',lat:38.9,lng:71.3},
  // Moyen-Orient / Caucase
  IR:{n:'Iran',lat:32.4,lng:53.7},IQ:{n:'Irak',lat:33.2,lng:43.7},
  SY:{n:'Syrie',lat:35.0,lng:38.0},LB:{n:'Liban',lat:33.9,lng:35.9},
  JO:{n:'Jordanie',lat:31.2,lng:36.5},IL:{n:'Israël',lat:31.5,lng:35.0},
  SA:{n:'Arabie Saoudite',lat:24.2,lng:45.1},YE:{n:'Yémen',lat:15.6,lng:48.5},
  OM:{n:'Oman',lat:21.5,lng:55.9},AE:{n:'Émirats',lat:24.5,lng:54.0},
  QA:{n:'Qatar',lat:25.4,lng:51.2},KW:{n:'Koweït',lat:29.3,lng:47.5},
  BH:{n:'Bahreïn',lat:26.0,lng:50.6},TR:{n:'Turquie',lat:38.9,lng:35.2},
  CY:{n:'Chypre',lat:35.1,lng:33.4},GE:{n:'Géorgie',lat:42.3,lng:43.4},
  AM:{n:'Arménie',lat:40.1,lng:45.0},AZ:{n:'Azerbaïdjan',lat:40.1,lng:47.6},
  // Europe
  RU:{n:'Russie',lat:61.5,lng:105.3},UA:{n:'Ukraine',lat:48.4,lng:31.2},
  PL:{n:'Pologne',lat:51.9,lng:19.1},DE:{n:'Allemagne',lat:51.2,lng:10.5},
  FR:{n:'France',lat:46.2,lng:2.2},ES:{n:'Espagne',lat:40.5,lng:-3.7},
  IT:{n:'Italie',lat:41.9,lng:12.6},GB:{n:'Royaume-Uni',lat:55.4,lng:-3.4},
  SE:{n:'Suède',lat:60.1,lng:18.6},NO:{n:'Norvège',lat:60.5,lng:8.5},
  FI:{n:'Finlande',lat:61.9,lng:25.7},DK:{n:'Danemark',lat:56.3,lng:9.5},
  NL:{n:'Pays-Bas',lat:52.1,lng:5.3},BE:{n:'Belgique',lat:50.5,lng:4.5},
  CH:{n:'Suisse',lat:46.8,lng:8.2},AT:{n:'Autriche',lat:47.5,lng:14.6},
  CZ:{n:'Tchéquie',lat:49.8,lng:15.5},SK:{n:'Slovaquie',lat:48.7,lng:19.7},
  HU:{n:'Hongrie',lat:47.2,lng:19.5},RO:{n:'Roumanie',lat:45.9,lng:25.0},
  BG:{n:'Bulgarie',lat:42.7,lng:25.5},RS:{n:'Serbie',lat:44.0,lng:21.0},
  HR:{n:'Croatie',lat:45.1,lng:15.2},GR:{n:'Grèce',lat:39.1,lng:22.0},
  PT:{n:'Portugal',lat:39.4,lng:-8.2},IE:{n:'Irlande',lat:53.4,lng:-8.2},
  LT:{n:'Lituanie',lat:55.2,lng:24.0},LV:{n:'Lettonie',lat:56.9,lng:24.6},
  EE:{n:'Estonie',lat:58.6,lng:25.0},BY:{n:'Biélorussie',lat:53.7,lng:28.0},
  MD:{n:'Moldavie',lat:47.4,lng:28.4},BA:{n:'Bosnie',lat:44.2,lng:17.7},
  ME:{n:'Monténégro',lat:42.7,lng:19.4},MK:{n:'Macédoine',lat:41.6,lng:21.7},
  AL:{n:'Albanie',lat:41.2,lng:20.2},IS:{n:'Islande',lat:65.0,lng:-18.6},
  // Amériques Nord
  US:{n:'États-Unis',lat:37.1,lng:-95.7},CA:{n:'Canada',lat:56.1,lng:-106.3},
  MX:{n:'Mexique',lat:23.6,lng:-102.6},
  // Amériques Centrale & Caraïbes
  GT:{n:'Guatemala',lat:15.8,lng:-90.2},BZ:{n:'Belize',lat:17.2,lng:-88.5},
  HN:{n:'Honduras',lat:15.2,lng:-86.2},SV:{n:'El Salvador',lat:13.8,lng:-88.9},
  NI:{n:'Nicaragua',lat:12.9,lng:-85.2},CR:{n:'Costa Rica',lat:9.7,lng:-83.8},
  PA:{n:'Panama',lat:8.5,lng:-80.8},CU:{n:'Cuba',lat:21.5,lng:-79.5},
  JM:{n:'Jamaïque',lat:18.1,lng:-77.3},HT:{n:'Haïti',lat:19.0,lng:-72.3},
  DO:{n:'RD Dominicaine',lat:18.7,lng:-70.2},
  // Amériques du Sud
  CO:{n:'Colombie',lat:4.6,lng:-74.3},VE:{n:'Venezuela',lat:6.4,lng:-66.6},
  GY:{n:'Guyana',lat:5.0,lng:-59.0},SR:{n:'Suriname',lat:3.9,lng:-56.0},
  BR:{n:'Brésil',lat:-14.2,lng:-51.9},PE:{n:'Pérou',lat:-9.2,lng:-75.0},
  EC:{n:'Équateur',lat:-1.8,lng:-78.2},BO:{n:'Bolivie',lat:-16.3,lng:-63.6},
  PY:{n:'Paraguay',lat:-23.4,lng:-58.4},UY:{n:'Uruguay',lat:-32.5,lng:-55.8},
  AR:{n:'Argentine',lat:-38.4,lng:-63.6},CL:{n:'Chili',lat:-35.7,lng:-71.5},
  // Océanie
  AU:{n:'Australie',lat:-25.3,lng:133.8},NZ:{n:'Nouvelle-Zélande',lat:-40.9,lng:174.9},
  PG:{n:'Papouasie',lat:-6.3,lng:143.9},FJ:{n:'Fidji',lat:-17.7,lng:178.1},
  CA:{n:'Canada',lat:56.1,lng:-106.3},
  ES:{n:'Espagne',lat:40.5,lng:-3.7},
  DE:{n:'Allemagne',lat:51.2,lng:10.5},
  GB:{n:'Royaume-Uni',lat:55.4,lng:-3.4},
  JP:{n:'Japon',lat:36.2,lng:138.3},
  PK:{n:'Pakistan',lat:29.9,lng:69.3},
  ID:{n:'Indonésie',lat:-0.8,lng:113.9},
  VN:{n:'Viêt Nam',lat:14.1,lng:108.3},
  UA:{n:'Ukraine',lat:48.4,lng:31.2},
  RO:{n:'Roumanie',lat:45.9,lng:25.0},
  BE:{n:'Belgique',lat:50.5,lng:4.5},
  AT:{n:'Autriche',lat:47.5,lng:14.6},
  GR:{n:'Grèce',lat:39.1,lng:22.0},
  NO:{n:'Norvège',lat:60.5,lng:8.5},
  DK:{n:'Danemark',lat:56.3,lng:9.5},
  IE:{n:'Irlande',lat:53.4,lng:-8.2},
  SK:{n:'Slovaquie',lat:48.7,lng:19.7},
  RS:{n:'Serbie',lat:44.0,lng:21.0},
  BA:{n:'Bosnie',lat:44.2,lng:17.7},
  MK:{n:'Macédoine',lat:41.6,lng:21.7},
  LV:{n:'Lettonie',lat:56.9,lng:24.6},
  BY:{n:'Biélorussie',lat:53.7,lng:28.0},
  IS:{n:'Islande',lat:65.0,lng:-18.6},
  LU:{n:'Luxembourg',lat:49.8,lng:6.1},
  MT:{n:'Malte',lat:35.9,lng:14.4},
  GE:{n:'Géorgie',lat:42.3,lng:43.4},
  AZ:{n:'Azerbaïdjan',lat:40.1,lng:47.6},
  UZ:{n:'Ouzbékistan',lat:41.4,lng:64.6},
  KG:{n:'Kirghizstan',lat:41.2,lng:74.8},
  AF:{n:'Afghanistan',lat:33.9,lng:67.7},
  LK:{n:'Sri Lanka',lat:7.9,lng:80.8},
  MM:{n:'Myanmar',lat:17.1,lng:96.1},
  LA:{n:'Laos',lat:17.9,lng:102.5},
  TW:{n:'Taïwan',lat:23.7,lng:120.9},
  KP:{n:'Corée du Nord',lat:40.3,lng:127.5},
  BT:{n:'Bhoutan',lat:27.5,lng:90.4},
  IQ:{n:'Irak',lat:33.2,lng:43.7},
  LB:{n:'Liban',lat:33.9,lng:35.9},
  IL:{n:'Israël',lat:31.5,lng:35.0},
  AE:{n:'Émirats',lat:24.5,lng:54.0},
  KW:{n:'Koweït',lat:29.3,lng:47.5},
  YE:{n:'Yémen',lat:15.6,lng:48.5},
  TR:{n:'Turquie',lat:38.9,lng:35.2},
  NE:{n:'Niger',lat:17.6,lng:8.1},
  ML:{n:'Mali',lat:17.6,lng:-3.9},
  GN:{n:'Guinée',lat:11.8,lng:-11.9},
  GH:{n:'Ghana',lat:7.9,lng:-1.0},
  BJ:{n:'Bénin',lat:9.3,lng:2.3},
  TD:{n:'Tchad',lat:15.5,lng:18.7},
  CG:{n:'Congo',lat:-0.2,lng:15.8},
  GA:{n:'Gabon',lat:-0.8,lng:11.6},
  GW:{n:'Guinée-Bissau',lat:11.8,lng:-15.2},
  LR:{n:'Liberia',lat:6.4,lng:-9.4},
  SS:{n:'Soudan du Sud',lat:6.9,lng:31.3},
  SO:{n:'Somalie',lat:5.2,lng:46.2},
  ER:{n:'Érythrée',lat:15.2,lng:39.8},
  RW:{n:'Rwanda',lat:-1.9,lng:29.9},
  ZM:{n:'Zambie',lat:-13.1,lng:27.8},
  MZ:{n:'Mozambique',lat:-18.7,lng:35.5},
  NA:{n:'Namibie',lat:-22.0,lng:17.1},
  ZA:{n:'Afrique du Sud',lat:-30.6,lng:22.9},
  LS:{n:'Lesotho',lat:-29.6,lng:28.2},
  TZ:{n:'Tanzanie',lat:-6.4,lng:34.9},
  LY:{n:'Libye',lat:26.3,lng:17.2},
  DZ:{n:'Algérie',lat:28.0,lng:1.7},
  CV:{n:'Cap-Vert',lat:15.1,lng:-23.6},
  MU:{n:'Maurice',lat:-20.3,lng:57.6},
  PE:{n:'Pérou',lat:-9.2,lng:-75.0},
  VE:{n:'Venezuela',lat:6.4,lng:-66.6},
  BO:{n:'Bolivie',lat:-16.3,lng:-63.6},
  UY:{n:'Uruguay',lat:-32.5,lng:-55.8},
  CL:{n:'Chili',lat:-35.7,lng:-71.5},
  CR:{n:'Costa Rica',lat:9.7,lng:-83.8},
  CU:{n:'Cuba',lat:21.5,lng:-79.5},
  HT:{n:'Haïti',lat:19.0,lng:-72.3},
  SV:{n:'El Salvador',lat:13.8,lng:-88.9},
  BZ:{n:'Belize',lat:17.2,lng:-88.5},
  SR:{n:'Suriname',lat:3.9,lng:-56.0},
  NZ:{n:'Nouvelle-Zélande',lat:-40.9,lng:174.9},
  FJ:{n:'Fidji',lat:-17.7,lng:178.1},
  BN:{n:'Brunei',lat:4.5,lng:114.7},
  MV:{n:'Maldives',lat:3.2,lng:73.2},
  AD:{n:'Andorre',lat:42.5,lng:1.5},
  AG:{n:'Antigua-et-Barbuda',lat:17.1,lng:-61.8},
  BS:{n:'Bahamas',lat:25.0,lng:-77.4},
  BB:{n:'Barbade',lat:13.2,lng:-59.5},
  KM:{n:'Comores',lat:-11.9,lng:43.9},
  DM:{n:'Dominique',lat:15.4,lng:-61.4},
  GD:{n:'Grenade',lat:12.1,lng:-61.7},
  KI:{n:'Kiribati',lat:-3.4,lng:-168.7},
  LI:{n:'Liechtenstein',lat:47.2,lng:9.5},
  MH:{n:'Îles Marshall',lat:7.1,lng:171.2},
  FM:{n:'Micronésie',lat:7.4,lng:150.5},
  MC:{n:'Monaco',lat:43.7,lng:7.4},
  NR:{n:'Nauru',lat:-0.5,lng:166.9},
  PW:{n:'Palaos',lat:7.5,lng:134.6},
  PS:{n:'Palestine',lat:31.9,lng:35.2},
  KN:{n:'Saint-Kitts-et-Nevis',lat:17.3,lng:-62.7},
  LC:{n:'Sainte-Lucie',lat:13.9,lng:-61.0},
  VC:{n:'Saint-Vincent',lat:13.3,lng:-61.2},
  WS:{n:'Samoa',lat:-13.8,lng:-172.1},
  SM:{n:'Saint-Marin',lat:43.9,lng:12.5},
  ST:{n:'Sao Tomé-et-Principe',lat:0.2,lng:6.6},
  SC:{n:'Seychelles',lat:-4.7,lng:55.5},
  SI:{n:'Slovénie',lat:46.2,lng:14.8},
  SB:{n:'Îles Salomon',lat:-9.6,lng:160.2},
  TO:{n:'Tonga',lat:-21.2,lng:-175.2},
  TT:{n:'Trinité-et-Tobago',lat:10.7,lng:-61.2},
  TV:{n:'Tuvalu',lat:-7.1,lng:177.6},
  VU:{n:'Vanuatu',lat:-15.4,lng:166.9},
};

// ─── MALADIES PAR PAYS ────────────────────────────────────────────
const DC = {
  dengue:   ['BR','CO','VE','PE','EC','BO','PY','CR','PA','HN','GT','NI','SV','MX','DO','JM','CU','HT','IN','TH','VN','PH','ID','MY','MM','BD','LK','KH','LA','SG','TW','NG','GH','CI','CM','TZ','KE','SN','ML','BF','BJ','TG','NE','CF','CD','GN','SL','LR','GM','AU','FJ','PG','TL'],
  mpox:     ['CD','NG','CM','CF','CG','GH','CI','TZ','KE','SN','ML','GN','RW','UG','BI','ZM','US','CA','GB','FR','DE','ES','IT','BE','NL','SE','PT','BR','TH','IN','MY','SG'],
  h5n1:     ['US','CA','MX','IN','VN','TH','ID','PH','MY','BD','EG','SD','NG','GH','CM','CN','JP','KR','MN','KZ','RU','FR','DE','GB','NL','BE','PL','CZ','RO','UA'],
  cholera:  ['HT','SO','SY','YE','AF','SD','SS','ET','NG','CD','ZM','MW','TZ','MZ','GH','CM','IQ','LB','SL','GN','GW','LR','SN','ML','NE','CF','CG','AO','KE','UG','ER','DJ'],
  covid19:  ['US','BR','IN','FR','DE','GB','IT','ES','RU','TR','AR','CO','MX','PL','PH','ID','UA','PE','CH','NL','AU','BE','AT','CZ','RO','HU','SE','PT','CL','VN','BD','TH','MY','CA','SG','ZA','TN','MA','EG','DZ','KE','NG','SN','CM','GH','JP','KR','CN','IR','SA','AE','OM','QA','KW'],
  measles:  ['NG','ET','CD','SD','SS','SO','CF','ML','NE','BF','CM','GN','GW','SL','LR','TG','BJ','YE','AF','PK','IN','PH','ID','BD','MM','UA','RO','SY','IQ'],
  malaria:  ['NG','CD','ET','MZ','TZ','UG','KE','ML','CM','GH','BF','MR','GN','SN','CI','TG','BJ','NE','CF','CG','AO','ZM','ZW','MW','MG','SS','SD','BI','RW','IN','MM','TH','ID','PG','PH','MY','BD','PK','AF','GW','SL','LR','GM','DJ','ER'],
  tb:       ['IN','PH','PK','NG','BD','CN','RU','UA','CD','TZ','ET','ZA','MZ','ZM','MW','AO','MM','VN','TH','ID','MY','KH','LA','KZ','UZ','TM','KG','TJ','GE','AZ','AM','PE','BR','CO','BO','EC','GN','SL','LR','SN','ML','GH','CM'],
  marburg:  ['TZ','CD'],
  nipah:    ['IN','BD','MY'],
  hiv:      ['ZA','MZ','ZW','ZM','MW','TZ','UG','KE','RW','BI','CD','ET','NG','CM','CI','GH','SN','ML','TH','IN','MM','VN','ID','PH','RU','UA','BY','MD','US','CA','BR','CO','PE','GN','SL','LR'],
  amr:      ['IN','PK','BD','PH','VN','TH','ID','MY','CN','KZ','UZ','RU','UA','NG','ET','KE','TZ','ZA','EG','US','BR','TR','IR','DE','FR','GB','IT','ES'],
  candida:  ['US','CA','GB','DE','FR','IT','ES','IN','ZA','SG','AU','BR','CO','MX','TR'],
  influenza:['US','CA','BR','MX','AR','CL','FR','DE','GB','IT','ES','RU','AU','NZ','JP','KR','CN','IN','TH','ID','PH','VN','SG','ZA','NG','EG','MA','TN','TZ','KE','UA','PL'],
  hantavirus:['US','CA','CL','AR','BR','PE','BO','DE','FR','SE','FI','NO','RU','BY','UA','SK','CZ','CN','KR','JP','KZ','MN'],
  ebola:    ['CD','CG','SS','GA','GQ','GN','SL','LR','NG'],
  pertussis:['PH','CN','IN','AU','NZ','US','CA','GB','FR','DE','IT','ES','BR','AR','CO','MX','ID','JP','KR','SG','TH','VN','BD','PK','NG','ET','KE','ZA'],
  zika:     ['BR','CO','VE','PE','EC','GT','HN','SV','NI','CR','PA','DO','JM','CU','HT','MX','TH','ID','PH','SG','MY','VN','MM','IN','BD'],
  yellow_fever:['NG','CD','CI','GH','CM','SN','ML','GN','SL','LR','BF','TG','BJ','NE','CF','CG','AO','ZM','ET','SD','UG','KE','TZ','BR','CO','PE','EC','BO','VE','GY','SR','GM','GW'],
  lassa:    ['NG','SL','GN','LR','CI','ML','GH','SN','BF','BJ','TG'],
  mers:     ['SA','AE','QA','KW','OM','BH','JO','LB','YE','KR','GB','FR','DE','IT','AT','NL'],
  rabies:   ['IN','PK','CN','PH','BD','ID','VN','ET','SD','NG','MM','TH','MY','KH','LA','NP','AF','PE','BO','EC','MX','GT','HN','NI','SV'],
  chikungunya:['IN','TH','ID','PH','MY','SG','VN','MM','LK','MV','MG','BR','CO','VE','PE','EC','GT','HN','SV','PA','DO','JM','CU','HT','IT','FR','ES','PT','GR','CM','CI','GH','NG','TZ','KE','SN'],
  hep_b:    ['CN','IN','ID','PH','VN','TH','MM','KH','LA','BD','PK','MN','NG','ET','CD','GH','CM','SN','ML','CI','GN','TG','BJ','NE','KE','TZ','ZA','EG','MA','DZ','TN','SD','SA','TR','UA','RU','KZ'],
  polio:    ['PK','AF','NG','SS','CD','ET','UA','SY','IQ','YE','SD','SO'],
  meningitis:['NG','ML','BF','NE','GH','CM','TD','CF','SD','SS','ET','KE','TZ','SN','GN','SL','LR','GM'],
};

// ─── COULEURS PAR MALADIE ─────────────────────────────────────────
const DC_COLORS = {
  dengue:'#ef4444',mpox:'#f97316',h5n1:'#f59e0b',cholera:'#06b6d4',
  covid19:'#8b5cf6',measles:'#ec4899',malaria:'#10b981',tb:'#94a3b8',
  marburg:'#dc2626',nipah:'#7c3aed',hiv:'#e11d48',amr:'#be185d',
  candida:'#d97706',influenza:'#0891b2',hantavirus:'#4c1d95',ebola:'#991b1b',
  pertussis:'#0f766e',zika:'#0ea5e9',yellow_fever:'#ca8a04',lassa:'#b45309',
  mers:'#854d0e',rabies:'#a855f7',chikungunya:'#f472b6',hep_b:'#d97706',
  polio:'#0284c7',meningitis:'#7c2d12',
};

// Priorité pour le mode "toutes" (la pire maladie gagne)


// ─── POPULATION PAR PAYS (millions) — pour dimensionner maladies mondiales ─
const POP = {
  CN:1412,IN:1417,US:339,ID:277,PK:240,NG:223,BR:216,BD:172,RU:144,MX:128,
  JP:124,ET:126,PH:117,EG:112,CD:102,VN:98,IR:89,TR:85,DE:84,TH:72,
  GB:67,FR:68,IT:59,ZA:60,TZ:67,MM:54,KE:55,KR:52,CO:52,ES:48,
  UG:48,AR:46,DZ:45,SD:48,UA:37,IQ:44,AF:42,PL:38,CA:39,MA:37,
  SA:36,UZ:35,PE:34,AO:36,MY:34,GH:34,MZ:33,YE:34,NP:30,VE:28,
  MG:30,CM:28,CI:28,NE:26,AU:26,LK:22,BF:22,ML:22,SY:22,MW:20,
  ZM:20,KZ:19,TD:18,CL:19,RO:19,SN:17,GT:18,NL:17,EC:18,KH:17,
  ZW:16,GN:14,RW:14,BJ:13,BI:12,TN:12,BO:12,BE:12,HT:11,CU:11,
  JO:11,DO:11,CZ:11,GR:10,PT:10,SE:10,AZ:10,HN:10,HU:10,TJ:10,
  BY:9,AT:9,IL:9,PG:10,TG:9,CH:9,SL:8,LA:8,LY:7,KG:7,
  NI:7,PY:7,BG:6,RS:7,SV:6,DK:6,FI:6,SG:6,LB:6,NO:5,
  CF:5,OM:5,IE:5,NZ:5,LR:5,MR:5,PA:4,KW:4,HR:4,GE:4,
  ER:4,MN:3,AM:3,UY:3,BA:3,QA:3,MD:3,NA:3,GM:3,BW:3,
  GA:2,LS:2,MK:2,SS:11,SO:18,GW:2,GQ:2,MU:1,SZ:1,DJ:1,
  TL:1,BT:1,CY:1,ME:1,LU:1,MT:1,IS:1,CV:1,BN:1,MV:1,BZ:1,SR:1,FJ:1,CG:6,TM:6,UZ:35,
};

// Génère des poids de cas pour une maladie mondiale selon la population
// et le taux d'incidence de la maladie
function globalWeightsFor(diseaseId, yearlyIncidence) {
  const weights = {};
  const totalPop = Object.values(POP).reduce((s,p) => s+p, 0);
  Object.keys(CC).forEach(iso2 => {
    const pop = POP[iso2] || 2; // défaut 2M si inconnu
    // Cas proportionnels à la population + variation régionale
    const share = pop / totalPop;
    weights[iso2] = Math.max(50, Math.round(yearlyIncidence * share));
  });
  return weights;
}

// ─── MALADIES MONDIALES (présentes dans TOUS les pays) ───────────
// Ces maladies existent partout — pas de pays épargné
const GLOBAL_DISEASES = [
  'hiv',        // VIH : tous les pays
  'tb',         // Tuberculose : tous les pays
  'influenza',  // Grippe : tous les pays
  'covid19',    // COVID : tous les pays
  'hep_b',      // Hépatite B : tous les pays
  'hepatitis_a','hepatitis_c','hepatitis_e',
  'measles',    // Rougeole : partout où couverture vaccinale imparfaite
  'pertussis',  // Coqueluche : tous les pays
  'rsv',        // VRS : tous les pays
  'rotavirus',  // Rotavirus : tous les pays
  'norovirus',  // Norovirus : tous les pays
  'pneumococcus','hib',
  'amr',        // Résistance antimicrobienne : tous les pays
  'rabies',     // Rage : quasi tous les pays
  'tetanus',    // Tétanos : tous les pays
  'candida',    // Candida auris : hôpitaux partout
  'group_a_strep',
  'hpv',        // HPV : tous les pays
];

// Retourne TOUS les pays (pour maladies mondiales)
function allCountries() {
  return Object.keys(CC);
}

// ─── GÉNÉRATION AUTO couleurs + pays pour TOUTES les maladies ────
// Complète DC_COLORS et DC depuis DB pour les maladies sans données carte
function completeDiseaseMapData() {
  if (typeof DB === 'undefined') return;
  DB.diseases.forEach(d => {
    // Couleur : depuis DB si absente
    if (!DC_COLORS[d.id]) {
      DC_COLORS[d.id] = d.color || '#64748b';
    }
    // MALADIES MONDIALES : présentes dans TOUS les pays
    if (GLOBAL_DISEASES.includes(d.id) || (d.regions && d.regions.some(r => r.toLowerCase().includes('mondial')))) {
      DC[d.id] = allCountries();
      // Génère les poids de cas proportionnels à la population
      if (typeof DISEASE_CASE_WEIGHTS !== 'undefined') {
        const yearly = (typeof YEARLY_INCIDENCE !== 'undefined' && YEARLY_INCIDENCE[d.id]) ? YEARLY_INCIDENCE[d.id] : d.cases;
        DISEASE_CASE_WEIGHTS[d.id] = globalWeightsFor(d.id, yearly);
      }
    }
    // Pays : si absent, génère depuis les régions
    else if (!DC[d.id] || DC[d.id].length === 0) {
      DC[d.id] = regionsToCountries(d.regions || []);
    }
  });
}

// Convertit les régions OMS en liste de pays ISO2
function regionsToCountries(regions) {
  const regionMap = {
    'Afrique': ['NG','ET','CD','TZ','KE','UG','GH','CM','ML','SN','CI','BF','NE','ZM','ZW','MZ','AO','MW','MG','RW','BI','SD','SS','SO','TD','CF','CG','GA','GN','SL','LR','TG','BJ','MR','GM','GW','ER','DJ','NA','BW','SZ','LS','ZA'],
    'Afrique sub': ['NG','ET','CD','TZ','KE','UG','GH','CM','ML','SN','CI','BF','NE','ZM','ZW','MZ','AO','MW','MG','RW','BI','SS','GN','SL','LR','TG','BJ'],
    'Afrique de l': ['NG','GH','CI','ML','SN','BF','NE','GN','SL','LR','TG','BJ','MR','GM','GW'],
    'Afrique centrale': ['CD','CM','CF','CG','GA','GQ','TD','AO'],
    'Afrique de l\'Est': ['ET','KE','TZ','UG','RW','BI','SS','SO','ER','DJ'],
    'Amériques': ['US','CA','MX','BR','CO','AR','PE','VE','CL','EC','BO','PY','UY','GT','HN','NI','CR','PA','CU','DO','HT','JM','GY','SR'],
    'Amérique': ['US','CA','MX','BR','CO','AR','PE','VE','CL','EC','BO','PY'],
    'Asie': ['CN','IN','ID','PK','BD','JP','PH','VN','TH','MM','KR','MY','NP','LK','KH','LA','AF','MN','KZ','UZ','SG','TW'],
    'Asie du Sud': ['IN','PK','BD','NP','LK','AF','BT'],
    'Asie SE': ['ID','PH','VN','TH','MM','MY','KH','LA','SG','TL'],
    'Asie Sud': ['IN','PK','BD','NP','LK','AF'],
    'Asie Est': ['CN','JP','KR','MN','TW'],
    'Europe': ['DE','FR','GB','IT','ES','PL','RO','NL','BE','CZ','GR','PT','SE','HU','AT','CH','BG','RS','HR','UA','RU','BY','SK','FI','NO','DK','IE','LT','LV','EE','MD'],
    'Moyen-Orient': ['SA','AE','QA','KW','OM','BH','JO','LB','YE','IQ','IR','SY','IL','TR'],
    'Océanie': ['AU','NZ','PG','FJ'],
    'Mondial': ['US','CN','IN','BR','RU','FR','DE','GB','ID','NG','JP','ET','PH','EG','VN','CD','TR','IR','TH','ZA','KE','IT','ES','MX','CO','AR','PL','UA','SD','SN'],
  };

  const countries = new Set();
  regions.forEach(r => {
    // Cherche correspondance partielle
    for (const [key, list] of Object.entries(regionMap)) {
      if (r.includes(key) || key.includes(r.split(' ')[0])) {
        list.forEach(c => countries.add(c));
      }
    }
  });

  // Si aucune correspondance, met quelques pays par défaut
  if (countries.size === 0) {
    ['NG','IN','BR','CD','ET','ID'].forEach(c => countries.add(c));
  }

  return Array.from(countries);
}

const PRIORITY = ['marburg','nipah','h5n1','ebola','mpox','cholera','lassa','yellow_fever',
  'malaria','measles','dengue','tb','hiv','pertussis','meningitis','hantavirus',
  'covid19','mers','amr','candida','influenza','polio','zika','chikungunya','hep_b','rabies'];

// ─── ÉTAT ─────────────────────────────────────────────────────────
let MAP = null;
let activeDis = 'all';
let circles = {};   // iso2 → L.circle
let mapReady = false;

// ─── INIT MAP ─────────────────────────────────────────────────────
function initMapFull() {
  const panel = document.getElementById('panel-map');
  if (!panel) return;

  const h = window.innerHeight - 50 - 24 - 37 - 20;
  panel.style.cssText = `padding:8px;height:${h}px;box-sizing:border-box`;

  panel.innerHTML = `
  <div style="display:flex;gap:8px;height:100%">

    <!-- FILTRE GAUCHE -->
    <div style="width:175px;flex-shrink:0;background:var(--card);border:1px solid var(--brd);border-radius:var(--r);display:flex;flex-direction:column;overflow:hidden">
      <div style="padding:7px 8px 5px;border-bottom:1px solid var(--brd);flex-shrink:0">
        <div style="font-size:8px;font-weight:700;text-transform:uppercase;color:var(--t2);margin-bottom:4px">🎨 Filtrer par maladie</div>
        <input oninput="filterMapSearch(this.value)" placeholder="Chercher..." style="width:100%;background:var(--bg3);border:1px solid var(--brd);color:var(--t1);padding:3px 6px;border-radius:4px;font-size:8px;outline:none"/>
      </div>
      <div id="dis-filter-list" style="flex:1;overflow-y:auto;padding:4px 5px"></div>
    </div>

    <!-- CARTE CENTRALE -->
    <div style="flex:1;position:relative;border-radius:var(--r);overflow:hidden;border:1px solid var(--brd)">
      <div id="the-map" style="width:100%;height:100%"></div>
      <!-- LÉGENDE -->
      <div id="map-legend" style="position:absolute;bottom:9px;left:9px;z-index:500;background:rgba(5,8,15,.93);border:1px solid rgba(255,255,255,.08);border-radius:7px;padding:7px 10px;backdrop-filter:blur(4px);max-width:160px"></div>
    </div>

    <!-- PANNEAU DROIT -->
    <div style="width:215px;flex-shrink:0;display:flex;flex-direction:column;gap:6px;overflow-y:auto">

      <!-- Assistant IA carte -->
      <div style="background:var(--card);border:1px solid var(--brd);border-radius:var(--r);padding:8px;flex-shrink:0">
        <div style="font-size:9px;font-weight:700;color:var(--oral);margin-bottom:5px" id="map-dis-title">🌍 Toutes les maladies</div>
        <div style="display:flex;gap:3px;margin-bottom:6px;flex-wrap:wrap">
          <button onclick="if(typeof loadWHODiseaseMap==='function')loadWHODiseaseMap();if(typeof buildMapFromReliefWeb==='function')buildMapFromReliefWeb();if(typeof loadDelphiDengue==='function')loadDelphiDengue();" style="background:rgba(34,197,94,.1);border:1px solid rgba(34,197,94,.25);color:#22c55e;font-size:8px;padding:3px 8px;border-radius:4px;cursor:pointer;font-weight:600;flex:1">🌍 Charger vraies données OMS/ONU</button>
        </div>
        <div style="display:flex;gap:3px;margin-bottom:6px">
          <button id="view-pays-btn" onclick="setMapView('pays')" style="background:rgba(20,184,166,.15);border:1px solid rgba(20,184,166,.3);color:#5eead4;font-size:8px;padding:3px 8px;border-radius:4px;cursor:pointer;font-weight:600;flex:1">📍 Par pays</button>
          <button id="view-region-btn" onclick="setMapView('region')" style="background:rgba(100,116,139,.1);border:1px solid rgba(100,116,139,.2);color:#94a3b8;font-size:8px;padding:3px 8px;border-radius:4px;cursor:pointer;font-weight:600;flex:1">🌍 Par division régionale</button>
        </div>
        <div id="map-ai-btns" style="display:flex;flex-direction:column;gap:3px;margin-bottom:5px"></div>
        <div id="map-ai-txt" style="display:none;font-size:9px;color:var(--t2);line-height:1.6;border-top:1px solid var(--brd);padding-top:5px;margin-top:3px"></div>
      </div>

      <!-- Alertes -->
      <div style="background:var(--card);border:1px solid var(--brd);border-radius:var(--r);padding:8px">
        <div style="font-size:7px;font-weight:700;text-transform:uppercase;color:var(--t2);margin-bottom:5px">⚡ Alertes OMS</div>
        <div id="m-alerts"></div>
      </div>

      <!-- COVID live -->
      <div style="background:var(--card);border:1px solid var(--brd);border-radius:var(--r);padding:8px">
        <div style="font-size:7px;font-weight:700;text-transform:uppercase;color:var(--t2);margin-bottom:5px">🦠 COVID <span style="background:rgba(34,197,94,.1);color:#86efac;border:1px solid rgba(34,197,94,.18);padding:1px 4px;border-radius:3px;font-size:7px;font-weight:700">LIVE</span></div>
        <div id="m-covid"><div style="display:flex;align-items:center;justify-content:center;padding:10px"><div style="width:16px;height:16px;border:2px solid rgba(255,255,255,.1);border-top-color:#14b8a6;border-radius:50%;animation:spin .7s linear infinite"></div></div></div>
      </div>

      <!-- Stats -->
      <div style="background:var(--card);border:1px solid var(--brd);border-radius:var(--r);padding:8px">
        <div style="font-size:7px;font-weight:700;text-transform:uppercase;color:var(--t2);margin-bottom:5px">📈 Stats globales</div>
        <div id="m-stats"></div>
      </div>

    </div>
  </div>`;

  // Init Leaflet
  MAP = L.map('the-map', {
    zoomControl: true, attributionControl: false,
    minZoom: 2, maxZoom: 10,
    scrollWheelZoom: false, doubleClickZoom: true,
    dragging: true, inertia: true, inertiaDeceleration: 2000,
    touchZoom: true, tap: true, tapTolerance: 15,
    worldCopyJump: false, bounceAtZoomLimits: false,
    maxBounds: [[-85, -180], [85, 180]], maxBoundsViscosity: 0.3
  });

  // Fond de carte : Carto Voyager (naturel, clair, noms lisibles — la belle carte)
  const tileLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager_nolabels/{z}/{x}/{y}{r}.png', {
    maxZoom: 18, noWrap: true, subdomains: 'abcd', attribution: ''
  });
  tileLayer.addTo(MAP);

  // Si Carto échoue, bascule sur OpenStreetMap
  tileLayer.on('tileerror', function() {
    if (!window._tileFallbackDone) {
      window._tileFallbackDone = true;
      MAP.removeLayer(tileLayer);
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 18, noWrap: true, attribution: ''
      }).addTo(MAP);
    }
  });

  // Affiche le monde entier d'emblée
  MAP.setView([15, 5], 3);
  MAP.zoomControl.setPosition('bottomright');

  mapReady = true;
  // Redessine les noms de pays à chaque zoom (anti-chevauchement adaptatif)
  MAP.on('zoomend moveend', function(){ if(typeof drawCountryLabels==='function') drawCountryLabels(); });

  // IMPORTANT : remplit d'abord les pays de chaque maladie
  if (typeof completeDiseaseMapData === 'function') completeDiseaseMapData();

  // Dessine immédiatement les cercles
  drawAllCircles();
  if(typeof drawCountryLabels==='function') drawCountryLabels();
  // Garantit l'affichage des noms après chargement complet
  setTimeout(function(){ if(typeof drawCountryLabels==='function') drawCountryLabels(); }, 1500);
  buildFilterList();
  buildLegend();
  renderMapAIBtns();
  renderMapSide();

  window.addEventListener('resize', () => {
    const h2 = window.innerHeight - 50 - 24 - 37 - 20;
    if (panel) panel.style.height = h2 + 'px';
    if (MAP) MAP.invalidateSize();
  });
  setTimeout(() => { if (MAP) MAP.invalidateSize(); }, 200);
}

// ─── DESSINE TOUS LES CERCLES ─────────────────────────────────────
function drawAllCircles() {
  if (!MAP || !mapReady) return;

  // Efface tout
  Object.values(circles).forEach(c => MAP.removeLayer(c));
  circles = {};

  // Fonction taille cercle selon nombre de cas
  const weights = (typeof DISEASE_CASE_WEIGHTS !== 'undefined') ? DISEASE_CASE_WEIGHTS : {};

  // Calcule le MAX de la maladie affichée pour une échelle RELATIVE
  let scaleMax = 0;
  if (activeDis !== 'all' && weights[activeDis]) {
    Object.values(weights[activeDis]).forEach(v => { if (v > scaleMax) scaleMax = v; });
  } else {
    // Vue "toutes maladies" : max global
    Object.keys(weights).forEach(d => {
      Object.values(weights[d]).forEach(v => { if (v > scaleMax) scaleMax = v; });
    });
  }
  if (scaleMax < 1) scaleMax = 1;

  // Taille RELATIVE : le plus gros pays = maxR, les autres proportionnels
  function radiusForCases(cases) {
    if (!cases || cases < 1) return 3;
    const minR = 3.5;
    const maxR = (activeDis === 'all') ? 20 : 22;
    const ratio = Math.log10(cases + 1) / Math.log10(scaleMax + 1);
    const r = minR + (maxR - minR) * Math.pow(Math.max(0, Math.min(1, ratio)), 2.2);
    return Math.max(minR, Math.min(maxR, r));
  }

  // ─── MODE PAR RÉGION : agrège les cas par région, un gros cercle par région ──
  if (typeof mapViewMode !== 'undefined' && mapViewMode === 'region' && typeof REGION_CENTERS !== 'undefined') {
    const regionTotals = {}; // { region: { cases, color, diseases } }

    Object.entries(REGION_CENTERS).forEach(([region, rdata]) => {
      let totalCases = 0;
      let worstColor = null;
      const diseaseSet = new Set();

      rdata.countries.forEach(iso2 => {
        if (activeDis === 'all') {
          for (const disId of PRIORITY) {
            if (DC[disId] && DC[disId].includes(iso2)) {
              if (!worstColor) worstColor = DC_COLORS[disId];
              const w = weights[disId] && weights[disId][iso2] ? weights[disId][iso2] : 5000;
              totalCases += w;
              diseaseSet.add(disId);
            }
          }
          const cv = (typeof cvData !== 'undefined') ? cvData.find(x => x.countryInfo?.iso2 === iso2) : null;
          if (cv && cv.active) totalCases += cv.active;
        } else {
          if (DC[activeDis] && DC[activeDis].includes(iso2)) {
            worstColor = DC_COLORS[activeDis];
            const w = weights[activeDis] && weights[activeDis][iso2] ? weights[activeDis][iso2] : 5000;
            totalCases += w;
            diseaseSet.add(activeDis);
          }
        }
      });

      if (totalCases > 0 && worstColor) {
        regionTotals[region] = { cases: totalCases, color: worstColor, diseases: [...diseaseSet], center: rdata };
      }
    });

    // Dessine un gros cercle par région
    Object.entries(regionTotals).forEach(([region, data]) => {
      const c = L.circleMarker([data.center.lat, data.center.lng], {
        radius: Math.max(8, Math.min(32, Math.log10(data.cases + 1) * 4.2)),
        color: data.color, fillColor: data.color,
        fillOpacity: 0.4, weight: 2, opacity: 0.9
      }).addTo(MAP);
      c.bindTooltip(`<div style="font-size:10px"><b>🌍 ${region}</b><br><span style="font-size:9px;color:#fdba74">≈ ${data.cases.toLocaleString('fr-FR')} cas</span><br><span style="font-size:8px;opacity:.8">${data.diseases.length} maladie(s) · ${data.center.countries.length} pays</span></div>`, { sticky: true, className: 'map-tip', offset: [0, -4] });
      circles['region-' + region] = c;
    });

    return; // Mode région terminé
  }

  if (activeDis === 'all') {
    // Mode toutes : chaque pays = cercle dimensionné par le total de tous ses cas
    Object.keys(CC).forEach(iso2 => {
      const coord = CC[iso2];
      if (!coord) return;

      // Trouve la pire maladie (couleur) + total cas tous confondus
      let worstColor = null;
      let totalCases = 0;
      let diseaseList = [];

      for (const disId of PRIORITY) {
        if (DC[disId] && DC[disId].includes(iso2)) {
          if (!worstColor) worstColor = DC_COLORS[disId];
          const w = weights[disId] && weights[disId][iso2] ? weights[disId][iso2] : 5000;
          totalCases += w;
          diseaseList.push(disId);
        }
      }

      // Ajoute COVID temps réel
      const cv = (typeof cvData !== 'undefined') ? cvData.find(x => x.countryInfo?.iso2 === iso2) : null;
      if (cv && cv.active) totalCases += cv.active;

      if (!worstColor && !cv) return; // pas de maladie = pas de cercle

      const color = worstColor || DC_COLORS.covid19;
      const c = L.circleMarker([coord.lat, coord.lng], {
        radius: radiusForCases(totalCases),
        color: color, fillColor: color,
        fillOpacity: 0.32, weight: 1.2, opacity: 0.75
      }).addTo(MAP);

      c.bindTooltip(`<div style="font-size:10px"><b>${coord.n}</b><br><span style="font-size:9px;color:#fdba74">≈ ${totalCases.toLocaleString('fr-FR')} cas (toutes maladies)</span>${diseaseList.length ? '<br><span style="font-size:8px;opacity:.8">' + diseaseList.slice(0,5).map(d => `<span style="color:${DC_COLORS[d]||'#fff'}">●</span>${d}`).join(' ') + '</span>' : ''}</div>`, { sticky: true, className: 'map-tip', offset: [0, -4] });
      c.on('click', () => openCountryPopup(iso2, coord.n));
      circles[iso2] = c;
    });

  } else {
    // Mode maladie unique : cercle dimensionné par cas de CETTE maladie
    const countries = DC[activeDis] || [];
    const color = DC_COLORS[activeDis] || '#ef4444';
    const disWeights = weights[activeDis] || {};

    // COVID : utilise les vraies données API
    if (activeDis === 'covid19' && typeof cvData !== 'undefined' && cvData.length) {
      cvData.forEach(cv => {
        const iso2 = cv.countryInfo?.iso2;
        const lat = cv.countryInfo?.lat, lng = cv.countryInfo?.long;
        if (!lat || !lng || !cv.active) return;
        const c = L.circleMarker([lat, lng], {
          radius: radiusForCases(cv.active),
          color, fillColor: color,
          fillOpacity: 0.35, weight: 1.1, opacity: 0.75
        }).addTo(MAP);
        c.bindTooltip(`<div style="font-size:10px"><b>${cv.country}</b><br><span style="color:#c4b5fd">${(cv.active||0).toLocaleString('fr-FR')} cas actifs</span><br><span style="font-size:8px;opacity:.7">${(cv.deaths||0).toLocaleString('fr-FR')} décès</span></div>`, { sticky: true, className: 'map-tip' });
        c.on('click', () => openCountryPopup(iso2 || '', cv.country));
        circles[iso2 || cv.country] = c;
      });
    } else {
      // Autres maladies : données pondérées
      countries.forEach(iso2 => {
        const coord = CC[iso2];
        if (!coord) return;
        const cases = disWeights[iso2] || 3000;
        const c = L.circleMarker([coord.lat, coord.lng], {
          radius: radiusForCases(cases),
          color, fillColor: color,
          fillOpacity: 0.35, weight: 1.1, opacity: 0.75
        }).addTo(MAP);
        const disName = (typeof DB !== 'undefined') ? (DB.diseases.find(x=>x.id===activeDis)?.name || activeDis) : activeDis;
        c.bindTooltip(`<div style="font-size:10px"><b>${coord.n}</b><br><span style="color:${color}">≈ ${cases.toLocaleString('fr-FR')} cas ${disName}</span></div>`, { sticky: true, className: 'map-tip' });
        c.on('click', () => openCountryPopup(iso2, coord.n));
        circles[iso2] = c;
      });
    }
  }

  // Style tooltip
  if (!document.getElementById('map-tip-style')) {
    const s = document.createElement('style');
    s.id = 'map-tip-style';
    s.textContent = '.map-tip{background:rgba(5,8,15,.95)!important;border:1px solid rgba(255,255,255,.12)!important;color:#e0e8f5!important;font-size:10px!important;padding:5px 8px!important;border-radius:6px!important;box-shadow:0 4px 16px rgba(0,0,0,.8)!important;white-space:nowrap}.map-tip::before{display:none!important}';
    document.head.appendChild(s);
  }
}

// ─── FILTRE PAR MALADIE ───────────────────────────────────────────
function setActiveDis(id) {
  activeDis = id;
  drawAllCircles();
  buildFilterList();
  buildLegend();

  // Titre
  const ttl = document.getElementById('map-dis-title');
  if (ttl) {
    if (id === 'all') ttl.textContent = '🌍 Toutes les maladies';
    else {
      const d = (typeof DB !== 'undefined') ? DB.diseases.find(x => x.id === id) : null;
      ttl.textContent = d ? d.emoji + ' ' + d.name : id;
    }
  }

  // Auto-analyse IA pour la maladie sélectionnée
  if (id !== 'all' && typeof GROQ_KEY !== 'undefined' && GROQ_KEY) {
    const d = (typeof DB !== 'undefined') ? DB.diseases.find(x => x.id === id) : null;
    const cnt = (DC[id] || []).length;
    const el = document.getElementById('map-ai-txt');
    if (el && d) {
      el.style.display = 'block';
      el.innerHTML = '<span style="font-size:9px;opacity:.7"><span class="spin"></span> IA analyse...</span>';
      fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + GROQ_KEY },
        body: JSON.stringify({ model: GROQ_MODEL, messages: [{ role: 'user', content: `En 2 phrases: situation mondiale ${d.name} juillet 2026. ${cnt} pays touchés, tendance ${d.trend > 0 ? '+' : ''}${d.trend || 0}%/mois.` }], max_tokens: 120, temperature: 0.5 }),
        signal: AbortSignal.timeout(12000)
      }).then(r => r.json()).then(data => {
        const txt = data.choices?.[0]?.message?.content || '';
        if (el && txt) el.innerHTML = `<div style="font-size:9px;color:#e0e8f5;line-height:1.6">${txt}</div>`;
      }).catch(() => { if (el) el.style.display = 'none'; });
    }
  } else {
    const el = document.getElementById('map-ai-txt');
    if (el) el.style.display = 'none';
  }
}

function buildFilterList() {
  const el = document.getElementById('dis-filter-list');
  if (!el) return;

  const diseases = typeof DB !== 'undefined' ? DB.diseases : [];
  const items = [{ id: 'all', name: '🌍 Toutes les maladies', color: '#64748b' }, ...diseases.map(d => ({ id: d.id, name: d.emoji + ' ' + d.name, color: DC_COLORS[d.id] || '#ef4444' }))];

  el.innerHTML = items.map(item => {
    const isActive = activeDis === item.id;
    const cnt = item.id === 'all' ? Object.keys(CC).length : (DC[item.id] || []).length;
    return `<button onclick="setActiveDis('${item.id}')" class="dis-filter-btn" style="display:flex;align-items:center;gap:5px;padding:4px 7px;width:100%;text-align:left;background:${isActive ? item.color + '25' : 'rgba(255,255,255,.02)'};border:1px solid ${isActive ? item.color + '66' : 'rgba(255,255,255,.06)'};border-radius:5px;cursor:pointer;margin-bottom:2px;transition:all .12s">
      <div style="width:8px;height:8px;border-radius:50%;background:${item.color};flex-shrink:0;opacity:${isActive ? 1 : 0.7}"></div>
      <span style="font-size:8px;color:${isActive ? item.color : '#5a7299'};font-weight:${isActive ? '700' : '400'};flex:1;text-align:left">${item.name}</span>
      <span style="font-size:7px;color:${isActive ? item.color + 'aa' : '#1a2d47'}">${cnt}</span>
    </button>`;
  }).join('');
}

function filterMapSearch(q) {
  const btns = document.querySelectorAll('.dis-filter-btn');
  btns.forEach(b => {
    b.style.display = (!q || b.textContent.toLowerCase().includes(q.toLowerCase())) ? 'flex' : 'none';
  });
}

function buildLegend() {
  const el = document.getElementById('map-legend');
  if (!el) return;

  if (activeDis === 'all') {
    const top = PRIORITY.slice(0, 10);
    el.innerHTML = `<div style="font-size:7px;font-weight:700;text-transform:uppercase;color:#5a7299;margin-bottom:4px;letter-spacing:.5px">Couleur = pire maladie</div>` +
      top.map(id => {
        const d = (typeof DB !== 'undefined') ? DB.diseases.find(x => x.id === id) : null;
        return `<div style="display:flex;align-items:center;gap:4px;margin-bottom:2px">
          <div style="width:7px;height:7px;border-radius:50%;background:${DC_COLORS[id]};flex-shrink:0"></div>
          <span style="font-size:7px;color:#5a7299">${d ? d.emoji + ' ' + d.name.split(' ')[0] : id}</span>
        </div>`;
      }).join('') +
      `<div style="font-size:7px;color:#1a2d47;margin-top:2px">+ ${PRIORITY.length - top.length} autres</div>`;
  } else {
    const d = (typeof DB !== 'undefined') ? DB.diseases.find(x => x.id === activeDis) : null;
    const col = DC_COLORS[activeDis] || '#ef4444';
    const cnt = (DC[activeDis] || []).length;
    const isReliefWeb = (typeof window !== 'undefined' && window._reliefwebGenerated && window._reliefwebGenerated[activeDis]);
    const isCDC = (typeof window !== 'undefined' && window._cdcGenerated && window._cdcGenerated[activeDis]);
    const isWHO = (typeof window !== 'undefined' && window._whoGenerated && window._whoGenerated[activeDis]);
    const isDelphi = (typeof window !== 'undefined' && window._delphiGenerated && window._delphiGenerated[activeDis]);
    const isWebSearch = (typeof window !== 'undefined' && window._tavilyGenerated && window._tavilyGenerated[activeDis]);
    const isRSS = (typeof window !== 'undefined' && window._rssGenerated && window._rssGenerated[activeDis]);
    const isIA = (typeof window !== 'undefined' && window._groqGenerated && window._groqGenerated[activeDis]);
    el.innerHTML = `
      <div style="display:flex;align-items:center;gap:5px;margin-bottom:5px">
        <div style="width:10px;height:10px;border-radius:50%;background:${col}"></div>
        <span style="font-size:9px;font-weight:700;color:${col}">${d ? d.emoji + ' ' + d.name : activeDis}</span>
      </div>
      <div style="font-size:8px;color:#5a7299;margin-bottom:2px">${cnt} pays touchés ${isReliefWeb ? '<span style="color:#22c55e">🌐 ONU temps réel</span>' : isWHO ? '<span style="color:#22c55e">🌍 Données OMS réelles</span>' : isDelphi ? '<span style="color:#22c55e">📊 Delphi CMU réel</span>' : isCDC ? '<span style="color:#22c55e">🏛️ CDC USA réel</span>' : isRSS ? '<span style="color:#22c55e">📡 RSS OMS</span>' : isWebSearch ? '<span style="color:#5eead4">🌐 Web</span>' : isIA ? '<span style="color:#fdba74">🦙 IA</span>' : '<span style="color:#5a7299">📋 base</span>'}</div>
      <div style="display:flex;align-items:center;gap:4px;margin-bottom:2px">
        <div style="width:7px;height:7px;border-radius:50%;background:${col};opacity:.8"></div>
        <span style="font-size:7px;color:#5a7299">Pays touchés</span>
      </div>
      <div style="display:flex;align-items:center;gap:4px">
        <div style="width:7px;height:7px;border-radius:50%;background:#1a2d47;border:1px solid rgba(255,255,255,.1)"></div>
        <span style="font-size:7px;color:#5a7299">Non touchés</span>
      </div>`;
  }
}

// ─── POPUP PAYS ───────────────────────────────────────────────────
function openCountryPopup(iso2, name) {
  if (!MAP) return;
  const coord = CC[iso2];
  if (!coord) return;
  const diseases = getDiseasesOfCountry(iso2);
  const cv = (typeof cvData !== 'undefined') ? cvData.find(c => c.countryInfo?.iso2 === iso2) : null;

  const groqBtn = (typeof GROQ_KEY !== 'undefined' && GROQ_KEY)
    ? `<button onclick="analyzeCountryIA('${iso2}','${name.replace(/'/g, "\\'")}','${diseases.join(',')}',${cv ? cv.active : 0},${cv ? cv.deaths : 0})" style="background:linear-gradient(135deg,rgba(245,80,54,.18),rgba(255,140,0,.18));border:1px solid rgba(245,80,54,.3);color:#fdba74;padding:6px;border-radius:5px;cursor:pointer;font-size:9px;font-weight:600;width:100%;margin-top:4px">🦙 Analyser ${name} avec Assistant IA</button>`
    : '<div style="font-size:8px;color:#5a7299;text-align:center;margin-top:4px"> pour analyser ce pays</div>';

  // Popup avec style custom
  const popup = L.popup({
    maxWidth: 300,
    className: 'country-popup'
  })
    .setLatLng([coord.lat, coord.lng])
    .setContent(`
      <div style="font-family:system-ui,sans-serif">
        <div style="font-size:13px;font-weight:700;margin-bottom:7px;color:#e0e8f5">${name} <span style="font-size:9px;color:#5a7299;font-weight:400">${iso2}</span></div>

        ${diseases.length ? `
          <div style="margin-bottom:7px">
            <div style="font-size:8px;color:#5a7299;margin-bottom:3px">Maladies actives (${diseases.length}):</div>
            <div style="display:flex;flex-wrap:wrap;gap:2px">${diseases.map(id => `<span style="background:${DC_COLORS[id] || '#333'}22;color:${DC_COLORS[id] || '#94a3b8'};border:1px solid ${DC_COLORS[id] || '#333'}44;padding:1px 5px;border-radius:4px;font-size:8px;font-weight:700">${id}</span>`).join('')}</div>
          </div>` : '<div style="font-size:9px;color:#5a7299;margin-bottom:6px">Aucune épidémie majeure recensée</div>'}

        ${cv ? `
          <div style="background:rgba(139,92,246,.1);border:1px solid rgba(139,92,246,.25);border-radius:5px;padding:5px 8px;margin-bottom:6px;font-size:9px">
            <div style="font-weight:700;color:#c4b5fd;margin-bottom:2px">COVID-19 — Temps réel</div>
            <div style="color:#e0e8f5">Actifs: <b>${(cv.active||0).toLocaleString()}</b> &nbsp;·&nbsp; Décès: <b>${(cv.deaths||0).toLocaleString()}</b> &nbsp;·&nbsp; Total: <b>${(cv.cases||0).toLocaleString()}</b></div>
          </div>` : ''}

        ${groqBtn}
      </div>`)
    .openOn(MAP);

  // Style popup
  if (!document.getElementById('cpop-style')) {
    const s = document.createElement('style');
    s.id = 'cpop-style';
    s.textContent = `.country-popup .leaflet-popup-content-wrapper{background:rgba(7,13,21,.97)!important;border:1px solid rgba(255,255,255,.12)!important;border-radius:10px!important;color:#e0e8f5!important;box-shadow:0 8px 32px rgba(0,0,0,.9)!important}.country-popup .leaflet-popup-tip{background:rgba(7,13,21,.97)!important}.country-popup .leaflet-popup-content{margin:12px 14px!important}`;
    document.head.appendChild(s);
  }
}

function analyzeCountryIA(iso2, name, disStr, active, deaths) {
  if (MAP) MAP.closePopup();
  const diseases = disStr ? disStr.split(',').filter(Boolean) : [];
  const q = `Analyse épidémique de ${name} (${iso2}) en juillet 2026.\nMaladies actives: ${diseases.length ? diseases.join(', ') : 'aucune majeure'}.\nCOVID: ${parseInt(active||0).toLocaleString()} cas actifs, ${parseInt(deaths||0).toLocaleString()} décès totaux.\nDétaille: situation sanitaire, risques principaux, recommandations pour les voyageurs et résidents.`;
  if (typeof askAI === 'function') askAI(q);
}

// ─── PANNEAU LATÉRAL ──────────────────────────────────────────────
function renderMapSide() {
  // Alertes
  const ma = document.getElementById('m-alerts');
  if (ma && typeof DB !== 'undefined') {
    ma.innerHTML = DB.alerts.slice(0, 4).map(a =>
      `<div onclick="pickDis && pickDis('${a.did}')" style="padding:4px 6px;border-radius:4px;border-left:2px solid ${a.color};background:rgba(0,0,0,.2);margin-bottom:3px;cursor:pointer;font-size:8px;line-height:1.4;color:#e0e8f5">${a.text}<br><span style="color:#1a2d47">${a.time}</span></div>`
    ).join('');
  }

  // Stats
  const ms = document.getElementById('m-stats');
  if (ms && typeof DB !== 'undefined') {
    const tot = DB.diseases.reduce((s, d) => s + d.cases, 0);
    const totD = DB.diseases.reduce((s, d) => s + d.deaths, 0);
    const cnt = Object.keys(CC).length;
    ms.innerHTML = [
      ['Épidémies suivies', DB.diseases.length],
      ['Pays sur la carte', cnt],
      ['Cas estimés', (tot/1e6).toFixed(1)+'M'],
      ['Niveau critique', DB.diseases.filter(d => d.risk === 'critical').length],
    ].map(([l,v]) => `<div style="display:flex;justify-content:space-between;padding:3px 0;border-bottom:1px solid rgba(255,255,255,.05);font-size:9px"><span style="color:#5a7299">${l}</span><b>${v}</b></div>`).join('');
  }
}

function renderMapAIBtns() {
  const el = document.getElementById('map-ai-btns');
  if (!el) return;
  el.innerHTML = (typeof GROQ_KEY !== 'undefined' && GROQ_KEY) ? [
    ['🌍 Situation mondiale', 'Quelle est la situation épidémique mondiale en juillet 2026 ? Quelles maladies progressent le plus ?'],
    ['🚨 Risques pandémiques', 'Quelles maladies représentent le plus grand risque pandémique en 2026 ? H5N1, Nipah, Marburg ou autre ?'],
    ['🌍 Afrique et Sénégal', "Analyse épidémique de l'Afrique subsaharienne et du Sénégal en 2026 : paludisme, méningite, fièvre jaune, dengue, choléra — situation et risques."],
  ].map(([l, q]) => `<button onclick="analyzeMapIA('${q.replace(/'/g, "\\'")}')" style="background:rgba(245,80,54,.08);border:1px solid rgba(245,80,54,.18);border-radius:5px;color:#fdba74;font-size:8px;padding:4px 7px;cursor:pointer;transition:all .12s;text-align:left;width:100%">🦙 ${l}</button>`).join('') : '';
}

function analyzeMapIA(q) {
  const el = document.getElementById('map-ai-txt');
  if (el) { el.style.display = 'block'; el.innerHTML = '<span style="font-size:9px;opacity:.7"><span class="spin"></span> IA analyse...</span>'; }
  if (typeof askAI === 'function') askAI(q, txt => { if (el) { el.style.display = 'block'; el.innerHTML = `<div style="font-size:9px;color:#e0e8f5;line-height:1.6">${txt}</div>`; } });
}

// ─── HELPERS ──────────────────────────────────────────────────────
function getDiseasesOfCountry(iso2) {
  return Object.entries(DC).filter(([, countries]) => countries.includes(iso2)).map(([id]) => id);
}

// Mise à jour des cercles quand COVID data arrive
function refreshMapCovid() {
  if (mapReady && activeDis === 'covid19') drawAllCircles();
  renderMapSide();
  // Update COVID panel
  const mc = document.getElementById('m-covid');
  if (mc && typeof cvData !== 'undefined' && cvData.length) {
    const w = cvData.reduce((s, c) => ({ cases: s.cases + (c.cases||0), active: s.active + (c.active||0), deaths: s.deaths + (c.deaths||0) }), { cases:0, active:0, deaths:0 });
    mc.innerHTML = [['Total cas', w.cases.toLocaleString('fr-FR')],['Cas actifs', w.active.toLocaleString('fr-FR')],['Décès', w.deaths.toLocaleString('fr-FR')],['Pays', cvData.length]].map(([l,v]) => `<div style="display:flex;justify-content:space-between;padding:3px 0;border-bottom:1px solid rgba(255,255,255,.05);font-size:9px"><span style="color:#5a7299">${l}</span><b>${v}</b></div>`).join('');
  }
}

// ─── GROQ MET À JOUR LA CARTE ─────────────────────────────────────
// Appelé après groqUpdateDiseases() pour rafraîchir les cercles
function groqRefreshMap() {
  if (!mapReady) return;
  drawAllCircles();
  buildFilterList();
  buildLegend();
  renderMapSide();
}

// ═══════════════════════════════════════════════════════════════
// VUE PAR RÉGION vs PAR PAYS
// ═══════════════════════════════════════════════════════════════
let mapViewMode = 'pays'; // 'pays' ou 'region'

// Centres géographiques des régions (pour les gros points régionaux)
const REGION_CENTERS = {
  'Afrique de l\'Ouest': { lat: 11, lng: -4, countries: ['NG','GH','CI','ML','SN','BF','NE','GN','SL','LR','TG','BJ','MR','GM','GW'] },
  'Afrique Centrale': { lat: 2, lng: 18, countries: ['CD','CM','CF','CG','GA','GQ','TD','AO'] },
  'Afrique de l\'Est': { lat: 0, lng: 37, countries: ['ET','KE','TZ','UG','RW','BI','SS','SO','ER','DJ'] },
  'Afrique Australe': { lat: -25, lng: 25, countries: ['ZA','ZW','MZ','ZM','MW','BW','NA','SZ','LS','MG'] },
  'Afrique du Nord': { lat: 28, lng: 15, countries: ['EG','LY','TN','DZ','MA','SD'] },
  'Amérique du Nord': { lat: 40, lng: -100, countries: ['US','CA','MX'] },
  'Amérique Centrale/Caraïbes': { lat: 15, lng: -85, countries: ['GT','HN','NI','CR','PA','CU','DO','HT','JM'] },
  'Amérique du Sud': { lat: -15, lng: -60, countries: ['BR','CO','AR','PE','VE','CL','EC','BO','PY','UY','GY','SR'] },
  'Asie du Sud': { lat: 22, lng: 78, countries: ['IN','PK','BD','NP','LK','AF','BT'] },
  'Asie du Sud-Est': { lat: 5, lng: 110, countries: ['ID','PH','VN','TH','MM','MY','KH','LA','SG','TL'] },
  'Asie de l\'Est': { lat: 35, lng: 115, countries: ['CN','JP','KR','MN','TW'] },
  'Asie Centrale': { lat: 43, lng: 65, countries: ['KZ','UZ','TM','KG','TJ'] },
  'Moyen-Orient': { lat: 29, lng: 45, countries: ['SA','AE','QA','KW','OM','BH','JO','LB','YE','IQ','IR','SY','IL','TR'] },
  'Europe': { lat: 50, lng: 10, countries: ['DE','FR','GB','IT','ES','PL','RO','NL','BE','CZ','GR','PT','SE','HU','AT','CH','BG','RS','HR','UA','RU','BY','SK','FI','NO','DK','IE'] },
  'Océanie': { lat: -25, lng: 140, countries: ['AU','NZ','PG','FJ'] },
};

function setMapView(mode) {
  mapViewMode = mode;
  // Met à jour l'apparence des boutons
  const pb = document.getElementById('view-pays-btn');
  const rb = document.getElementById('view-region-btn');
  if (pb && rb) {
    if (mode === 'pays') {
      pb.style.background = 'rgba(20,184,166,.15)'; pb.style.color = '#5eead4'; pb.style.borderColor = 'rgba(20,184,166,.3)';
      rb.style.background = 'rgba(100,116,139,.1)'; rb.style.color = '#94a3b8'; rb.style.borderColor = 'rgba(100,116,139,.2)';
    } else {
      rb.style.background = 'rgba(20,184,166,.15)'; rb.style.color = '#5eead4'; rb.style.borderColor = 'rgba(20,184,166,.3)';
      pb.style.background = 'rgba(100,116,139,.1)'; pb.style.color = '#94a3b8'; pb.style.borderColor = 'rgba(100,116,139,.2)';
    }
  }
  drawAllCircles();
}

// Trouve la région d'un pays
function countryToRegion(iso2) {
  for (const [region, data] of Object.entries(REGION_CENTERS)) {
    if (data.countries.includes(iso2)) return region;
  }
  return null;
}

if (typeof window !== 'undefined') {
  window.setMapView = setMapView;
  window.mapViewMode = mapViewMode;
}

// ═══════════════════════════════════════════════════════════════
// LABELS DES PAYS TRADUITS sur la carte
// ═══════════════════════════════════════════════════════════════
let countryLabels = [];

function drawCountryLabels() {
  if (!MAP) return;
  if (countryLabels && countryLabels.length) {
    countryLabels.forEach(l => { try { MAP.removeLayer(l); } catch(e){} });
  }
  countryLabels = [];
  if (typeof CC === 'undefined' || typeof countryName !== 'function') return;

  const z = MAP.getZoom();
  const bounds = MAP.getBounds();

  // Grands pays prioritaires (affichés en premier quand dézoomé)
  const MAJOR = ['US','CN','IN','BR','RU','CA','AU','AR','KZ','DZ','CD','SA','MX','ID','LY','IR','SD','ML','NE','TD','AO','ZA','ET','EG','NG','MN','PE','CO','BO','MR','TZ','KE','FR','DE','ES','TR','PK','MM','TH','JP','GB','IT','UA','PL','SE','NO','FI','VE','CL','NZ','PG','MA','SO','ZM','MZ','MG','AF','UZ','YE','IQ','SY','VN','MY','PH','KR','KP','GH','CI','CM','SN','BF','GN','UG','ZW','BW','NA','BD','NP','LK','GT','CU','HT','EC','PY','UY','RO','GR','PT','NL','BE','CH','AT'];

  // Liste : grands pays d'abord, puis TOUS les autres (195+ pays)
  const allCodes = Object.keys(CC);
  const others = allCodes.filter(c => MAJOR.indexOf(c) === -1);
  const list = MAJOR.concat(others);

  const placed = [];
  const minDist = (z <= 2) ? 8 : (z <= 3) ? 5.5 : (z <= 4) ? 3 : (z <= 5) ? 1.8 : (z <= 6) ? 1 : 0.5;

  function tryPlace(lat, lng, name, isState) {
    if (!bounds.contains([lat, lng])) return false;
    for (let p of placed) {
      const w = minDist * (0.55 + name.length * 0.06);
      if (Math.abs(p.lat - lat) < minDist * 0.42 && Math.abs(p.lng - lng) < w) return false;
    }
    placed.push({lat: lat, lng: lng});
    const fs = isState ? 9 : ((z <= 2) ? 8 : (z <= 3) ? 9 : (z <= 4) ? 10 : 11);
    const col = isState ? '#5a4a2a' : '#16304d';
    const label = L.marker([lat, lng], {
      icon: L.divIcon({
        className: 'country-label-div',
        html: '<span style="color:' + col + ';font-size:' + fs + 'px;font-weight:700;white-space:nowrap;text-shadow:-1px -1px 0 #fff,1px -1px 0 #fff,-1px 1px 0 #fff,1px 1px 0 #fff,0 0 3px #fff;pointer-events:none;transform:translate(-50%,-50%);display:inline-block">' + name + '</span>',
        iconSize: [1, 1], iconAnchor: [0, 0]
      }),
      interactive: false, keyboard: false, zIndexOffset: 1000
    });
    label.addTo(MAP);
    countryLabels.push(label);
    return true;
  }

  // 1. Les pays
  list.forEach(iso2 => {
    const coord = CC[iso2];
    if (!coord || typeof coord.lat === 'undefined') return;
    const name = countryName(iso2);
    if (!name) return;
    tryPlace(coord.lat, coord.lng, name, false);
  });

  // 2. Les 50 États américains (à partir du zoom 4, quand on regarde les USA)
  if (z >= 4 && typeof US_STATES !== 'undefined') {
    Object.keys(US_STATES).forEach(code => {
      const st = US_STATES[code];
      tryPlace(st.lat, st.lng, st.n, true);
    });
  }
}

if (typeof window !== 'undefined') window.drawCountryLabels = drawCountryLabels;
