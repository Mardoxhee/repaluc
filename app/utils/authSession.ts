const SESSION_KEY = 'repaluc_auth';

export function hasLocalSession(storage: Storage): boolean {
  return Boolean(storage.getItem(SESSION_KEY)?.trim() || storage.getItem('token')?.trim());
}

export function rememberLocalSession(storage: Storage, username: string): void {
  storage.setItem(SESSION_KEY, JSON.stringify({ username, ts: Date.now() }));
}

export function endLocalSession(storage: Storage): void {
  storage.removeItem('token');
  storage.removeItem(SESSION_KEY);
}
