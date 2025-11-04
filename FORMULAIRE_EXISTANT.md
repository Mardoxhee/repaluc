# Affichage du Formulaire Existant - Documentation

## 🎯 Fonctionnalité Implémentée

Le système vérifie maintenant automatiquement si une victime a déjà rempli un formulaire Plan de Vie et affiche soit :
- ✅ Le formulaire rempli (mode lecture)
- ✅ Le formulaire vierge (mode édition)

## 🔄 Workflow

```
1. Utilisateur clique sur "Plan de vie"
   ↓
2. Vérification automatique via API
   GET /plan-vie-enquette/victime/:idVictime
   ↓
3a. Si formulaire existe → Affichage en mode lecture
3b. Si pas de formulaire → Affichage du formulaire vierge
   ↓
4. En mode lecture :
   - Bouton "Modifier" → Pré-remplit et passe en mode édition
   - Bouton "Imprimer" → Impression du formulaire
```

## 📡 API Endpoint

### Vérification du formulaire existant

```
GET http://10.140.0.104:8007/plan-vie-enquette/victime/:idVictime
```

**Réponse si formulaire existe :**
```json
{
  "createdAt": "2025-11-04T12:12:36.013Z",
  "updatedAt": "2025-11-04T12:12:36.013Z",
  "deletedAt": null,
  "id": 3,
  "status": "Draft",
  "victimeId": 49,
  "isSign": false,
  "planVieQuestion": [
    {
      "createdAt": "2025-11-04T12:12:36.059Z",
      "updatedAt": "2025-11-04T12:12:36.059Z",
      "deletedAt": null,
      "id": 65,
      "reponse": "35",
      "obs": null,
      "questionId": 592,
      "planVieId": 3,
      "question": {
        "id": 592,
        "question": "Âge",
        "categorieId": 29,
        "reponseType": "number",
        "ordre": 2,
        "visible": true,
        "numeroQuestion": "Q.2"
      }
    },
    {
      "id": 66,
      "reponse": "Jean Dupont",
      "obs": "Observation spéciale",
      "questionId": 591,
      "planVieId": 3,
      "question": {
        "id": 591,
        "question": "Nom complet",
        "reponseType": "text",
        "ordre": 1,
        "numeroQuestion": "Q.1"
      }
    }
  ]
}
```

**Réponse si pas de formulaire :**
- Status 404 ou réponse vide

## 🎨 Mode Lecture (Formulaire Existant)

### Affichage

- **Header** : Titre "Plan de Vie - Formulaire Rempli"
- **Statut** : Affichage du statut (Draft, Completed, etc.)
- **Signature** : Indicateur visuel si signé (✓ Signé)
- **Réponses** : Organisées par catégories
- **Design** : Fond bleu clair pour les réponses

### Actions disponibles

1. **Imprimer** (bouton bleu)
   - Ouvre la boîte de dialogue d'impression
   - Le formulaire est optimisé pour l'impression

2. **Modifier** (bouton violet)
   - Pré-remplit le formulaire avec les données existantes
   - Passe en mode édition
   - Permet de modifier et re-soumettre

## 🔧 Fonctionnalités Techniques

### 1. Vérification automatique

```typescript
const checkExistingForm = async () => {
  const response = await fetch(
    `http://10.140.0.104:8007/plan-vie-enquette/victime/${victim.id}`
  );
  
  if (response.ok) {
    const data = await response.json();
    // Nouvelle structure avec planVieQuestion
    if (data && data.planVieQuestion && data.planVieQuestion.length > 0) {
      setExistingForm(data);
      setHasExistingForm(true);
    }
  }
};
```

### 2. Pré-remplissage intelligent

```typescript
// Détection automatique du type de réponse
const responses = existingForm.planVieQuestion || [];

