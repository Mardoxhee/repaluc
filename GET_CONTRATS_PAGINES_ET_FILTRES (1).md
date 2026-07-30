# Contrats paginés avec filtres dynamiques

Cette API permet au frontend de récupérer les contrats des victimes `LUC`, `MPU` ou `PECMU`, avec pagination et un nombre dynamique de filtres.

## Endpoints

```http
GET /contrat/LUC
GET /contrat/MPU
GET /contrat/PECMU
```

La mention est déterminée par l'endpoint utilisé. Il n'est donc pas nécessaire d'ajouter la mention dans les paramètres de recherche.

## Paramètres de requête

| Paramètre | Type | Obligatoire | Valeur par défaut | Description |
|---|---:|---:|---:|---|
| `page` | entier | Non | `1` | Numéro de la page, à partir de `1`. |
| `limit` | entier | Non | `20` | Nombre de contrats par page, entre `1` et `100`. |
| `champ` | chaîne répétable | Non | — | Colonne de `Victime` ou `Contrat` à filtrer. |
| `valeur` | chaîne répétable | Non | — | Valeur associée au `champ` placé à la même position. |

`champ` et `valeur` doivent toujours être fournis ensemble. Pour plusieurs filtres, les deux paramètres sont répétés dans le même ordre.

## Pagination sans filtre

```http
GET /contrat/LUC?page=1&limit=20
```

## Un seul filtre

Filtrer les contrats LUC par province de la victime :

```http
GET /contrat/LUC?page=1&limit=20&champ=victime.province&valeur=KINSHASA
```

Filtrer les contrats MPU par type de contrat :

```http
GET /contrat/MPU?page=1&limit=20&champ=contrat.typeContrat&valeur=indemnisation
```

## Plusieurs filtres

Il faut répéter `champ` et `valeur`. Tous les filtres sont combinés avec l'opérateur logique `ET`.

```http
GET /contrat/LUC?page=1&limit=20&champ=victime.nom&valeur=MUSEKELA&champ=victime.province&valeur=KINSHASA&champ=contrat.mesuresReparationAcceptees&valeur=indemnisation
```

Cette requête retourne uniquement les contrats qui respectent simultanément ces conditions :

- `victime.nom = MUSEKELA` ;
- `victime.province = KINSHASA` ;
- `contrat.mesuresReparationAcceptees` contient `indemnisation`.

L'ordre est important. Le premier `champ` utilise la première `valeur`, le deuxième `champ` utilise la deuxième `valeur`, etc.

## Mesures de réparation

Les colonnes JSON suivantes bénéficient d'une recherche à l'intérieur du tableau :

- `contrat.mesuresReparationAcceptees` ;
- `contrat.mesuresReparationRenoncees`.

Exemple avec une mesure acceptée :

```http
GET /contrat/LUC?champ=contrat.mesuresReparationAcceptees&valeur=priseEnChargeMedicale
```

Pour exiger plusieurs mesures en même temps, répétez le même champ :

```http
GET /contrat/LUC?champ=contrat.mesuresReparationAcceptees&valeur=indemnisation&champ=contrat.mesuresReparationAcceptees&valeur=priseEnChargeMedicale
```

Le contrat doit alors contenir les deux mesures.

## Champs utilisables

Le nom envoyé doit correspondre à une colonne réelle de l'entité `Victime` ou `Contrat`. Le préfixe est recommandé :

```text
victime.nom
victime.sexe
victime.categorie
victime.province
victime.territoire
victime.commune
victime.prejudiceFinal
victime.indemnisation
victime.id

contrat.nomBeneficiaire
contrat.nomPostnom
contrat.typeContrat
contrat.reparationAdministrative
contrat.typePrejudiceReconnu
contrat.montantTotalUSD
contrat.mesuresReparationAcceptees
contrat.mesuresReparationRenoncees
contrat.dateSignature
contrat.lieuSignature
contrat.victimeId
contrat.id
```

