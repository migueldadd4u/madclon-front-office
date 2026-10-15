// MAD Clon — service worker mínimo (PWA de verdad)
// Estáticos con hash: caché primero (offline total una vez vistos).
// Páginas HTML: red primero (fresco); sin red, la última versión vista.
// JSON de /data: RED PRIMERO con plazo de 3 s; sin red, o si tarda y lo guardado es de
//     menos de un día, lo guardado (desde la v8; hasta la v7, caché de un día sin revalidar).
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
// v5 (06/09/2026): misma película que la v4, cuatro noches después. El refresco
//     nocturno se paró del 03 al 06/09 (un aviso editorial —«la historia lleva 22
//     días sin capítulo»— tumbaba el lote entero) y, arreglado y republicado a las
//     08:10 del 06/09, MAD seguía viendo la franja «estos números son del 2/9, 111 h
//     sin correr»: su navegador tenía sellado el lote muerto y esta caché no
//     revalida. Producción servía el lote bueno; su copia local, no.
//     Ésa es la factura fija del diseño aprobado el 03/08 (caché de un día, que es
//     lo que da el modo avión): cada parada se paga dos veces. Mientras el diseño
//     siga así, ARREGLAR LA PUBLICACIÓN NO TERMINA HASTA SUBIR ESTA VERSIÓN, que es
//     lo único que desaloja el lote muerto en el navegador de todo el mundo a la vez.
// v6 (19/09/2026): overview incorpora hardware; desalojar lotes sin indicadores.
// v7 (24/09/2026): overview gana `retos` (forma nueva, /retos lo pinta): desalojar lotes sin él.
// v8 (15/10/2026): los JSON de /data pasan de «primero caché, sin revalidar» a RED PRIMERO
//     con plazo (PLAZO_RED_MS). Quien volvía a la web veía los datos de ayer hasta 24 h,
//     y cada parada del refresco se pagaba dos veces (v4, v5). Ahora cada visita pide el
//     lote a la red y guarda en caché toda respuesta buena, llegue a tiempo o tarde.
//     El modo avión se mantiene: sin red, lo guardado aunque sea viejo. Si la red tarda
//     más del plazo, lo guardado solo si es de menos de un día (DIA_MS); si es más viejo,
//     se espera a la red. Un 5xx también cae a lo guardado; un 4xx no (el fichero ya no
//     está, y eso se respeta). Arreglar una parada de publicación ya no exige subir VERSION;
//     cambiar la FORMA de un JSON sí (regla de la v3), porque con red lenta u offline la
//     página nueva podría recibir un lote guardado de la forma vieja.
const VERSION = 'v8'
const ESTATICA = `madclon-estatica-${VERSION}`
const PAGINAS = `madclon-paginas-${VERSION}`
const DATOS = `madclon-datos-${VERSION}`
const DIA_MS = 24 * 60 * 60 * 1000

// Por debajo del FETCH_TIMEOUT_MS de la página (5 s, src/lib/data.ts): si la red tarda, la
// página tiene que recibir lo guardado antes de rendirse ella. Lo vigila scripts/sw-datos.test.mjs.
const PLAZO_RED_MS = 3000
const TARDE = Symbol('tarde')

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

  // JSON del día: red primero con plazo; sin red o si tarda, lo guardado
  if (esDatos(url.pathname)) {
    // Cada respuesta buena se guarda, llegue antes o después del plazo: si tarda, la página
    // ya se llevó lo guardado y esta copia es la de la próxima visita.
    let guardado = Promise.resolve()

    const red = fetch(req).then(res => {
      if (res.ok) {
        const cabeceras = new Headers(res.headers)

        cabeceras.set('sw-fecha', String(Date.now()))

        // Ojo: hay que clonar ANTES de construir la copia sellada. Pasar `res.body`
        // directamente deja la respuesta original sin cuerpo y la página recibe un
        // ERR_FAILED en el primer arranque (era la causa del reintento a los 1,5 s).
        const copia = res.clone()

        guardado = DATOS_P.then(cache => cache.put(req, new Response(copia.body, { status: copia.status, statusText: copia.statusText, headers: cabeceras })))
      }

      return res
    })

    // Que el SW siga vivo hasta guardar la respuesta aunque la página ya tenga la suya.
    e.waitUntil(red.then(() => guardado, () => {}).catch(() => {}))

    e.respondWith(
      (async () => {
        const cache = await DATOS_P

        // Un 5xx es el servidor fallando: lo guardado, si lo hay. Un 4xx se respeta.
        const deLaRed = async res => (res.status >= 500 && (await cache.match(req))) || res
        let plazo

        const tarde = new Promise(resolve => {
          plazo = setTimeout(() => resolve(TARDE), PLAZO_RED_MS)
        })

        try {
          const res = await Promise.race([red, tarde])

          if (res !== TARDE) return await deLaRed(res)

          // La red tarda: lo guardado si es de menos de un día; si no, se sigue esperando a la red.
          const guardada = await cache.match(req)
          const fecha = guardada && Number(guardada.headers.get('sw-fecha'))

          if (guardada && fecha && Date.now() - fecha < DIA_MS) return guardada

          return await deLaRed(await red)
        } catch (err) {
          const guardada = await cache.match(req)

          if (guardada) return guardada // sin red (modo avión): sirve lo guardado aunque esté viejo
          throw err
        } finally {
          clearTimeout(plazo)
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
