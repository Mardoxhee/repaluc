# Créer un contrat

Cette route crée un contrat lié à une victime. Elle peut également créer, dans la même requête, un ou plusieurs plans d’indemnisation associés.

## Endpoint

```http
POST /contrat
Content-Type: application/json
```

En environnement local, avec le port par défaut :

```text
http://localhost:3000/contrat
```

## Corps de la requête

### Champs du contrat

| Champ | Type | Obligatoire | Description |
| --- | --- | --- | --- |
| `reparationAdministrative` | `string` | Oui | Type de réparation administrative accordée à la victime. |
| `typeContrat` | `string` | Oui | Type du contrat. |
| `reparationJudiciaire` | `string` | Non | Type de réparation judiciaire, si applicable. |
| `typePrejudiceReconnu` | `string` | Oui | Type de préjudice reconnu. |
| `montantTotalUSD` | `number` | Oui | Montant total en USD, avec au maximum deux décimales. |
| `droitAccompagnement` | `boolean` | Oui | Indique si le droit à l’accompagnement a été accordé. |
| `serviceMediateurUtilise` | `boolean` | Non | Indique si un service de médiation a été utilisé. |
| `recoursServiceMediation` | `boolean` | Non | Indique si la victime a eu recours au service de médiation. |
| `avocatAccompagnement` | `boolean` | Non | Indique si un avocat a accompagné la victime. |
| `comprisCesdroits` | `boolean` | Non | Indique si la victime comprend ses droits. |
| `exerceDroit` | `boolean` | Non | Indique si la victime exerce ses droits. |
| `nomComprisDroit` | `boolean` | Non | Indique si le nom de la personne ayant expliqué les droits est compris. |
| `copieEvaluations` | `boolean` | Non | Indique si une copie des évaluations a été remise. |
| `informeDroitVictime` | `boolean` | Non | Indique si la victime a été informée de ses droits. |
| `organisationAccompagnement` | `string` | Non | Organisation ayant accompagné la victime. |
| `incapableConsentir` | `boolean` | Oui | Indique si la victime est incapable de consentir elle-même. |
| `nomRepresentant` | `string` | Non | Nom du représentant légal. |
| `qualiteRepresentant` | `string` | Non | Qualité ou lien du représentant avec la victime. |
| `organisationRepresentant` | `string` | Non | Organisation représentante. |
| `pieceIdentiteRepresentant` | `string` | Non | Type de pièce d’identité du représentant. |
| `accepteReparation` | `boolean` | Oui | Indique si la victime accepte la réparation proposée. |
| `dateSignature` | `string` ISO 8601 | Oui | Date et heure de signature du contrat. |
| `lieuSignature` | `string` | Oui | Lieu de signature. |
| `signature` | `string` | Oui | Référence ou identifiant de la signature. |
| `victimeId` | `number` | Oui | Identifiant de la victime concernée. |
| `planIndemnisation` | `array` | Non | Plans d’indemnisation à créer avec le contrat. |

### Champs d’un plan d’indemnisation

| Champ | Type | Obligatoire | Description |
| --- | --- | --- | --- |
| `periode` | `string` | Oui | Période du paiement, par exemple `Nov 2026`. |
| `montantUSD` | `number` | Oui | Montant prévu en USD, avec au maximum deux décimales. |
| `statut` | `string` | Non | Statut du paiement. La valeur par défaut est `Planifier`. |
| `datePaiementEffectif` | `string` ISO 8601 | Non | Date effective du paiement. |
| `modePaiement` | `string` | Non | Mode de paiement, par exemple `Cash`, `Mobile Money` ou `Banque`. |
| `preuve` | `string` | Non | Lien ou référence de la preuve de paiement. |

Il n’est pas nécessaire d’envoyer `contratId` dans les plans : le lien est créé automatiquement lors de l’enregistrement du contrat.

## Correspondance avec le contrat à dynamiser

Les commentaires ci-dessous indiquent où chaque valeur doit être utilisée dans le contrat affiché. Le format est du `JSONC` (JSON avec commentaires) : il sert de guide au développement et ne doit pas être envoyé directement à l’API, car un véritable corps JSON ne peut pas contenir de commentaires.