responses.forEach((item) => {
  const reponse = item.reponse;
  if (reponse && reponse.includes(',')) {
    // Checkbox : convertir en tableau
    prefilledData[item.questionId] = reponse.split(',').map(s => s.trim());
  } else {
    // Text/Number/Radio : valeur directe
    prefilledData[item.questionId] = reponse;
  }
});
```

### 3. États du composant

```typescript
const [existingForm, setExistingForm] = useState<any>(null);
const [hasExistingForm, setHasExistingForm] = useState(false);
const [checkingExisting, setCheckingExisting] = useState(true);
```

## 📊 Affichage des Réponses

### Structure

```
┌─────────────────────────────────────────┐
│ Plan de Vie - Formulaire Rempli        │
│ Statut: Draft  ✓ Signé                 │
│                    [Imprimer] [Modifier]│
├─────────────────────────────────────────┤
│                                         │
│ ┌─ Informations générales ────────────┐│
│ │                                      ││
│ │ Q.1 Nom complet                      ││
│ │ └─> Jean Dupont                      ││
│ │                                      ││
│ │ Q.2 Âge                              ││
│ │ └─> 35                               ││
│ └──────────────────────────────────────┘│
│                                         │
│ ┌─ Dimension médicale ─────────────────┐│
│ │                                      ││
│ │ Q.8 Avez-vous des problèmes...       ││
│ │ └─> Oui                              ││
│ └──────────────────────────────────────┘│
└─────────────────────────────────────────┘
```

## 🎨 Design

### Couleurs

- **Header** : Violet `#901c67`
- **Numéros de questions** : Violet `#901c67`
- **Réponses** : Fond bleu clair `bg-blue-50` avec bordure `border-blue-200`
- **Bordure gauche** : Bleu `border-blue-600`

### Responsive

- Adapté pour mobile et desktop
- Optimisé pour l'impression

## 🔄 Modification du Formulaire

### Processus

1. Utilisateur clique sur "Modifier"
2. Le système :
   - Récupère toutes les réponses
   - Convertit les checkboxes (string → array)
   - Pré-remplit `formData`
   - Passe en mode édition
3. L'utilisateur peut modifier les réponses
4. À la soumission :
   - Même endpoint POST
   - Mise à jour du formulaire existant

### Gestion des types

| Type Question | Stockage API | Affichage | Pré-remplissage |
|--------------|--------------|-----------|-----------------|
| Text | String | Texte simple | String direct |
| Number | String | Nombre | String direct |
| Textarea | String | Texte multi-lignes | String direct |
| Radio | String | Option sélectionnée | String direct |
| Checkbox | String (CSV) | Liste d'options | Array (split par ',') |

## 🖨️ Impression

### Fonctionnalité

```typescript
<button onClick={() => window.print()}>
  Imprimer
</button>
```

### Optimisations

- Mise en page adaptée pour A4
- Suppression des boutons à l'impression (via CSS)
- Conservation des couleurs et structure

## 🐛 Gestion des Erreurs

### Scénarios

1. **API inaccessible**
   - Affiche le formulaire vierge
   - Log l'erreur en console

2. **Réponse vide**
   - Considéré comme "pas de formulaire"
   - Affiche le formulaire vierge

3. **Données corrompues**
   - Affiche les données disponibles
   - Ignore les réponses invalides

## 📈 Améliorations Futures

- [ ] Historique des modifications
- [ ] Comparaison de versions
- [ ] Export PDF personnalisé
- [ ] Signature électronique
- [ ] Validation des modifications
- [ ] Commentaires sur les réponses
- [ ] Notifications de mise à jour
- [ ] Mode collaboratif

## 🧪 Tests

### Cas de test

1. ✅ Victime sans formulaire → Affiche formulaire vierge
2. ✅ Victime avec formulaire → Affiche formulaire rempli
3. ✅ Clic sur "Modifier" → Pré-remplit correctement
4. ✅ Modification et soumission → Met à jour
5. ✅ Impression → Format correct
6. ✅ Réponses checkbox → Conversion correcte

### Commandes de test

```javascript
// Dans la console du navigateur
// Vérifier l'état
console.log('Has existing form:', hasExistingForm);
console.log('Existing form data:', existingForm);
console.log('Form data:', formData);
```

## 📞 Support

Pour toute question :
- Code source : `/app/reparations/components/formulaireplandevie.tsx`
- Documentation API : Contacter l'équipe backend
- Issues : Créer un ticket avec captures d'écran
