// Guardia de F-8 (15/10/2026): los JSON de /data, RED PRIMERO con plazo; el modo avión, intacto.
//
// POR QUÉ EXISTE. Hasta la v7 el service worker servía los JSON «primero caché, sin
// revalidar» durante un día: quien volvía a la web veía los datos de ayer hasta 24 h, y
// cada parada del refresco nocturno se pagaba dos veces (v4, v5). La v8 pregunta antes a la
// red y solo cae a lo guardado sin red, con un 5xx o si la red tarda (y lo guardado es de
// menos de un día). Estas pruebas cargan public/sw.js TAL CUAL en un contexto de Node con
// `self`, `caches` y `fetch` simulados: sin navegador, pero con el código que se publica.
//
// Los plazos corren cien veces más deprisa (setTimeout escalado): 3 s del SW son 30 ms aquí.

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import vm from 'node:vm'

import { auditRuntimeSource, auditServiceWorkerSource } from './public-safety.mjs'

const SW = readFileSync(new URL('../public/sw.js', import.meta.url), 'utf8')
const DATA_TS = readFileSync(new URL('../src/lib/data.ts', import.meta.url), 'utf8')
const ORIGEN = 'https://sw.test'
const BASE = '/madclon-front-office'
const URL_DATOS = `${ORIGEN}${BASE}/data/overview.json`
const HORA = 3_600_000
const ESCALA = 100
const VERSION = /const VERSION = '([^']+)'/.exec(SW)?.[1]

const espera = ms => new Promise(resolve => setTimeout(resolve, ms / ESCALA))

/** CacheStorage mínimo: lo justo que usa sw.js (open, keys, delete, match, put, add). */
function crearCaches(fetchSimulado) {
  const almacen = new Map()
  const clave = req => (typeof req === 'string' ? new URL(req, ORIGEN).href : req.url)

  const abrir = nombre => {
    if (!almacen.has(nombre)) almacen.set(nombre, new Map())
    const m = almacen.get(nombre)

    return {
      match: async req => m.get(clave(req))?.clone(),
      put: async (req, res) => {
        const cuerpo = await res.arrayBuffer()

        m.set(clave(req), new Response(cuerpo, { status: res.status, statusText: res.statusText, headers: res.headers }))
      },
      add: async req => {
        const res = await fetchSimulado(new Request(new URL(req, ORIGEN)))

        if (res.ok) m.set(clave(req), res)
      }
    }
  }

  return {
    almacen,
    caches: {
      open: async nombre => abrir(nombre),
      keys: async () => [...almacen.keys()],
      delete: async nombre => almacen.delete(nombre)
    }
  }
}

/**
 * Carga sw.js con una red simulada. `red(req)` devuelve una promesa de Response (o la rechaza
 * como hace el navegador sin conexión). `reloj.t` es el Date.now() que ve el SW.
 */
function cargarSW(red) {
  const manejadores = {}
  const reloj = { t: Date.parse('2026-10-15T08:00:00Z') }
  const peticiones = []

  const fetchSimulado = req => {
    peticiones.push(req.url)

    return red(req)
  }

  const { almacen, caches } = crearCaches(fetchSimulado)

  class FechaSimulada extends Date {
    static now() {
      return reloj.t
    }
  }

  const contexto = vm.createContext({
    self: {
      registration: { scope: `${ORIGEN}${BASE}/` },
      location: { origin: ORIGEN },
      addEventListener: (tipo, fn) => {
        manejadores[tipo] = fn
      },
      skipWaiting: async () => {},
      clients: { claim: async () => {} }
    },
    caches,
    fetch: fetchSimulado,
    Response,
    Headers,
    Request,
    URL,
    Date: FechaSimulada,
    setTimeout: (fn, ms) => setTimeout(fn, ms / ESCALA),
    clearTimeout
  })

  vm.runInContext(SW, contexto, { filename: 'public/sw.js' })

  /** Dispara un fetch como el navegador: devuelve lo que la página recibe y cuándo acaba todo. */
  const pedir = url => {
    let respuesta
    const extensiones = []

    const evento = {
      request: new Request(url),
      respondWith: p => {
        respuesta = Promise.resolve(p)
      },
      waitUntil: p => extensiones.push(p)
    }

    manejadores.fetch(evento)
    assert.ok(respuesta, 'el SW no respondió a una petición de /data')
    respuesta.catch(() => {})

    return { respuesta, todo: Promise.allSettled([respuesta, ...extensiones]) }
  }

  /** Mete en la caché de datos un lote sellado hace `edadMs`. */
  const guardar = async (cuerpo, edadMs) => {
    const cache = await caches.open(`madclon-datos-${VERSION}`)

    await cache.put(URL_DATOS, new Response(cuerpo, { headers: { 'content-type': 'application/json', 'sw-fecha': String(reloj.t - edadMs) } }))
  }

  const guardado = async () => {
    const cache = await caches.open(`madclon-datos-${VERSION}`)
    const res = await cache.match(URL_DATOS)

    return res ? { cuerpo: await res.text(), fecha: Number(res.headers.get('sw-fecha')) } : null
  }

  return { manejadores, reloj, almacen, caches, pedir, guardar, guardado, peticiones }
}

const json = (cuerpo, status = 200) => new Response(cuerpo, { status, headers: { 'content-type': 'application/json' } })
const sinRed = () => Promise.reject(new TypeError('Failed to fetch'))
const tarda = (ms, res) => () => espera(ms).then(() => res())

