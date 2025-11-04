# Formulaire Plan de Vie - Documentation

## 📋 Vue d'ensemble

Le formulaire Plan de Vie permet de collecter des informations détaillées sur les victimes à travers un questionnaire dynamique organisé par catégories.

## 🎯 Fonctionnalités

### ✅ Chargement dynamique des questions
- Récupération depuis l'API : `http://10.140.0.104:8007/question/type/plandevie`
- Organisation par catégories
- Tri automatique par ordre

### ✅ Types de questions supportés
- **Text** : Champs de texte simple
- **Number** : Champs numériques
- **Textarea** : Zones de texte multi-lignes
- **Radio** : Choix unique avec assertions dynamiques
- **Checkbox** : Choix multiples avec assertions dynamiques

### ✅ Branchement conditionnel
- Les questions avec option "Autre" déclenchent l'affichage de la question suivante
- Masquage automatique des questions non pertinentes

### ✅ Navigation
- Navigation par catégories (onglets)
- Boutons Précédent/Suivant
- Barre de progression

### ✅ Sauvegarde
- Validation des données
- Format de payload standardisé
- Envoi vers l'API

## 🔧 Utilisation

### Dans VictimDetailModal

```tsx
<Formulaireplandevie 
  victim={currentVictim} 
  userId={1} 
/>
```

### Props

| Prop | Type | Requis | Description |
|------|------|--------|-------------|
| `victim` | `Victim` | Optionnel | Objet victime avec au minimum `{ id: number }` |
| `userId` | `number` | Optionnel | ID de l'utilisateur (défaut: 1) |

## 📤 Format de soumission

### Endpoint
```
POST http://10.140.0.104:8007/plan-vie-enquette
```

### Payload

```json
{
  "userId": 12,
  "victimeId": 45,
  "status": "Draft",
  "isSign": false,
  "questionResponse": [
    {
      "questionId": 591,
      "reponse": "Jean Dupont"
    },
    {
      "questionId": 592,
      "reponse": "35"
    },
    {
      "questionId": 593,
      "reponse": "M"
    },
    {
      "questionId": 600,
      "reponse": "Soins généraux, Chirurgie réparatrice, Médicaments réguliers"
    }
  ]
}
```

### Traitement des réponses

- **Text/Number/Textarea/Radio** : Valeur directe convertie en string
- **Checkbox** : Tableau de valeurs joint par ", "
- **Réponses vides** : Filtrées automatiquement

## 🎨 Design

### Charte graphique
- **Couleur principale** : Violet `#901c67`
- **Couleur secondaire** : Bleu `#2563eb`
- **Fond** : Gris clair `bg-gray-50`
- **Champs** : Blanc `bg-white`

### Éléments visuels
- Bordure gauche bleue sur chaque question
- Numéros de questions avec fond violet
- Headers de sections en violet
- Boutons de navigation en violet/bleu

## 🔀 Logique de branchement

### Règles

1. Si une question a des assertions ET contient "Autre"
2. La question suivante (ordre + 1) ne s'affiche que si "Autre" est sélectionné
3. Pour les radio : vérification de la valeur exacte
4. Pour les checkbox : vérification si "Autre" est dans le tableau

### Exemple

```
Q.9 : Quels types de soins ? (checkbox)
  - Soins généraux
  - Chirurgie
  - Autre ✓ (sélectionné)

Q.9.1 : Autre (text) → S'AFFICHE car "Autre" coché en Q.9
```

## 🚨 Validations

### Avant soumission

1. ✅ Vérification de la présence de `victim.id`
2. ✅ Vérification d'au moins une réponse
3. ✅ Filtrage des réponses vides

### Messages d'erreur

- **Pas de victime** : "Aucune victime sélectionnée"
- **Formulaire vide** : "Veuillez répondre à au moins une question"
- **Erreur API** : Message d'erreur du serveur

## 📊 Structure des données

### Question (API)

```typescript
interface Question {
  id: number;
  question: string;
  categorie: string;
  branchement: any[];
  type: 'text' | 'number' | 'radio' | 'checkbox' | 'textarea';
  numero: string;
  visible: boolean;
  ordre: number;
  assertions: Assertion[];
}

interface Assertion {
  id: number;
  text: string;
}
```

### Réponse API (Retour)

```typescript
interface QuestionsByCategory {
  [category: string]: Question[];
}
```

Exemple :
```json
{
  "Informations générales": [
    { "id": 591, "question": "Nom complet", ... },
    { "id": 592, "question": "Âge", ... }
  ],
  "Dimension médicale": [
    { "id": 598, "question": "Avez-vous des problèmes de santé", ... }
  ]
}
```

## 🔄 Workflow

```
1. Chargement du composant
   ↓
2. Fetch des questions depuis l'API
   ↓
3. Organisation par catégories
   ↓
4. Affichage de la première catégorie
   ↓
5. L'utilisateur remplit le formulaire
   ↓
6. Navigation entre catégories
   ↓
7. Soumission
   ↓
8. Validation des données
   ↓
9. Construction du payload
   ↓
10. POST vers l'API
    ↓
11. Affichage du résultat
```

## 🐛 Debugging

### Console logs

Le composant log automatiquement :
- ✅ Payload avant envoi
- ✅ Réponse du serveur
- ✅ Erreurs éventuelles

### Vérifier les données

```javascript
// Dans la console du navigateur
// Après avoir rempli le formulaire
console.log('Form data:', formData);
```

## 🎯 Améliorations futures

- [ ] Sauvegarde automatique (brouillon)
- [ ] Validation par champ
- [ ] Indicateurs de champs obligatoires
- [ ] Export PDF du formulaire rempli
- [ ] Historique des modifications
- [ ] Mode signature électronique
- [ ] Support des pièces jointes
- [ ] Traduction multilingue

## 📞 Support

Pour toute question ou problème, consulter :
- Code source : `/app/reparations/components/formulaireplandevie.tsx`
- API Documentation : Contacter l'équipe backend
