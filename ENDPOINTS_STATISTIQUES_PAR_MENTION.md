# Endpoints filtrés par mention

Ce document décrit les endpoints ajoutés pour consulter les victimes et les contrats selon leur mention (`LUC`, `MPU` ou `PECMU`).

## Règles communes

- Les comparaisons de mention ignorent la casse et les espaces placés avant ou après la valeur. Par exemple, `luc`, `LUC` et ` LUC ` sont considérés comme `LUC`.
- Les endpoints globaux déjà présents restent disponibles et conservent leur comportement.
- Les nombres présents dans les exemples sont uniquement illustratifs.

## Progression globale des réparations

### Endpoints

```http
GET /victime/stats/reparation/globalProgress/LUC
GET /victime/stats/reparation/globalProgress/MPU
GET /victime/stats/reparation/globalProgress/PECMU
```

Chaque endpoint retourne les statistiques de progression uniquement pour les victimes de la mention indiquée dans l’URL.

La réponse contient :

- le nombre total de victimes de la mention ;
- le nombre de victimes avec et sans photo ;
- le nombre de victimes avec et sans pièce ;
- le nombre de victimes avec et sans contrat ;
- le nombre de victimes dont l’indemnisation est commencée ou non commencée ;
- le montant total des plans d’indemnisation dont la date de paiement effectif est renseignée.

```json
{
  "success": true,
  "message": "Statistiques des victimes LUC récupérées avec succès",
  "data": {
    "total": 1000,
    "photo": {
      "withPhoto": 700,
      "withoutPhoto": 300
    },
    "piece": {
      "withPiece": 450,
      "withoutPiece": 550
    },
    "contrat": {
      "withContrat": 120,
      "withoutContrat": 880
    },
    "indemnisation": {
      "commencee": 80,
      "nonCommencee": 930,
      "montantTotalIndemnise": 25000
    }
  }
}
```

Une victime ayant plusieurs plans, dont certains sont payés et d’autres non, peut actuellement être comptée à la fois dans `commencee` et `nonCommencee`. Ces deux compteurs ne sont donc pas nécessairement complémentaires.

## Contrats filtrés par mention

### Endpoints

```http
GET /contrat/LUC
GET /contrat/MPU
GET /contrat/PECMU
```

Chaque endpoint retourne tous les contrats liés aux victimes de la mention indiquée. Deux relations sont chargées dans chaque contrat :

- `victime` : la victime liée au contrat ;
- `planIndemnisation` : les plans d’indemnisation du contrat.

La réponse est un tableau de contrats :

```json
[
  {
    "id": 15,
    "victimeId": 42,
    "mesuresReparationAcceptees": [
      "indemnisation",
      "priseEnChargeMedicale"
    ],
    "victime": {
      "id": 42,
      "mention": "LUC"
    },
    "planIndemnisation": []
  }
]
```

Si aucun contrat ne correspond à la mention, l’endpoint retourne un tableau vide.

## Mesures de réparation acceptées par les victimes LUC

### Endpoint

```http
GET /contrat/stats/mesures-reparation/LUC
```

Cet endpoint compte les contrats des victimes LUC dont le tableau `mesuresReparationAcceptees` contient chacune des mesures suivantes :

- `indemnisation` ;
- `reinsertionEconomique` ;
- `priseEnChargeMedicale` ;
- `accompagnementPsychosocial`.

```json
{
  "success": true,
  "message": "Statistiques des mesures de réparation LUC récupérées avec succès",
  "data": {
    "totalContrats": 120,
    "mesuresReparationAcceptees": {
      "indemnisation": 90,
      "reinsertionEconomique": 35,
      "priseEnChargeMedicale": 42,
      "accompagnementPsychosocial": 28
    }
  }
}
```

`totalContrats` correspond à tous les contrats des victimes LUC, y compris ceux dont aucune des quatre mesures n’est présente. Un contrat peut contenir plusieurs mesures et être compté dans plusieurs catégories ; la somme des quatre compteurs peut donc dépasser `totalContrats`.

## Total à indemniser pour les victimes LUC

### Endpoint

```http
GET /victime/stats/total-indemnisation/LUC
```

Cet endpoint additionne le champ `indemnisation` des victimes dont la mention est LUC. Il ne s’agit pas de la somme de `contrat.montantTotalUSD` ni de celle des plans d’indemnisation.

```json
{
  "totalIndemnisation": 123456
}
```

Lorsque la somme est absente ou nulle, `totalIndemnisation` vaut `0`.

## Répartition par sexe des victimes LUC

### Endpoint

```http
GET /victime/stats/sexe/LUC
```

