# Guide IndexedDB - Persistance Offline

## 🎯 Objectif

Sauvegarder automatiquement toutes les données dans IndexedDB pour un fonctionnement offline complet avec données persistantes.

## 📊 Architecture

### Stores (Tables) Créés

| Store | Contenu | Index |
|-------|---------|-------|
| `victims` | Liste des victimes | status, province |
| `evaluations` | Évaluations médicales | victimeId |
| `planVie` | Plans de vie | victimeId |
| `questions` | Questions des formulaires | categorieId |
| `stats` | Statistiques globales | - |
| `metadata` | Métadonnées (timestamps, etc.) | - |

### Workflow Automatique

```
1. Utilisateur fait une requête GET
   ↓
2. FetchContext essaie l'API
   ↓
3a. Succès → Sauvegarde dans IndexedDB + Retourne les données
3b. Échec → Récupère depuis IndexedDB
   ↓
4. Données affichées (online ou offline)
```

## 🔧 Fichiers Créés

### 1. `app/utils/indexedDB.ts`

Utilitaires pour gérer IndexedDB :

```typescript
// Initialiser la DB
await initDB();

// Sauvegarder des données
await saveToStore(STORES.VICTIMS, victimesData);

// Récupérer toutes les données
const victims = await getAllFromStore(STORES.VICTIMS);

// Récupérer un élément
const victim = await getFromStore(STORES.VICTIMS, 123);

// Récupérer par index
const evaluated = await getByIndex(STORES.VICTIMS, 'status', 'Évalué');

// Supprimer
await deleteFromStore(STORES.VICTIMS, 123);

// Vider un store
await clearStore(STORES.VICTIMS);

// Métadonnées
await saveMetadata('last_sync', Date.now());
const lastSync = await getMetadata('last_sync');

// Vérifier fraîcheur des données
const isFresh = await isDataFresh('victims_list', 5); // 5 minutes
```

### 2. `app/hooks/useOfflineData.ts`

Hook React pour gérer les données offline :

```typescript
// Hook générique
const { data, loading, error, isOffline, refetch } = useOfflineData({
  storeName: STORES.VICTIMS,
  apiUrl: 'http://10.140.0.104:8007/victime',
  cacheKey: 'victims_list',
  maxAgeMinutes: 10,
});

// Hooks spécifiques
const { data: victims } = useVictims();
const { victim } = useVictim(123);
const { data: stats } = useStats();
const { data: questions } = useQuestions('plandevie');
```

### 3. `app/context/FetchContext.tsx` (Modifié)

Le FetchContext sauvegarde maintenant automatiquement :

- ✅ Détecte le type de requête (GET/POST/etc.)
- ✅ Identifie le store approprié selon l'URL
- ✅ Sauvegarde automatiquement les réponses GET
- ✅ Fallback vers IndexedDB en cas d'erreur réseau
- ✅ Indicateur `isOffline` disponible

### 4. `app/components/DBStatus.tsx`

Composant de debug pour visualiser la DB :

- 🔵 Bouton flottant en bas à gauche
- 📊 Affiche le nombre d'éléments par store
- 🗑️ Permet de vider les stores
- 💾 Export de toute la DB en JSON

## 🚀 Utilisation

### Automatique (via FetchContext)

Toutes les requêtes GET passant par `useFetch()` sont automatiquement sauvegardées :

```typescript
const { fetcher } = useFetch();

// Cette requête sera automatiquement mise en cache
const victims = await fetcher('http://10.140.0.104:8007/victime');

// En mode offline, les données viendront d'IndexedDB
```

### Manuelle (via hooks)

```typescript
import { useVictims } from '@/app/hooks/useOfflineData';

function MyComponent() {
  const { data, loading, error, isOffline, refetch } = useVictims();
  
  if (loading) return <div>Chargement...</div>;
  if (error) return <div>Erreur: {error}</div>;
  
  return (
    <div>
      {isOffline && <p>Mode offline - Données du cache</p>}
      {data?.map(victim => <div key={victim.id}>{victim.nom}</div>)}
      <button onClick={refetch}>Actualiser</button>
    </div>
  );
}
```

### Directe (via utils)

```typescript
import { saveToStore, getAllFromStore, STORES } from '@/app/utils/indexedDB';

// Sauvegarder manuellement
await saveToStore(STORES.VICTIMS, myVictims);

// Récupérer manuellement
const victims = await getAllFromStore(STORES.VICTIMS);
```

## 📱 Composant DBStatus

### Accès

Un bouton violet avec icône de base de données apparaît en bas à gauche.

### Fonctionnalités

1. **Voir l'état** : Nombre d'éléments par store
2. **Actualiser** : Recompter les éléments
3. **Vider** : Supprimer les données d'un store
4. **Exporter** : Télécharger toute la DB en JSON

### Utilisation

```
Clic sur le bouton → Modal s'ouvre
- VICTIMS: 150 éléments [🗑️]
- EVALUATIONS: 45 éléments [🗑️]
- PLAN_VIE: 12 éléments [🗑️]
- etc.

[Actualiser] [Exporter]
```

## 🧪 Test Complet

### Étape 1 : Build et Démarrage

```bash
npm run build
npm start
```

### Étape 2 : Charger les Données

