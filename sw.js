const CACHE_NAME = "nestfinder-cache-v8";
const STATIC_ASSETS = ["/", "/index.html", "/login.html", "/manifest.json", "/favicon.svg", "/icon.svg"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const url = event.request.url;

  // Never intercept Firebase, Google APIs, or external services
  if (
    url.includes("firebaseio.com") ||
    url.includes("googleapis.com") ||
    url.includes("gstatic.com") ||
    url.includes("firebaseapp.com") ||
    url.includes("safaricom.co.ke") ||
    url.includes("resend.com") ||
    url.includes("supabase.co") ||
    !url.startsWith("https://nest-finder-cuk.vercel.app")
  ) {
    return;
  }

  // Cache-first for static assets, network-first for everything else
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        if (response && response.status === 200 && event.request.method === "GET") {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => caches.match(event.request));
    })
  );
});