Cet endpoint compte les victimes LUC par sexe et fusionne les libellés équivalents :

- `Femme`, `Feminin` et `Féminin` deviennent `Femme` ;
- `Homme` et `Masculin` deviennent `Homme` ;
- une valeur vide ou `null` devient `Inconnu` ;
- les autres valeurs sont conservées.

La normalisation ignore la casse et les espaces autour des valeurs.

```json
[
  {
    "sexe": "Femme",
    "total": 500
  },
  {
    "sexe": "Homme",
    "total": 320
  },
  {
    "sexe": "Inconnu",
    "total": 10
  }
]
```

## Répartition par tranche d’âge des victimes LUC

### Endpoint

```http
GET /victime/stats/tranche-age/LUC
```

Cet endpoint répartit les victimes LUC dans les tranches suivantes :

- `0-4` ;
- `5-17` ;
- `18-34` ;
- `35-59` ;
- `60+` ;
- `INCONNU` pour un âge absent ou invalide.

Les pourcentages sont calculés par rapport au nombre total de victimes LUC.

```json
{
  "total": 1000,
  "repartitions": [
    { "tranche": "0-4", "total": 10, "pourcentage": 1 },
    { "tranche": "5-17", "total": 150, "pourcentage": 15 },
    { "tranche": "18-34", "total": 400, "pourcentage": 40 },
    { "tranche": "35-59", "total": 300, "pourcentage": 30 },
    { "tranche": "60+", "total": 100, "pourcentage": 10 },
    { "tranche": "INCONNU", "total": 40, "pourcentage": 4 }
  ]
}
```

## Répartition par province des victimes LUC

### Endpoint

```http
GET /victime/stats/province/LUC
```

Cet endpoint compte les victimes LUC et les regroupe selon la valeur de leur champ `province`.

```json
[
  {
    "province": "Nord-Kivu",
    "total": "250"
  },
  {
    "province": "Sud-Kivu",
    "total": "180"
  }
]
```

## Répartition par territoire des victimes LUC

### Endpoint

```http
GET /victime/stats/territoire/LUC
```

Cet endpoint compte les victimes LUC par territoire. Les victimes dont `territoire` vaut `null` sont exclues. Une chaîne vide n’est pas considérée comme `null` et n’est donc pas exclue par cette règle.

```json
[
  {
    "territoire": "Beni",
    "total": "150"
  },
  {
    "territoire": "Masisi",
    "total": "90"
  }
]
```

## Répartition par préjudice final des victimes LUC

### Endpoint

```http
GET /victime/stats/prejudice-final/LUC
```

Cet endpoint compte les victimes LUC et les regroupe selon leur champ `prejudiceFinal`.

```json
[
  {
    "prejudiceFinal": "Préjudice corporel",
    "total": "125"
  },
  {
    "prejudiceFinal": "Préjudice matériel",
    "total": "80"
  }
]
```

## Victimes LUC filtrées par agent de réparation

### Endpoint

```http
GET /victime/filtre/agent-reparation/LUC?agentReparation=Diane+Asele&page=1&limit=1
```

### Paramètres de requête

| Paramètre | Type | Obligatoire | Description |
| --- | --- | --- | --- |
| `agentReparation` | `string` | Oui | Valeur exacte de `variablesSpecifiques.agentReparation`. Dans une URL, `+` représente un espace. |
| `page` | `number` | Non | Numéro de page, avec `1` comme valeur par défaut. La valeur doit être supérieure ou égale à `1`. |
| `limit` | `number` | Non | Nombre maximal de victimes par page, avec `20` comme valeur par défaut. La valeur doit être supérieure ou égale à `1`. |

La route applique simultanément les filtres suivants :

- `victime.mention = LUC` ;
- `victime.variablesSpecifiques.agentReparation = agentReparation`.

Les victimes sont triées par identifiant décroissant.

```json
{
  "data": [
    {
      "id": 123,
      "mention": "LUC",
      "variablesSpecifiques": {
        "agentReparation": "Diane Asele"
      }
    }
  ],
  "meta": {
    "total": 25,
    "page": 1,
    "limit": 1,
    "totalPages": 25,
    "hasNextPage": true,
    "hasPreviousPage": false
  }
}
```

Contrairement à l’ancien endpoint sans filtre de mention, l’absence de résultat ne produit pas une erreur `404`. La route LUC retourne une pagination vide :

```json
{
  "data": [],
  "meta": {
    "total": 0,
    "page": 1,
    "limit": 1,
    "totalPages": 0,
    "hasNextPage": false,
    "hasPreviousPage": false
  }
}
```

