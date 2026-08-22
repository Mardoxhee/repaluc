# Intégration frontend — Tableau de bord LUC par territoire

## 1. Objectif

Cette fonctionnalité fournit au frontend les données nécessaires pour afficher :

- le tableau récapitulatif LUC par territoire ;
- les totaux généraux ;
- le graphique de progression placé sous le tableau.

Le tableau et le graphique utilisent le même endpoint. Aucun second appel API
n'est nécessaire pour construire le graphique.

## 2. Endpoint

```http
GET /victime/stats/tableau-bord/LUC/par-territoire
```

Cet endpoint ne reçoit aucun paramètre. L'authentification habituelle de
l'application doit être envoyée par le client HTTP du frontend.

## 3. Définitions métier

- `cibleTotale` : nombre distinct de victimes ayant la mention `LUC` ;
- `victimesRecontactees` : victimes dont la photo est renseignée et non vide ;
- `contratsSignes` : victimes possédant un contrat ;
- `victimesAyantCommenceIndemnisation` : victimes ayant au moins un plan avec
  une `datePaiementEffectif` non nulle ;
- `resteVictimesACommencerIndemnisation` : différence entre `cibleTotale` et
  `victimesAyantCommenceIndemnisation` ;
- `montantTotalPlanifieUSD` : somme des `montantUSD` de tous les plans ;
- `montantTotalPayeUSD` : somme des `montantUSD` des plans dont la
  `datePaiementEffectif` est non nulle ;
- `resteAPayer` : différence entre `montantTotalPlanifieUSD` et
  `montantTotalPayeUSD`.

Les victimes sont comptées une seule fois, même lorsqu'elles possèdent plusieurs
plans. Les montants, eux, additionnent toutes les tranches concernées.

Un territoire vide ou nul est retourné sous le libellé `INCONNU`. Les
territoires sont déjà triés alphabétiquement par le backend.

## 4. Contrats TypeScript

```ts
export interface TableauBordLucTerritoire {
  territoire: string;
  cibleTotale: number;
  victimesRecontactees: number;
  pourcentageRecontactees: number;
  contratsSignes: number;
  pourcentageContratsSignes: number;
  victimesAyantCommenceIndemnisation: number;
  pourcentageVictimesAyantCommenceIndemnisation: number;
  resteVictimesACommencerIndemnisation: number;
  montantTotalPlanifieUSD: number;
  montantTotalPayeUSD: number;
  resteAPayer: number;
}

export type TableauBordLucTotal = Omit<
  TableauBordLucTerritoire,
  'territoire'
>;

export interface TableauBordLucResponse {
  success: true;
  mention: 'LUC';
  totalTerritoires: number;
  territoires: TableauBordLucTerritoire[];
  totalGeneral: TableauBordLucTotal;
}
```

Tous les compteurs, pourcentages et montants sont retournés sous forme de
`number`. Le frontend ne doit pas faire de conversion avec `parseInt`.

## 5. Exemple de réponse

```json
{
  "success": true,
  "mention": "LUC",
  "totalTerritoires": 2,
  "territoires": [
    {
      "territoire": "BOMA",
      "cibleTotale": 100,
      "victimesRecontactees": 70,
      "pourcentageRecontactees": 70,
      "contratsSignes": 60,
      "pourcentageContratsSignes": 60,
      "victimesAyantCommenceIndemnisation": 40,
      "pourcentageVictimesAyantCommenceIndemnisation": 40,
      "resteVictimesACommencerIndemnisation": 60,
      "montantTotalPlanifieUSD": 100000,
      "montantTotalPayeUSD": 40000,
      "resteAPayer": 60000
    },
    {
      "territoire": "INCONNU",
      "cibleTotale": 5,
      "victimesRecontactees": 3,
      "pourcentageRecontactees": 60,
      "contratsSignes": 2,
      "pourcentageContratsSignes": 40,
      "victimesAyantCommenceIndemnisation": 1,
      "pourcentageVictimesAyantCommenceIndemnisation": 20,
      "resteVictimesACommencerIndemnisation": 4,
      "montantTotalPlanifieUSD": 5000,
      "montantTotalPayeUSD": 1000,
      "resteAPayer": 4000
    }
  ],
  "totalGeneral": {
    "cibleTotale": 105,
    "victimesRecontactees": 73,
    "pourcentageRecontactees": 69.52,
    "contratsSignes": 62,
    "pourcentageContratsSignes": 59.05,
    "victimesAyantCommenceIndemnisation": 41,
    "pourcentageVictimesAyantCommenceIndemnisation": 39.05,
    "resteVictimesACommencerIndemnisation": 64,
    "montantTotalPlanifieUSD": 105000,
    "montantTotalPayeUSD": 41000,
    "resteAPayer": 64000
  }
}
```

## 6. Appel HTTP côté frontend

Exemple avec `fetch` :

