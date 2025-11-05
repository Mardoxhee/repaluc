# 🔐 Variables d'Environnement

## 📋 Configuration Requise

Créez un fichier `.env.local` à la racine du projet avec les variables suivantes :

```bash
# API Base URL (Victimes, Documents)
NEXT_PUBLIC_API_BASE_URL=http://10.140.0.106:8006

# API Plan de Vie
NEXT_PUBLIC_API_PLANVIE_URL=http://10.140.0.104:8007

# URL de Logout
NEXT_PUBLIC_LOGOUT_URL=http://10.140.0.106:4201/login
```

## 📝 Description des Variables

### `NEXT_PUBLIC_API_BASE_URL`
- **Utilisation** : API principale pour les victimes et documents
- **Endpoints** :
  - `/victime/*` - Gestion des victimes
  - `/victime/document/*` - Documents des victimes
  - `/minio/files/*` - Fichiers MinIO
  - `/minio/files/upload` - Upload de fichiers

### `NEXT_PUBLIC_API_PLANVIE_URL`
- **Utilisation** : API pour le formulaire Plan de Vie
- **Endpoints** :
  - `/plan-vie-enquette/victime/:id` - Récupérer le formulaire d'une victime
  - `/plan-vie-enquette` - Créer/Mettre à jour un formulaire
  - `/question/type/plandevie` - Récupérer les questions

### `NEXT_PUBLIC_LOGOUT_URL`
- **Utilisation** : URL de redirection lors de la déconnexion
- **Endpoint** : Page de login

## 🔒 Sécurité

⚠️ **Important** :
- Ne jamais committer le fichier `.env.local`
- Utiliser `NEXT_PUBLIC_` uniquement pour les variables côté client
- Les URLs sont maintenant configurables par environnement

## 🚀 Utilisation

### Développement Local

```bash
# Copier le template
cp ENV_VARIABLES.md .env.local

# Éditer avec vos URLs
nano .env.local
```

### Production

Configurez les variables d'environnement dans votre plateforme de déploiement (Vercel, Netlify, etc.)

## 📦 Fichiers Modifiés

Les fichiers suivants utilisent maintenant les variables d'environnement :

1. **`app/reparations/components/formulaireplandevie.tsx`**
   - `API_PLANVIE_URL` pour tous les endpoints Plan de Vie

2. **`app/luc/components/VictimDetailModal.tsx`**
   - `NEXT_PUBLIC_API_BASE_URL` pour les victimes et documents

3. **`app/reparations/components/VictimDetailModal.tsx`**
   - `NEXT_PUBLIC_API_BASE_URL` pour les victimes et documents

4. **`components/layouts/header.tsx`**
   - `NEXT_PUBLIC_LOGOUT_URL` pour la déconnexion

5. **`app/context/FetchContext.tsx`**
   - `NEXT_PUBLIC_API_BASE_URL` comme base URL par défaut

## ✅ Vérification

Pour vérifier que les variables sont bien chargées :

```javascript
// Dans la console du navigateur
console.log('API Base:', process.env.NEXT_PUBLIC_API_BASE_URL);
console.log('API Plan de Vie:', process.env.NEXT_PUBLIC_API_PLANVIE_URL);
console.log('Logout URL:', process.env.NEXT_PUBLIC_LOGOUT_URL);
```

## 🔄 Fallback

Si une variable n'est pas définie, le code utilise les valeurs par défaut :

```typescript
const API_PLANVIE_URL = process.env.NEXT_PUBLIC_API_PLANVIE_URL || 'http://10.140.0.104:8007';
const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://10.140.0.106:8006';
const logoutUrl = process.env.NEXT_PUBLIC_LOGOUT_URL || 'http://10.140.0.106:4201/login';
```

⚠️ **Recommandation** : Toujours définir les variables pour éviter d'exposer les URLs par défaut.

---

**Créé le** : 2025-11-04  
**Dernière mise à jour** : 2025-11-04
