// Service worker: cache the app shell on install; cache audio on first play.
// Audio is NOT pre-cached (all ~185MB would be rejected on install, esp. Safari).
var SHELL_CACHE = 'minna-shell-v2';
var AUDIO_CACHE = 'minna-audio-v1';
var SHELL = [
  './',
  './index.html',
  './app.js',
  './lessons.js',
  './exercises-data.js',
  './exercises.js',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(SHELL_CACHE).then(function (c) { return c.addAll(SHELL); }));
  self.skipWaiting();
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) {
        return k !== SHELL_CACHE && k !== AUDIO_CACHE;
      }).map(function (k) { return caches.delete(k); }));
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', function (e) {
  var url = new URL(e.request.url);
  if (e.request.method !== 'GET') return;
  // Audio: cache-first, fetch on demand and store for offline use.
  if (url.pathname.indexOf('/audio/') !== -1 && url.pathname.endsWith('.mp3')) {
    e.respondWith(
      caches.open(AUDIO_CACHE).then(function (cache) {
        return cache.match(e.request).then(function (hit) {
          if (hit) return hit;
          return fetch(e.request).then(function (res) {
            if (res && res.ok) cache.put(e.request, res.clone());
            return res;
          });
        });
      })
    );
    return;
  }
  // App shell: cache-first, fall back to network.
  e.respondWith(
    caches.match(e.request).then(function (hit) {
      return hit || fetch(e.request).then(function (res) {
        if (res && res.ok && url.origin === self.location.origin) {
          var copy = res.clone();
          caches.open(SHELL_CACHE).then(function (c) { c.put(e.request, copy); });
        }
        return res;
      });
    }).catch(function () { return caches.match('./index.html'); })
  );
});
