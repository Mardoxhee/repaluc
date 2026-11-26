import { healthZonesByProvince } from '../constants/healthZonesByProvince';
import { rdcProvinces } from '../constants/provinces';
import { normalizeText } from '../utils/mentionStats';
import type { WorkflowField } from './WorkflowForm';

export type CarePartnerLocation = { nom?: string; structure?: string; province?: string; zoneSante?: string; healthZone?: string };

function options(items: Array<string | undefined>, selected?: string) {
  const values = Array.from(new Set([...items, selected].filter((item): item is string => Boolean(item?.trim()))));
  return Object.fromEntries(values.sort((a, b) => a.localeCompare(b, 'fr')).map(item => [item, item]));
}

const locationKey = (value: unknown) => normalizeText(value).replace(/[^a-z0-9]/g, '');

export function careLocationFields(scope: 'care' | 'transfer', partners: CarePartnerLocation[]): WorkflowField[] {
  const province = scope + 'Province';
  const zone = scope + 'HealthZone';
  const structure = scope + 'StructureName';
  const forProvince = (name: string) => partners.filter(p => name && locationKey(p.province) === locationKey(name));
  return [
    {
      key: province, label: scope === 'care' ? 'Province' : 'Province de transfert', type: 'select', required: true,
      resetOnChange: [zone, structure],
      options: values => options([...rdcProvinces, ...partners.map(p => p.province)], values[province]),
    },
    {
      key: zone, label: scope === 'care' ? 'Zone de santé' : 'Zone de santé de transfert', type: 'select', required: true,
      resetOnChange: [structure],
      options: values => {
        const name = values[province];
        const official = Object.keys(healthZonesByProvince).find(item => locationKey(item) === locationKey(name));
        const partnerZones = forProvince(name).map(p => p.zoneSante || p.healthZone);
        return options([...(official ? healthZonesByProvince[official] : []), ...partnerZones], values[zone]);
      },
    },
    {
      key: structure, label: scope === 'care' ? 'Structure de prise en charge' : 'Structure receveuse', type: 'select', required: true,
      options: values => {
        const matching = forProvince(values[province]).filter(p => values[zone] && locationKey(p.zoneSante || p.healthZone) === locationKey(values[zone]));
        return options(matching.map(p => p.nom || p.structure), values[structure]);
      },
    },
  ];
}
