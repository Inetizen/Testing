const CACHE_NAME = 'hotfake-cache-v6'; // Version 6 forcibly clears old index-4-1 cache!

// Using relative paths for GitHub Pages subfolder compatibility
const urlsToCache = [
  './',
  './index.html',
  './admin.html',
  './profile.html',
  './special.html',
  './permission.html',
  './payment.html',
  './contact-support.html',
  './100.png',
  './LargeTile.scale-100.png',
  './launchericon-144x144.png',
  './launchericon-512x512.png',
  './manifest.json'
];

self.addEventListener('install', event => {
  self.skipWaiting(); 
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Advanced PWA: Essential files cached!');
        return cache.addAll(urlsToCache);
      })
      .catch(error => {
        console.error('PWA Cache Error:', error);
      })
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(self.clients.claim());
  
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          if (cache !== CACHE_NAME) {
            console.log('Advanced PWA: Deleting old cache ->', cache);
            return caches.delete(cache);
          }
        })
      );
    })
  );
});

self.addEventListener('fetch', event => {
  if (
      event.request.url.includes('firebaseio.com') || 
      event.request.url.includes('ipapi.co') ||
      event.request.url.includes('google-analytics') ||
      event.request.url.includes('workers.dev') 
  ) {
     return;
  }

  if (event.request.headers.get('range')) {
      return;
  }

  event.respondWith(
    fetch(event.request)
      .then(response => {
        if (response && response.status === 200 && response.type === 'basic') {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then(cache => {
                cache.put(event.request, responseClone);
            });
        }
        return response;
      })
      .catch(() => {
        return caches.match(event.request);
      })
  );
});
