const STATIC_CACHE = 'fortre-static-v3';
const RUNTIME_CACHE = 'fortre-runtime-v3';

const CORE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/logo-fortre.svg',
  '/fortre-icon-1024.png',
  '/apple-touch-icon-v2.png'
];

// 1. Install: simpan aset inti ke cache
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(CORE_ASSETS))
  );
  self.skipWaiting();
});

// 2. Activate: bersihkan cache versi lama
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== STATIC_CACHE && key !== RUNTIME_CACHE)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// 3. Fetch: Stale-While-Revalidate untuk aset & CDN, Network-First untuk navigasi
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Lewati request non-GET dan endpoint API Supabase
  if (request.method !== 'GET' || request.url.includes('supabase.co')) {
    return;
  }

  // Navigasi halaman utama (buka app saat offline)
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(STATIC_CACHE).then((cache) => cache.put('/index.html', copy));
          return response;
        })
        .catch(() => caches.match('/index.html'))
    );
    return;
  }

  // Aset lokal & CDN eksternal (Tailwind, Alpine, Chart.js, Lucide, Fonts)
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      const networkFetch = fetch(request)
        .then((response) => {
          if (response && (response.status === 200 || response.type === 'opaque')) {
            const copy = response.clone();
            caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(() => cachedResponse);

      return cachedResponse || networkFetch;
    })
  );
});