```jsonc
{
  "reparationAdministrative": "Indemnisation financière", // Texte de la mesure proposée : « une indemnisation ... vous est proposée, en tant que mesure de réparation administrative ».
  "typeContrat": "Contrat de réparation", // Nature ou titre du document ; permet de sélectionner le modèle de contrat à afficher.
  "reparationJudiciaire": "Jugement favorable", // Réparation judiciaire reconnue, si elle doit apparaître dans une section judiciaire du contrat.
  "typePrejudiceReconnu": "Perte économique", // Valeur affichée sous « A été reconnue comme victime du préjudice suivant ».
  "montantTotalUSD": 2500.75, // Montant global affiché dans le paragraphe d’indemnisation et dans le total des tranches.

  "droitAccompagnement": true, // Active ou coche le bloc général « Droit à l’accompagnement ».
  "serviceMediateurUtilise": false, // Indique qu’un service de médiation a réellement été utilisé ; utile pour l’état ou l’historique du dossier.
  "recoursServiceMediation": true, // Coche « À faire recours aux services du Médiateur » dans les droits communiqués à la victime.
  "avocatAccompagnement": true, // Indique que la victime est accompagnée par un avocat ; participe à la ligne sur l’accompagnement juridique.
  "comprisCesdroits": true, // Indique globalement que la victime déclare avoir compris les droits expliqués.
  "exerceDroit": true, // Coche « Avoir exercé ce droit avant de donner son consentement ».
  "nomComprisDroit": false, // Coche « Avoir compris ce droit, mais avoir choisi de ne pas y recourir ».
  "copieEvaluations": true, // Coche « Une copie de l’évaluation médicale/psychosociale est jointe... ».
  "informeDroitVictime": true, // Coche l’attestation finale indiquant que le signataire a été informé des droits de la victime.
  "organisationAccompagnement": "ONG Justice pour Tous", // Nom injecté dans la phrase sur l’organisation qui accompagne la victime dans son parcours.

  "incapableConsentir": true, // Coche « La victime est en situation d’incapacité permanente ou temporaire à consentir seule » et affiche le bloc du représentant.
  "nomRepresentant": "Jean Mulenda", // Valeur affichée à côté de « Nom du/de la représentant(e) ».
  "qualiteRepresentant": "Père biologique", // Valeur affichée à côté de « Qualité (parent, tuteur, curateur...) ».
  "organisationRepresentant": "Association des victimes", // Valeur affichée à côté de « Organisation accompagnatrice (le cas échéant) ».
  "pieceIdentiteRepresentant": "Carte d’électeur n° 123", // Valeur affichée à côté de « Pièce d’identité du/de la représentant(e) (type et numéro) ».

  "accepteReparation": true, // Si true, coche « J’accepte de bénéficier... » ; si false, coche « Je ne souhaite pas bénéficier... ». Ces deux cases doivent être exclusives.
  "dateSignature": "2026-07-27T10:30:00.000Z", // Date injectée dans la mention « Fait à ... le ... » et associée à la signature.
  "lieuSignature": "Kinshasa", // Lieu injecté dans la mention « Fait à ... ».
  "signature": "sign-001", // Référence de la signature utilisée dans le bloc de signature du contrat.
  "victimeId": 42, // Identifie la victime dont les informations personnelles alimentent les autres parties du contrat ; cette valeur n’est pas imprimée comme telle.

  "planIndemnisation": [ // Alimente dynamiquement le tableau « Tranches » ; la longueur du tableau donne « Nombre ».
    {
      "periode": "Août 2026", // En-tête de colonne de la tranche, par exemple « Nov 2025 ».
      "montantUSD": 1250.25, // Somme affichée sous la période ; la somme de toutes les lignes permet de calculer le total.
      "statut": "Planifier", // État métier de la tranche ; peut être affiché dans le tableau ou dans le suivi du paiement.
      "datePaiementEffectif": "2026-08-20", // Date réelle du versement, à afficher lorsque la tranche a été payée.
      "modePaiement": "Banque", // Mode de versement ; permet notamment de dynamiser la mention indiquant qu’aucun paiement ne sera effectué en cash.
      "preuve": "preuves/recu-001.pdf" // Lien ou référence vers le justificatif du paiement.
    }
  ]
}
```

### Règles d’affichage conseillées

- Afficher le bloc du représentant uniquement lorsque `incapableConsentir === true`.
- Afficher les données optionnelles uniquement lorsqu’elles sont renseignées ; éviter de produire `null`, `undefined` ou une ligne vide dans le contrat final.
- Traiter `accepteReparation` comme un choix exclusif : `true` correspond à l’acceptation et `false` au refus. Les deux cases ne doivent jamais être cochées simultanément.
- Construire le tableau « Tranches » avec `planIndemnisation`. Son nombre de colonnes est `planIndemnisation.length` et son total est la somme des `montantUSD`.
- Vérifier côté interface que la somme des tranches correspond à `montantTotalUSD`, car cette règle n’est pas encore contrôlée par le backend.
- Formater `montantTotalUSD` et `montantUSD` selon la présentation retenue (`2 500,75 USD`, par exemple), sans modifier leurs valeurs numériques envoyées à l’API.
- Formater `dateSignature` pour l’affichage, tout en continuant à envoyer une date ISO 8601 au backend.

## Exemple de requête complète

