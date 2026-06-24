/**
 * Jamra — Service Worker
 *
 * Stratégies de cache :
 *  - Précache : shell de l'app (HTML, JS, CSS, icônes)
 *  - Stale-While-Revalidate : assets statiques et images
 *  - Network-First : navigation HTML (pour avoir toujours la dernière version si online)
 *  - Network-only : appels API OpenFoodFacts (pas de cache côté SW, cache métier en IndexedDB)
 */

const CACHE_VERSION = 'jamra-v2';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const RUNTIME_CACHE = `${CACHE_VERSION}-runtime`;

// Fichiers à pré-cacher au install
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/icon-192.png',
  '/icon-512.png',
  '/apple-touch-icon.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(k => !k.startsWith(CACHE_VERSION))
          .map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ne traite que les GET same-origin et OFF
  if (request.method !== 'GET') return;

  // Pas de cache pour OpenFoodFacts ou Supabase API (toujours frais, IndexedDB gère le cache métier)
  if (url.hostname.includes('openfoodfacts')) return;
  if (url.hostname.includes('supabase.co')) return;

  // Hors du scope de l'app : ne rien faire
  if (url.origin !== self.location.origin) return;

  // Navigation HTML : network-first avec fallback cache (pour récup en offline)
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then(res => {
          const copy = res.clone();
          caches.open(RUNTIME_CACHE).then(cache => cache.put(request, copy));
          return res;
        })
        .catch(() =>
          caches.match(request).then(cached => cached || caches.match('/'))
        )
    );
    return;
  }

  // Assets statiques (JS, CSS, images, fonts) : stale-while-revalidate
  event.respondWith(
    caches.match(request).then(cached => {
      const fetchPromise = fetch(request).then(res => {
        if (res && res.status === 200) {
          const copy = res.clone();
          caches.open(RUNTIME_CACHE).then(cache => cache.put(request, copy));
        }
        return res;
      }).catch(() => cached);
      return cached || fetchPromise;
    })
  );
});

// Message handler pour update
self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});

// ─── Push notifications ──────────────────────────────────────────────────────
self.addEventListener('push', (event) => {
  let data = { title: 'Jamra', body: '💪 Nouveau message de ton coach', icon: '/icon-192.png', badge: '/icon-192.png', tag: 'jamra-push' };
  if (event.data) {
    try { Object.assign(data, event.data.json()); } catch { data.body = event.data.text(); }
  }
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: data.icon || '/icon-192.png',
      badge: data.badge || '/icon-192.png',
      tag: data.tag || 'jamra-push',
      data: { url: data.url || '/' },
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(wins => {
      const match = wins.find(w => w.url.includes(self.location.origin));
      if (match) { match.focus(); match.navigate(url); }
      else clients.openWindow(url);
    })
  );
});
