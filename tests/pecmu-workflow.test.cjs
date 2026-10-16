const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
// Run the repository's TypeScript modules without adding a test-runner dependency.
require.extensions['.ts'] = (module, filename) => {
  module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText, filename);
};
const { workflowAccess, finishEpisode, readWorkflow, saveWorkflow, readSignedFile } = require('../app/reparations/services/pecmuWorkflow.ts');
const prototype = require('../app/reparations/services/pecmuPrototype.ts');
const empty = () => ({ version: 1, consents: [], acts: [], episodes: [] });
const active = () => ({ ...empty(), certification: { consentId: 1 }, pool: { eligible: true, reason: 'Motif', decidedAt: '2026-10-16' }, consents: [{ id: 2, kind: 'care', signedAt: '2026-10-16' }], episodes: [{ number: 1, structure: 'Structure A', summary: 'Suivi', openedAt: '2026-10-16' }] });

test('steps remain locked without the initial signed document', () => {
  assert.deepEqual(workflowAccess(empty(), []), { certification: true, pool: false, consents: false, care: false });
  assert.equal(workflowAccess({ ...active(), certification: { consentId: 99 } }, [1, 2]).pool, false);
});
test('eligibility and the care consent gate successive steps', () => {
  const state = active();
  assert.deepEqual(workflowAccess(state, [1, 2]), { certification: true, pool: true, consents: true, care: true });
  assert.equal(workflowAccess({ ...state, pool: { ...state.pool, eligible: false } }, [1, 2]).consents, false);
  for (const kind of ['refusal', 'transfer', 'procedure']) {
    assert.equal(workflowAccess({ ...state, consents: [{ id: 2, kind }] }, [1, 2]).care, false);
  }
  assert.equal(workflowAccess(state, [1]).care, false);
});
test('transfer requires a receiving structure and a transfer consent', () => {
  assert.throws(() => finishEpisode(active(), 'Transféré à un niveau supérieur', 'Suivi', 'Structure B'), /consentement/);
  const state = active(); state.consents.push({ id: 3, kind: 'transfer', signedAt: '2026-10-16' });
  assert.throws(() => finishEpisode(state, 'Transféré à un niveau supérieur', 'Suivi', '', 3), /structure/);
  const transferred = finishEpisode(state, 'Transféré à un niveau supérieur', 'Synthèse reprise', 'Structure B', 3);
  assert.equal(transferred.closedAt, undefined);
  assert.equal(transferred.episodes.length, 2);
  assert.equal(transferred.episodes[0].transferConsentId, 3);
  assert.equal(transferred.episodes[1].structure, 'Structure B');
  assert.equal(transferred.episodes[1].summary, 'Synthèse reprise');
  assert.equal(transferred.episodes[1].outcome, undefined);
  assert.equal(state.episodes.length, 1, 'transition must not mutate its input');
  assert.throws(() => finishEpisode(transferred, 'Perdu de vue', 'Suivi'), /deuxième/);
  assert.throws(() => finishEpisode(transferred, 'Transféré à un niveau supérieur', 'Suivi', 'C', 3), /deuxième/);
  for (const outcome of ['Stabilisé/guéri', 'Décédé']) assert.ok(finishEpisode(transferred, outcome, 'Synthèse finale').closedAt);
});
test('only healing and death close a first episode; lost to follow-up remains open', () => {
  assert.equal(finishEpisode(active(), 'Perdu de vue', 'Suivi').closedAt, undefined);
  for (const outcome of ['Stabilisé/guéri', 'Décédé']) {
    const closed = finishEpisode(active(), outcome, 'Synthèse finale');
    assert.ok(closed.closedAt);
    assert.throws(() => finishEpisode(closed, outcome, 'Modification'), /déjà clôturé/);
  }
  assert.throws(() => finishEpisode(active(), 'Décédé', '  '), /synthèse/);
});
test('prototype persistence, attachments and reopening never write to the server', async () => {
  const noNetwork = async () => { throw new Error('Unexpected network request'); };
  const fiche = await prototype.createFichePecmu(noNetwork, { nomVictime: 'Victime de démonstration' });
  const consent = await prototype.createConsentementPecmu(noNetwork, { fichePecmuId: fiche.id, agent: 'Agent', filename: 'consentement.pdf', file: 'ZmljaGU=' });
  const state = { ...empty(), certification: { consentId: consent.id, uploadedAt: new Date().toISOString() } };
  await saveWorkflow(noNetwork, fiche.id, state);
  assert.deepEqual(readWorkflow(await prototype.getFichePecmu(noNetwork, fiche.id)), state);
  assert.equal((await prototype.listConsentementsByFiche(noNetwork, fiche.id))[0].file, 'ZmljaGU=');
  const act = await prototype.createActeMedicalPecmu(noNetwork, { fichePecmuId: fiche.id, rapportMedical: 'Acte', examens: [{ filename: consent.filename, file: consent.file }] });
  assert.equal((await prototype.listActesMedicauxByFiche(noNetwork, fiche.id))[0].id, act.id);
  await prototype.createSuiviAccompagnement(noNetwork, { fichePecmuId: fiche.id, avis: 'Suivi' });
  assert.equal((await prototype.listSuivisByFiche(noNetwork, fiche.id)).length, 1);
  const snapshot = await prototype.getFichePecmu(noNetwork, fiche.id); snapshot.victimName = 'Changed';
  assert.notEqual((await prototype.getFichePecmu(noNetwork, fiche.id)).victimName, 'Changed');
});
test('existing records are read but prototype changes do not issue PUT/POST', async () => {
  const calls = [];
  const fetcher = async (url, options) => { calls.push({ url, options }); return { id: 987, victimName: 'Existing' }; };
  await prototype.updateFichePecmu(fetcher, 987, { medicalStatus: 'Clôturé' });
  assert.deepEqual(calls, [{ url: '/fiche-pecmu/987', options: undefined }]);
});
test('unsupported and oversized documents are rejected before reading', async () => {
  await assert.rejects(readSignedFile({ name: 'file.exe', size: 20 }), /PDF/);
  await assert.rejects(readSignedFile({ name: 'file.pdf', size: 11 * 1024 * 1024 }), /10 Mo/);
});
test('each medical act requires its own signed procedure consent', () => {
  const { assertMedicalActAllowed } = require('../app/reparations/services/pecmuWorkflow.ts');
  const state = active();
  assert.throws(() => assertMedicalActAllowed(state, [1, 2], 2), /consentement/);
  state.consents.push({ id: 3, kind: 'procedure', signedAt: '2026-10-16' });
  assert.throws(() => assertMedicalActAllowed(state, [1, 2], 3), /consentement/);
  assert.doesNotThrow(() => assertMedicalActAllowed(state, [1, 2, 3], 3));
  state.acts.push({ id: 20, consentId: 3, episode: 1 });
  assert.throws(() => assertMedicalActAllowed(state, [1, 2, 3], 3), /déjà associé/);
  assert.throws(() => assertMedicalActAllowed({ ...state, closedAt: '2026-10-16' }, [1, 2, 3], 3), /clôturé/);
});
