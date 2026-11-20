self.addEventListener('install', (evento) => {
  evento.waitUntil(self.skipWaiting())
})

self.addEventListener('activate', (evento) => {
  evento.waitUntil(self.clients.claim())
})

self.addEventListener('fetch', () => {
  // Sin caché: dejamos que el navegador resuelva cada solicitud contra la red.
  // Esto evita servir chunks o documentos desactualizados de Next.js.
})
