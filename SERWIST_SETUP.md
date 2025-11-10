# Configuration Serwist pour l'accès hors ligne

## 📦 Packages installés

```bash
npm install @serwist/next serwist
```

## 🔧 Configuration

### 1. Service Worker (`app/sw.ts`)
Le Service Worker utilise Serwist avec :
- **Precaching** : Toutes les ressources statiques sont précachées
- **Runtime Caching** : Configuration par défaut de `@serwist/next/worker`
- **Skip Waiting** : Activation immédiate du nouveau SW
- **Clients Claim** : Prise de contrôle immédiate des clients
- **Navigation Preload** : Amélioration des performances de navigation

### 2. Configuration Next.js (`next.config.ts`)
```typescript
import withSerwistInit from "@serwist/next";

const withSerwist = withSerwistInit({
  swSrc: "app/sw.ts",           // Source du Service Worker
  swDest: "public/sw.js",       // Destination après build
  disable: process.env.NODE_ENV === "development", // Désactivé en dev
  cacheOnNavigation: true,      // Cache lors de la navigation
  reloadOnOnline: true,         // Recharge quand la connexion revient
});
```

### 3. Provider Client (`app/components/SerwistProvider.tsx`)
Composant qui :
- Enregistre le Service Worker en production
- Vérifie les mises à jour toutes les heures
- Écoute les changements de statut en ligne/hors ligne
- Logs les événements dans la console

### 4. Page Offline (`app/offline/page.tsx`)
Page affichée quand l'utilisateur est hors ligne et qu'aucune version cachée n'est disponible.

## 🚀 Utilisation

### Build de production
```bash
npm run build
npm start
```

### Vérification
1. Ouvrez l'application en production
2. Ouvrez les DevTools (F12) → Application → Service Workers
3. Vous devriez voir le SW enregistré avec le scope `/`
4. Testez en mode hors ligne (DevTools → Network → Offline)

## 📊 Stratégies de cache

Le Service Worker utilise `defaultCache` de Serwist qui inclut :

1. **CacheFirst** pour :
   - Ressources statiques (_next/*, CSS, JS, fonts)
   - Images (png, jpg, svg, etc.)
   - Google Fonts

2. **NetworkFirst** pour :
   - Pages HTML (navigation)
   - API calls (avec fallback au cache)

3. **Fallback** :
   - Page `/offline` si aucune version cachée n'existe

## 🔍 Debugging

### Console logs
- ✅ Service Worker enregistré
- 🌐 Connexion rétablie
- 📡 Connexion perdue - Mode hors ligne

### Chrome DevTools
- **Application → Service Workers** : Statut du SW
- **Application → Cache Storage** : Contenu des caches
- **Network → Offline** : Tester le mode hors ligne

## 📝 Notes importantes

1. **Mode développement** : Le Service Worker est désactivé pour éviter les problèmes de cache
2. **HTTPS requis** : Les Service Workers nécessitent HTTPS (sauf localhost)
3. **Mise à jour** : Le SW vérifie automatiquement les mises à jour toutes les heures
4. **Anciens fichiers** : Les fichiers `sw-custom.js` et `sw-precache.js` de next-pwa peuvent être supprimés

## 🔄 Migration depuis next-pwa

Les changements effectués :
1. ✅ Désinstallation de `next-pwa`
2. ✅ Installation de `@serwist/next` et `serwist`
3. ✅ Création de `app/sw.ts`
4. ✅ Mise à jour de `next.config.ts`
5. ✅ Ajout de `SerwistProvider` dans le layout
6. ✅ Création de la page `/offline`

## 🎯 Avantages de Serwist

- ✅ Meilleure maintenance (successeur officiel de next-pwa)
- ✅ TypeScript natif
- ✅ Meilleures performances
- ✅ API plus moderne et flexible
- ✅ Support Next.js 15+
