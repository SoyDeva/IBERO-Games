const CACHE_NAME = 'mision-nebula-v4';
const FILES = [
  './', './index.html', './informe-actividad-1.html', './README.md',
  './css/styles.css', './css/accessibility.css', './css/print.css',
  './js/app.js', './js/game.js', './js/data.js', './js/storage.js',
  './js/canvas.js', './js/evaluation.js', './js/report.js', './js/accessibility.js',
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
  event.respondWith(caches.match(event.request).then((cached) => cached || fetch(event.request).then((response) => {
    const copy = response.clone();
    caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
    return response;
  }).catch(() => caches.match('./index.html'))));
});
