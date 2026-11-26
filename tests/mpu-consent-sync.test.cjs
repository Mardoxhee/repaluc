const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
require.extensions['.ts'] = (module, filename) => {
  module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText, filename);
};

const auth = require('../app/utils/authFetch.ts');
const cache = require('../app/utils/contractsCache.ts');
const connectivity = require('../app/utils/victimsCache.ts');
const { syncPendingContracts } = require('../app/utils/contractsSyncService.ts');

function pendingConsent() {
  return {
    id: 8, victimId: 25, createdAt: 1700000000000, targetType: 'consentement-mpu', action: 'create',
    signatureDataUrl: 'data:image/png;base64,aW1hZ2U=',
    contractData: {
      victimeId: 25, decisionConsentement: 'accepte', dateConsentement: '2026-11-26T00:00:00.000Z',
      lieuConsentement: 'Lieu', informeMpu: false, signature: 'SIG_ELEC', signatureBeneficiaire: 'ancienne.png',
      signatureRepresentant: 'ancienne.png', id: 77, victime: { id: 25 },
    },
  };
}

function simulate(t, record, handle) {
  const state = { record };
  const calls = [];
  const progress = [];
  t.mock.method(auth, 'getAuthToken', () => 'session-de-test');
  t.mock.method(connectivity, 'isOnline', () => true);
  t.mock.method(cache, 'getAllPendingContracts', async () => state.record ? [structuredClone(state.record)] : []);
  t.mock.method(cache, 'recordPendingContractSync', async (sent, consentId) => {
    if (!state.record || state.record.revision !== sent.revision) return false;
    if (consentId === undefined) state.record = null;
    else Object.assign(state.record, { targetId: consentId, action: 'update', consentMetadataSynced: true });
    return true;
  });
  t.mock.method(auth, 'authenticatedFetch', async (url, init = {}) => {
    const path = new URL(url).pathname;
    const method = init.method || 'GET';
    calls.push([method, path]);
    return handle(method, path, init);
  });
  return { state, calls, progress, sync: () => syncPendingContracts({ onProgress: value => progress.push(value) }) };
}

test('MPU saves allowed fields, then attaches the signature; after a refused upload only the attachment is retried', async t => {
  let uploads = 0;
  const stored = [];
  const consent = pendingConsent();
  const { state, calls, sync, progress } = simulate(t, consent, (method, path, init) => {
    if (method === 'GET' && path === '/consentements-mpu/victime/25') return new Response(null, { status: 404 });
    if (method === 'POST' && path === '/consentements-mpu') {
      assert.deepEqual(JSON.parse(init.body), {
        victimeId: 25, decisionConsentement: 'accepte', dateConsentement: '2026-11-26',
        lieuConsentement: 'Lieu', informeMpu: false,
      });
      return Response.json({ data: { id: 13, victimeId: 25 } }, { status: 201 });
    }
    if (method === 'GET' && path === '/document-victime/by-id-victime/25') return Response.json(stored);
    if (method === 'POST' && path === '/document-victime/victime/25/upload') {
      uploads++;
      assert.equal(init.body.get('category'), 'signature');
      assert.equal(init.body.get('file').type, 'image/png');
      assert.ok(init.body.get('file').size > 0);
      if (uploads === 1) return Response.json({ message: ['fichier refusé'] }, { status: 400 });
      stored.push({ id: 47, label: init.body.get('label'), lien: 'stored.png' });
      return Response.json(stored[0]);
    }
    throw new Error('Unexpected request: ' + method + ' ' + path);
  });
  assert.equal((await sync()).failed, 1);
  assert.match(progress.at(-1).message, /400.*fichier refusé/);
  assert.equal(state.record.targetId, 13);
  assert.equal(state.record.signatureDataUrl, consent.signatureDataUrl);
  assert.equal((await sync()).synced, 1);
  assert.equal(calls.filter(([, path]) => path.startsWith('/consentements-mpu')).length, 2);
  assert.equal(state.record, null);
});

test('an offline MPU create for an existing consent patches it; validation errors reach the settings and preserve the drawing', async t => {
  const { sync, progress, calls, state } = simulate(t, pendingConsent(), (method, path, init) => {
    if (method === 'GET') return Response.json({ id: 13, victimeId: 25 });
    assert.equal(path, '/consentements-mpu/13');
    assert.equal(method, 'PATCH');
    const payload = JSON.parse(init.body);
    assert.equal('victimeId' in payload, false);
    assert.equal('signature' in payload, false);
    return Response.json({ message: ['property X should not exist'] }, { status: 400 });
  });
  assert.equal((await sync()).failed, 1);
  assert.equal(calls.length, 2);
  assert.match(progress.at(-1).message, /400.*property X should not exist/);
  assert.doesNotMatch(progress.at(-1).message, /conflit/);
  assert.ok(state.record.signatureDataUrl);
});

