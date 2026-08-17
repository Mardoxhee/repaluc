'use client';

export const getConnectedAgentFullName = (): string | null => {
  if (typeof window === 'undefined') return null;

  try {
    const raw = localStorage.getItem('usr');
    if (!raw) {
      const authRaw = localStorage.getItem('repaluc_auth');
      if (!authRaw) return null;

      const auth = JSON.parse(authRaw);
      const username = auth?.username;
      return typeof username === 'string' && username.trim().length > 0
        ? username.trim()
        : null;
    }

    const user = JSON.parse(raw);
    if (!user || typeof user !== 'object') return null;

    const direct = user.fullName ?? user.nomComplet ?? user.nom_complet ?? user.name;
    if (typeof direct === 'string' && direct.trim().length > 0) return direct.trim();

    const first = user.prenom ?? user.firstName ?? user.firstname;
    const last = user.nom ?? user.lastName ?? user.lastname;
    const parts = [first, last]
      .filter((value: unknown): value is string => typeof value === 'string' && value.trim().length > 0)
      .map((value) => value.trim());
    if (parts.length > 0) return parts.join(' ');

    const username = user.username ?? user.userName ?? user.email;
    return typeof username === 'string' && username.trim().length > 0
      ? username.trim()
      : null;
  } catch {
    return null;
  }
};
