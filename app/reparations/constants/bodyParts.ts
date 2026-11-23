export const bodyPartGroups: Array<{ label: string; parts: string[] }> = [
  { label: 'Tête et visage', parts: ['Crâne / cuir chevelu', 'Front', 'Yeux', 'Oreilles', 'Nez', 'Bouche / lèvres', 'Dents / mâchoire', 'Joues', 'Visage (autre)'] },
  { label: 'Cou', parts: ['Cou / nuque'] },
  { label: 'Thorax et poitrine', parts: ['Poitrine / seins', 'Côtes', 'Sternum', 'Dos supérieur'] },
  { label: 'Abdomen et bassin', parts: ['Abdomen / ventre', 'Région lombaire', 'Bassin', 'Organes génitaux', 'Région anale / périnéale'] },
  { label: 'Membres supérieurs', parts: ['Épaule droite / gauche', 'Bras droit / gauche', 'Coude droit / gauche', 'Avant-bras droit / gauche', 'Poignet droit / gauche', 'Main droite / gauche', 'Doigts'] },
  { label: 'Membres inférieurs', parts: ['Hanche droite / gauche', 'Cuisse droite / gauche', 'Genou droit / gauche', 'Jambe droite / gauche', 'Cheville droite / gauche', 'Pied droit / gauche', 'Orteils'] },
  { label: 'Atteintes généralisées', parts: ['Plusieurs parties du corps', 'Corps entier', 'Atteintes internes (organes internes)'] },
];

export const allBodyParts = bodyPartGroups.flatMap(group => group.parts);
