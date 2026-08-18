# Intégration Frontend — Consentements MPU

Ce document est le contrat d'intégration du module **Consentements MPU**. Il est destiné au frontend Next.js et peut être transmis tel quel à une IA chargée de construire les écrans et les appels API.

## Objectif métier

Un consentement MPU formalise l'accord ou le refus d'une victime de bénéficier des Mesures Provisoires Urgentes (MPU). Un consentement est lié à **une seule victime** et une victime ne peut avoir qu'**un seul** consentement MPU.

La clé de liaison est `victimeId`. La victime doit déjà exister avant de créer le consentement.

> Ce module concerne uniquement les victimes `MPU`. Le frontend ne doit pas proposer ce formulaire à une victime `LUC` ou `PECMU`.

## Base URL et authentification

Les routes ci-dessous sont relatives à l'URL de l'API, par exemple :

```text
https://api.exemple.cd/consentements-mpu
```

L'API est protégée : envoyer le jeton d'authentification sur chaque requête.

```http
Authorization: Bearer <access_token>
Content-Type: application/json
```

## Routes disponibles

| Méthode | Route | Usage |
| --- | --- | --- |
| `POST` | `/consentements-mpu` | Créer le consentement MPU d'une victime |
| `GET` | `/consentements-mpu` | Lister tous les consentements, avec leur victime |
| `GET` | `/consentements-mpu/:id` | Obtenir un consentement par son identifiant |
| `GET` | `/consentements-mpu/victime/:victimeId` | Obtenir le consentement d'une victime |
| `PATCH` | `/consentements-mpu/:id` | Mettre à jour partiellement un consentement |
| `DELETE` | `/consentements-mpu/:id` | Supprimer un consentement |
| `GET` | `/consentements-mpu/stats` | Statistiques globales |
| `GET` | `/consentements-mpu/stats/MPU` | Statistiques des victimes dont la mention est `MPU` |
| `GET` | `/consentements-mpu/victimes-signees?page=1&limit=20` | Liste paginée des victimes ayant signé |
| `GET` | `/consentements-mpu/victimes-signees/recherche?nom=MULEBA` | Recherche non paginée par nom parmi les victimes ayant signé |

## Créer un consentement — `POST /consentements-mpu`

### Champs obligatoires

| Champ | Type | Règle |
| --- | --- | --- |
| `victimeId` | `number` | ID d'une victime existante ; unique pour ce module |
| `decisionConsentement` | `"accepte" \| "refuse"` | Décision finale de la victime ou du représentant |
| `dateConsentement` | `string` | Date ISO au format `YYYY-MM-DD` |
| `lieuConsentement` | `string` | Lieu de signature du consentement |

### Champs facultatifs

| Champ | Type | Valeurs / rôle |
| --- | --- | --- |
| `etatVictimisation` | `string` | `directe`, `indirecte`, `communaute_victime` ou `communaute_affectee` |
| `situationVulnerabiliteUrgente` | `boolean` | Situation urgente nécessitant une réponse MPU |
| `mesuresProposees` | `string[]` | Liste des mesures sélectionnées ; voir les valeurs recommandées ci-dessous |
| `autresMesures` | `string` | Précision libre si la mesure est « autre » |
| `vulnerabilites` | `string[]` | Liste des vulnérabilités sélectionnées |
| `autresVulnerabilites` | `string` | Précision libre si vulnérabilité « autre » |
| `informeMpu` | `boolean` | La personne a reçu les informations sur les MPU |
| `droitsExpliques` | `boolean` | Ses droits, obligations et recours ont été expliqués |
| `aExerceDroit` | `boolean` | `true` : droit exercé ; `false` : droit compris mais non exercé ; omettre si non renseigné |
| `engagementsAcceptes` | `boolean` | La personne accepte les engagements liés aux biens/activités |
| `mediateurFonarev` | `boolean` | La personne souhaite/sollicite le Médiateur FONAREV |
| `accompagnementPersonneConfiance` | `boolean` | Accompagnement par une personne ou organisation de confiance |
| `incapableConsentir` | `boolean` | Mettre `true` si la victime ne peut pas consentir seule |
| `nomRepresentant` | `string` | À renseigner si `incapableConsentir` est `true` |
| `qualiteRepresentant` | `string` | Ex. `Tuteur légal`, `Parent` |
| `organisationRepresentant` | `string` | Organisation du représentant, si applicable |
| `pieceIdentiteRepresentant` | `string` | Référence de sa pièce d'identité |
| `nomAgentFonarev` | `string` | Agent FONAREV signataire |
| `fonctionAgentFonarev` | `string` | Fonction de l'agent FONAREV |
| `signatureBeneficiaire` | `string` | Référence/URL/nom de fichier de la signature ou empreinte du bénéficiaire |
| `signatureRepresentant` | `string` | Référence/URL/nom de fichier de la signature du représentant |

### Valeurs recommandées pour les listes

Le backend accepte des chaînes libres dans les deux tableaux. Pour garder des statistiques homogènes, le frontend doit utiliser ces codes stables :

```ts
export const MESURES_MPU = [
  'abri_urgence',
  'baches_couvertures_nattes_moustiquaires',
  'vivres',
  'complements_nutritionnels',
  'acces_eau_potable',
  'kits_hygiene',
  'installations_sanitaires',
  'lumiere_energie_publique',
  'consultation_medicale',
  'medicaments',
  'premiers_secours_psychologiques',
  'accompagnement_psychosocial',
  'documentation',
  'orientation_juridique',
  'protection_enfance',
  'autres_mesures_protection',
] as const;

export const VULNERABILITES_MPU = [
  'grossesse',
  'handicap',
  'maladie_chronique',
  'enfant_protection_particuliere',
  'enfant_non_accompagne',
  'menage_monoparental',
] as const;
```

