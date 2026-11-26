const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');

require.extensions['.ts'] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText, filename);
const api = require('../app/utils/victimDocumentApi.ts');
const {
  getMpuConsentDocumentReference, getMpuSignerField, getMpuSignatureFileKey, resolveMpuSignatureUrl,
} = require('../app/utils/mpuConsentSignature.ts');

test('the consent signer determines the canonical field', () => {
  assert.equal(getMpuSignerField(false), 'signatureBeneficiaire');
  assert.equal(getMpuSignerField(true), 'signatureRepresentant');
});

test('only a permanent file key can be attached to the consent', () => {
  assert.equal(getMpuSignatureFileKey('signatures/stored.png'), 'signatures/stored.png');
  assert.equal(getMpuSignatureFileKey('https://legacy.test/minio/files/signatures/stored.png'), 'signatures/stored.png');
  for (const value of [null, '', 'SIG_ELEC', 'blob:local', 'data:image/png;base64,AQID',
    'https://storage.test/key?X-Amz-Signature=temporary']) {
    assert.equal(getMpuSignatureFileKey(value), '');
  }
});

test('a former attachment is recovered by act and capture, using its stored name', async t => {
  const list = t.mock.method(api, 'listVictimDocuments', async victimId => {
    assert.equal(victimId, 18);
    return api.normalizeVictimDocuments([
      { id: 1, label: 'Signature de l’acte de consentement MPU n°4 · ' + new Date(100).toISOString(), key: 'first.png' },
      { id: 2, label: 'Signature', originalName: 'signature_consentement_mpu_4_200.png', name: 'renamed.png' },
      { id: 3, label: 'Signature', originalName: 'signature_consentement_mpu_40_300.png', name: 'another-act.png' },
    ]);
  });
  assert.equal(await getMpuConsentDocumentReference(18, 4, 100), 'first.png');
  assert.equal(await getMpuConsentDocumentReference(18, 4), 'renamed.png');
  assert.equal(await getMpuConsentDocumentReference(18, 4, 300), '');
  assert.equal(await getMpuConsentDocumentReference(18, 8), '');
  assert.equal(list.mock.callCount(), 4);
});

test('reading a canonical filename requests a viewing URL for that file', async t => {
  const resolver = t.mock.method(api, 'getVictimFileUrl', async key => {
    assert.equal(key, 'signatures/current.png');
    return 'https://storage.test/short-lived';
  });
  assert.equal(await resolveMpuSignatureUrl('signatures/current.png'), 'https://storage.test/short-lived');
  assert.equal(resolver.mock.callCount(), 1);
});
