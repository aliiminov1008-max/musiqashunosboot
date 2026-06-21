const CACHE_NAME = 'musiqa-attestatsiya-v1';
const STATIC_ASSETS = [
  '/index.html',
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

// So'rovlarni ushlash — avval keshdan, keyin tarmoqdan
self.addEventListener('fetch', event => {
  // Faqat GET so'rovlarni keshlash
  if (event.request.method !== 'GET') return;

  // Google Fonts va Telegram skriptlari uchun — tarmoqdan olish
  const url = new URL(event.request.url);
  if (
    url.hostname === 'fonts.googleapis.com' ||
    url.hostname === 'fonts.gstatic.com' ||
    url.hostname === 'telegram.org'
  ) {
    event.respondWith(fetch(event.request).catch(() => new Response('')));
    return;
  }

  // Boshqa so'rovlar: avval kesh, keyin tarmoq
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        // Muvaffaqiyatli javoblarni keshga saqlash
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => {
        // Tarmoq yo'q bo'lsa va keshda yo'q bo'lsa
        return new Response('<h2>Internet aloqasi yo\'q</h2>', {
          headers: { 'Content-Type': 'text/html; charset=utf-8' }
        });
      });
    })
  );
});
