const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');

require.extensions['.ts'] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText, filename);

const cache = require('../app/utils/victimPhotosCache.ts');
const auth = require('../app/utils/authFetch.ts');
const network = require('../app/utils/victimsCache.ts');
const { syncPendingVictimPhotos, syncPendingVictimPhotosForVictim } = require('../app/utils/victimPhotosSyncService.ts');

function setupQueue(t, entries) {
  t.mock.method(network, 'isOnline', () => true);
  t.mock.method(auth, 'getAuthToken', () => 'test-token');
  t.mock.method(cache, 'getAllPendingVictimPhotos', async () => structuredClone(entries));
  t.mock.method(cache, 'getVictimPhotosForVictim', async id =>
    structuredClone(entries.filter(entry => entry.victimId === id)));
  t.mock.method(cache, 'saveVictimPhotoUploadReference', async (id, remoteUrl) => {
    Object.assign(entries.find(entry => entry.id === id), { remoteUrl });
  });
  t.mock.method(cache, 'markVictimPhotoSynced', async (id, remoteUrl) => {
    Object.assign(entries.find(entry => entry.id === id), { remoteUrl, synced: true, validationError: undefined });
  });
  t.mock.method(cache, 'markVictimPhotoRejected', async (id, validationError) => {
    Object.assign(entries.find(entry => entry.id === id), { validationError });
  });
  t.mock.method(cache, 'markVictimPhotoSuperseded', async id => {
    Object.assign(entries.find(entry => entry.id === id), { superseded: true });
  });

  const { NEXT_PUBLIC_UPLOAD_ENDPOINT, NEXT_PUBLIC_API_BASE_URL } = process.env;
  process.env.NEXT_PUBLIC_API_BASE_URL = 'https://api.test';
  delete process.env.NEXT_PUBLIC_UPLOAD_ENDPOINT;
  t.after(() => {
    if (NEXT_PUBLIC_UPLOAD_ENDPOINT === undefined) delete process.env.NEXT_PUBLIC_UPLOAD_ENDPOINT;
    else process.env.NEXT_PUBLIC_UPLOAD_ENDPOINT = NEXT_PUBLIC_UPLOAD_ENDPOINT;
    if (NEXT_PUBLIC_API_BASE_URL === undefined) delete process.env.NEXT_PUBLIC_API_BASE_URL;
    else process.env.NEXT_PUBLIC_API_BASE_URL = NEXT_PUBLIC_API_BASE_URL;
  });
}

test('a gallery photo keeps its format and a rejected victim PATCH resumes from the uploaded key', async t => {
  const photoDataUrl = 'data:image/webp;base64,UklGRg==';
  const queue = [{ id: 2, victimId: 42, createdAt: 1234, synced: false, photoDataUrl }];
  setupQueue(t, queue);

  const calls = [];
  const progress = [];
  let rejectPatch = true;
  t.mock.method(auth, 'authenticatedFetch', async (url, init) => {
    calls.push(init.method);
    if (init.method === 'POST') {
      assert.equal(url, 'https://api.test/minio/files/upload');
      assert.deepEqual([...init.body.keys()], ['file']);
      const file = init.body.get('file');
      assert.equal(file.name, 'victim_photo_42_1234.webp');
      assert.equal(file.type, 'image/webp');
      assert.equal(await file.text(), 'RIFF');
      return Response.json({ data: { filename: 'photos/stored.webp', url: 'https://cdn.test/signed' } });
    }
    assert.equal(url, 'https://api.test/victime/42');
    assert.deepEqual(JSON.parse(init.body), { photo: 'photos/stored.webp' });
    return rejectPatch
      ? Response.json({ error: 'Bad Request', message: ['photo must be a string'] }, { status: 400 })
      : new Response(null, { status: 204 });
  });

  const first = await syncPendingVictimPhotos({ onProgress: event => progress.push(event) });
  assert.equal(first.failed, 1);
  assert.match(first.lastError, /400.*photo must be a string/);
  assert.equal(progress.at(-1).message, first.lastError);
  assert.equal(queue[0].remoteUrl, 'photos/stored.webp');
  assert.equal(queue[0].synced, false);
  assert.equal(queue[0].photoDataUrl, photoDataUrl);
  assert.match(queue[0].validationError, /400.*photo must be a string/);
  assert.deepEqual(await syncPendingVictimPhotos({ automatic: true }), { synced: 0, failed: 0, skipped: 1 });

  rejectPatch = false;
  assert.deepEqual(await syncPendingVictimPhotosForVictim(42), { synced: 1, failed: 0, skipped: 0 });
  assert.equal(queue[0].synced, true);
  assert.deepEqual(calls, ['POST', 'PATCH', 'PATCH']);
});

test('after a new photo is linked the older rejected one leaves the queue without another transfer', async t => {
  const queue = [
    { id: 7, victimId: 15, synced: false, photoDataUrl: 'data:image/jpeg;base64,/9j/2Q==', validationError: 'Erreur de validation (HTTP 400)' },
    { id: 8, victimId: 15, synced: false, remoteUrl: 'new.jpg' },
  ];
  setupQueue(t, queue);
  const associations = [];
  t.mock.method(auth, 'authenticatedFetch', async (_url, init) => {
    assert.equal(init.method, 'PATCH');
    associations.push(JSON.parse(init.body));
    return new Response(null, { status: 204 });
  });
  assert.deepEqual(await syncPendingVictimPhotos({ automatic: true }), { synced: 1, failed: 0, skipped: 1 });
  assert.deepEqual(await syncPendingVictimPhotos({ automatic: true }), { synced: 0, failed: 0, skipped: 1 });
  assert.deepEqual(await syncPendingVictimPhotosForVictim(15), { synced: 0, failed: 0, skipped: 0 });
  assert.equal(queue[0].synced, false);
  assert.equal(queue[0].superseded, true);
  assert.ok(queue[0].photoDataUrl);
  assert.deepEqual(associations, [{ photo: 'new.jpg' }]);
});

test('a refused file keeps its local image and reports the upload validation before association', async t => {
  const queue = [{ id: 7, victimId: 15, createdAt: 100, synced: false, photoDataUrl: 'data:image/jpeg;base64,/9j/2Q==' }];
  setupQueue(t, queue);
  let requests = 0;
  t.mock.method(auth, 'authenticatedFetch', async (_url, init) => {
    requests++;
    assert.equal(init.method, 'POST');
    assert.equal(init.body.get('file').name, 'victim_photo_15_100.jpg');
    return Response.json({ error: 'Bad Request', message: ['file is too large'] }, { status: 400 });
  });

  const result = await syncPendingVictimPhotosForVictim(15);
  assert.equal(result.failed, 1);
  assert.match(result.lastError, /400.*file is too large/);
  assert.equal(requests, 1);
  assert.equal(queue[0].remoteUrl, undefined);
  assert.equal(queue[0].synced, false);
});
