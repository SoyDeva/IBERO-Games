const CACHE_NAME = 'mision-nebula-retina-sharpness-v28';

const APP_SHELL = [
  './',
  './index.html',
  './informe-actividad-1.html',
  './README.md',
  './manifest.webmanifest',
  './assets/icons/favicon.svg',
  './assets/icons/app-icon-180.png',
  './assets/icons/app-icon-192.png',
  './assets/icons/app-icon-512.png',

  './css/styles.css',
  './css/learning-progress.css',
  './css/learning-profile-tools.css',
  './css/learning-repair.css',
  './css/nebula-bright.css',
  './css/flight-polish.css',
  './css/flight-mobile-cleanup.css',
  './css/mission-results.css',
  './css/hangar-polish.css',
  './css/hangar-gameplay.css',
  './css/ranking-polish.css',
  './css/accessibility.css',
  './css/print.css',

  './js/accessibility.js',
  './js/app.js',
  './js/canvas.js',
  './js/config/ship-catalog.js',
  './js/config/storage-keys.js',
  './js/config/supabase.js',
  './js/core/achievements.js',
  './js/core/economy.js',
  './js/core/flight-challenges.js',
  './js/core/flight-excitement.js',
  './js/core/flight-geometry.js',
  './js/core/flight-loadout.js',
  './js/core/flight-performance.js',
  './js/core/flight-simulation.js',
  './js/core/flight-state.js',
  './js/core/galactic-errors.js',
  './js/core/galactic-score.js',
  './js/core/galactic-season.js',
  './js/core/hangar.js',
  './js/core/html.js',
  './js/core/learning-backup.js',
  './js/core/learning-device-backup.js',
  './js/core/learning-device-restore.js',
  './js/core/learning-export.js',
  './js/core/learning-profiles.js',
  './js/core/learning-progress.js',
  './js/core/learning-recovery.js',
  './js/core/learning-repair.js',
  './js/core/mission-summary.js',
  './js/core/pilot-profile.js',
  './js/core/question-adaptation.js',
  './js/core/question-feedback.js',
  './js/core/routes.js',
  './js/core/settings.js',
  './js/core/station.js',
  './js/core/storage-diagnostics.js',
  './js/core/tutorial.js',
  './js/data.js',
  './js/data/generated-question-bank.js',
  './js/evaluation.js',
  './js/galactic-league.js',
  './js/game.js',
  './js/questions.js',
  './js/report.js',
  './js/services/achievement-store.js',
  './js/services/browser-storage.js',
  './js/services/economy-store.js',
  './js/services/flight-input-controller.js',
  './js/services/galactic-league-service.js',
  './js/services/game-storage.js',
  './js/services/learning-progress-store.js',
  './js/services/learning-repair-store.js',
  './js/services/pilot-profile-store.js',
  './js/services/question-session.js',
  './js/services/ranking-controller.js',
  './js/services/storage-diagnostics-store.js',
  './js/services/supabase-rpc.js',
  './js/space-game.js',
  './js/storage.js',
  './js/ui/flight-excitement-renderer.js',
  './js/ui/flight-renderer.js',
  './js/ui/game-over-screen.js',
  './js/ui/hangar-screen.js',
  './js/ui/home-screen.js',
  './js/ui/learning-device-restore-panel.js',
  './js/ui/learning-progress-panel.js',
  './js/ui/learning-recovery-panel.js',
  './js/ui/learning-repair-controller.js',
  './js/ui/learning-repair-panel.js',
  './js/ui/learning-tools-controller.js',
  './js/ui/navigation-bindings.js',
  './js/ui/pause-panel.js',
  './js/ui/quiz-panel.js',
  './js/ui/ranking-screen.js',
  './js/ui/static-screens.js',
  './js/ui/station-panel.js',
  './js/ui/storage-diagnostics-panel.js',
  './js/ui/teacher-learning-report.js',
  './js/ui/tutorial-panel.js'
];

const CODE_REQUEST = /\.(?:html|css|js|webmanifest)$/i;

async function cacheSuccessfulResponse(request, response) {
  if (response?.ok) {
    const cache = await caches.open(CACHE_NAME);
    await cache.put(request, response.clone());
  }
  return response;
}

async function cachedResponse(request) {
  return caches.match(request, { ignoreSearch: true });
}

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(
    keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
  )));
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const requestUrl = new URL(event.request.url);
  if (requestUrl.origin !== self.location.origin) return;

  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((response) => cacheSuccessfulResponse(event.request, response))
        .catch(async () => (await cachedResponse(event.request)) || cachedResponse('./index.html'))
    );
    return;
  }

  if (CODE_REQUEST.test(requestUrl.pathname)) {
    event.respondWith(
      fetch(event.request)
        .then((response) => cacheSuccessfulResponse(event.request, response))
        .catch(async () => (await cachedResponse(event.request)) || new Response('Recurso no disponible sin conexión.', {
          status: 503,
          statusText: 'Offline',
          headers: { 'Content-Type': 'text/plain; charset=utf-8' }
        }))
    );
    return;
  }

  event.respondWith(
    cachedResponse(event.request).then((cached) => cached || fetch(event.request)
      .then((response) => cacheSuccessfulResponse(event.request, response)))
  );
});