test('la versión sube a v8 y la auditoría de public-safety no encuentra nada', () => {
  assert.equal(VERSION, 'v8')
  assert.deepEqual(auditServiceWorkerSource(SW), [])
  assert.deepEqual(auditRuntimeSource(SW, 'public/sw.js'), [])
})

test('el plazo del SW queda por debajo del de la página, con margen', () => {
  const plazo = Number(/const PLAZO_RED_MS = (\d+)/.exec(SW)?.[1])
  const pagina = Number(/const FETCH_TIMEOUT_MS = (\d+)/.exec(DATA_TS)?.[1])

  assert.ok(plazo > 0 && pagina > 0, `no encuentro PLAZO_RED_MS (${plazo}) o FETCH_TIMEOUT_MS (${pagina})`)
  assert.ok(plazo + 1000 <= pagina, `el SW espera ${plazo} ms y la página se rinde a los ${pagina}: lo guardado llegaría tarde`)
})

test('F-8: con red, manda la red aunque lo guardado sea de hace una hora; y se guarda lo nuevo', async () => {
  const sw = cargarSW(async () => json('{"lote":"hoy"}'))

  await sw.guardar('{"lote":"ayer"}', HORA)
  const { respuesta, todo } = sw.pedir(URL_DATOS)

  assert.equal(await (await respuesta).text(), '{"lote":"hoy"}')
  await todo
  assert.deepEqual(await sw.guardado(), { cuerpo: '{"lote":"hoy"}', fecha: sw.reloj.t })
  assert.equal(sw.peticiones.length, 1)
})

test('modo avión: sin red, lo guardado aunque tenga tres días', async () => {
  const sw = cargarSW(sinRed)

  await sw.guardar('{"lote":"viejo"}', 72 * HORA)

  assert.equal(await (await sw.pedir(URL_DATOS).respuesta).text(), '{"lote":"viejo"}')
})

test('sin red y sin nada guardado: error, que la página pinta «en revisión»', async () => {
  const sw = cargarSW(sinRed)

  await assert.rejects(sw.pedir(URL_DATOS).respuesta, TypeError)
})

test('red lenta y lo guardado es de hoy: lo guardado al plazo, y la respuesta tardía se guarda', async () => {
  const sw = cargarSW(tarda(10_000, () => json('{"lote":"hoy"}')))

  await sw.guardar('{"lote":"de-esta-mañana"}', 2 * HORA)
  const { respuesta, todo } = sw.pedir(URL_DATOS)
  const inicio = performance.now()

  assert.equal(await (await respuesta).text(), '{"lote":"de-esta-mañana"}')
  const ms = (performance.now() - inicio) * ESCALA

  // Llega a los ~3 s simulados (red primero: no se sirve lo guardado sin preguntar), y antes que la red.
  assert.ok(ms >= 2500, `lo guardado llegó a los ${Math.round(ms)} ms simulados: no esperó a la red`)
  await todo
  assert.equal((await sw.guardado()).cuerpo, '{"lote":"hoy"}', 'la respuesta que llegó tarde no se guardó para la próxima visita')
})

test('red lenta y lo guardado tiene más de un día: se espera a la red', async () => {
  const sw = cargarSW(tarda(4_000, () => json('{"lote":"hoy"}')))

  await sw.guardar('{"lote":"de-anteayer"}', 30 * HORA)

  assert.equal(await (await sw.pedir(URL_DATOS).respuesta).text(), '{"lote":"hoy"}')
})

test('red lenta y nada guardado: se espera a la red', async () => {
  const sw = cargarSW(tarda(4_000, () => json('{"lote":"hoy"}')))

  assert.equal(await (await sw.pedir(URL_DATOS).respuesta).text(), '{"lote":"hoy"}')
})

test('el servidor falla (5xx): lo guardado; si no hay, el error tal cual', async () => {
  const conCopia = cargarSW(async () => json('caído', 503))

  await conCopia.guardar('{"lote":"ayer"}', 30 * HORA)
  assert.equal(await (await conCopia.pedir(URL_DATOS).respuesta).text(), '{"lote":"ayer"}')

  const sinCopia = cargarSW(async () => json('caído', 503))

  assert.equal((await sinCopia.pedir(URL_DATOS).respuesta).status, 503)
  assert.equal(await sinCopia.guardado(), null, 'un 503 no se guarda')
})

test('un 4xx se respeta: el fichero ya no está y no se resucita la copia', async () => {
  const sw = cargarSW(async () => json('no está', 404))

  await sw.guardar('{"lote":"ayer"}', HORA)

  assert.equal((await sw.pedir(URL_DATOS).respuesta).status, 404)
})

test('al activarse, la v8 tira las cachés de la v7 y deja lo ajeno', async () => {
  const sw = cargarSW(async () => json('{}'))

  for (const nombre of ['madclon-datos-v7', 'madclon-estatica-v7', 'madclon-paginas-v7', 'otra-web']) await sw.caches.open(nombre)
  const pendientes = []

  sw.manejadores.activate({ waitUntil: p => pendientes.push(p) })
  await Promise.all(pendientes)

  assert.deepEqual((await sw.caches.keys()).sort(), ['madclon-datos-v8', 'madclon-estatica-v8', 'madclon-paginas-v8', 'otra-web'])
})
