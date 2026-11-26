const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');

require.extensions['.ts'] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText, filename);
const api = require('../app/utils/victimDocumentApi.ts');
const { ensureMpuConsentSignatureDocument, readMpuConsentSignatureUrl, getLegacyMpuSignatureReference } = require('../app/utils/mpuConsentSignature.ts');

test('an interrupted upload is reconciled and a newer drawing stays distinct and readable', async t => {
  const documents = [];
  t.mock.method(api, 'listVictimDocuments', async id => {
    assert.equal(id, 18);
    return documents;
  });
  t.mock.method(api, 'getVictimFileUrl', async reference => 'preview/' + reference);
  const upload = t.mock.method(api, 'uploadVictimDocument', async (id, file, label, category) => {
    assert.equal(id, 18);
    assert.equal(category, 'signature');
    assert.equal(file.type, 'image/png');
    assert.equal(file.size, 3);
    documents.push({ id: documents.length + 1, label, name: file.name, lien: 'key-' + documents.length });
    if (documents.length === 1) throw new TypeError('Connection lost');
  });
  const image = 'data:image/png;base64,AQID';
  await ensureMpuConsentSignatureDocument(18, 4, image, 100);
  await ensureMpuConsentSignatureDocument(18, 4, image, 100);
  await ensureMpuConsentSignatureDocument(18, 4, image, 200);
  // The same victim's dossier can contain signatures from other documents.
  await ensureMpuConsentSignatureDocument(18, 40, image, 300);
  assert.equal(upload.mock.callCount(), 3);
  assert.equal(await readMpuConsentSignatureUrl(18, 4, 'old-key'), 'preview/key-1');
  assert.equal(await readMpuConsentSignatureUrl(18, 7, 'SIG_ELEC'), '');
  assert.equal(await readMpuConsentSignatureUrl(18, 7, 'legacy.png'), 'preview/legacy.png');
});

test('old resolver URLs use the configured API and the signed file is fetched anonymously', async t => {
  const documents = [];
  t.mock.method(api, 'listVictimDocuments', async () => documents);
  t.mock.method(api, 'getVictimFileUrl', async reference => {
    assert.equal(reference, '/minio/files/key');
    return 'https://storage.test/signed.png';
  });
  t.mock.method(globalThis, 'fetch', async (url, init) => {
    assert.equal(url, 'https://storage.test/signed.png');
    assert.equal(init.credentials, 'omit');
    assert.equal(new Headers(init.headers).has('Authorization'), false);
    return new Response(new Blob(['drawing'], { type: 'image/png' }));
  });
  const upload = t.mock.method(api, 'uploadVictimDocument', async (_victimId, file) => {
    documents.push({ id: 1, label: 'Signature', originalName: file.name, name: 'renamed-by-server.png' });
    return null;
  });
  const legacy = getLegacyMpuSignatureReference({ signature: 'SIG_ELEC', signatureRepresentant: 'https://legacy.test/minio/files/key' });
  await ensureMpuConsentSignatureDocument(18, 4, legacy, 100);
  assert.equal(upload.mock.callCount(), 1);
});

test('a 2xx without an identifiable stored image leaves the capture pending and never duplicates an incomplete matching attachment', async t => {
  const documents = [];
  t.mock.method(api, 'listVictimDocuments', async () => documents);
  const upload = t.mock.method(api, 'uploadVictimDocument', async () => null);
  const sync = () => ensureMpuConsentSignatureDocument(18, 4, 'data:image/png;base64,AQID', 100);
  await assert.rejects(sync(), /pas été retrouvée/);
  documents.push({ id: 3, label: 'Signature', originalName: 'signature_consentement_mpu_4_100.png', name: 'signature_consentement_mpu_4_100.png' });
  await assert.rejects(sync(), /référence de fichier manque/);
  assert.equal(upload.mock.callCount(), 1);
  await assert.rejects(readMpuConsentSignatureUrl(18, 4, 'old-signature.png'), /référence.*absente/);
});

test('a multipart validation refusal retains the backend reason and never acknowledges the signature', async t => {
  const list = t.mock.method(api, 'listVictimDocuments', async () => []);
  const refused = new api.VictimDocumentApiError('Validation du fichier (400)', 400);
  t.mock.method(api, 'uploadVictimDocument', async () => { throw refused; });
  await assert.rejects(ensureMpuConsentSignatureDocument(18, 4, 'data:image/png;base64,AQID', 100), error => error === refused);
  assert.equal(list.mock.callCount(), 1);
});
