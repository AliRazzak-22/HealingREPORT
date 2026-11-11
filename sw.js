/* Service Worker — تطبيق التقارير المالية: غلاف قابل للتثبيت ويعمل دون نت */
const CACHE = 'fin-reports-v2';
const SHELL = ['./', './index.html', './financial-reports.html', './manifest.webmanifest', './logo.png', './logo.svg'];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => Promise.allSettled(SHELL.map(u => c.add(new Request(u, { cache: 'reload' })))))
      .then(() => self.skipWaiting())
  );
});
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin === self.location.origin) {
    /* ملفات التطبيق: من الشبكة أولاً (ليصل كل تحديث) وبديل من الكاش عند انقطاع النت */
    e.respondWith(
      fetch(req)
        .then(r => { const cp = r.clone(); caches.open(CACHE).then(c => c.put(req, cp)); return r; })
        .catch(() => caches.match(req).then(m => m || caches.match('./index.html').then(m2 => m2 || caches.match('./financial-reports.html'))))
    );
    return;
  }
  /* الخطوط ومكتبات Firebase: من الكاش فوراً مع تحديث بالخلفية */
  e.respondWith(
    caches.match(req).then(m => {
      const fresh = fetch(req)
        .then(r => { if (r && r.ok) caches.open(CACHE).then(c => c.put(req, r.clone())); return r; })
        .catch(() => m);
      return m || fresh;
    })
  );
});