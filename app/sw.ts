import type { PrecacheEntry, RuntimeCaching, SerwistGlobalConfig } from "serwist";
import { Serwist, NetworkFirst, CacheFirst, StaleWhileRevalidate } from "serwist";

// This declares the value of `injectionPoint` to TypeScript.
declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: WorkerGlobalScope;

// Plugin commun: n'enregistrer en cache que les réponses 200 OK.
const onlyOkResponses = {
  cacheWillUpdate: async ({ response }: { response: Response }) => {
    if (response && response.status === 200) return response;
    return null;
  },
};

/**
 * runtimeCaching custom — VOLONTAIREMENT SANS ExpirationPlugin pour les pages
 * et les données critiques, afin que l'app reste accessible hors-ligne
 * indéfiniment (ex: plusieurs semaines en mode avion).
 *
 * NB : on remplace intentionnellement `defaultCache` de @serwist/next/worker,
 * car il applique un TTL de 24 h aux pages HTML (cause du bug offline après
 * une journée).
 */
const runtimeCaching: RuntimeCaching[] = [
  // 1) Pages HTML (navigation) — NetworkFirst avec fallback cache permanent
  {
    matcher: ({ request, url }) =>
      request.mode === "navigate" ||
      request.destination === "document" ||
      url.pathname === "/" ||
      url.pathname.endsWith(".html"),
    handler: new NetworkFirst({
      cacheName: "pages-cache",
      networkTimeoutSeconds: 3,
      plugins: [onlyOkResponses],
    }),
  },

  // 2) Données API (Next.js internes /api/*) — NetworkFirst permanent
  {
    matcher: ({ url }) => url.pathname.startsWith("/api/"),
    handler: new NetworkFirst({
      cacheName: "api-cache",
      networkTimeoutSeconds: 5,
      plugins: [onlyOkResponses],
    }),
  },

  // 3) Appels cross-origin vers le backend (core API) — NetworkFirst permanent
  {
    matcher: ({ url, request }) =>
      request.method === "GET" &&
      url.origin !== (self as unknown as { location: Location }).location.origin &&
      !url.hostname.includes("fonts.g"),
    handler: new NetworkFirst({
      cacheName: "external-api-cache",
      networkTimeoutSeconds: 5,
      plugins: [onlyOkResponses],
    }),
  },

  // 4) Scripts / styles / workers Next.js — StaleWhileRevalidate
  {
    matcher: ({ request }) =>
      request.destination === "script" ||
      request.destination === "style" ||
      request.destination === "worker",
    handler: new StaleWhileRevalidate({
      cacheName: "static-resources",
      plugins: [onlyOkResponses],
    }),
  },

  // 5) Images — CacheFirst, conservées tant qu'il y a de l'espace
  {
    matcher: ({ request }) => request.destination === "image",
    handler: new CacheFirst({
      cacheName: "images-cache",
      plugins: [onlyOkResponses],
    }),
  },

  // 6) Polices — CacheFirst long terme
  {
    matcher: ({ request, url }) =>
      request.destination === "font" ||
      url.hostname.includes("fonts.gstatic.com") ||
      url.hostname.includes("fonts.googleapis.com"),
    handler: new CacheFirst({
      cacheName: "fonts-cache",
      plugins: [onlyOkResponses],
    }),
  },

  // 7) Fallback générique (audio, vidéo, manifest, etc.)
  {
    matcher: () => true,
    handler: new StaleWhileRevalidate({
      cacheName: "misc-cache",
      plugins: [onlyOkResponses],
    }),
  },
];

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching,
});

serwist.addEventListeners();
