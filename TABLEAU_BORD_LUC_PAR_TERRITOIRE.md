# Tableau de bord LUC par territoire

Le guide complet destiné à l'équipe frontend est disponible dans
[`INTEGRATION_FRONTEND_TABLEAU_BORD_LUC.md`](./INTEGRATION_FRONTEND_TABLEAU_BORD_LUC.md).

## Endpoint

```http
GET /victime/stats/tableau-bord/LUC/par-territoire
```

Cet endpoint retourne la synthèse des activités de suivi des victimes dont la
mention est `LUC`, regroupée par territoire. Les territoires vides sont
présentés sous le libellé `INCONNU` et les groupes sont triés par ordre
alphabétique.

## Règles de calcul

- `cibleTotale` : nombre distinct de victimes LUC du territoire ;
- `victimesRecontactees` : victimes dont `photo` est renseignée et non vide ;
- `contratsSignes` : victimes possédant un contrat ;
- `victimesAyantCommenceIndemnisation` : victimes ayant au moins un plan avec une
  `datePaiementEffectif` renseignée ;
- `resteVictimesACommencerIndemnisation` : `cibleTotale -
  victimesAyantCommenceIndemnisation` ;
- `montantTotalPlanifieUSD` : somme de `montantUSD` de tous les plans ;
- `montantTotalPayeUSD` : somme de `montantUSD` des plans dont la
  `datePaiementEffectif` est renseignée ;
- `resteAPayer` : `montantTotalPlanifieUSD - montantTotalPayeUSD` ;
- chaque pourcentage est calculé par rapport à `cibleTotale` et arrondi à deux
  décimales.

Une victime qui possède plusieurs plans d'indemnisation n'est comptée qu'une
seule fois dans chaque indicateur.

## Exemple de réponse

```json
{
  "success": true,
  "mention": "LUC",
  "totalTerritoires": 1,
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
    }
  ],
  "totalGeneral": {
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
  }
}
```