```ts
export async function chargerTableauBordLuc(
  apiBaseUrl: string,
): Promise<TableauBordLucResponse> {
  const response = await fetch(
    `${apiBaseUrl}/victime/stats/tableau-bord/LUC/par-territoire`,
    {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
      credentials: 'include',
    },
  );

  if (!response.ok) {
    throw new Error(`Chargement impossible (${response.status})`);
  }

  return response.json() as Promise<TableauBordLucResponse>;
}
```

Si l'application utilise un jeton Bearer plutôt qu'un cookie de session, le
client HTTP central du projet doit ajouter l'en-tête `Authorization`.

## 7. Affichage du tableau

Les lignes du tableau viennent directement de `response.territoires`. La ligne
« TOTAL GÉNÉRAL » utilise `response.totalGeneral`.

Colonnes recommandées :

1. Territoire ;
2. Cible totale ;
3. Victimes recontactées ;
4. % recontactées ;
5. Contrats signés ;
6. % contrats signés ;
7. Indemnisation commencée ;
8. % indemnisation commencée ;
9. Victimes restant à commencer ;
10. Montant planifié USD ;
11. Montant payé USD ;
12. Reste à payer USD.

Formatage recommandé :

```ts
const formatNombre = new Intl.NumberFormat('fr-FR');
const formatUSD = new Intl.NumberFormat('fr-FR', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 2,
});

formatNombre.format(ligne.cibleTotale);
formatUSD.format(ligne.resteAPayer);
`${ligne.pourcentageRecontactees.toFixed(2)} %`;
```

## 8. Construction du graphique

Le graphique de progression utilise les mêmes territoires. Exemple de données
compatibles avec Chart.js, `react-chartjs-2` ou une bibliothèque équivalente :

```ts
export function creerDonneesGraphique(
  response: TableauBordLucResponse,
) {
  return {
    labels: response.territoires.map((item) => item.territoire),
    datasets: [
      {
        label: 'Cible totale',
        data: response.territoires.map((item) => item.cibleTotale),
        backgroundColor: '#1F4E78',
      },
      {
        label: 'Victimes recontactées',
        data: response.territoires.map(
          (item) => item.victimesRecontactees,
        ),
        backgroundColor: '#5B9BD5',
      },
      {
        label: 'Contrats signés',
        data: response.territoires.map((item) => item.contratsSignes),
        backgroundColor: '#70AD47',
      },
      {
        label: 'Indemnisation commencée',
        data: response.territoires.map(
          (item) => item.victimesAyantCommenceIndemnisation,
        ),
        backgroundColor: '#ED7D31',
      },
    ],
  };
}
```

Configuration minimale du graphique :

```ts
export const optionsGraphique = {
  responsive: true,
  maintainAspectRatio: false,
  interaction: {
    mode: 'index' as const,
    intersect: false,
  },
  plugins: {
    legend: {
      position: 'bottom' as const,
    },
    title: {
      display: true,
      text: 'Progression par activité et par territoire',
    },
  },
  scales: {
    y: {
      beginAtZero: true,
      ticks: {
        precision: 0,
      },
    },
  },
};
```

Il est déconseillé de mélanger les montants USD et les nombres de victimes sur
le même axe. Si un graphique financier est nécessaire, créer un second
graphique avec `montantTotalPlanifieUSD`, `montantTotalPayeUSD` et
`resteAPayer`.

## 9. États de l'interface

Le frontend doit prévoir :

- un indicateur de chargement pendant la requête ;
- un message d'erreur avec possibilité de réessayer ;
- un état vide lorsque `territoires.length === 0` ;
- un tableau défilable horizontalement sur mobile ;
- une hauteur fixe ou minimale pour le conteneur du graphique.

Une réponse vide valide conserve cette structure :

```json
{
  "success": true,
  "mention": "LUC",
  "totalTerritoires": 0,
  "territoires": [],
  "totalGeneral": {
    "cibleTotale": 0,
    "victimesRecontactees": 0,
    "contratsSignes": 0,
    "victimesAyantCommenceIndemnisation": 0,
    "resteVictimesACommencerIndemnisation": 0,
    "montantTotalPlanifieUSD": 0,
    "montantTotalPayeUSD": 0,
    "resteAPayer": 0,
    "pourcentageRecontactees": 0,
    "pourcentageContratsSignes": 0,
    "pourcentageVictimesAyantCommenceIndemnisation": 0
  }
}
```

## 10. Résumé de l'intégration

1. Appeler l'endpoint une seule fois au chargement de la page.
2. Stocker la réponse complète dans l'état du composant ou dans le gestionnaire
   de requêtes du projet.
3. Utiliser `territoires` pour les lignes du tableau.
4. Utiliser `totalGeneral` pour la ligne totale et les cartes récapitulatives.
5. Transformer `territoires` en `labels` et `datasets` pour le graphique.
6. Ne recalculer côté frontend ni les pourcentages ni les montants restants.
