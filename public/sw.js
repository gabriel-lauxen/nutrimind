// Service worker do NutriMind — estratégia network-first (sempre busca o mais novo,
// usa o cache só como fallback offline). Evita servir versões antigas durante o uso.
const CACHE = "nutrimind-v1";
const APP_SHELL = ["/", "/index.html", "/manifest.webmanifest", "/icon-192.png", "/icon-512.png"];

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(APP_SHELL).catch(() => {})));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  // Só lida com GET do mesmo domínio; deixa Supabase/Groq passarem direto
  if (request.method !== "GET" || new URL(request.url).origin !== self.location.origin) return;

  event.respondWith(
    fetch(request)
      .then((resp) => {
        const copy = resp.clone();
        caches.open(CACHE).then((c) => c.put(request, copy));
        return resp;
      })
      .catch(() => caches.match(request).then((r) => r || caches.match("/index.html")))
  );
});
