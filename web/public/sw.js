// MAD Clon — service worker mínimo (PWA de verdad)
// Estáticos con hash: caché primero (offline total una vez vistos).
// Páginas HTML: red primero (fresco); sin red, la última versión vista.
// JSON de /data: caché de UN DÍA — fresco se sirve al instante; viejo o sin red, lo guardado.
// v2: los JSON se clonan antes de sellarlos en caché (arreglo del ERR_FAILED en frío)
// v3 (13/08/2026): cambia la FORMA de clones.json — los buzones y agendas pasan a
//     identificarse por `clave` y las palabras de la flota se fueron al build. Un
//     lote viejo servido de caché (hasta 24 h) pintaría /salud con filas anónimas,
//     así que esta versión tira la caché de datos al activarse. Subir VERSION es
//     obligatorio siempre que cambie la forma de un JSON, no solo su contenido.
// v4 (18/08/2026): la forma no cambia, pero la caché tenía secuestrado un lote
//     RANCIO. El refresco nocturno estuvo tres días parado (su reloj vivía dentro
//     de una aplicación que dejó de correr) y, cuando se arregló y se publicó lote
//     fresco, la web SEGUÍA enseñando el del 15/8: quien la hubiera visitado en
//     las 24 h anteriores tenía el lote viejo sellado con la hora de SU descarga,
//     y esta caché es «primero caché» — no revalida, ni siquiera pregunta.
//     Así que una parada de publicación se paga DOS veces: los días que dura, y
//     hasta 24 h más después de arreglarla. Subir VERSION es la única forma de
//     desalojar eso en el navegador de todo el mundo a la vez.
const VERSION = 'v4'
const ESTATICA = `madclon-estatica-${VERSION}`
const PAGINAS = `madclon-paginas-${VERSION}`
const DATOS = `madclon-datos-${VERSION}`
const DIA_MS = 24 * 60 * 60 * 1000

// Subruta real del despliegue (p. ej. /madclon-front-office), derivada del scope
const BASE = new URL(self.registration.scope).pathname.replace(/\/$/, '')

// Cachés pre-abiertas en el arranque: las respuestas no esperan aperturas en frío
const ESTATICA_P = caches.open(ESTATICA)
const PAGINAS_P = caches.open(PAGINAS)
const DATOS_P = caches.open(DATOS)

self.addEventListener('install', e => {
  // La primera carga llega antes de que el SW mande: en la instalación
  // precacheamos la portada, sus chunks (leyendo el HTML), el manifiesto y
  // los JSON del día — así el modo offline es completo desde la PRIMERA visita.
  e.waitUntil(
    (async () => {
      const [paginas, estatica, datos] = await Promise.all([caches.open(PAGINAS), caches.open(ESTATICA), caches.open(DATOS)])
      const res = await fetch(`${BASE}/`)

      if (res.ok) {
        await paginas.put(`${BASE}/`, res.clone())

        const html = await res.text()
        const urls = new Set([`${BASE}/manifest.webmanifest`])

        for (const m of html.matchAll(/(?:src|href)="([^"]*?_next\/static\/[^"]+)"/g)) urls.add(m[1])
        await Promise.allSettled([...urls].map(u => estatica.add(u)))
      }

      const jsons = ['manifest', 'overview', 'serie', 'tokens', 'clones'].map(n => `${BASE}/data/${n}.json`)

      await Promise.allSettled(jsons.map(u => datos.add(u)))
      await self.skipWaiting()
    })()
  )
})

self.addEventListener('activate', e => {
  e.waitUntil(
    (async () => {
      const claves = await caches.keys()

      await Promise.all(claves.filter(c => c.startsWith('madclon-') && !c.endsWith(VERSION)).map(c => caches.delete(c)))
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

  // JSON con caché de un día
  if (esDatos(url.pathname)) {
    e.respondWith(
      (async () => {
        const cache = await DATOS_P
        const guardada = await cache.match(req)
        const fecha = guardada && Number(guardada.headers.get('sw-fecha'))

        if (guardada && fecha && Date.now() - fecha < DIA_MS) return guardada

        try {
          const res = await fetch(req)

          if (res.ok) {
            const cabeceras = new Headers(res.headers)

            cabeceras.set('sw-fecha', String(Date.now()))

            // Ojo: hay que clonar ANTES de construir la copia sellada. Pasar `res.body`
            // directamente deja la respuesta original sin cuerpo y la página recibe un
            // ERR_FAILED en el primer arranque (era la causa del reintento a los 1,5 s).
            const copia = res.clone()

            cache.put(req, new Response(copia.body, { status: copia.status, statusText: copia.statusText, headers: cabeceras }))
          }

          return res
        } catch (err) {
          if (guardada) return guardada // sin red: sirve lo guardado aunque esté viejo
          throw err
        }
      })()
    )

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
