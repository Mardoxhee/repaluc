'use client';

import React, { useMemo, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import Swal from 'sweetalert2';
import { Eye, EyeOff, Loader2, ShieldCheck, WifiOff, KeyRound } from 'lucide-react';
import { hashPassword, saveOfflineCredentials, verifyOfflineCredentials } from '@/app/utils/authCache';

type Step = 'credentials' | '2fa';

export default function LoginPage() {
  const router = useRouter();

  const CORE_BASE_URL = process.env.NEXT_PUBLIC_CORE_BASE_URL || '';

  const [step, setStep] = useState<Step>('credentials');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [token2fa, setToken2fa] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loginData, setLoginData] = useState<any>(null);

  const [mounted, setMounted] = useState(false);
  const [online, setOnline] = useState<boolean>(true);

  React.useEffect(() => {
    setMounted(true);
    const update = () => {
      try {
        setOnline(navigator.onLine);
      } catch {
        setOnline(true);
      }
    };

    update();
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    return () => {
      window.removeEventListener('online', update);
      window.removeEventListener('offline', update);
    };
  }, []);

  const finishLogin = async () => {
    localStorage.setItem('repaluc_auth', JSON.stringify({ username, ts: Date.now() }));
    try {
      localStorage.removeItem('repaluc_session_locked');
    } catch {
      // ignore
    }
    router.replace('/');
  };

  const verify2fa = async (token: string) => {
    if (!token || token.length !== 6) return;
    if (submitting) return;

    setSubmitting(true);
    try {
      const res = await fetch(`${CORE_BASE_URL}/auth/verify-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: username, token }),
      });

      const payload = await res.json().catch(() => null);

      const isValid = payload?.result === true || payload?.message === 'VALIDE!';
      if (!res.ok || !isValid) {
        throw new Error('Code 2FA invalide');
      }

      const merged = {
        ...(loginData || {}),
        ...((payload?.data as any) || {}),
      } as any;

      const effectiveUser = payload?.data?.user ?? loginData?.user;
      if (merged?.token) localStorage.setItem('token', merged.token);
      if (effectiveUser) localStorage.setItem('usr', JSON.stringify(effectiveUser));
      if (merged?.userAuthorisation) localStorage.setItem('auth', JSON.stringify(merged.userAuthorisation));
      if (merged?.applications) localStorage.setItem('apps', JSON.stringify(merged.applications));

      const passwordHash = await hashPassword(username, password);
      await saveOfflineCredentials(username, passwordHash);

      await finishLogin();
    } catch (error: any) {
      await Swal.fire({
        icon: 'error',
        title: 'Vérification échouée',
        text: error?.message || 'Impossible de valider le 2FA',
        confirmButtonColor: '#901c67'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const submitCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) return;

    setSubmitting(true);
    try {
      if (!online) {
        const ok = await verifyOfflineCredentials(username, password);
        if (!ok) {
          await Swal.fire({
            icon: 'error',
            title: 'Connexion hors ligne impossible',
            text: 'Identifiants non reconnus en mode hors ligne. Connectez-vous une première fois en ligne.',
            confirmButtonColor: '#901c67'
          });
          return;
        }

        await finishLogin();
        return;
      }

      if (!CORE_BASE_URL) {
        await Swal.fire({
          icon: 'error',
          title: 'Configuration manquante',
          text: 'NEXT_PUBLIC_CORE_BASE_URL n\'est pas configurée.',
          confirmButtonColor: '#901c67'
        });
        return;
      }

      const res = await fetch(`${CORE_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      if (!res.ok) {
        throw new Error('Identifiants incorrects');
      }

      const payload = await res.json().catch(() => null);
      const data = payload?.data;
      if (!data) {
        throw new Error('Réponse login invalide');
      }
      setLoginData(data);

      setStep('2fa');
    } catch (error: any) {
      await Swal.fire({
        icon: 'error',
        title: 'Connexion échouée',
        text: error?.message || 'Impossible de se connecter',
        confirmButtonColor: '#901c67'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const submit2fa = async (e: React.FormEvent) => {
    e.preventDefault();
    await verify2fa(token2fa);
  };

  return (
    <div className="min-h-screen w-full bg-slate-50 text-slate-900">
      <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2">
        <div className="relative hidden lg:block overflow-hidden">
          <Image
            src="/hero2.JPG"
            alt="Background"
            fill
            priority
            className="object-cover object-left scale-[1.03] brightness-[0.9] contrast-[1.1] saturate-[1.15]"
          />
          <div className="absolute inset-0 bg-black/25 z-10" />
          <div className="absolute inset-0 bg-gradient-to-tr from-black/55 via-black/30 to-transparent z-10" />
          <div className="absolute inset-0 z-10">
            <div className="absolute -top-24 -left-24 w-80 h-80 bg-fuchsia-500/20 rounded-full blur-3xl" />
            <div className="absolute bottom-10 left-20 w-64 h-64 bg-emerald-500/20 rounded-full blur-3xl" />
            <div className="absolute top-32 right-16 w-48 h-48 bg-blue-500/15 rounded-full blur-2xl" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(255,255,255,0.10),transparent_35%),radial-gradient(circle_at_80%_60%,rgba(255,255,255,0.06),transparent_45%)]" />
          </div>
          <div className="absolute bottom-14 left-14 right-14 max-w-[560px] z-20">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/15 backdrop-blur">
              <ShieldCheck size={16} className="text-emerald-300" />
              <span className="text-xs font-semibold tracking-wide text-white/90">Accès sécurisé</span>
            </div>
            <h1 className="mt-4 text-4xl font-bold leading-tight text-white">
              FONAREV Operational
              <span className="block text-white/80">Suivi & Gestion des Victimes</span>
            </h1>
            <p className="mt-4 text-sm text-white/70 leading-relaxed">
              Connecte-toi pour accéder aux modules et travailler même en mode hors ligne.
              La première connexion doit être effectuée en ligne pour activer l’accès offline.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-center p-6 bg-slate-50">
          <div className="w-full max-w-md">
            <div className="border border-slate-200 bg-white shadow-xl overflow-hidden">
              <div className="px-8 pt-8 pb-6 border-b border-slate-100">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-bold">Connexion</h2>
                    <p className="mt-1 text-sm text-slate-600">
                      {step === 'credentials' ? 'Entre ton identifiant et ton mot de passe.' : 'Saisis le code Microsoft Authenticator.'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-2 text-xs" suppressHydrationWarning>
                      {mounted ? (
                        !online ? (
                          <span className="inline-flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-700 px-3 py-1 whitespace-nowrap">
                            <WifiOff size={14} /> <span>Hors ligne</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-2 bg-blue-50 border border-blue-200 text-blue-700 px-3 py-1 whitespace-nowrap">
                            <KeyRound size={14} /> <span>En ligne</span>
                          </span>
                        )
                      ) : (
                        <span className="inline-flex items-center gap-2 bg-slate-50 border border-slate-200 text-slate-500 px-3 py-1 whitespace-nowrap">
                          <KeyRound size={14} /> <span>...</span>
                        </span>
                      )}
                    </span>
                  </div>
                </div>
              </div>

              <div className="px-8 pb-8">
                {step === 'credentials' ? (
                  <form onSubmit={submitCredentials} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-2">Nom d’utilisateur</label>
                      <input
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        autoComplete="username"
                        className="w-full border border-slate-300 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400"
                        placeholder="ex: john.doe"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-2">Mot de passe</label>
                      <div className="relative">
                        <input
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          autoComplete="current-password"
                          type={showPassword ? 'text' : 'password'}
                          className="w-full border border-slate-300 px-4 py-3 pr-11 text-sm outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400"
                          placeholder="••••••••"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((s) => !s)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 p-2 hover:bg-slate-100 text-slate-600"
                          title={showPassword ? 'Masquer' : 'Afficher'}
                        >
                          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={submitting || !username || !password}
                      className="w-full py-3 text-sm font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed bg-blue-600 hover:bg-blue-700"
                    >
                      {submitting ? (
                        <span className="inline-flex items-center justify-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Connexion...
                        </span>
                      ) : (
                        'Se connecter'
                      )}
                    </button>

                    {!online && (
                      <div className="text-xs text-slate-500 leading-relaxed">
                        Mode hors ligne : seuls les utilisateurs déjà connectés au moins une fois en ligne peuvent se reconnecter.
                      </div>
                    )}
                  </form>
                ) : (
                  <form onSubmit={submit2fa} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-2">Code Microsoft Authenticator</label>
                      <input
                        value={token2fa}
                        onChange={(e) => {
                          const raw = e.target.value;
                          const cleaned = raw.replace(/\D/g, '').slice(0, 6);
                          setToken2fa(cleaned);
                          if (cleaned.length === 6) {
                            void verify2fa(cleaned);
                          }
                        }}
                        inputMode="numeric"
                        maxLength={6}
                        className="w-full border border-slate-300 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 tracking-widest"
                        placeholder="123456"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={submitting || !token2fa}
                      className="w-full py-3 text-sm font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed bg-blue-600 hover:bg-blue-700"
                    >
                      {submitting ? (
                        <span className="inline-flex items-center justify-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Vérification...
                        </span>
                      ) : (
                        'Valider'
                      )}
                    </button>

                    <button
                      type="button"
                      disabled={submitting}
                      onClick={() => {
                        setToken2fa('');
                        setStep('credentials');
                      }}
                      className="w-full py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 border border-slate-200 disabled:opacity-50"
                    >
                      Retour
                    </button>
                  </form>
                )}
              </div>
            </div>

            <div className="mt-6 text-center text-xs text-slate-500">
              © {new Date().getFullYear()} FONAREV • Accès sécurisé
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