```json
{
  "reparationAdministrative": "Indemnisation financière",
  "typeContrat": "Contrat de réparation",
  "reparationJudiciaire": "Jugement favorable",
  "typePrejudiceReconnu": "Perte économique",
  "montantTotalUSD": 2500.75,
  "droitAccompagnement": true,
  "serviceMediateurUtilise": false,
  "recoursServiceMediation": false,
  "avocatAccompagnement": true,
  "comprisCesdroits": true,
  "exerceDroit": true,
  "nomComprisDroit": true,
  "copieEvaluations": true,
  "informeDroitVictime": true,
  "organisationAccompagnement": "ONG Justice pour Tous",
  "incapableConsentir": false,
  "accepteReparation": true,
  "dateSignature": "2026-07-27T10:30:00.000Z",
  "lieuSignature": "Kinshasa",
  "signature": "sign-001",
  "victimeId": 42,
  "planIndemnisation": [
    {
      "periode": "Août 2026",
      "montantUSD": 1250.25,
      "statut": "Planifier",
      "modePaiement": "Mobile Money"
    },
    {
      "periode": "Septembre 2026",
      "montantUSD": 1250.5,
      "statut": "Planifier",
      "modePaiement": "Banque"
    }
  ]
}
```

Lorsque `incapableConsentir` vaut `true`, les informations du représentant peuvent être envoyées :

```json
{
  "incapableConsentir": true,
  "nomRepresentant": "Jean Mulenda",
  "qualiteRepresentant": "Père biologique",
  "organisationRepresentant": "Association des victimes",
  "pieceIdentiteRepresentant": "Carte d’électeur"
}
```

Cet extrait complète le corps principal ; il ne constitue pas à lui seul une requête valide.

## Exemple avec cURL

```bash
curl --request POST 'http://localhost:3000/contrat' \
  --header 'Content-Type: application/json' \
  --data-raw '{
    "reparationAdministrative": "Indemnisation financière",
    "typeContrat": "Contrat de réparation",
    "typePrejudiceReconnu": "Perte économique",
    "montantTotalUSD": 2500.75,
    "droitAccompagnement": true,
    "incapableConsentir": false,
    "accepteReparation": true,
    "dateSignature": "2026-07-27T10:30:00.000Z",
    "lieuSignature": "Kinshasa",
    "signature": "sign-001",
    "victimeId": 42
  }'
```

## Réponse en cas de succès

Statut HTTP : `201 Created`

La réponse contient le contrat enregistré, son identifiant et, lorsqu’ils ont été fournis, les plans d’indemnisation créés.

```json
{
  "id": 15,
  "reparationAdministrative": "Indemnisation financière",
  "typeContrat": "Contrat de réparation",
  "reparationJudiciaire": null,
  "typePrejudiceReconnu": "Perte économique",
  "montantTotalUSD": 2500.75,
  "droitAccompagnement": true,
  "serviceMediateurUtilise": null,
  "recoursServiceMediation": false,
  "avocatAccompagnement": null,
  "comprisCesdroits": true,
  "exerceDroit": true,
  "nomComprisDroit": true,
  "copieEvaluations": true,
  "informeDroitVictime": true,
  "organisationAccompagnement": "ONG Justice pour Tous",
  "incapableConsentir": false,
  "nomRepresentant": null,
  "qualiteRepresentant": null,
  "organisationRepresentant": null,
  "pieceIdentiteRepresentant": null,
  "accepteReparation": true,
  "dateSignature": "2026-07-27T10:30:00.000Z",
  "lieuSignature": "Kinshasa",
  "signature": "sign-001",
  "victimeId": 42,
  "planIndemnisation": []
}
```

## Erreurs possibles

### `400 Bad Request`

La validation échoue notamment lorsqu’un champ obligatoire manque, lorsqu’un type est incorrect, lorsque la date n’est pas au format ISO 8601 ou lorsqu’un champ inconnu est envoyé.

Exemple :

```json
{
  "message": [
    "montantTotalUSD must be a number conforming to the specified constraints",
    "dateSignature must be a valid ISO 8601 date string"
  ],
  "error": "Bad Request",
  "statusCode": 400
}
```

### `500 Internal Server Error`

Une erreur de persistance, par exemple une référence de victime invalide ou un problème de base de données, produit actuellement la réponse suivante :

```json
{
  "statusCode": 500,
  "message": "Une erreur est survenue lors de la création du contrat. Veuillez réessayer plus tard.",
  "error": "Internal Server Error"
}
```

## Remarques

- Les booléens doivent être envoyés sous forme de vrais booléens JSON (`true` ou `false`), et non sous forme de chaînes (`"true"` ou `"false"`).
- Les nombres doivent être envoyés sans guillemets.
- Les champs absents du DTO sont refusés par la validation globale.
- La somme des montants des plans n’est actuellement pas comparée automatiquement à `montantTotalUSD`.
- La documentation Swagger est disponible sur `/api/v1` lorsque l’application est démarrée.
