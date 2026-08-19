'use client';

const AUTH_STORAGE_KEYS = ['token', 'usr', 'auth', 'apps', 'repaluc_auth'];
const SESSION_LOCK_KEY = 'repaluc_session_locked';

let unauthorizedLogoutInProgress = false;

export const getAuthToken = (): string | null => {
  if (typeof window === 'undefined') return null;

  try {
    const token = localStorage.getItem('token');
    return token && token.trim().length > 0 ? token.trim() : null;
  } catch {
    return null;
  }
};

export const withAuthHeaders = (headers?: HeadersInit): Headers => {
  const nextHeaders = new Headers(headers);
  const token = getAuthToken();

  if (token && !nextHeaders.has('Authorization')) {
    nextHeaders.set('Authorization', `Bearer ${token}`);
  }

  return nextHeaders;
};

const shouldSkipAuthHeaders = (input: RequestInfo | URL): boolean => {
  const url =
    typeof input === 'string'
      ? input
      : input instanceof URL
        ? input.href
        : input.url;

  return url.startsWith('data:') || url.startsWith('blob:');
};

const getRequestUrl = (input: RequestInfo | URL): string => {
  if (typeof input === 'string') return input;
  if (input instanceof URL) return input.href;
  return input.url;
};

const isAuthRequest = (input: RequestInfo | URL): boolean => {
  const url = getRequestUrl(input);
  return url.includes('/auth/login') || url.includes('/auth/verify-token');
};

const clearAuthSession = () => {
  try {
    AUTH_STORAGE_KEYS.forEach((key) => localStorage.removeItem(key));
    localStorage.setItem(SESSION_LOCK_KEY, JSON.stringify({
      reason: 'unauthorized',
      ts: Date.now(),
    }));
  } catch {
    // ignore
  }

  void import('./authCache')
    .then(({ clearOfflineCredentials }) => clearOfflineCredentials())
    .catch(() => undefined);
};

const redirectToOnlineLogin = async () => {
  if (typeof window === 'undefined') return;
  if (window.location.pathname.startsWith('/login')) return;
  if (unauthorizedLogoutInProgress) return;

  unauthorizedLogoutInProgress = true;
  clearAuthSession();

  try {
    const Swal = (await import('sweetalert2')).default;
    await Swal.fire({
      icon: 'warning',
      title: 'Session expirée',
      text: 'Votre session a expiré. Reconnectez-vous en ligne pour obtenir un nouveau token.',
      confirmButtonText: 'Se reconnecter',
      confirmButtonColor: '#901c67',
      timer: 2500,
      timerProgressBar: true,
      allowOutsideClick: false,
    });
  } catch {
    window.alert('Votre session a expiré. Reconnectez-vous en ligne pour obtenir un nouveau token.');
  } finally {
    window.location.assign('/login?reason=session-expired');
  }
};

export const authenticatedFetch = async (
  input: RequestInfo | URL,
  init: RequestInit = {}
): Promise<Response> => {
  if (shouldSkipAuthHeaders(input)) {
    return fetch(input, init);
  }

  const baseHeaders = init.headers ?? (input instanceof Request ? input.headers : undefined);

  const response = await fetch(input, {
    ...init,
    headers: withAuthHeaders(baseHeaders),
  });

  if (response.status === 401 && !isAuthRequest(input)) {
    void redirectToOnlineLogin();
  }

  return response;
};
