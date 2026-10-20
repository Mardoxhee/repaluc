const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
require.extensions['.ts'] = (module, filename) => {
  module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText, filename);
};
const api = require('../app/reparations/services/pecmuWorkflowApi.ts');
const ficheApi = require('../app/reparations/services/pecmuApi.ts');

test('generic alert creation never sends protected workflow fields', () => {
  const payload = ficheApi.mapF2ValuesToFichePecmuPayload({ nomVictime: 'Test', certificationIncident: 'Oui', decisionPecmu: 'Cas éligible', identificationVictime: 'Oui', typeViolation: 'Valeur personnalisée', 'plainte_Forte fièvre': 'Non' });
  for (const key of ['incidentCertification', 'consentement', 'certificationNote', 'pecmuDecision']) assert.equal(key in payload, false);
  assert.equal(payload.victimIdentification, true);
  assert.equal(payload.violationType, 'Valeur personnalisée');
  assert.equal(payload.highFever, false);
});
test('general updates reject protected fields before making requests', async () => {
  for (const field of ['incidentCertification', 'consentement', 'certificationNote', 'pecmuDecision']) {
    await assert.rejects(ficheApi.updateFichePecmu(async () => { throw Error('Must not request'); }, 1, { [field]: 'value' }), /actions dédiées/);
  }
});
test('workflow GET orders any number of transferred episodes and preserves server actions', async () => {
  const state = await api.loadPecmuWorkflow(async path => {
    assert.equal(path, '/fiche-pecmu/42/workflow');
    return { fiche: { id: 42 }, currentStatus: 'TRANSFERRED', nextActions: ['UPLOAD_TRANSFER_NOTE'], medicalCare: [{ id: 3, sequenceNumber: 3 }, { id: 1, sequenceNumber: 1 }, { id: 2, sequenceNumber: 2 }] };
  }, 42);
  assert.deepEqual(state.medicalCare.map(c => c.id), [1, 2, 3]);
  assert.deepEqual(state.nextActions, ['UPLOAD_TRANSFER_NOTE']);
  assert.equal(api.canPerform(state, 'OPEN_TRANSFERRED_MEDICAL_CARE', null), false);
});
test('actions require both server transition and explicit SSO permission when provided', () => {
  const state = { nextActions: ['RECORD_MEDICAL_DECISION'] };
  assert.equal(api.canPerform(state, 'RECORD_MEDICAL_DECISION', []), false);
  assert.equal(api.canPerform(state, 'RECORD_MEDICAL_DECISION', ['fiche-pecmu:update']), false);
  assert.equal(api.canPerform(state, 'RECORD_MEDICAL_DECISION', ['fiche-pecmu:medical-decision']), true);
  assert.equal(api.canPerform(state, 'CLOSE_CASE', ['fiche-pecmu:update']), false);
});
test('stepper distinguishes pending closure, explicit lost-to-follow-up closure and closed orientations', () => {
  assert.equal(api.activeWorkflowTab('CERTIFICATION_PENDING'), 'certification');
  assert.equal(api.activeWorkflowTab('NOT_ELIGIBLE'), 'decision');
  assert.equal(api.activeWorkflowTab('CONSENT_REFUSED'), 'consents');
  assert.equal(api.activeWorkflowTab('TRANSFERRED'), 'care');
  assert.equal(api.activeWorkflowTab('CLOSURE_PENDING'), 'closure');
  assert.equal(api.activeWorkflowTab('LOST_TO_FOLLOW_UP'), 'closure');
  assert.equal(api.activeWorkflowTab('CLOSED'), 'orientations');
});
test('uploads send a real multipart file without forcing Content-Type', async () => {
  const file = new File(['%PDF-1.4 test'], 'consent.pdf', { type: 'application/pdf' });
  await api.uploadPecmuFile(async (path, options) => {
    assert.equal(path, '/acte-consentement-pecmu/9/file');
    assert.equal(options.method, 'POST');
    assert.equal(options.headers, undefined);
    assert.equal(options.body.get('file').name, 'consent.pdf');
    assert.equal(await options.body.get('file').text(), '%PDF-1.4 test');
  }, '/acte-consentement-pecmu/9/file', file);
  assert.throws(() => api.validatePecmuFile(new File([], 'empty.pdf')), /vide/);
  assert.throws(() => api.validatePecmuFile(new File(['x'], 'file.webp')), /PDF/);
});
test('private documents request a fresh signed URL for every view', async () => {
  let count = 0;
  const fetcher = async path => { assert.equal(path, '/acte-consentement-pecmu/9/file/download-url'); return { url: `https://storage.example/file?signature=${++count}` }; };
  const first = await api.getPecmuDocumentUrl(fetcher, '/acte-consentement-pecmu/9/file/download-url');
  const second = await api.getPecmuDocumentUrl(fetcher, '/acte-consentement-pecmu/9/file/download-url');
  assert.notEqual(first, second);
  await assert.rejects(api.getPecmuDocumentUrl(async () => ({ url: 'javascript:alert(1)' }), '/file'), /indisponible/);
});
test('pagination uses top-level API metadata', () => {
  const meta = ficheApi.normalizePecmuMeta({ data: [], page: 3, limit: 10, total: 37, totalPages: 4 }, { page: 1, limit: 20 }, 10);
  assert.equal(meta.page, 3); assert.equal(meta.limit, 10); assert.equal(meta.totalPages, 4); assert.equal(meta.hasNextPage, true);
});
test('HTTP client preserves business errors and handles empty deletion responses', async () => {
  const originalFetch = global.fetch;
  try {
    global.fetch = async () => new Response(JSON.stringify({ code: 'TRANSFER_NOTE_REQUIRED', message: 'Note obligatoire' }), { status: 400 });
    await assert.rejects(api.pecmuRequest('/fiche-pecmu/1/close'), error => error instanceof api.PecmuApiError && error.statusCode === 400 && error.code === 'TRANSFER_NOTE_REQUIRED' && error.message === 'Note obligatoire');
    global.fetch = async () => new Response(null, { status: 204 });
    await assert.doesNotReject(ficheApi.deleteConsentementPecmu(api.pecmuRequest, 9));
  } finally { global.fetch = originalFetch; }
});
test('malformed workflow is not accepted as successful local state', async () => {
  await assert.rejects(api.loadPecmuWorkflow(async () => null, 1), /incomplet/);
  await assert.rejects(api.loadPecmuWorkflow(async () => ({ fiche: { id: 1 } }), 1), /incomplet/);
});
test('certification uploads to MinIO and submits exactly the returned reference and certified', async () => {
  const calls = [];
  const fetcher = async (path, options) => {
    calls.push({ path, options });
    if (path === '/minio/files/upload') return { filename: 'stored-note-certif.pdf', url: 'https://storage.example/fonarev/stored-note-certif.pdf?X-Amz-Signature=temporary' };
    return {};
  };
  const reference = await api.uploadCertificationNote(fetcher, new File(['%PDF-1.4'], 'local-name.pdf'));
  await api.certifyPecmuAlert(fetcher, 42, true, reference);
  assert.equal(calls[0].options.body.get('file').name, 'local-name.pdf');
  assert.equal(calls[1].path, '/fiche-pecmu/42/certification');
  assert.deepEqual(JSON.parse(calls[1].options.body), { certified: true, certificationFile: 'stored-note-certif.pdf' });
});
test('certification rejects missing MinIO references and does not send a successful certification without a file', async () => {
  await assert.rejects(api.uploadCertificationNote(async () => ({}), new File(['%PDF'], 'note.pdf')), /référence/);
  let requests = 0;
  await assert.rejects(api.certifyPecmuAlert(async () => { requests++; }, 42, true), /note de certification/);
  assert.equal(requests, 0);
});
test('certification preview resolves stored MinIO keys through data.src', async () => {
  const url = await api.getCertificationFileUrl(async path => {
    assert.equal(path, '/minio/files/notes/note%20certif.pdf');
    return { url: 'https://storage.example/upload-only', data: { src: 'https://storage.example/note.pdf?signature=fresh' } };
  }, 'notes/note certif.pdf');
  assert.equal(url, 'https://storage.example/note.pdf?signature=fresh');
  assert.equal(await api.getCertificationFileUrl(async () => { throw Error('Unexpected request'); }, 'https://storage.example/file.pdf'), 'https://storage.example/file.pdf');
  await assert.rejects(api.getCertificationFileUrl(async () => ({ data: { src: 'javascript:alert(1)' } }), 'note.pdf'), /indisponible/);
});
test('certification preview accepts the MinIO filename and url response', async () => {
  const url = 'https://storage.example/fonarev/note.pdf?X-Amz-Signature=fresh';
  assert.equal(await api.getCertificationFileUrl(async path => {
    assert.equal(path, '/minio/files/note.pdf');
    return { filename: 'note.pdf', url };
  }, 'note.pdf'), url);
  await assert.rejects(api.getCertificationFileUrl(async () => ({ filename: 'note.pdf' }), 'note.pdf'), /indisponible/);
  await assert.rejects(api.getCertificationFileUrl(async () => ({ url: 'javascript:alert(1)' }), 'note.pdf'), /indisponible/);
});
test('certification preview renews a previously stored signed MinIO URL', async () => {
  let calls = 0;
  const fetcher = async path => {
    assert.equal(path, '/minio/files/notes/note%20certif.pdf');
    return { url: `https://storage.example/fonarev/notes/note.pdf?X-Amz-Signature=fresh${++calls}` };
  };
  const stored = 'https://storage.example/fonarev/notes/note%20certif.pdf?X-Amz-Signature=expired';
  assert.match(await api.getCertificationFileUrl(fetcher, stored), /fresh1$/);
  assert.match(await api.getCertificationFileUrl(fetcher, stored), /fresh2$/);
});
test('PECMU dashboard statistics use the dedicated endpoint and preserve zero counters', async () => {
  const stats = { total: 0, certified: 0, notCertified: 0, eligible: 0, notEligible: 0, treated: 0, hospitalized: 0, nonHospitalized: 0, stabilizedOrCured: 0, deceased: 0, transferred: 0, lostToFollowUp: 0, closed: 0, orientedToOtherPrograms: 0 };
  for (const response of [stats, { data: stats }]) {
    assert.deepEqual(await ficheApi.getFichePecmuStatistics(async path => {
      assert.equal(path, '/fiche-pecmu/statistics');
      return response;
    }), stats);
  }
  await assert.rejects(ficheApi.getFichePecmuStatistics(async () => { throw new Error('Unavailable'); }), /Unavailable/);
});
test('workflow tabs unlock progressively and refusal never unlocks medical care', () => {
  const allowed = api.isWorkflowTabAvailable;
  assert.equal(allowed('CERTIFICATION_PENDING', 'decision'), false);
  assert.equal(allowed('NOT_CERTIFIED', 'decision'), false);
  assert.equal(allowed('MEDICAL_DECISION_PENDING', 'decision'), true);
  assert.equal(allowed('NOT_ELIGIBLE', 'consents'), false);
  assert.equal(allowed('CONSENT_PENDING', 'consents'), true);
  assert.equal(allowed('CONSENT_REFUSED', 'care'), false);
  assert.equal(allowed('READY_FOR_CARE', 'care'), true);
  assert.equal(allowed('READY_FOR_CARE', 'followups'), false);
  for (const status of ['IN_CARE', 'TRANSFERRED', 'CLOSURE_PENDING', 'LOST_TO_FOLLOW_UP']) {
    assert.equal(allowed(status, 'followups'), true);
    assert.equal(allowed(status, 'orientations'), false);
  }
  assert.equal(allowed('CLOSED', 'orientations'), true);
  assert.equal(allowed('CLOSED', 'care'), true);
  assert.equal(allowed('CERTIFICATION_PENDING', 'history'), true);
});
