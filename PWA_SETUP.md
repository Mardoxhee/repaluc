# Configuration PWA - Suivi des Victimes

## ✅ Configuration Terminée

L'application a été configurée comme une Progressive Web App (PWA) avec support offline complet.

## 📋 Fichiers Créés/Modifiés

### 1. Configuration Next.js
- **`next.config.ts`** : Ajout de next-pwa avec stratégies de cache
- **`next-pwa.d.ts`** : Déclarations TypeScript pour next-pwa

### 2. Fichiers PWA
- **`public/manifest.json`** : Manifeste de l'application PWA
- **`public/icon.svg`** : Icône SVG de l'application
- **`public/offline.html`** : Page affichée en mode hors ligne
- **`public/generate-icons.html`** : Générateur d'icônes PNG

### 3. Layout
- **`app/layout.tsx`** : Ajout des métadonnées PWA et liens vers le manifeste

## 🚀 Étapes pour Finaliser

### 1. Générer les Icônes PNG

Ouvrez `public/generate-icons.html` dans un navigateur. Les icônes seront automatiquement générées et téléchargées :
- `icon-192x192.png`
- `icon-512x512.png`

Placez ces fichiers dans le dossier `public/`.

### 2. Build de Production

```bash
npm run build
```

Cela générera automatiquement :
- `public/sw.js` (Service Worker)
- `public/workbox-*.js` (Fichiers Workbox)

### 3. Démarrer en Production

```bash
npm start
```

## 📱 Fonctionnalités PWA

### ✅ Installable
- L'application peut être installée sur mobile et desktop
- Icône sur l'écran d'accueil
- Expérience native

### ✅ Mode Offline
- **Pages** : Toutes les pages visitées sont mises en cache
- **API** : Les requêtes API sont mises en cache avec stratégie NetworkFirst
- **Images** : Cache des images avec stratégie CacheFirst
- **Ressources statiques** : JS, CSS, fonts avec stratégie StaleWhileRevalidate

### ✅ Stratégies de Cache

1. **Google Fonts** : CacheFirst (1 an)
2. **Images** : CacheFirst (30 jours, max 64 entrées)
3. **API (10.140.0.104:8007 & 10.140.0.106:8006)** : NetworkFirst avec timeout 10s (1 jour, max 200 entrées)
4. **Ressources statiques** : StaleWhileRevalidate (1 jour, max 32 entrées)

## 🧪 Tester la PWA

### Sur Desktop (Chrome/Edge)

1. Ouvrez l'application en production
2. Cliquez sur l'icône d'installation dans la barre d'adresse
3. Testez le mode offline :
   - Ouvrez DevTools > Application > Service Workers
   - Cochez "Offline"
   - Naviguez dans l'application

### Sur Mobile

1. Ouvrez l'application dans Chrome/Safari
2. Menu > "Ajouter à l'écran d'accueil"
3. L'application s'ouvre en mode standalone
4. Testez en mode avion

## 🔧 Configuration Avancée

### Modifier les Stratégies de Cache

Éditez `next.config.ts` section `runtimeCaching` pour ajuster :
- Les patterns d'URL
- Les handlers (CacheFirst, NetworkFirst, StaleWhileRevalidate)
- Les durées d'expiration
- Le nombre max d'entrées

### Ajouter des Routes Offline

Les routes sont automatiquement mises en cache lors de la navigation. Pour pré-cacher des routes spécifiques, ajoutez-les dans le service worker.

## 📊 Monitoring

### Vérifier le Service Worker

```javascript
// Dans la console du navigateur
navigator.serviceWorker.getRegistrations().then(registrations => {
  console.log('Service Workers actifs:', registrations);
});
```

### Vérifier le Cache

```javascript
// Dans la console du navigateur
caches.keys().then(keys => {
  console.log('Caches disponibles:', keys);
});
```

## ⚠️ Notes Importantes

1. **Développement** : Le service worker est désactivé en mode dev pour éviter les problèmes de cache
2. **HTTPS** : En production, servez l'application via HTTPS (requis pour les service workers)
3. **Cache** : Les données API sont mises en cache pendant 24h. Ajustez selon vos besoins
4. **Mise à jour** : Le service worker se met à jour automatiquement lors du déploiement

## 🎨 Personnalisation

### Changer les Couleurs

Éditez `public/manifest.json` :
```json
{
  "theme_color": "#2563eb",
  "background_color": "#ffffff"
}
```

### Changer les Icônes

Remplacez les fichiers dans `public/` :
- `icon.svg`
- `icon-192x192.png`
- `icon-512x512.png`

## 🐛 Dépannage

### Le Service Worker ne s'installe pas

1. Vérifiez que vous êtes en mode production
2. Vérifiez la console pour les erreurs
3. Effacez le cache et rechargez

### Les données ne se mettent pas en cache

1. Vérifiez les patterns d'URL dans `next.config.ts`
2. Vérifiez que les requêtes retournent un statut 200
3. Consultez DevTools > Application > Cache Storage

### L'application ne fonctionne pas offline

1. Visitez d'abord toutes les pages en ligne
2. Vérifiez que le service worker est actif
3. Consultez `offline.html` pour le fallback

## 📚 Ressources

- [Next PWA Documentation](https://github.com/shadowwalker/next-pwa)
- [Workbox Strategies](https://developer.chrome.com/docs/workbox/modules/workbox-strategies/)
- [PWA Best Practices](https://web.dev/pwa/)

## ✨ Prochaines Étapes

1. ✅ Générer les icônes PNG
2. ✅ Build de production
3. ✅ Tester l'installation
4. ✅ Tester le mode offline
5. ✅ Déployer en production avec HTTPS
