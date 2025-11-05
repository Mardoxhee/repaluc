# 📱 Guide Visuel - Mode Offline

## 🎯 Vue d'Ensemble

Votre application Next.js est maintenant **100% fonctionnelle offline** avec :
- ✅ Pages en cache (Service Worker)
- ✅ Données persistantes (IndexedDB)
- ✅ Synchronisation automatique
- ✅ Interface de monitoring

---

## 🚀 Démarrage Rapide

### 1. Build et Start

```bash
npm run build
npm start
```

**Résultat** : Application sur `http://localhost:3008`

---

## 📸 Interface Utilisateur

### Composants Visuels

```
┌─────────────────────────────────────────────────────────┐
│                    NAVIGATION BAR                        │
│                                                          │
│  [Logo]  [Réparations]  [Luc]              [User] 🟠   │ ← Indicateur Offline
└─────────────────────────────────────────────────────────┘
│                                                          │
│                                                          │
│                    CONTENU PAGE                          │
│                                                          │
│  ┌────────────────────────────────────────────────┐    │
│  │  Liste des Victimes                            │    │
│  │                                                 │    │
│  │  • Victime 1 - Évalué                         │    │
│  │  • Victime 2 - En attente                     │    │
│  │  • Victime 3 - Contrôlé                       │    │
│  └────────────────────────────────────────────────┘    │
│                                                          │
│                                                          │
│  🔵 [150]  ← DBStatus (bas gauche)                     │
└─────────────────────────────────────────────────────────┘
```

---

## 🟠 Indicateur Offline (Haut Droite)

### État Offline

```
┌──────────────────────────────┐
│ 🔴 Mode Hors Ligne           │
│ Vous travaillez avec les     │
│ données en cache             │
└──────────────────────────────┘
```

**Quand** : Apparaît dès que la connexion est perdue  
**Couleur** : Orange  
**Position** : Haut droite  
**Durée** : Permanent jusqu'au retour en ligne  

### État Online

```
┌──────────────────────────────┐
│ 🟢 Connexion rétablie        │
│ Vous êtes de nouveau en ligne│
└──────────────────────────────┘
```

**Quand** : Apparaît au retour en ligne  
**Couleur** : Vert  
**Position** : Haut droite  
**Durée** : 3 secondes puis disparaît  

---

## 🔵 DBStatus (Bas Gauche)

### Bouton Flottant

```
  🔵
 [150]  ← Badge avec nombre total
```

**Clic** → Ouvre le modal de monitoring

### Modal DBStatus

```
┌─────────────────────────────────────────────────┐
│ 📊 État IndexedDB              150 éléments  [✕]│
├─────────────────────────────────────────────────┤
│                                                  │
│  ┌──────────────────────────────────────────┐  │
│  │ VICTIMS                          [150] 🗑 │  │
│  │ victims                                   │  │
│  └──────────────────────────────────────────┘  │
│                                                  │
│  ┌──────────────────────────────────────────┐  │
│  │ EVALUATIONS                       [45] 🗑 │  │
│  │ evaluations                               │  │
│  └──────────────────────────────────────────┘  │
│                                                  │
│  ┌──────────────────────────────────────────┐  │
│  │ PLAN_VIE                          [12] 🗑 │  │
│  │ planVie                                   │  │
│  └──────────────────────────────────────────┘  │
│                                                  │
│  ┌──────────────────────────────────────────┐  │
│  │ QUESTIONS                         [89] 🗑 │  │
│  │ questions                                 │  │
│  └──────────────────────────────────────────┘  │
│                                                  │
│  ┌──────────────────────────────────────────┐  │
│  │ STATS                              [1] 🗑 │  │
│  │ stats                                     │  │
│  └──────────────────────────────────────────┘  │
│                                                  │
│  ┌──────────────────────────────────────────┐  │
│  │ METADATA                           [5] 🗑 │  │
│  │ metadata                                  │  │
│  └──────────────────────────────────────────┘  │
│                                                  │
├─────────────────────────────────────────────────┤
│  [🔄 Actualiser]              [💾 Exporter]     │
└─────────────────────────────────────────────────┘
```

**Fonctions** :
- **Nombre** : Affiche le nombre d'éléments dans chaque store
- **🗑️** : Vider un store spécifique
- **🔄 Actualiser** : Recompter les éléments
- **💾 Exporter** : Télécharger la DB en JSON

---

## 🔄 Workflow Complet

