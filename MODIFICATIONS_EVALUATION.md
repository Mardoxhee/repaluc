# Modifications du système d'évaluation médicale

## Changements effectués

### 1. Optimisation des requêtes API
- **Problème** : Vérification automatique de l'évaluation pour chaque victime de la liste (N requêtes)
- **Solution** : Vérification uniquement au clic sur le bouton "Voir l'évaluation"
- **Impact** : Passage de N+1 requêtes à 1 seule requête au chargement de la liste

### 2. Déplacement du bouton "Voir l'évaluation"
- **Avant** : Bouton dans la liste des victimes
- **Maintenant** : Bouton dans l'onglet "Informations" du modal de détails de la victime
- **Avantage** : Interface plus épurée et logique d'accès améliorée

### 3. Verrouillage des champs pré-remplis
- **Fonctionnalité** : Les champs ayant déjà du contenu dans une évaluation existante sont automatiquement :
  - Pré-remplis avec les données existantes
  - Grisés (background gris)
  - Désactivés (non modifiables)
- **Composant créé** : `EvaluationInput.tsx` - Composant réutilisable qui gère automatiquement l'état de verrouillage
- **Message d'information** : Bannière amber qui s'affiche quand une évaluation existante est détectée

## Fichiers modifiés

1. **ListVictims.tsx**
   - Suppression de `checkVictimEvaluations()` qui faisait N requêtes
   - Ajout de `handleViewEvaluation()` qui vérifie au clic
   - Passage de la fonction au modal de détails via props

2. **VictimDetailModal.tsx**
   - Ajout du bouton "Voir le rapport d'évaluation" dans l'onglet "Informations"
   - Affichage conditionnel basé sur le statut de la victime

3. **evaluation.tsx**
   - Ajout de `existingEvaluation` state pour tracker l'évaluation existante
   - Ajout de `isFieldDisabled()` - fonction helper pour vérifier si un champ doit être verrouillé
   - Ajout de `getInputClassName()` - fonction helper pour les classes CSS
   - Remplacement des inputs standards par le composant `EvaluationInput`
   - Bannière d'information quand une évaluation existe

4. **EvaluationInput.tsx** (nouveau fichier)
   - Composant générique pour input/textarea/select
   - Gère automatiquement le verrouillage avec la prop `isLocked`
   - Applique les styles appropriés (gris + cursor-not-allowed)

## Utilisation

### Pour vérifier si une victime a une évaluation :
1. Cliquer sur "Détails" dans la liste
2. Dans l'onglet "Informations", vérifier la section "Évaluation Médicale"
3. Le bouton "Voir le rapport d'évaluation" apparaît si la victime a un statut "Évalué" ou "Contrôlé"
4. Au clic, vérification API et ouverture du modal ou message d'information

### Lors de la modification d'une évaluation :
- Les champs déjà remplis apparaissent en gris et ne peuvent pas être modifiés
- Seuls les champs vides peuvent être complétés
- Un message d'avertissement s'affiche en haut de la première étape