Pour une autre mesure ou vulnérabilité, remplir respectivement `autresMesures` ou `autresVulnerabilites` au lieu d'inventer un nouveau code dans le tableau.

### Exemple complet de requête

```json
{
  "victimeId": 42,
  "etatVictimisation": "directe",
  "situationVulnerabiliteUrgente": true,
  "mesuresProposees": [
    "vivres",
    "kits_hygiene",
    "consultation_medicale",
    "accompagnement_psychosocial"
  ],
  "vulnerabilites": ["handicap", "maladie_chronique"],
  "informeMpu": true,
  "droitsExpliques": true,
  "aExerceDroit": false,
  "engagementsAcceptes": true,
  "mediateurFonarev": false,
  "accompagnementPersonneConfiance": true,
  "incapableConsentir": false,
  "decisionConsentement": "accepte",
  "dateConsentement": "2026-08-13",
  "lieuConsentement": "Kalemie",
  "nomAgentFonarev": "Marie Kabongo",
  "fonctionAgentFonarev": "Chargée de protection",
  "signatureBeneficiaire": "signatures/consentement-42.png"
}
```

### Exemple de consentement signé par un représentant

```json
{
  "victimeId": 43,
  "incapableConsentir": true,
  "nomRepresentant": "Jean Mulenda",
  "qualiteRepresentant": "Tuteur légal",
  "pieceIdentiteRepresentant": "Carte d'électeur n°12345",
  "decisionConsentement": "accepte",
  "dateConsentement": "2026-08-13",
  "lieuConsentement": "Kalemie",
  "signatureRepresentant": "signatures/representant-43.png"
}
```

### Exemple Next.js avec `fetch`

```ts
type ConsentementMpuPayload = {
  victimeId: number;
  decisionConsentement: 'accepte' | 'refuse';
  dateConsentement: string;
  lieuConsentement: string;
  mesuresProposees?: string[];
  vulnerabilites?: string[];
  signatureBeneficiaire?: string;
  signatureRepresentant?: string;
  [key: string]: unknown;
};

export async function creerConsentementMpu(
  payload: ConsentementMpuPayload,
  accessToken: string,
) {
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/consentements-mpu`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message ?? 'Impossible de créer le consentement MPU');
  }

  return response.json();
}
```

## Règles à appliquer dans l'interface

1. Vérifier que la victime est de mention `MPU` avant d'afficher le bouton « Créer le consentement ».
2. Utiliser `GET /consentements-mpu/victime/:victimeId` pour savoir si la victime a déjà un consentement. Si un consentement existe, afficher l'édition (`PATCH`) plutôt qu'un second formulaire de création.
3. Si `incapableConsentir` vaut `true`, afficher et demander les données du représentant ainsi que sa signature.
4. Une victime est considérée comme ayant signé si `signatureBeneficiaire` **ou** `signatureRepresentant` contient une valeur non vide.
5. N'envoyer que de vrais booléens (`true` ou `false`), jamais les chaînes `"true"` ou `"false"`.
6. Envoyer les tableaux `mesuresProposees` et `vulnerabilites` sous forme de tableaux JSON, jamais sous forme de texte séparé par des virgules.

## Mise à jour — `PATCH /consentements-mpu/:id`

Envoyer uniquement les champs à modifier. Exemple pour enregistrer la signature après une première saisie :

```json
{
  "signatureBeneficiaire": "signatures/consentement-42.png",
  "decisionConsentement": "accepte"
}
```

## Victimes ayant signé

### Liste paginée

```http
GET /consentements-mpu/victimes-signees?page=1&limit=20
```

- `page` vaut `1` par défaut.
- `limit` vaut `20` par défaut et est limité à `100`.
- La réponse suit ce format :

```json
{
  "data": [
    {
      "id": 12,
      "victimeId": 42,
      "signatureBeneficiaire": "signatures/consentement-42.png",
      "victime": {
        "id": 42,
        "nom": "MULEBA"
      }
    }
  ],
  "meta": {
    "total": 1,
    "page": 1,
    "limit": 20,
    "totalPages": 1,
    "hasNextPage": false,
    "hasPreviousPage": false
  }
}
```

### Recherche par nom, sans pagination

```http
GET /consentements-mpu/victimes-signees/recherche?nom=MUL
```

La recherche utilise un `LIKE '%MUL%'`, est insensible à la casse et ne retourne que les victimes ayant signé.

## Statistiques

```http
GET /consentements-mpu/stats
GET /consentements-mpu/stats/MPU
```

La réponse contient notamment : le total de consentements, les décisions `accepte`/`refuse`, les états de victimisation, les mesures proposées, les vulnérabilités et les informations liées à l'accompagnement.

## Erreurs importantes à gérer

| Statut | Cas |
| --- | --- |
| `400` | Payload invalide, victime inexistante, ou consentement déjà existant pour cette victime |
| `401` / `403` | Jeton absent, expiré ou non autorisé |
| `404` | Consentement introuvable |

Lors d'une erreur, afficher le message renvoyé par l'API (`error.message`) à l'utilisateur.