1. Ouvrir http://localhost:3008
2. Naviguer vers `/reparations`
3. Attendre le chargement des victimes
4. Ouvrir le DBStatus (bouton en bas à gauche)
5. Vérifier que VICTIMS contient des éléments

### Étape 3 : Tester Offline

1. Passer en mode offline (DevTools > Network > Offline)
2. Actualiser la page (F5)
3. ✅ Les victimes s'affichent depuis IndexedDB
4. Naviguer vers une victime
5. ✅ Les détails s'affichent

### Étape 4 : Vérifier la Console

```
[IndexedDB] Base de données ouverte avec succès
[FetchContext] IndexedDB initialisée
[FetchContext] Données sauvegardées dans victims
[FetchContext] Mode offline, récupération depuis IndexedDB
[IndexedDB] 150 élément(s) récupéré(s) de victims
```

## 🔍 Détection Automatique des URLs

Le système détecte automatiquement le store approprié :

| URL Pattern | Store |
|-------------|-------|
| `/victime/stats` | STATS |
| `/victime` | VICTIMS |
| `/evaluation` | EVALUATIONS |
| `/plan-vie-enquette` | PLAN_VIE |
| `/question` | QUESTIONS |

## 💾 Persistance des Données

### Durée de Vie

- **IndexedDB** : Données persistantes jusqu'à suppression manuelle
- **Fraîcheur** : Configurable par hook (défaut: 5-10 min)
- **Synchronisation** : Automatique au retour en ligne

### Taille Limite

- **Chrome/Edge** : ~50% de l'espace disque disponible
- **Firefox** : ~50% de l'espace disque disponible
- **Safari** : ~1 GB

### Gestion de l'Espace

```typescript
// Vérifier l'utilisation
if ('storage' in navigator && 'estimate' in navigator.storage) {
  const estimate = await navigator.storage.estimate();
  console.log(`Utilisé: ${estimate.usage} / ${estimate.quota}`);
}
```

## 🔄 Synchronisation

### Automatique

- Au retour en ligne, les requêtes GET refetch automatiquement
- Les nouvelles données écrasent le cache

### Manuelle

```typescript
const { refetch } = useVictims();

// Forcer une synchronisation
await refetch();
```

### Stratégie

1. **NetworkFirst** : Essaie le réseau, fallback vers cache
2. **CacheFirst** : Utilise le cache, met à jour en arrière-plan
3. **StaleWhileRevalidate** : Retourne le cache, fetch en parallèle

## 🐛 Dépannage

### IndexedDB ne s'initialise pas

```javascript
// Dans la console
indexedDB.databases().then(console.log);
```

### Voir les données

```javascript
// Dans la console
import { exportDB } from '@/app/utils/indexedDB';
const data = await exportDB();
console.log(data);
```

### Vider complètement

```javascript
// Dans la console
indexedDB.deleteDatabase('RepalucDB');
location.reload();
```

### Erreur de quota

```javascript
// Vider les stores les moins importants
await clearStore(STORES.STATS);
await clearStore(STORES.QUESTIONS);
```

## 📊 Monitoring

### Logs Automatiques

Le système log automatiquement :

```
[IndexedDB] 150 élément(s) sauvegardé(s) dans victims
[FetchContext] Données sauvegardées dans victims
[FetchContext] Mode offline, récupération depuis IndexedDB
```

### Métriques

```typescript
// Compter les éléments
const count = await countStore(STORES.VICTIMS);

// Vérifier la fraîcheur
const isFresh = await isDataFresh('victims_list', 10);

// Dernière sync
const lastSync = await getMetadata('last_sync_victims');
```

## 🎯 Cas d'Usage

### 1. Liste des Victimes

```typescript
// Automatique via FetchContext
const { fetcher } = useFetch();
const victims = await fetcher('http://10.140.0.104:8007/victime');
// → Sauvegardé dans STORES.VICTIMS
```

### 2. Détails d'une Victime

```typescript
const { victim } = useVictim(123);
// → Récupéré depuis IndexedDB si offline
```

### 3. Formulaire Plan de Vie

```typescript
const { data: questions } = useQuestions('plandevie');
// → Questions en cache, disponibles offline
```

### 4. Statistiques

```typescript
const { data: stats } = useStats();
// → Stats en cache, mises à jour toutes les 15 min
```

## ✨ Avantages

- ✅ **Zéro configuration** : Fonctionne automatiquement
- ✅ **Transparent** : Aucun changement de code nécessaire
- ✅ **Performant** : Chargement instantané depuis le cache
- ✅ **Robuste** : Fallback automatique en cas d'erreur
- ✅ **Debuggable** : Composant DBStatus pour visualiser
- ✅ **Flexible** : Hooks personnalisables

## 🚀 Prochaines Étapes

- [ ] Synchronisation bidirectionnelle (POST/PUT offline)
- [ ] Queue de requêtes offline
- [ ] Résolution de conflits
- [ ] Compression des données
- [ ] Encryption des données sensibles
- [ ] Background sync API

## 📚 Ressources

- [IndexedDB API](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API)
- [Storage API](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API)
- [Best Practices](https://web.dev/indexeddb-best-practices/)

---

**L'application est maintenant 100% fonctionnelle offline avec persistance des données !** 🎉