### Scénario 1 : Première Utilisation

```
1. [EN LIGNE] Ouvrir http://localhost:3008
   ↓
2. [EN LIGNE] Cliquer sur "Réparations"
   → Page se charge
   → Victimes se chargent depuis l'API
   → 🔵[150] apparaît (DBStatus)
   ↓
3. [EN LIGNE] Cliquer sur "Luc"
   → Page se charge
   → Données se chargent
   ↓
4. [EN LIGNE] Attendre 10 secondes
   → Cache se finalise
   ↓
5. [OFFLINE] F12 > Network > Cocher "Offline"
   → 🟠 "Mode Hors Ligne" apparaît
   ↓
6. [OFFLINE] Appuyer sur F5 (Actualiser)
   → ✅ Page se charge depuis le cache
   → ✅ Victimes s'affichent depuis IndexedDB
   ↓
7. [OFFLINE] Naviguer entre les pages
   → ✅ Tout fonctionne !
```

### Scénario 2 : Serveur Coupé

```
1. [EN LIGNE] Application fonctionne normalement
   ↓
2. [SERVEUR ON] Terminal : npm start
   → Application tourne
   ↓
3. [SERVEUR OFF] Terminal : Ctrl+C
   → Serveur s'arrête
   ↓
4. [NAVIGATEUR] F5 (Actualiser)
   → 🟠 "Mode Hors Ligne" apparaît
   → ✅ Page se charge depuis le cache
   → ✅ Données depuis IndexedDB
   ↓
5. [NAVIGATEUR] Navigation
   → ✅ Tout fonctionne !
```

### Scénario 3 : Retour en Ligne

```
1. [OFFLINE] Application fonctionne avec le cache
   → 🟠 "Mode Hors Ligne" affiché
   ↓
2. [ONLINE] Décocher "Offline" ou redémarrer serveur
   → 🟢 "Connexion rétablie" apparaît (3s)
   ↓
3. [ONLINE] Actualiser la page
   → Nouvelles données chargées depuis l'API
   → IndexedDB mis à jour
   → Badge DBStatus mis à jour
```

---

## 🎬 Étapes de Test

### Test 1 : Vérifier le Cache des Pages

```bash
# 1. Démarrer
npm start

# 2. Navigateur
http://localhost:3008

# 3. Visiter les pages
- Cliquer "Réparations"
- Cliquer "Luc"
- Revenir à l'accueil

# 4. Console (F12)
caches.keys().then(console.log)
# Résultat attendu : ['next-cache', 'api-cache', 'html-pages', ...]

# 5. Passer offline
F12 > Network > Offline

# 6. Actualiser
F5

# ✅ Résultat : Page se charge
```

### Test 2 : Vérifier IndexedDB

```bash
# 1. Charger les données
http://localhost:3008/reparations

# 2. Ouvrir DBStatus
Clic sur 🔵 (bas gauche)

# 3. Vérifier
VICTIMS: [150] ← Doit être > 0

# 4. Console (F12)
indexedDB.databases().then(console.log)
# Résultat attendu : [{name: 'RepalucDB', version: 1}]

# 5. Voir les données
# Dans la console :
import { getAllFromStore, STORES } from '@/app/utils/indexedDB';
const victims = await getAllFromStore(STORES.VICTIMS);
console.log(victims);

# ✅ Résultat : Array de victimes
```

### Test 3 : Serveur Coupé

```bash
# 1. Terminal 1
npm start
# Serveur démarre

# 2. Navigateur
http://localhost:3008/reparations
# Charger les données

# 3. Vérifier DBStatus
🔵 [150] ← Doit avoir des données

# 4. Terminal 1
Ctrl+C
# Serveur s'arrête

# 5. Navigateur
F5 (Actualiser)

# ✅ Résultat : Application continue de fonctionner
```

---

## 🔍 Vérifications Console

### Logs Attendus (En Ligne)

```
[IndexedDB] Base de données ouverte avec succès
[FetchContext] IndexedDB initialisée
[PWA] Service Worker prêt
[PWA] Page mise en cache: /
[PWA] Page mise en cache: /reparations
[PWA] Page mise en cache: /luc
[FetchContext] Données sauvegardées dans victims
[IndexedDB] 150 élément(s) sauvegardé(s) dans victims
```

### Logs Attendus (Offline)

```
[FetchContext] Mode offline, récupération depuis IndexedDB
[IndexedDB] 150 élément(s) récupéré(s) de victims
```

