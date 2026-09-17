/* ═══ carrerasAPP v17.3 — sw.js (Service Worker standalone) ═══
 * Estrategia:
 *  - App shell (mismo origen, GET): cache-first, fallback a red y re-cache.
 *  - CDNs (jsdelivr, cdnjs, unpkg, fonts googleapis/gstatic, gstatic firebase):
 *    stale-while-revalidate (sirve cache y actualiza en fondo).
 *  - APIs de datos (dolarapi, pydolarvenezuela, binance, firebase/firestore):
 *    network-only, con fallback a cache SOLO si ya existiera (nunca se cachean
 *    aquí; jamás se cachean respuestas con credenciales).
 *  - Todo en try/catch: si la red falla y no hay cache → Response de error
 *    controlada, NUNCA throw (la app es local-first y sobrevive sin SW).
 */
'use strict';

var CACHE = 'carrerasapp-v17-3';

var SHELL = ['./', 'index.html', 'styles.css', 'app.js', 'manifest.json', 'icon.png', 'icon_512.png'];

var CDN_HOSTS = [
  'cdn.jsdelivr.net',
  'cdnjs.cloudflare.com',
  'unpkg.com',
  'fonts.googleapis.com',
  'fonts.gstatic.com',
  'www.gstatic.com'
];

var API_HOSTS = [
  'dolarapi.com',
  'pydolarvenezuela.com',
  'binance.com',
  'firestore.googleapis.com',
  'firebaseio.com',
  'identitytoolkit.googleapis.com',
  'securetoken.googleapis.com',
  'www.googleapis.com'
];

function hostMatch(host, list) {
  for (var i = 0; i < list.length; i++) {
    var h = list[i];
    if (host === h) return true;
    if (host.length > h.length && host.slice(host.length - h.length - 1) === '.' + h) return true;
  }
  return false;
}

function errorResponse(msg) {
  try {
    return new Response(JSON.stringify({ ok: false, error: msg || 'offline' }), {
      status: 503,
      statusText: 'Service Unavailable',
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (e) {
    return Response.error();
  }
}

function cachePut(req, res) {
  // Nunca cachear respuestas con credenciales ni respuestas inválidas.
  try {
    if (!res) return;
    if (req.credentials === 'include') return;
    if (!(res.status === 200 || res.type === 'opaque' || res.type === 'cors' || res.type === 'basic')) return;
    var clone = res.clone();
    caches.open(CACHE).then(function (c) { c.put(req, clone); }).catch(function () {});
  } catch (e) { /* noop */ }
}

self.addEventListener('install', function (e) {
  try {
    e.waitUntil(
      caches.open(CACHE)
        .then(function (c) { return c.addAll(SHELL); })
        .catch(function () { /* precache best-effort: la app es local-first */ })
        .then(function () { return self.skipWaiting(); })
    );
  } catch (err) { try { self.skipWaiting(); } catch (e) {} }
});

self.addEventListener('activate', function (e) {
  try {
    e.waitUntil(
      caches.keys()
        .then(function (keys) {
          return Promise.all(keys.map(function (k) {
            if (k !== CACHE) return caches.delete(k);
            return Promise.resolve(false);
          }));
        })
        .catch(function () {})
        .then(function () { return self.clients.claim(); })
    );
  } catch (err) { try { self.clients.claim(); } catch (e) {} }
});

self.addEventListener('fetch', function (e) {
  try {
    var req = e.request;
    if (!req || req.method !== 'GET') return;

    var url;
    try { url = new URL(req.url); } catch (err) { return; }
    var host = url.hostname || '';
    var isOwn = url.origin === self.location.origin;

    // --- APIs de datos: NETWORK-ONLY (fallback a cache solo si existiera) ---
    if (hostMatch(host, API_HOSTS)) {
      e.respondWith(
        fetch(req).catch(function () {
          return caches.match(req).then(function (hit) {
            return hit || errorResponse('offline: api de datos sin red');
          });
        })
      );
      return;
    }

    // --- CDNs de librerías/fuentes: STALE-WHILE-REVALIDATE ---
    if (hostMatch(host, CDN_HOSTS)) {
      e.respondWith(
        caches.match(req).then(function (hit) {
          var net = fetch(req).then(function (res) {
            cachePut(req, res);
            return res;
          }).catch(function () { return hit || null; });
          if (hit) return hit;
          return net.then(function (res) { return res || errorResponse('offline: cdn sin cache'); });
        })
      );
      return;
    }

    // --- App shell (mismo origen): CACHE-FIRST, fallback a red y re-cache ---
    if (isOwn) {
      e.respondWith(
        caches.match(req).then(function (hit) {
          if (hit) return hit;
          return fetch(req).then(function (res) {
            cachePut(req, res);
            return res;
          }).catch(function () {
            return errorResponse('offline: shell sin cache');
          });
        })
      );
      return;
    }

    // --- Resto de orígenes: red directa con error controlado ---
    e.respondWith(
      fetch(req).catch(function () { return errorResponse('offline'); })
    );
  } catch (err) {
    // Nunca propagar excepciones desde el SW.
    try { e.respondWith(errorResponse('sw error')); } catch (e2) {}
  }
});