test('a historical placeholder alone never creates an act presented as signed', async t => {
  const consent = pendingConsent();
  consent.signatureDataUrl = null;
  consent.contractData = { signature: 'SIG_ELEC' };
  const { sync, progress, calls, state } = simulate(t, consent, () => new Response(null, { status: 404 }));
  assert.equal((await sync()).failed, 1);
  assert.deepEqual(calls, [['GET', '/consentements-mpu/victime/25']]);
  assert.match(progress.at(-1).message, /Tracé de signature absent/);
  assert.ok(state.record);
});

test('queued LUC updates still use PATCH /contrat/:id and keep the signature in the contract', async t => {
  const entry = { id: 3, victimId: 25, targetId: 18, action: 'update', createdAt: 200,
    contractData: { victimeId: 25, nomAgentFonarev: 'Agent', signature: 'sig.png', planIndemnisation: [{ periode: '2026' }] } };
  const { sync, calls } = simulate(t, entry, (method, path, init) => {
    assert.deepEqual(JSON.parse(init.body), {
      victimeId: 25, signature: 'sig.png', planIndemnisation: [{ periode: '2026', nomAgentFonarev: 'Agent' }],
    });
    return new Response(null, { status: 204 });
  });
  assert.equal((await sync()).synced, 1);
  assert.deepEqual(calls, [['PATCH', '/contrat/18']]);
});

test('a legacy update verifies the remote signature if the pending item has only a marker', async t => {
  const consent = pendingConsent();
  Object.assign(consent, { signatureDataUrl: null, targetId: 13, action: 'update' });
  consent.contractData = { signature: 'SIG_ELEC', lieuConsentement: 'Nouveau lieu' };
  const { sync, calls, state } = simulate(t, consent, (method, path, init) => {
    if (method === 'GET' && path === '/consentements-mpu/victime/25') {
      return Response.json({ id: 13, victimeId: 25, signatureBeneficiaire: 'original.png' });
    }
    if (method === 'GET' && path === '/document-victime/by-id-victime/25') return Response.json([]);
    if (method === 'GET' && path === '/minio/files/original.png') return Response.json({ url: 'https://example.invalid/original.png' });
    if (method === 'PATCH' && path === '/consentements-mpu/13') {
      assert.deepEqual(JSON.parse(init.body), { lieuConsentement: 'Nouveau lieu' });
      return new Response(null, { status: 204 });
    }
    throw new Error('Unexpected request: ' + method + ' ' + path);
  });
  assert.equal((await sync()).synced, 1);
  assert.equal(calls.filter(([method]) => method === 'POST').length, 0);
  assert.equal(state.record, null);
});

test('a newer local edit during attachment upload remains queued for the next sync', async t => {
  const consent = pendingConsent();
  let uploads = 0;
  const stored = [];
  const { sync, state, progress } = simulate(t, consent, (method, path, init) => {
    if (method === 'GET' && path === '/consentements-mpu/victime/25') return Response.json({ id: 13, victimeId: 25 });
    if (method === 'PATCH' && path === '/consentements-mpu/13') return new Response(null, { status: 204 });
    if (method === 'GET' && path === '/document-victime/by-id-victime/25') return Response.json(stored);
    if (method === 'POST' && path === '/document-victime/victime/25/upload') {
      if (++uploads === 1) {
        state.record = { ...state.record, revision: 1, consentMetadataSynced: false, signatureCapturedAt: consent.createdAt + 1000,
          signatureDataUrl: 'data:image/png;base64,cmV2aXNpb24=' };
      }
      const document = { id: uploads, label: init.body.get('label'), lien: 'stored-' + uploads + '.png' };
      stored.push(document);
      return Response.json(document);
    }
    throw new Error('Unexpected request: ' + method + ' ' + path);
  });
  assert.equal((await sync()).failed, 1);
  assert.match(progress.at(-1).message, /modifié pendant l’envoi/);
  assert.equal(state.record.revision, 1);
  assert.equal((await sync()).synced, 1);
  assert.equal(state.record, null);
});

test('LUC signature uploads prefer a stable reference and still accept legacy URL-only responses', async t => {
  const temporaryUrl = 'https://storage.example.invalid/sig.png?X-Amz-Signature=example';
  for (const [label, reply, expected] of [
    ['filename', { data: { filename: 'saved.png', url: temporaryUrl } }, 'saved.png'],
    ['path', { url: temporaryUrl, data: { path: '/minio/files/saved.png' } }, '/minio/files/saved.png'],
    ['legacy URL', { url: temporaryUrl }, temporaryUrl],
  ]) {
    await t.test(label, async subtest => {
      const entry = { id: 8, victimId: 25, createdAt: 200, contractData: { victimeId: 25 },
        signatureDataUrl: 'data:image/png;base64,aW1hZ2U=' };
      const { sync, calls } = simulate(subtest, entry, (method, path, init) => {
        if (path.endsWith('/upload')) {
          assert.equal(init.body.get('file').type, 'image/png');
          return Response.json(reply);
        }
        assert.equal(path, '/contrat');
        assert.equal(JSON.parse(init.body).signature, expected);
        return new Response(null, { status: 201 });
      });
      assert.equal((await sync()).synced, 1);
      assert.equal(calls.length, 2);
    });
  }
});
