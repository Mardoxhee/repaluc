const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');

require.extensions['.ts'] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText, filename);

const { hasLocalSession, rememberLocalSession, endLocalSession } = require('../app/utils/authSession.ts');
const { authenticatedFetch } = require('../app/utils/authFetch.ts');

function storageWith(entries = {}) {
  const items = new Map(Object.entries(entries));
  return {
    getItem: key => items.get(key) ?? null,
    setItem: (key, value) => items.set(key, value),
    removeItem: key => items.delete(key),
  };
}

test('a reload recognizes a stored bearer or a previous offline login, independently of their age', () => {
  assert.equal(hasLocalSession(storageWith({ token: 'saved-token' })), true);
  assert.equal(hasLocalSession(storageWith({ repaluc_auth: '{"username":"test","ts":1}' })), true);
  assert.equal(hasLocalSession(storageWith({ usr: '{"username":"test"}' })), false);
  assert.equal(hasLocalSession(storageWith()), false);
});

test('explicit sign-out ends the stored session and preserves the offline data', () => {
  const storage = storageWith({ token: 'saved-token', 'offline-work': 'pending' });
  rememberLocalSession(storage, 'test');
  assert.equal(JSON.parse(storage.getItem('repaluc_auth')).username, 'test');
  endLocalSession(storage);
  assert.equal(hasLocalSession(storage), false);
  assert.equal(storage.getItem('offline-work'), 'pending');
});

test('victim requests returning 401 and 403 leave the local session available after reload', async t => {
  const storage = storageWith({ token: 'saved-token', repaluc_auth: '{"username":"test","ts":1}' });
  const originalWindow = Object.getOwnPropertyDescriptor(globalThis, 'window');
  const originalStorage = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  Object.defineProperty(globalThis, 'window', { configurable: true, value: {} });
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: storage });
  t.after(() => {
    if (originalWindow) Object.defineProperty(globalThis, 'window', originalWindow);
    else delete globalThis.window;
    if (originalStorage) Object.defineProperty(globalThis, 'localStorage', originalStorage);
    else delete globalThis.localStorage;
  });
  let status = 401;
  t.mock.method(globalThis, 'fetch', async (_url, init) => {
    assert.equal(init.headers.get('Authorization'), 'Bearer saved-token');
    return new Response(null, { status });
  });
  for (status of [401, 403]) {
    const response = await authenticatedFetch('https://example.test/victime');
    assert.equal(response.status, status);
    assert.equal(storage.getItem('token'), 'saved-token');
    assert.equal(storage.getItem('repaluc_auth'), '{"username":"test","ts":1}');
    assert.equal(hasLocalSession(storage), true);
  }
});
