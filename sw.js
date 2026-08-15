self.addEventListener('install', (event) => { self.skipWaiting(); });
self.addEventListener('activate', (event) => { clients.claim(); });
self.addEventListener('fetch', (event) => {
  if (event.request.method === 'POST' && event.request.url.includes('shared=true')) {
    event.respondWith(
      (async () => {
        const formData = await event.request.formData();
        const file = formData.get('file');
        const cache = await caches.open('shared-image');
        await cache.put('/shared-image-temp', new Response(file));
        return Response.redirect('/index.html?shared=true', 303);
      })()
    );
  }
});
