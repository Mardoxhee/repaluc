const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
require.extensions['.ts'] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText, filename);
const api = require('../app/reparations/services/victimProgressionApi.ts');
const snapshot = (mention = 'LUC') => ({
  victime: { id: 42, mention }, documents: { contratDisponible: true },
  progression: {
    medicale: { statut: mention === 'LUC' ? 'EVALUATED' : 'PLANNED', notes: null },
    psychologique: { statut: 'STARTED', notes: 'Suivi' },
    economique: { statut: 'NOT_STARTED', formation: { type: 'TRADE', precision: 'Menuiserie' }, activitesGeneratricesRevenus: ['Atelier'], notes: null },
    indemnisation: { pourcentage: 62.5, palier: 50, montantPaye: 2500 },
  },
});
test('unchanged follow-up sends no patch; clearing values preserves explicit null and empty arrays', () => {
  const before = api.progressionFields(snapshot());
  assert.deepEqual(api.progressionChanges(before, { ...before }), {});
  assert.deepEqual(api.progressionChanges(before, { ...before, trainingType: null, trainingDetails: null, incomeGeneratingActivities: [] }), {
    trainingType: null, trainingDetails: null, incomeGeneratingActivities: [],
  });
  const patch = api.progressionChanges(before, { ...before, psychologicalStatus: 'COMPLETED' });
  assert.deepEqual(patch, { psychologicalStatus: 'COMPLETED' });
  for (const name of ['documents', 'victime', 'indemnisation', 'suivi', 'pourcentage', 'palier']) assert.equal(name in before, false);
});
test('MPU never sends computed medical status or LUC medical notes', () => {
  const fields = api.progressionFields(snapshot('MPU'));
  assert.equal('medicalStatus' in fields, false);
  assert.equal('medicalNotes' in fields, false);
  assert.equal(api.progressionPath(42, 'MPU'), '/victime/42/progression-mpu');
  assert.equal(api.progressionPath(42, 'LUC'), '/victime/42/progression-reparation');
});
test('invalid activities and excessive notes fail before a mutation', () => {
  for (const activities of [['Duplicate', 'Duplicate'], ['x'.repeat(256)], Array.from({ length: 51 }, (_, i) => String(i))]) {
    assert.throws(() => api.progressionChanges({}, { incomeGeneratingActivities: activities }), /50 activités/);
  }
  assert.throws(() => api.progressionChanges({}, { economicNotes: 'x'.repeat(5001) }), /5 000/);
  assert.throws(() => api.progressionChanges({}, { trainingDetails: 'x'.repeat(2001) }), /2 000/);
});
test('client retains server-calculated amounts, sends authenticated partial JSON, and surfaces failures', async () => {
  const originalFetch = global.fetch;
  const originalWindow = global.window;
  const originalStorage = global.localStorage;
  global.window = {};
  global.localStorage = { getItem: key => key === 'token' ? 'test-token' : null };
  try {
    global.fetch = async (url, options) => {
      assert.equal(options.headers.get('Authorization'), 'Bearer test-token');
      assert.equal(options.headers.get('Content-Type'), 'application/json');
      assert.equal(options.method, 'PATCH');
      assert.deepEqual(JSON.parse(options.body), { psychologicalStatus: 'COMPLETED' });
      return new Response(JSON.stringify(snapshot()), { headers: { 'Content-Type': 'application/json' } });
    };
    const result = await api.progressionRequest('/victime/42/progression-reparation', 'PATCH', { psychologicalStatus: 'COMPLETED' });
    assert.equal(result.progression.indemnisation.pourcentage, 62.5);
    assert.equal(result.progression.indemnisation.palier, 50);
    global.fetch = async () => new Response(JSON.stringify({ message: 'Interdit' }), { status: 403 });
    await assert.rejects(api.progressionRequest('/victime/42/progression-mpu'), e => e instanceof api.ProgressionError && e.status === 403);
    global.fetch = async () => new Response(JSON.stringify({ message: ['Numéro déjà utilisé'] }), { status: 400 });
    await assert.rejects(api.progressionRequest('/victime/42/progression-mpu'), /Numéro déjà utilisé/);
    global.fetch = async () => new Response('{}');
    await assert.rejects(api.progressionRequest('/victime/42/progression-mpu'), /incomplète/);
  } finally { global.fetch = originalFetch; global.window = originalWindow; global.localStorage = originalStorage; }
});

const { victimProgressionSummary } = require('../app/reparations/utils/victimProgressionSummary.ts');
test('LUC average includes documents, every rehabilitation and exact payment percentage equally', () => {
  const data = snapshot();
  data.documents = { photoDisponible: true, pieceIdentiteDisponible: true, contratDisponible: true };
  const result = victimProgressionSummary(data);
  // (100 + 100 + 100 + 25 + 50 + 0 + 62.5) / 7 = 62.5
  assert.equal(result.items.length, 7);
  assert.equal(result.percent, 63);
  assert.equal(result.items.find(i => i.label === 'Indemnisation').score, 62.5);
  assert.match(result.description, /poids égal/);
});
test('MPU average includes consent, medical clinics, membership and payments, excluding LUC compensation', () => {
  const data = snapshot('MPU');
  data.documents = { photoDisponible: true, pieceIdentiteDisponible: true, consentementEnregistre: true, acteConsentementDisponible: true };
  data.progression.medicale.statut = 'COMPLETED';
  data.progression.psychologique.statut = 'COMPLETED';
  data.progression.economique.statut = 'COMPLETED';
  data.progression.musoAvec = { statutAdhesion: 'COMPLETED', pourcentagePaiement: 100 };
  const result = victimProgressionSummary(data);
  assert.equal(result.items.length, 9);
  assert.equal(result.percent, 100);
  assert.equal(result.items.some(i => i.label === 'Indemnisation'), false);
  data.progression.musoAvec = null;
  assert.equal(victimProgressionSummary(data).percent, 78);
});
test('optional notes and training do not affect completion; incomplete payments never round up to 100%', () => {
  const data = snapshot();
  data.documents = { photoDisponible: true, pieceIdentiteDisponible: true, contratDisponible: true };
  for (const name of ['medicale', 'psychologique', 'economique']) data.progression[name].statut = 'COMPLETED';
  data.progression.economique.formation = { type: null, precision: null };
  data.progression.economique.activitesGeneratricesRevenus = [];
  data.progression.indemnisation.pourcentage = 99.99;
  assert.equal(victimProgressionSummary(data).percent, 99);
  data.progression.indemnisation.pourcentage = 100;
  assert.equal(victimProgressionSummary(data).percent, 100);
  data.progression.indemnisation.pourcentage = NaN;
  assert.equal(victimProgressionSummary(data).percent, 86);
});
