# Guide : Filtre par Préjudice Final

## 📍 Localisation
**Page** : `/reparations` → Onglet **"Victimes"** → Bouton **"Filtres avancés"**

## 🎯 Objectif
Permettre de filtrer la liste des victimes par leur **préjudice final** en utilisant le constructeur de filtres avancés qui envoie une requête API avec le paramètre `prejudiceFinal`.

## 📋 Les 4 préjudices finaux disponibles

1. **Perte de vie**
2. **Perte économique**
3. **Atteinte à l'intégrité physique**
4. **Autre** (l'utilisateur peut saisir une valeur personnalisée)

## 🔧 Comment utiliser le filtre

### Étape 1 : Ouvrir le constructeur de filtres
1. Allez dans `/reparations`
2. Cliquez sur l'onglet **"Victimes"**
3. Cliquez sur le bouton **"Filtres avancés"** (icône Filter)

### Étape 2 : Ajouter un filtre
1. Cliquez sur **"Ajouter un filtre"**
2. Dans le menu déroulant **"Champ"**, sélectionnez **"Préjudice Final"**

### Étape 3 : Choisir l'opérateur
Sélectionnez l'opérateur souhaité :
- **"Égal à"** : Pour une correspondance exacte
- **"Contient"** : Pour une recherche partielle (si disponible)

### Étape 4 : Sélectionner la valeur
Dans le menu déroulant **"Valeur"**, choisissez :
- **Perte de vie**
- **Perte économique**
- **Atteinte à l'intégrité physique**
- **Autre** (puis saisir une valeur personnalisée)

### Étape 5 : Appliquer le filtre
Le filtre s'applique automatiquement et envoie une requête API avec le paramètre `prejudiceFinal`.

## 🌐 Requête API générée

### Exemple 1 : Filtre "Perte de vie"
```
GET /victime/paginate/filtered?page=1&limit=20&prejudiceFinal=Perte de vie
```

### Exemple 2 : Filtre "Autre" avec valeur personnalisée
```
GET /victime/paginate/filtered?page=1&limit=20&prejudiceFinal=Séquestration
```

### Exemple 3 : Combinaison avec d'autres filtres
```
GET /victime/paginate/filtered?page=1&limit=20&province=Kinshasa&prejudiceFinal=Atteinte à l'intégrité physique
```

## 📊 Interface utilisateur

### Constructeur de filtres
```
┌─────────────────────────────────────────────────────────┐
│  Constructeur de filtres                                │
├─────────────────────────────────────────────────────────┤
│  [+ Ajouter un filtre]  [Réinitialiser]                │
├─────────────────────────────────────────────────────────┤
│  Filtre 1:                                              │
│  ┌──────────────┐  ┌──────────┐  ┌──────────────────┐  │
│  │ Champ        │  │ Opérateur│  │ Valeur           │  │
│  │ Préjudice    │  │ Égal à   │  │ Perte de vie     │  │
│  │ Final     ▼  │  │       ▼  │  │               ▼  │  │
│  └──────────────┘  └──────────┘  └──────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### Sélection "Autre"
Quand l'utilisateur sélectionne **"Autre"** dans la valeur, il peut :
- Soit choisir "Autre" tel quel
- Soit saisir une valeur personnalisée dans le champ texte

## 🔍 Différence avec le filtre `filtreComponent.tsx`

| Aspect | `ListVictims.tsx` (Filtres avancés) | `filtreComponent.tsx` |
|--------|--------------------------------------|------------------------|
| **Type** | Filtre côté serveur (API) | Filtre côté client |
| **Paramètre** | `prejudiceFinal` | `prejudicesSubis` |
| **Options** | 4 préjudices + Autre | 5 préjudices mock |
| **Requête** | Envoie à l'API | Filtre local |
| **Usage** | Liste principale des victimes | Panneau de filtres rapides |

## ✅ Avantages du filtre API

1. **Performance** : Filtre côté serveur pour grandes quantités de données
2. **Pagination** : Fonctionne avec la pagination
3. **Précision** : Utilise le champ `prejudiceFinal` de la base de données
4. **Flexibilité** : Combinable avec d'autres filtres (province, statut, etc.)
5. **Personnalisation** : Option "Autre" pour des cas spécifiques

## 📝 Exemples d'utilisation

### Cas 1 : Trouver toutes les victimes avec "Perte de vie"
1. Ajouter un filtre
2. Champ : **Préjudice Final**
3. Opérateur : **Égal à**
4. Valeur : **Perte de vie**
5. Résultat : Liste des victimes où `prejudiceFinal = "Perte de vie"`

### Cas 2 : Recherche personnalisée
1. Ajouter un filtre
2. Champ : **Préjudice Final**
3. Opérateur : **Égal à**
4. Valeur : **Autre** (puis saisir "Torture psychologique")
5. Résultat : Liste des victimes où `prejudiceFinal = "Torture psychologique"`

### Cas 3 : Combinaison de filtres
1. **Filtre 1** : Province = Kinshasa
2. **Filtre 2** : Préjudice Final = Atteinte à l'intégrité physique
3. **Filtre 3** : Statut = Confirmé
4. Résultat : Victimes confirmées à Kinshasa avec atteinte à l'intégrité physique

## 🔄 Flux de données

```
Interface utilisateur
    ↓
Sélection "Préjudice Final" + Valeur
    ↓
buildQueryParams() ajoute prejudiceFinal=...
    ↓
Requête API : GET /victime/paginate/filtered?prejudiceFinal=...
    ↓
Serveur filtre par le champ prejudiceFinal
    ↓
Retour des résultats filtrés
    ↓
Affichage dans la liste
```

## 🎨 Code implémenté

### Dans `ListVictims.tsx`
```typescript
const prejudiceFinalOptions = [
    "Perte de vie",
    "Perte économique",
    "Atteinte à l'intégrité physique",
    "Autre"
];

const filterFields = [
    // ... autres champs
    { 
        key: 'prejudiceFinal', 
        label: 'Préjudice Final', 
        type: 'select', 
        options: prejudiceFinalOptions 
    },
    // ... autres champs
];
```

### Génération de la requête
```typescript
const buildQueryParams = useCallback(() => {
    const params: Record<string, string> = {
        page: meta.page.toString(),
        limit: meta.limit.toString(),
    };

    if (search) params.nom = search;

    // Build filters from rules
    filterRules.forEach((rule) => {
        if (rule.value) params[rule.field] = rule.value;
        // Si rule.field = 'prejudiceFinal', ajoute prejudiceFinal=...
    });

    return new URLSearchParams(params).toString();
}, [meta.page, meta.limit, search, filterRules]);
```

## 🚀 Résultat final

L'utilisateur peut maintenant :
- ✅ Filtrer par **Préjudice Final** dans le constructeur de filtres avancés
- ✅ Choisir parmi **4 options prédéfinies** + **"Autre"**
- ✅ Saisir une **valeur personnalisée** pour "Autre"
- ✅ Combiner avec **d'autres filtres** (province, statut, etc.)
- ✅ Obtenir des résultats **filtrés côté serveur** via l'API
- ✅ Utiliser la **pagination** avec les filtres actifs
