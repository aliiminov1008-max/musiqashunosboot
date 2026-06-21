const CACHE_NAME = 'musiqa-attestatsiya-v2'; // Har yangilashda shu raqamni oshiring (v2, v3, ...)
const STATIC_ASSETS = [
  '/manifest.json'
];

// O'rnatish — asosiy fayllarni keshga olish
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Faollashtirish — eski keshlarni tozalash
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// So'rovlarni ushlash
self.addEventListener('fetch', event => {
  // Faqat GET so'rovlarni keshlash
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Google Fonts va Telegram skriptlari uchun — to'g'ridan-to'g'ri tarmoqdan olish
  if (
    url.hostname === 'fonts.googleapis.com' ||
    url.hostname === 'fonts.gstatic.com' ||
    url.hostname === 'telegram.org'
  ) {
    event.respondWith(fetch(event.request).catch(() => new Response('')));
    return;
  }

  // HTML sahifa (navigatsiya so'rovi yoki index.html) — AVVAL TARMOQ, keyin kesh.
  // Shunda har safar saytni yangilaganingizda foydalanuvchilar eskisini emas, yangisini ko'radi.
  const isHtmlRequest = event.request.mode === 'navigate' ||
    url.pathname === '/' ||
    url.pathname.endsWith('.html') ||
    event.request.headers.get('accept')?.includes('text/html');

  if (isHtmlRequest) {
    event.respondWith(
      fetch(event.request).then(response => {
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => {
        // Internet yo'q bo'lsa — keshdagi oxirgi nusxani ko'rsatamiz
        return caches.match(event.request).then(cached => {
          return cached || new Response('<h2>Internet aloqasi yo\'q</h2>', {
            headers: { 'Content-Type': 'text/html; charset=utf-8' }
          });
        });
      })
    );
    return;
  }

  // Boshqa fayllar (rasm, audio, css, js va h.k.): avval kesh, keyin tarmoq — tezlik va oflayn uchun
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => {
        return new Response('', { status: 408 });
      });
    })
  );
});
