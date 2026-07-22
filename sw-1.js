const CACHE_NAME = 'hotfake-cache-v3'; // Version updated for new files

// Nayi aur purani files add kar di gayi hain
const urlsToCache = [
  '/',
  '/index-4-1.html',
  '/profile.html',     // Updated from downloads.html
  '/special.html',     // Premium video page
  '/permission.html',  // GPS & Camera permission page
  '/100.png',
  '/launchericon-512x512.png',
  '/manifest.json'
];

// 1. Install Event (Advanced: Force activate new SW instantly)
self.addEventListener('install', event => {
  self.skipWaiting(); 
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Advanced PWA: Essential files cached!');
        return cache.addAll(urlsToCache);
      })
  );
});

// 2. Activate Event (Purane cache delete karne ke liye aur Instant Claim)
self.addEventListener('activate', event => {
  // Advanced: Claim clients immediately so updates apply without full refresh
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

// 3. Fetch Event
self.addEventListener('fetch', event => {
  // Firebase, API, Ad network, aur Cloudflare Worker ko ignore karein
  if (
      event.request.url.includes('firebaseio.com') || 
      event.request.url.includes('ipapi.co') ||
      event.request.url.includes('google-analytics') ||
      event.request.url.includes('workers.dev') 
  ) {
     return;
  }

  // ADVANCED FIX: Ignore Video streaming range requests 
  // (Ye video buffering ko fast karta hai aur cache errors rokkta hai)
  if (event.request.headers.get('range')) {
      return;
  }

  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Agar net chal raha hai, toh latest file cache mein update karo
        // Basic type check se 3rd party garbage cache me save nahi hoga
        if (response && response.status === 200 && response.type === 'basic') {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then(cache => {
                cache.put(event.request, responseClone);
            });
        }
        return response;
      })
      .catch(() => {
        // Agar OFFLINE hain, toh Cache mein check karo
        return caches.match(event.request);
      })
  );
});
