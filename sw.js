const CACHE = 'myapp-v3';
const IMG_CACHE = 'myapp-img-v1';
const ASSETS = [
  './',
  './index.html',
  './post.html'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).catch(() => {}));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE && k !== IMG_CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;

  // الصور: من الذاكرة فوراً ثم تحديثها في الخلفية
  if (req.destination === 'image') {
    e.respondWith(
      caches.open(IMG_CACHE).then(async cache => {
        const cached = await cache.match(req);
        const network = fetch(req).then(res => {
          if (res && (res.ok || res.type === 'opaque')) cache.put(req, res.clone()).catch(() => {});
          return res;
        }).catch(() => cached);
        return cached || network;
      })
    );
    return;
  }

  // باقي الطلبات: الإنترنت أولاً ثم النسخة المحفوظة عند الانقطاع
  e.respondWith(
    fetch(req).catch(() => caches.match(req))
  );
});
