'use client';

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

export const authenticatedFetch = (
  input: RequestInfo | URL,
  init: RequestInit = {}
): Promise<Response> => {
  if (shouldSkipAuthHeaders(input)) {
    return fetch(input, init);
  }

  const baseHeaders = init.headers ?? (input instanceof Request ? input.headers : undefined);

  return fetch(input, {
    ...init,
    headers: withAuthHeaders(baseHeaders),
  });
};
