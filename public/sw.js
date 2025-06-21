const CACHE_NAME = 'gym-tracker-cache-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/css/style.css',
  '/js/script.js',
  '/manifest.json',
  'https://cdn.tailwindcss.com',
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap',
  // Agrega aquí los íconos que definiste en manifest.json
  '/images/gym/icons/icon-192x192.png',
  '/images/gym/icons/icon-512x512.png',
  '/images/gym/icons/icon-maskable-192x192.png',
  '/images/gym/icons/icon-maskable-512x512.png',
  // Sería ideal cachear también las imágenes de los ejercicios si no son demasiadas
  // o implementar una estrategia de caché más avanzada para ellas.
  // Por ahora, las omitimos para mantenerlo simple.
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Cache abierto');
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response; // Servir desde caché
        }
        return fetch(event.request).then(
          (response) => {
            // Si la respuesta es válida, la clonamos y la guardamos en caché
            if(!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            const responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });
            return response;
          }
        );
      })
  );
});

self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName); // Eliminar cachés antiguas
          }
        })
      );
    })
  );
});
