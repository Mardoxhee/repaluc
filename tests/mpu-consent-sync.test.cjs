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
      lieuConsentement: 'Lieu', informeMpu: false, incapableConsentir: false, signature: 'SIG_ELEC', signatureBeneficiaire: 'ancienne.png',
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
  t.mock.method(cache, 'recordPendingContractSync', async (sent, consentId, signatureFileKey) => {
    if (!state.record || state.record.revision !== sent.revision) return false;
    if (consentId === undefined) state.record = null;
    else {
      Object.assign(state.record, { targetId: consentId, action: 'update', consentMetadataSynced: true });
      if (signatureFileKey !== undefined) state.record.signatureFileKey = signatureFileKey;
    }
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

// The API may accept the act and still return both signer fields as null.
function unsignedAct() {
  return { id: 13, victimeId: 25, incapableConsentir: false,
    signatureBeneficiaire: null, signatureRepresentant: null,
    victime: { id: 25, age: '11', mention: 'MPU', documentVictime: [] } };
}

function simulateMpu(t, entry, existing = null) {
  const server = { act: existing, documents: [], uploadBodies: [], patchBodies: [], metadataWrites: 0 };
  const fileKey = '31d62c9c-557d-4706-aa97-17aac9f083f2.png';
  const harness = simulate(t, entry, (method, path, init) => {
    if (method === 'GET' && ['/consentements-mpu/victime/25', '/consentements-mpu/13'].includes(path)) {
      assert.equal(init.cache, 'no-store');
      return server.act ? Response.json({ data: server.act }) : new Response(null, { status: 404 });
    }
    if (method === 'GET' && path === '/document-victime/by-id-victime/25') return Response.json(server.documents);
    if (method === 'POST' && path === '/minio/files/upload') {
      server.uploadBodies.push(init.body);
      if (server.onUpload) server.onUpload();
      const file = init.body.get('file');
      return Response.json(server.uploadReply ?? {
        message: 'Fichier chargé avec succès', filename: fileKey,
        originalName: file.name, mimeType: file.type, size: file.size,
      }, { status: 201 });
    }
    if (method === 'POST' && path === '/consentements-mpu') {
      assert.equal(server.act, null, 'must not create twice');
      const payload = JSON.parse(init.body);
      assert.equal(payload.victimeId, 25);
      assert.equal(payload.dateConsentement, '2026-11-26');
      assert.equal(payload.informeMpu, false);
      for (const key of ['signature', 'signatureBeneficiaire', 'signatureRepresentant', 'id', 'victime']) {
        assert.equal(key in payload, false);
      }
      server.metadataWrites++;
      server.act = { ...unsignedAct(), ...payload };
      return Response.json(server.act, { status: 201 });
    }
    if (method === 'PATCH' && path === '/consentements-mpu/13') {
      assert.ok(server.act);
      const payload = JSON.parse(init.body);
      if ('signatureBeneficiaire' in payload || 'signatureRepresentant' in payload) {
        server.patchBodies.push(payload);
        if (server.signatureReply) return server.signatureReply(payload);
      } else {
        server.metadataWrites++;
      }
      Object.assign(server.act, payload);
      return new Response(null, { status: 204 });
    }
    throw new Error('Unexpected request: ' + method + ' ' + path);
  });
  return { ...harness, server, fileKey };
}

test('an MPU PATCH rejected by the DTO preserves the drawing and resumes with the uploaded filename', async t => {
  const originalEnv = process.env;
  const api = 'https://api.test';
  process.env = { ...originalEnv, NEXT_PUBLIC_API_BASE_URL: api + '/',
    NEXT_PUBLIC_UPLOAD_ENDPOINT: api + '/document-victime/victime/25/upload' };
  t.after(() => { process.env = originalEnv; });
  const entry = pendingConsent();
  const pngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO5s6NsAAAAASUVORK5CYII=';
  entry.signatureDataUrl = 'data:image/png;base64,' + pngBase64;
  const { sync, server, state, progress, fileKey, calls } = simulateMpu(t, entry);
  server.signatureReply = () => Response.json({ message: ['property signatureBeneficiaire should not exist'] }, { status: 400 });
  assert.equal((await sync()).failed, 1);
  assert.match(progress.at(-1).message, /400.*property signatureBeneficiaire should not exist/);
  assert.ok(state.record.signatureDataUrl);
  assert.equal(state.record.targetId, 13);
  assert.equal(state.record.signatureFileKey, fileKey);
  assert.equal(server.act.signatureBeneficiaire, null);
  assert.deepEqual(server.patchBodies, [{ signatureBeneficiaire: fileKey }]);
  delete server.signatureReply;
  assert.equal((await sync()).synced, 1, progress.at(-1).message);
  assert.equal(server.metadataWrites, 1);
  assert.equal(server.uploadBodies.length, 1);
  const form = server.uploadBodies[0];
  assert.deepEqual([...form.keys()], ['file']);
  const file = form.get('file');
  assert.equal(file.type, 'image/png');
  assert.equal(file.name, 'signature_25_1700000000000.png');
  assert.deepEqual(Buffer.from(await file.arrayBuffer()), Buffer.from(pngBase64, 'base64'));
  const uploads = auth.authenticatedFetch.mock.calls
    .map(call => call.arguments[0]).filter(url => url.endsWith('/upload'));
  assert.deepEqual(uploads, [api + '/minio/files/upload']);
  assert.equal(server.act.signatureBeneficiaire, fileKey);
  assert.equal(server.act.signatureRepresentant, null);
  assert.equal(calls.at(-1)[0], 'GET');
  assert.equal(state.record, null);
});

test('a 2xx signature PATCH is insufficient when the subsequent GET does not return the intended signer and key', async t => {
  const entry = pendingConsent();
  entry.contractData.incapableConsentir = true;
  const { sync, state, server, calls, fileKey, progress } = simulateMpu(t, entry, unsignedAct());
  // The PATCH can echo the submitted key even when a subsequent read fails to find it.
  server.signatureReply = payload => Response.json({ ...server.act, ...payload });
  assert.equal((await sync()).failed, 1);
  assert.ok(state.record.signatureDataUrl);
  assert.deepEqual(server.patchBodies, [{ signatureRepresentant: fileKey }]);
  assert.equal(calls.at(-1)[0], 'GET');

  server.act.signatureBeneficiaire = fileKey;
  server.act.signatureRepresentant = 'signature-precedente.png';
  assert.equal((await sync()).failed, 1);
  assert.ok(state.record);
  delete server.signatureReply;
  assert.equal((await sync()).synced, 1, progress.at(-1).message);
  assert.equal(server.uploadBodies.length, 1);
  assert.equal(server.act.signatureRepresentant, fileKey);
  assert.equal(state.record, null);
});

test('an act recovered from a former dossier attachment still requires its signature field to be persisted', async t => {
  const entry = pendingConsent();
  Object.assign(entry, { action: 'update', targetId: 13, consentMetadataSynced: true, signatureDataUrl: null });
  entry.contractData = { signature: 'SIG_ELEC', incapableConsentir: false };
  const { state, server, sync, progress } = simulateMpu(t, entry, unsignedAct());
  server.documents = [{ id: 27, originalName: 'signature_consentement_mpu_13_' + (entry.createdAt - 1) + '.png', fileName: 'other-capture.png' }];
  assert.equal((await sync()).failed, 1);
  assert.deepEqual(server.patchBodies, []);
  assert.ok(state.record);
  server.documents.push({ id: 28, originalName: 'signature_consentement_mpu_13_' + entry.createdAt + '.png', fileName: 'kept.png' });
  assert.equal((await sync()).synced, 1, progress.at(-1).message);
  assert.deepEqual(server.patchBodies, [{ signatureBeneficiaire: 'kept.png' }]);
  assert.equal(server.uploadBodies.length, 0);
  assert.equal(state.record, null);
});

test('a temporary upload URL alone never gets written into an MPU consent', async t => {
  const { server, progress, state, sync } = simulateMpu(t, pendingConsent());
  server.uploadReply = { url: 'https://storage.test/blob?X-Amz-Signature=temp' };
  assert.equal((await sync()).failed, 1);
  assert.match(progress.at(-1).message, /référence|permanent|fichier|clé/i);
  assert.ok(state.record.signatureDataUrl);
  assert.deepEqual(server.patchBodies, []);
});

test('an MPU upload returning only the client originalName retains the drawing for retry', async t => {
  const entry = pendingConsent();
  const { server, state, sync } = simulateMpu(t, entry);
  server.uploadReply = { originalName: 'signature_25_1700000000000.png' };
  assert.equal((await sync()).failed, 1);
  assert.equal(state.record.signatureDataUrl, entry.signatureDataUrl);
  assert.equal(state.record.signatureFileKey, undefined);
  assert.deepEqual(server.patchBodies, []);
});

test('an older queue item without a local signer flag uses the signer on the remote act', async t => {
  const entry = pendingConsent();
  Object.assign(entry, { targetId: 13, action: 'update', consentMetadataSynced: true });
  delete entry.contractData.incapableConsentir;
  const { sync, server, fileKey, progress } = simulateMpu(t, entry, { ...unsignedAct(), incapableConsentir: true });
  assert.equal((await sync()).synced, 1, progress.at(-1).message);
  assert.deepEqual(server.patchBodies, [{ signatureRepresentant: fileKey }]);
  assert.equal(server.act.signatureBeneficiaire, null);
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
  const original = { ...unsignedAct(), signatureBeneficiaire: 'original.png' };
  const { sync, server, state, progress } = simulateMpu(t, consent, original);
  assert.equal((await sync()).synced, 1, progress.at(-1).message);
  assert.equal(server.act.lieuConsentement, 'Nouveau lieu');
  assert.equal(server.act.signatureBeneficiaire, 'original.png');
  assert.equal(server.uploadBodies.length, 0);
  assert.equal(state.record, null);
});

test('a new drawing saved during an upload keeps its own revision in the queue', async t => {
  const { server, sync, state, progress } = simulateMpu(t, pendingConsent(), unsignedAct());
  const replacement = 'data:image/png;base64,cmV2aXNpb24=';
  server.onUpload = () => {
    state.record = { ...state.record, revision: 2, consentMetadataSynced: false, signatureCapturedAt: state.record.createdAt + 1000, signatureDataUrl: replacement };
  };
  assert.equal((await sync()).failed, 1);
  assert.equal(state.record.signatureDataUrl, replacement);
  assert.equal(server.patchBodies.length, 0);
  delete server.onUpload;
  assert.equal((await sync()).synced, 1, progress.at(-1).message);
  assert.equal(server.uploadBodies.length, 2);
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
