export const alertStructureTypes: Record<string, string> = {
  STRUCTURE_MEDICALE: 'Structure médicale',
  ONG: 'ONG',
  RELAIS_COMMUNAUTAIRE: 'Relais communautaire',
  SERVICE_PUBLIC: 'Service public',
  AUTRE: 'Autre',
};

export type AlertSource = {
  structureType?: string;
  structureName?: string;
  otherStructureType?: string;
  contactName?: string;
  phone?: string;
  relationship?: string;
  address?: string;
};

const sourceKeys = ['structureType', 'structureName', 'otherStructureType', 'contactName', 'phone', 'relationship', 'address'] as const;

export function cleanAlertSources(rows: readonly AlertSource[]): AlertSource[] {
  return rows.filter(row => row && typeof row === 'object').map(row => {
    const source: AlertSource = {};
    for (const key of sourceKeys) {
      const value = row[key];
      if (typeof value === 'string' && value.trim()) source[key] = value.trim();
    }
    if (source.structureType && source.structureType !== 'AUTRE') delete source.otherStructureType;
    return source;
  }).filter(row => Object.keys(row).length > 0);
}

// Older server records and older IndexedDB snapshots use different names for contact fields.
export function readAlertSources(fiche: Record<string, any>): AlertSource[] {
  if (Array.isArray(fiche.alertSources)) return cleanAlertSources(fiche.alertSources);
  return cleanAlertSources([{
    structureType: fiche.alertSourceStructureType, structureName: fiche.alertSourceStructureName,
    otherStructureType: fiche.alertSourceOtherStructureType,
    contactName: fiche.alertSourceFullName ?? fiche.sourceNom, phone: fiche.alertSourcePhone ?? fiche.sourceContact,
    relationship: fiche.alertSourceRelationship ?? fiche.sourceRapport, address: fiche.alertSourceAddress ?? fiche.sourceAdresse,
  }]);
}

export function alertSourceLabel(fiche: Record<string, any>): string {
  return readAlertSources(fiche).map(source =>
    source.structureName || source.contactName || alertStructureTypes[source.structureType || ''] || source.structureType
  ).filter(Boolean).join(', ');
}
