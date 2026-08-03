const CACHE_NAME = 'mision-nebula-v19';
const FILES = [
  './', './index.html', './informe-actividad-1.html', './README.md',
  './css/styles.css?v=19', './css/accessibility.css?v=19', './css/print.css?v=19',
  './js/app.js?v=19', './js/space-game.js?v=19', './js/questions.js', './js/game.js', './js/data.js', './js/storage.js',
  './js/canvas.js', './js/evaluation.js', './js/report.js', './js/accessibility.js?v=19',
  './assets/icons/favicon.svg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(FILES)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))));
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const requestUrl = new URL(event.request.url);
  if (requestUrl.origin !== self.location.origin) return;

  const networkFirst = event.request.mode === 'navigate' || /\.(?:html|css|js)$/.test(requestUrl.pathname);
  if (networkFirst) {
    event.respondWith(fetch(event.request).then((response) => {
      if (response.ok) caches.open(CACHE_NAME).then((cache) => cache.put(event.request, response.clone()));
      return response;
    }).catch(async () => (await caches.match(event.request)) || caches.match('./index.html')));
    return;
  }

  event.respondWith(caches.match(event.request).then((cached) => cached || fetch(event.request).then((response) => {
    if (response.ok) caches.open(CACHE_NAME).then((cache) => cache.put(event.request, response.clone()));
    return response;
  })));
});
