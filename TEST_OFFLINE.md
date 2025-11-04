# Guide de Test du Mode Offline

## 🎯 Objectif

Vérifier que l'application fonctionne complètement offline, même après actualisation.

## 📋 Procédure de Test

### Étape 1 : Démarrer l'Application

```bash
npm start
```

L'application démarre sur `http://localhost:3008`

### Étape 2 : Naviguer dans Toutes les Pages (IMPORTANT !)

**⚠️ Cette étape est CRUCIALE pour mettre les pages en cache**

1. Ouvrir `http://localhost:3008`
2. Cliquer sur "Réparations" → Attendre le chargement complet
3. Cliquer sur "Luc" → Attendre le chargement complet
4. Revenir à l'accueil
5. **Attendre 5 secondes** pour que le cache se finalise

### Étape 3 : Vérifier le Cache (Optionnel)

Ouvrir la console du navigateur (F12) et taper :

```javascript
// Voir tous les caches
caches.keys().then(console.log);

// Voir le contenu du cache des pages
caches.open('html-pages').then(cache => {
  cache.keys().then(keys => {
    console.log('Pages en cache:', keys.map(k => k.url));
  });
});

// Voir le cache manuel
caches.open('manual-precache-v1').then(cache => {
  cache.keys().then(keys => {
    console.log('Pré-cache manuel:', keys.map(k => k.url));
  });
});
```

Vous devriez voir :
- `html-pages` : Les pages visitées
- `manual-precache-v1` : Les pages pré-cachées
- `next-cache` : Les ressources Next.js
- `api-cache` : Les données API
- `static-resources` : JS, CSS, fonts
- `images-cache` : Images

### Étape 4 : Passer en Mode Offline

**Option A : Via les DevTools (Recommandé)**

1. Ouvrir DevTools (F12)
2. Aller dans l'onglet "Network" (Réseau)
3. Cocher "Offline"

**Option B : Via le Navigateur**

Chrome/Edge :
1. Ouvrir DevTools (F12)
2. Application > Service Workers
3. Cocher "Offline"

### Étape 5 : Tester l'Actualisation

1. Appuyer sur F5 ou Ctrl+R (Cmd+R sur Mac)
2. **✅ La page devrait se recharger normalement**
3. Naviguer entre les pages
4. **✅ Toutes les pages visitées devraient fonctionner**

### Étape 6 : Vérifier l'Indicateur

Vous devriez voir une notification orange :
```
🔴 Mode Hors Ligne
Vous travaillez avec les données en cache
```

### Étape 7 : Tester les Données API

1. Cliquer sur une victime (si vous avez visité la page en ligne)
2. **✅ Les données devraient s'afficher depuis le cache**

### Étape 8 : Revenir en Ligne

1. Décocher "Offline" dans les DevTools
2. **✅ Notification verte devrait apparaître**
```
🟢 Connexion rétablie
Vous êtes de nouveau en ligne
```

## ✅ Critères de Succès

- [ ] L'application se charge après actualisation en mode offline
- [ ] Les pages visitées sont accessibles offline
- [ ] La navigation fonctionne entre les pages en cache
- [ ] L'indicateur offline s'affiche correctement
- [ ] L'indicateur online s'affiche au retour en ligne
- [ ] Les données API en cache sont accessibles

## ❌ Problèmes Courants

### L'application ne se charge pas après actualisation

**Cause** : Les pages n'ont pas été visitées avant de passer offline

**Solution** :
1. Revenir en ligne
2. Visiter TOUTES les pages
3. Attendre 5-10 secondes
4. Repasser offline
5. Actualiser

### La page affiche "offline.html"

**Cause** : La page n'est pas en cache

**Solution** : Visiter la page en ligne d'abord

### Les données API ne s'affichent pas

**Cause** : Les requêtes API n'ont pas été faites en ligne

**Solution** : Charger les données en ligne d'abord

### Le service worker ne s'installe pas

**Cause** : Vous êtes en mode développement

**Solution** : 
```bash
npm run build
npm start
```

## 🔧 Dépannage

### Effacer Complètement le Cache

```javascript
// Dans la console
caches.keys().then(keys => {
  keys.forEach(key => caches.delete(key));
  console.log('Cache effacé');
});

// Puis recharger
location.reload();
```

### Forcer la Mise à Jour du Service Worker

```javascript
// Dans la console
navigator.serviceWorker.getRegistrations().then(registrations => {
  registrations.forEach(reg => {
    reg.unregister();
  });
  console.log('Service workers désinstallés');
});

// Puis recharger
location.reload();
```

### Vérifier l'État du Service Worker

```javascript
// Dans la console
navigator.serviceWorker.getRegistrations().then(registrations => {
  console.log('Service Workers actifs:', registrations);
  registrations.forEach(reg => {
    console.log('État:', reg.active ? 'Actif' : 'Inactif');
    console.log('Scope:', reg.scope);
  });
});
```

## 📊 Logs Utiles

Ouvrir la console et chercher :

```
[PWA] Service Worker prêt
[PWA] Page mise en cache: /
[PWA] Page mise en cache: /reparations
[PWA] Page mise en cache: /luc
```

Si vous voyez ces messages, le pré-cache fonctionne !

## 🎯 Test Avancé : Simulation Serveur Coupé

### Étape 1 : Préparer

1. Démarrer l'application : `npm start`
2. Visiter toutes les pages
3. Attendre 10 secondes

### Étape 2 : Couper le Serveur

Dans le terminal où tourne `npm start`, appuyer sur `Ctrl+C`

### Étape 3 : Tester

1. Dans le navigateur, actualiser la page (F5)
2. **✅ L'application devrait continuer de fonctionner**
3. Naviguer entre les pages
4. **✅ Tout devrait fonctionner**

### Étape 4 : Redémarrer

```bash
npm start
```

L'application se synchronise automatiquement.

## 📈 Métriques de Performance

| Action | Temps Attendu |
|--------|---------------|
| Chargement page offline | < 200ms |
| Navigation offline | < 100ms |
| API depuis cache | < 50ms |
| Actualisation offline | < 300ms |

## ✨ Fonctionnalités Testées

- [x] Chargement initial offline
- [x] Actualisation offline
- [x] Navigation entre pages
- [x] Données API en cache
- [x] Images en cache
- [x] Ressources statiques en cache
- [x] Indicateur de connexion
- [x] Fallback vers offline.html
- [x] Synchronisation au retour en ligne

## 🎓 Comprendre le Fonctionnement

### Workflow du Cache

```
1. Première visite (en ligne)
   ↓
2. Service Worker s'installe
   ↓
3. PWAInstaller pré-cache les pages principales
   ↓
4. Navigation → Pages mises en cache automatiquement
   ↓
5. API appelées → Réponses mises en cache
   ↓
6. Mode offline activé
   ↓
7. Actualisation → Pages servies depuis le cache
   ↓
8. Navigation → Fonctionne avec le cache
   ↓
9. Retour en ligne → Synchronisation automatique
```

### Stratégies de Cache Utilisées

| Ressource | Stratégie | Timeout | Durée |
|-----------|-----------|---------|-------|
| Pages HTML | NetworkFirst | 3s | 7 jours |
| Ressources _next | CacheFirst | - | 30 jours |
| API | NetworkFirst | 3s | 7 jours |
| Images | CacheFirst | - | 30 jours |
| JS/CSS | CacheFirst | - | 30 jours |

## 🚀 Prêt pour la Production

Une fois tous les tests passés, l'application est prête pour :
- Déploiement en production
- Utilisation sur mobile
- Installation comme PWA
- Fonctionnement offline complet

Bonne chance ! 🎉