### Commandes Utiles

```javascript
// Voir tous les caches
caches.keys().then(console.log);

// Voir les pages en cache
caches.open('html-pages').then(cache => {
  cache.keys().then(keys => {
    console.log('Pages:', keys.map(k => k.url));
  });
});

// Voir IndexedDB
indexedDB.databases().then(console.log);

// Compter les victimes
import { countStore, STORES } from '@/app/utils/indexedDB';
const count = await countStore(STORES.VICTIMS);
console.log(`${count} victimes en cache`);

// Exporter toute la DB
import { exportDB } from '@/app/utils/indexedDB';
const data = await exportDB();
console.log(data);

// Vérifier l'espace de stockage
const estimate = await navigator.storage.estimate();
console.log(`Utilisé: ${estimate.usage} / ${estimate.quota}`);
const percent = (estimate.usage / estimate.quota * 100).toFixed(2);
console.log(`${percent}% utilisé`);
```

---

## 🐛 Problèmes Courants

### ❌ Problème : Page blanche en offline

**Cause** : Page pas visitée en ligne

**Solution** :
```
1. Revenir en ligne
2. Visiter la page
3. Attendre 10 secondes
4. Repasser offline
```

### ❌ Problème : Pas de données en offline

**Cause** : Données pas chargées en ligne

**Solution** :
```
1. Revenir en ligne
2. Charger les données
3. Vérifier DBStatus : VICTIMS > 0
4. Repasser offline
```

### ❌ Problème : Badge DBStatus à 0

**Cause** : IndexedDB vide

**Solution** :
```
1. Naviguer dans l'application
2. Charger les victimes
3. Attendre 5 secondes
4. Actualiser DBStatus
```

### ❌ Problème : Service Worker pas actif

**Cause** : Mode développement

**Solution** :
```bash
# Toujours en production
npm run build
npm start
```

**Vérification** :
```javascript
navigator.serviceWorker.getRegistrations().then(regs => {
  console.log(`${regs.length} SW actif(s)`);
});
```

---

## 📊 Checklist de Validation

### Avant de Tester Offline

- [ ] Build en production (`npm run build`)
- [ ] Serveur démarré (`npm start`)
- [ ] Page d'accueil visitée
- [ ] Page `/reparations` visitée
- [ ] Page `/luc` visitée
- [ ] Données des victimes chargées
- [ ] DBStatus affiche > 0 victimes
- [ ] Attendu 10 secondes

### Test Offline

- [ ] Mode offline activé (F12 > Network > Offline)
- [ ] Page actualisée (F5)
- [ ] Page se charge correctement
- [ ] Victimes s'affichent
- [ ] Indicateur orange visible
- [ ] Navigation fonctionne
- [ ] Détails victimes accessibles

### Retour en Ligne

- [ ] Mode online réactivé
- [ ] Indicateur vert apparaît (3s)
- [ ] Données se mettent à jour
- [ ] DBStatus mis à jour

---

## 🎯 Résultat Final

```
┌─────────────────────────────────────────────────┐
│              APPLICATION REPALUC                 │
├─────────────────────────────────────────────────┤
│                                                  │
│  ✅ Pages en cache                              │
│     → Toutes les pages visitées accessibles     │
│                                                  │
│  ✅ Données persistantes                        │
│     → IndexedDB stocke victimes, évaluations    │
│                                                  │
│  ✅ Serveur coupé                               │
│     → Application continue de fonctionner       │
│                                                  │
│  ✅ Synchronisation automatique                 │
│     → Mise à jour au retour en ligne            │
│                                                  │
│  ✅ Interface de monitoring                     │
│     → DBStatus pour visualiser l'état           │
│                                                  │
│  ✅ Indicateur de connexion                     │
│     → Notification visuelle du statut           │
│                                                  │
└─────────────────────────────────────────────────┘

🎉 MODE OFFLINE 100% FONCTIONNEL ! 🎉
```

---

## 📚 Documentation Complète

Pour plus de détails, consultez :

- **`RESUME_MODE_OFFLINE.md`** - Guide rapide
- **`INDEXEDDB_GUIDE.md`** - Documentation IndexedDB
- **`TEST_OFFLINE.md`** - Procédures de test
- **`OFFLINE_OPTIMISATION.md`** - Optimisations PWA

---

**Votre application est maintenant prête pour une utilisation offline complète !** 🚀
