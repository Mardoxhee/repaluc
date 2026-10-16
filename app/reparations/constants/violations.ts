// Source : Catégorisation Violation - version finale (1) (1).docx
export const violationGroups: Array<{ label: string; violations: string[] }> = [
  {
    "label": "Perte de vie",
    "violations": [
      "Extermination (Action systématique visant à tuer des membres d'un groupe)",
      "Perte de vie (Conséquence directe et intentionnelle d'un acte criminel)"
    ]
  },
  {
    "label": "Violence Sexuelle Liée au Conflit",
    "violations": [
      "Atteinte à la pudeur",
      "Viol",
      "Excitation des mineurs à la débauche",
      "Souteneur et proxénétisme",
      "Prostitution forcée",
      "Harcèlement sexuel",
      "Esclavage sexuel",
      "Mariage forcé",
      "Zoophilie",
      "Trafic et exploitation des enfants à des fins sexuelles",
      "Grossesse forcée",
      "Pornographie mettant en scène des enfants",
      "Prostitution d’enfants"
    ]
  },
  {
    "label": "Atteinte à l'intégrité physique",
    "violations": [
      "Mutilation génitale",
      "Transmission délibérée des IST/incurable",
      "Stérilisation forcée",
      "Atteinte grave à l’intégrité physique",
      "Imposition de mesures visant à entraver les naissances",
      "Transfert forcé des enfants",
      "Réduction à l’esclavage",
      "Torture",
      "Causer intentionnellement de grandes souffrances",
      "Mutilation",
      "Atteinte grave à l’intégrité mentale",
      "Soumission intentionnelle à certaines conditions d’existence",
      "Emprisonnement ou privation de liberté",
      "Traitement inhumain",
      "Atteintes à la dignité de la personne",
      "Déportation ou transfert forcé de population"
    ]
  },
  {
    "label": "Perte économique",
    "violations": [
      "Destruction des biens",
      "Appropriation des biens",
      "Pillage"
    ]
  }
];

export const violationOptions = violationGroups.flatMap(group => group.violations);
