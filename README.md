# 🌍 World Disease Monitor — Surveillance épidémique temps réel

## Même méthode que HealthMap (Harvard) + vraies API

### Comment ça marche (approche HealthMap)
Comme HealthMap, l'app lit des dizaines de sources de news/RSS toutes les heures,
détecte automatiquement la maladie et le pays dans chaque alerte, et place un point
sur la carte. Plus il y a de news sur un foyer, plus le point est gros.

### 14 sources d'actualités temps réel (comme HealthMap)
- OMS Disease Outbreak News + Emergencies
- ReliefWeb ONU (API directe, sans proxy)
- CDC (Emerging Diseases + Outbreaks)
- CIDRAP, ECDC, ProMED
- Google News (Épidémies, Foyers OMS, Ebola/Marburg/Mpox, FR, H5N1)

### Sources sur la carte (indicateurs)
- 🌐 ONU temps réel (ReliefWeb)
- 🌍 Données OMS réelles (WHO GHO)
- 🏛️ CDC USA réel
- 📊 Delphi CMU réel
- 📡 RSS OMS / News (méthode HealthMap)
- 📋 base (référence stockée)


### Ouvrir
Dézipper → double-clic index.html dans Chrome/Firefox (avec internet)

### Ce qui est temps réel vs référence
- Cas, alertes, foyers, vaccins, science, économie/pays → API temps réel
- R₀, pathogène, mortalité, descriptions → référence médicale stockée
  (aucune API ne les streame, comme un dictionnaire médical)
