// MAD Clon — service worker mínimo (PWA de verdad)
// Estáticos con hash: caché primero (offline total una vez vistos).
// Páginas HTML: red primero (fresco); sin red, la última versión vista.
// JSON de /data: siempre red y no-store. Nunca entra en Cache Storage ni queda offline.
const VERSION = 'v3-no-public-data-cache'
const ESTATICA = `madclon-estatica-${VERSION}`
const PAGINAS = `madclon-paginas-${VERSION}`

// Subruta real del despliegue (p. ej. /madclon-front-office), derivada del scope
const BASE = new URL(self.registration.scope).pathname.replace(/\/$/, '')

// Cachés pre-abiertas en el arranque: las respuestas no esperan aperturas en frío
const ESTATICA_P = caches.open(ESTATICA)
const PAGINAS_P = caches.open(PAGINAS)

self.addEventListener('install', e => {
  // La primera carga llega antes de que el SW mande: en la instalación
  // precacheamos la portada, sus chunks (leyendo el HTML) y el manifiesto.
  // Los JSON públicos quedan expresamente fuera del modo offline.
  e.waitUntil(
    (async () => {
      const [paginas, estatica] = await Promise.all([caches.open(PAGINAS), caches.open(ESTATICA)])
      const res = await fetch(`${BASE}/`)

      if (res.ok) {
        await paginas.put(`${BASE}/`, res.clone())

        const html = await res.text()
        const urls = new Set([`${BASE}/manifest.webmanifest`])

        for (const m of html.matchAll(/(?:src|href)="([^"]*?_next\/static\/[^"]+)"/g)) urls.add(m[1])
        await Promise.allSettled([...urls].map(u => estatica.add(u)))
      }

      await self.skipWaiting()
    })()
  )
})

self.addEventListener('activate', e => {
  e.waitUntil(
    (async () => {
      const claves = await caches.keys()

      await Promise.all(
        claves
          .filter(c => c.startsWith('madclon-datos-') || (c.startsWith('madclon-') && !c.endsWith(VERSION)))
          .map(c => caches.delete(c))
      )
      await self.clients.claim()
    })()
  )
})

const esEstatico = p =>
  p.startsWith(`${BASE}/_next/static/`) ||
  p.startsWith(`${BASE}/images/`) ||
  p.endsWith('.png') ||
  p.endsWith('.svg') ||
  p.endsWith('.ico') ||
  p.endsWith('.webmanifest')

const esDatos = p => p.startsWith(`${BASE}/data/`)

self.addEventListener('fetch', e => {
  const req = e.request

  if (req.method !== 'GET') return

  const url = new URL(req.url)

  if (url.origin !== self.location.origin) return

  // Los datos no se precachean, no se guardan y no tienen fallback offline.
  if (esDatos(url.pathname)) {
    e.respondWith(fetch(req, { cache: 'no-store' }))

    return
  }

  // Estáticos: caché primero (sus nombres llevan hash de contenido)
  if (esEstatico(url.pathname)) {
    e.respondWith(
      (async () => {
        const cache = await ESTATICA_P
        const guardada = await cache.match(req)

        if (guardada) return guardada

        const res = await fetch(req)

        if (res.ok) cache.put(req, res.clone())

        return res
      })()
    )

    return
  }

  // Páginas: red primero; sin red, la última vista (y si no, la portada guardada)
  if (req.mode === 'navigate') {
    e.respondWith(
      (async () => {
        const cache = await PAGINAS_P

        try {
          const res = await fetch(req)

          if (res.ok) cache.put(req, res.clone())

          return res
        } catch (err) {
          const guardada = await cache.match(req)

          if (guardada) return guardada

          const raiz = await cache.match(`${BASE}/`)

          if (raiz) return raiz
          throw err
        }
      })()
    )
  }
})