Un champ sans préfixe est accepté lorsqu'il n'existe que dans une seule entité. Par exemple, `province` est résolu en `victime.province`. Un champ présent dans les deux entités, comme `id`, est ambigu et doit obligatoirement être écrit `victime.id` ou `contrat.id`.

La recherche est exacte pour les colonnes ordinaires. Par exemple, `KIN` ne correspond pas à `KINSHASA`.

> `secteur` n'est actuellement pas une colonne de l'entité `Victime`. Il ne peut donc pas être utilisé directement comme filtre. S'il est stocké dans `variablesSpecifiques`, un filtre JSON dédié devra être ajouté.

## Réponse

```json
{
  "data": [
    {
      "id": 15,
      "victimeId": 42,
      "typeContrat": "indemnisation",
      "mesuresReparationAcceptees": [
        "indemnisation",
        "priseEnChargeMedicale"
      ],
      "victime": {
        "id": 42,
        "nom": "MUSEKELA",
        "province": "KINSHASA",
        "mention": "LUC"
      },
      "planIndemnisation": []
    }
  ],
  "meta": {
    "total": 25,
    "page": 1,
    "limit": 20,
    "totalPages": 2,
    "hasNextPage": true,
    "hasPreviousPage": false
  }
}
```

Lorsque rien ne correspond, `data` est vide :

```json
{
  "data": [],
  "meta": {
    "total": 0,
    "page": 1,
    "limit": 20,
    "totalPages": 0,
    "hasNextPage": false,
    "hasPreviousPage": false
  }
}
```

## Intégration frontend avec `fetch`

```ts
type Mention = 'LUC' | 'MPU' | 'PECMU';

type ContratFilter = {
  champ: string;
  valeur: string | number | boolean | null | undefined;
};

async function getContrats(
  mention: Mention,
  filters: ContratFilter[] = [],
  page = 1,
  limit = 20,
) {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });

  filters.forEach(({ champ, valeur }) => {
    if (valeur !== null && valeur !== undefined && valeur !== '') {
      params.append('champ', champ);
      params.append('valeur', String(valeur));
    }
  });

  const response = await fetch(`/contrat/${mention}?${params.toString()}`);

  if (!response.ok) {
    throw new Error(`Erreur HTTP ${response.status}`);
  }

  return response.json();
}
```

Utilisation depuis un formulaire dynamique :

```ts
const filters: ContratFilter[] = [
  { champ: 'victime.nom', valeur: form.nom },
  { champ: 'victime.province', valeur: form.province },
  {
    champ: 'contrat.mesuresReparationAcceptees',
    valeur: form.mesure,
  },
];

const result = await getContrats('LUC', filters, 1, 20);

console.log(result.data);
console.log(result.meta);
```

Les valeurs vides sont ignorées avant l'envoi de la requête.

## Intégration frontend avec Axios

Pour garantir que les tableaux sont envoyés sous forme de paramètres répétés, utilisez `URLSearchParams` :

```ts
const params = new URLSearchParams();
params.append('page', '1');
params.append('limit', '20');

filters.forEach(({ champ, valeur }) => {
  if (valeur !== null && valeur !== undefined && valeur !== '') {
    params.append('champ', champ);
    params.append('valeur', String(valeur));
  }
});

const response = await axios.get('/contrat/LUC', { params });

const contrats = response.data.data;
const pagination = response.data.meta;
```

## Erreurs de validation

L'API retourne une erreur `400 Bad Request` dans les cas suivants :

- un `champ` n'a pas de `valeur` correspondante ;
- le nombre de champs diffère du nombre de valeurs ;
- le champ n'existe ni dans `Victime` ni dans `Contrat` ;
- un champ ambigu comme `id` est envoyé sans préfixe ;
- `page` est inférieur à `1` ;
- `limit` est inférieur à `1` ou supérieur à `100`.

Exemple invalide :

```http
GET /contrat/LUC?champ=id&valeur=42
```

Correction :

```http
GET /contrat/LUC?champ=victime.id&valeur=42
```
