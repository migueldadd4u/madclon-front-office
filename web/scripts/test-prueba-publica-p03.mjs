#!/usr/bin/env node
// agente: cdx-frontales-p03-builder-20261019-1415 · 2026-10-19
// P03: muestra editorial; standalone acotado o listener del gate acreditado antes de Chromium.
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { createRequire } from 'node:module'
import { lstatSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'

import { resolverPlaywrightHome } from './playwright-home.mjs'
import { esperarDomAsentado, esperarQuietudDeMovimiento } from './esperas.mjs'

const destinos = new Set([9354, 9355].map(p => `http://127.0.0.1:${p}/madclon-front-office/`))
const hash = contenido => createHash('sha256').update(contenido).digest('hex')
const ERROR_ATESTACION = 'P03 rechaza destino integrado: atestación no válida'

function identidadOut() {
  if (lstatSync(resolve('out')).isSymbolicLink()) throw new Error(ERROR_ATESTACION)
  const filas = []

  const recorrer = (directorio, prefijo = '') => {
    const entradas = readdirSync(directorio, { withFileTypes: true }).sort((a, b) => a.name < b.name ? -1 : a.name > b.name ? 1 : 0)

    for (const entrada of entradas) {
      const ruta = join(directorio, entrada.name)
      const relativa = prefijo + entrada.name

      if (entrada.isSymbolicLink()) throw new Error(ERROR_ATESTACION)
      if (entrada.isDirectory()) recorrer(ruta, `${relativa}/`)
      else if (entrada.isFile()) filas.push(`${relativa}\0${hash(readFileSync(ruta))}\n`)
      else throw new Error(ERROR_ATESTACION)
    }
  }

  recorrer(resolve('out'))

  return hash(filas.join(''))
}

async function acreditarIntegrado(valor, prueba) {
  try {
    const u = new URL(valor)

    if (u.protocol !== 'http:' || u.hostname !== '127.0.0.1' || u.pathname !== '/madclon-front-office/' || u.username || u.password || u.search || u.hash) throw new Error(ERROR_ATESTACION)
    if (!/^[a-f0-9]{64}$/.test(prueba.nonce || '') || !/^[a-f0-9]{64}$/.test(prueba.out || '')) throw new Error(ERROR_ATESTACION)
    if (identidadOut() !== prueba.out) throw new Error(ERROR_ATESTACION)
    const respuesta = await fetch(new URL('__p03_gate_attestation', u), { redirect: 'error', cache: 'no-store', signal: AbortSignal.timeout(5000) })

    if (!respuesta.ok) throw new Error(ERROR_ATESTACION)
    const cuerpo = await respuesta.json()
    const campos = ['version', 'nonce', 'origin', 'base', 'out_sha256']
    const valida = cuerpo && typeof cuerpo === 'object' && !Array.isArray(cuerpo) && Object.keys(cuerpo).length === campos.length && campos.every(k => Object.hasOwn(cuerpo, k)) && cuerpo.version === 1 && cuerpo.nonce === prueba.nonce && cuerpo.origin === u.origin && cuerpo.base === u.pathname && cuerpo.out_sha256 === prueba.out

    if (!valida) throw new Error(ERROR_ATESTACION)

    return u
  } catch {
    // Nunca incluir respuesta, nonce, env ni error de parseo/HTTP en el mensaje.
    throw new Error(ERROR_ATESTACION)
  }
}

async function negativosIntegrados(valor, prueba) {
  const alterar = s => (s[0] === 'a' ? 'b' : 'a') + s.slice(1)

  const casos = [
    [valor, { ...prueba, nonce: alterar(prueba.nonce) }],
    [valor, { ...prueba, out: alterar(prueba.out) }],
    [valor, { out: prueba.out }],
    [valor, { nonce: prueba.nonce }],
    [valor, { ...prueba, nonce: '' }],
    [valor.replace('127.0.0.1', 'localhost'), prueba],
    [`${valor}?x=1`, prueba],
    [valor.replace('/madclon-front-office/', '/otra/'), prueba]
  ]

  for (const [destino, caso] of casos) await assert.rejects(() => acreditarIntegrado(destino, caso), e => e.message === ERROR_ATESTACION)

  return casos.length
}

function validarDestino(valor) {
  assert.equal(typeof valor, 'string', 'destino debe ser string')
  assert.ok(destinos.has(valor), 'P03 rechaza destino antes de navegación, SW o CacheStorage')

  return new URL(valor)
}

// La guardia y sus negativos se ejecutan ANTES de crear navegador o acceder a red/almacenamiento.
const negativosDestino = [
  'http://127.0.0.1:9352/madclon-front-office/', 'http://127.0.0.1:9356/madclon-front-office/',
  'http://localhost:9354/madclon-front-office/', 'https://127.0.0.1:9354/madclon-front-office/',
  'http://127.0.0.1:9354/otra/', 'http://127.0.0.1:9354/madclon-front-office/?x=1',
  'http://127.0.0.1:9354/madclon-front-office/#x', 'http://u:p@127.0.0.1:9354/madclon-front-office/',
  'https://migueldadd4u.github.io/madclon-front-office/'
]

for (const destino of negativosDestino) assert.throws(() => validarDestino(destino))
const integrado = Object.hasOwn(process.env, 'P03_GATE_NONCE') || Object.hasOwn(process.env, 'P03_GATE_OUT_SHA256')
const pruebaGate = { nonce: process.env.P03_GATE_NONCE, out: process.env.P03_GATE_OUT_SHA256 }
const solicitada = process.env.PROTOTYPE_URL || 'http://127.0.0.1:9354/madclon-front-office/'
const baseUrl = integrado ? await acreditarIntegrado(solicitada, pruebaGate) : validarDestino(solicitada)
const base = baseUrl.href
const nIntegrados = integrado ? await negativosIntegrados(base, pruebaGate) : 0
const resultados = [{ guardiaDestino: 'PASS antes de Chromium/SW/CacheStorage', modo: integrado ? 'listener propio acreditado' : 'standalone9354/55', negativos: negativosDestino.length, negativosIntegrados: nIntegrados, destino: base, ...(integrado ? { out_sha256: pruebaGate.out } : {}) }]

if (process.argv.includes('--solo-atestacion')) {
  assert.ok(integrado, 'SMOKE requiere atestación integrada; no permite fallback standalone')
  console.log(JSON.stringify({ estado: 'PASS', alcance: 'SMOKE atestación; sin Chromium ni gate completo', resultados }, null, 2))
  process.exit(0)
}

const evidencia = process.env.PROTOTYPE_EVIDENCE && resolve(process.env.PROTOTYPE_EVIDENCE)

if (evidencia) mkdirSync(evidencia, { recursive: true })
const requireBrowser = createRequire(join(resolverPlaywrightHome().directorio, 'noop.js'))
const { chromium } = requireBrowser('playwright')
const axe = readFileSync(requireBrowser.resolve('axe-core/axe.min.js'), 'utf8')
const browser = await chromium.launch({ headless: true })

const casos = [
  { ancho: 390, idioma: 'es', modo: 'light', ac: false },
  { ancho: 1440, idioma: 'es', modo: 'light', ac: false },
  { ancho: 390, idioma: 'en', modo: 'light', ac: false },
  { ancho: 1440, idioma: 'en', modo: 'dark', ac: false },
  { ancho: 390, idioma: 'es', modo: 'light', ac: true },
  { ancho: 1440, idioma: 'en', modo: 'light', ac: true }
]

async function asentado(page) {
  assert.equal(await esperarDomAsentado(page), true, 'DOM estable')
  assert.equal((await esperarQuietudDeMovimiento(page)).estado, 'quieto', 'sin movimiento perpetuo')
}

async function destinoConFoco(page, id) {
  await page.waitForURL(u => u.hash === `#${id}`)
  await page.waitForFunction(x => document.activeElement?.id === x, id)
  const caja = await page.locator(`h2#${id}`).boundingBox()

  assert.ok(caja.y >= 80 && caja.y + caja.height <= page.viewportSize().height, `h2 ${id} visible bajo cabecera`)
}

async function coherente(page, hashEsperado, h1) {
  await page.waitForFunction(({ pathname, hash, h1 }) => location.pathname === pathname && location.hash === hash && document.querySelector('h1')?.textContent === h1, { pathname: baseUrl.pathname, hash: hashEsperado, h1 })
  assert.equal(await page.locator('h1').count(), 1)
  assert.equal(await page.locator('[data-escaparate-clon]').count(), 1)
  assert.equal(await page.locator('[data-demo-sintetica]').count(), 1)
  await asentado(page)
}

async function continuidadTeclado(page) {
  const antes = await page.evaluate(() => {
    const e = document.activeElement
    const r = e?.getBoundingClientRect()
    const estilo = e && getComputedStyle(e)


    return { tag: e?.tagName, id: e?.id, texto: e?.textContent?.trim().slice(0, 120), scrollY, rect: r && { x: r.x, y: r.y, width: r.width, height: r.height }, oculto: !!e && e !== document.body && (estilo.display === 'none' || estilo.visibility === 'hidden' || !r.width || !r.height || r.bottom <= 0 || r.top >= innerHeight) }
  })

  assert.equal(antes.oculto, false, `historial no deja foco oculto: ${JSON.stringify(antes)}`)
  const focoInicial = await page.evaluateHandle(() => document.activeElement)

  await page.keyboard.press('Tab')
  assert.equal(await focoInicial.evaluate(e => e === document.activeElement), false, 'Tab avanza a otro elemento; el mismo control visible no acredita continuidad')

  const despues = await page.evaluate(() => {
    const e = document.activeElement
    const r = e?.getBoundingClientRect()


    return { tag: e?.tagName, id: e?.id, texto: e?.textContent?.trim().slice(0, 120), utilizable: !!e && e !== document.body && r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < innerHeight && !e.matches(':disabled') }
  })

  assert.equal(despues.utilizable, true, `Tab continúa en control visible: ${JSON.stringify(despues)}`)
  const primerPaso = await page.evaluateHandle(() => document.activeElement)

  await page.keyboard.press('Tab')
  assert.equal(await primerPaso.evaluate(e => e === document.activeElement), false, 'segundo Tab sigue avanzando')
  assert.equal(await focoInicial.evaluate(e => e === document.activeElement), false, 'dos Tab no vuelven al control inicial en una trampa')

  const segundoPaso = await page.evaluate(() => {
    const e = document.activeElement
    const r = e?.getBoundingClientRect()


    return { tag: e?.tagName, id: e?.id, utilizable: !!e && e !== document.body && r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < innerHeight && !e.matches(':disabled') }
  })

  assert.equal(segundoPaso.utilizable, true, `segundo Tab continúa en control visible: ${JSON.stringify(segundoPaso)}`)

  await focoInicial.dispose()
  await primerPaso.dispose()

  return { antes, despues, segundoPaso }
}

async function editorial(page, idioma) {
  const demo = page.locator('section[aria-labelledby="demostracion"]')
  const texto = await demo.innerText()

  assert.match(await demo.locator('[data-demo-sintetica]').innerText(), idioma === 'es' ? /Demostración sintética[\s\S]*inventados[\s\S]*No son un correo real ni un resultado de cliente/ : /Synthetic demonstration[\s\S]*invented[\s\S]*not a real email or a client result/)
  assert.equal(await demo.locator('time').getAttribute('datetime'), '2026-10-18')
  assert.match(await demo.locator('time').innerText(), idioma === 'es' ? /18 de octubre de 2026.*fuente: mensaje de ejemplo de esta página/ : /18 October 2026.*source: the sample message on this page/)
  assert.equal(await demo.locator('#mensaje-sintetico').innerText(), idioma === 'es' ? 'Tenemos una propuesta para revisar. Reúne los antecedentes e indica qué información falta antes de decidir.' : 'We have a proposal to review. Gather the background and identify what information is missing before deciding.')

  const fragmentos = idioma === 'es'
    ? ['Una entrada ordenada', 'Origen', 'Mensaje sintético de esta página', 'Petición', 'Siguiente paso propuesto', 'Una propuesta para revisar', 'Solo el mensaje de ejemplo.', 'No se ha adjuntado la propuesta ni sus antecedentes. No hay base para recomendar su aprobación.', 'Revisión humana pendiente', 'No se ha enviado ninguna petición.']
    : ['An organized entry', 'Origin', 'Synthetic message on this page', 'Request', 'Proposed next step', 'A proposal to review', 'Only the sample message.', 'Neither the proposal nor its background is attached. There is no basis to recommend approval.', 'Human review pending', 'No request has been sent.']

  for (const fragmento of fragmentos) assert.ok(texto.includes(fragmento), `demo conserva ${fragmento}`)
  const limites = await page.locator('#limite-0-contenido').innerText()

  assert.match(limites, idioma === 'es' ? /no acredita precisión[\s\S]*ahorro ni resultados comerciales[\s\S]*trabajo en curso no es un éxito de cliente/ : /does not establish AI accuracy[\s\S]*savings or commercial results[\s\S]*work in progress is not a client success/)
}

async function cacheReal() {
  // También en9354/55: ENV integrado nunca hace fallback a standalone.
  if (integrado) await acreditarIntegrado(base, pruebaGate)
  else validarDestino(base)
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: 'allow', reducedMotion: 'reduce' })

  ctx.setDefaultTimeout(15000)
  const page = await ctx.newPage()

  try {
    await page.goto(base, { waitUntil: 'networkidle' })
    await page.waitForFunction(() => !!navigator.serviceWorker.controller)

    const identidad = await page.evaluate(async () => {
      const r = await navigator.serviceWorker.ready


      return { scope: r.scope, scriptURL: r.active?.scriptURL, controller: navigator.serviceWorker.controller?.scriptURL }
    })

    assert.equal(identidad.scope, base)
    assert.equal(identidad.scriptURL, new URL('sw.js', base).href)
    assert.equal(identidad.controller, identidad.scriptURL)
    const sw = await ctx.request.get(identidad.scriptURL)

    assert.equal(hash(await sw.body()), hash(readFileSync('public/sw.js')), 'worker servido idéntico al candidato')
    const dato = new URL('data/manifest.json', base).href
    const hashEsperado = hash(readFileSync('out/data/manifest.json'))

    const leer = () => page.evaluate(async u => {
      const antes = Date.now()
      const r = await fetch(u)
      const body = await r.text()
      const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(body))


      return { antes, despues: Date.now(), status: r.status, sello: r.headers.get('sw-fecha'), hash: [...new Uint8Array(bytes)].map(b => b.toString(16).padStart(2, '0')).join('') }
    }, dato)

    const copia = () => page.evaluate(async u => {
      const nombres = (await caches.keys()).filter(n => n.startsWith('madclon-datos-'))

      if (nombres.length !== 1) return null
      const r = await (await caches.open(nombres[0])).match(u)

      if (!r) return null
      const bytes = await crypto.subtle.digest('SHA-256', await r.arrayBuffer())


      return { cache: nombres[0], sello: r.headers.get('sw-fecha'), inspeccion: Date.now(), hash: [...new Uint8Array(bytes)].map(b => b.toString(16).padStart(2, '0')).join('') }
    }, dato)

    await leer()
    await page.waitForFunction(async u => {
      const nombres = (await caches.keys()).filter(n => n.startsWith('madclon-datos-'))
      const r = nombres.length === 1 && await (await caches.open(nombres[0])).match(u)


      return !!r && Number(r.headers.get('sw-fecha')) > 0
    }, dato, { timeout: 10000 })
    const caliente = await leer()
    const guardada = await copia()

    assert.equal(caliente.hash, hashEsperado)
    assert.equal(guardada.hash, hashEsperado)
    assert.equal(caliente.sello, guardada.sello, 'caché reciente se sirve con sello SW')

    const envejecer = async () => {
      const sello = String(Date.now() - 25 * 60 * 60 * 1000)

      await page.evaluate(async ({ u, sello }) => {
        const nombre = (await caches.keys()).find(n => n.startsWith('madclon-datos-'))
        const cache = await caches.open(nombre)
        const r = await cache.match(u)
        const headers = new Headers(r.headers)

        headers.set('sw-fecha', sello)
        await cache.put(u, new Response(await r.arrayBuffer(), { status: r.status, statusText: r.statusText, headers }))
      }, { u: dato, sello })

      return sello
    }

    const viejoOnline = await envejecer()
    const red = await leer()

    assert.equal(red.status, 200)
    assert.equal(red.hash, hashEsperado)
    assert.equal(red.sello, null, 'copia vencida online devuelve respuesta original de red')
    await page.waitForFunction(async ({ u, desde, esperado }) => {
      const nombre = (await caches.keys()).find(n => n.startsWith('madclon-datos-'))
      const r = nombre && await (await caches.open(nombre)).match(u)

      if (!r) return false
      const sello = Number(r.headers.get('sw-fecha'))
      const bytes = await crypto.subtle.digest('SHA-256', await r.arrayBuffer())
      const hash = [...new Uint8Array(bytes)].map(b => b.toString(16).padStart(2, '0')).join('')


      return sello >= desde && sello <= Date.now() && hash === esperado
    }, { u: dato, desde: red.antes, esperado: hashEsperado }, { timeout: 10000 })
    const renovada = await copia()

    assert.equal(renovada.hash, hashEsperado, 'copia renovada conserva hash del artefacto')
    assert.ok(Number(renovada.sello) >= red.antes && Number(renovada.sello) <= renovada.inspeccion, 'sello renovado está dentro de la ventana real del fetch y la inspección estable')
    const viejoOffline = await envejecer()

    await ctx.setOffline(true)
    const offline = await leer()

    assert.equal(offline.hash, hashEsperado)
    assert.equal(offline.sello, viejoOffline, 'offline conserva copia antigua, no simula frescura')
    await page.reload({ waitUntil: 'domcontentloaded' })
    await page.locator('[data-demo-sintetica]').waitFor({ state: 'visible' })
    assert.equal(await page.locator('h1').count(), 1, 'portada precacheada sigue legible offline')
    resultados.push({ swReal: 'PASS', identidad, manifestHash: hashEsperado, cache: guardada.cache, reciente: caliente.sello, fixture25hOnline: viejoOnline, ventanaRenovacion: { desde: red.antes, hasta: renovada.inspeccion }, renovada: renovada.sello, fixture25hOffline: viejoOffline, offline: 'copia vieja conservada; no frescura real', paginaOffline: 'demo visible' })
  } finally { await ctx.close() }
}

let fallo

try {
  for (const caso of casos) {
    const ctx = await browser.newContext({ viewport: { width: caso.ancho, height: 1000 }, serviceWorkers: 'block', reducedMotion: 'reduce' })

    ctx.setDefaultTimeout(15000)

    try {
      await ctx.addInitScript(c => {
        localStorage.setItem('madclon-lang', c.idioma)
        localStorage.setItem('madclon-contraste', c.ac ? '1' : '0')
        document.cookie = `madclon-front-office=${encodeURIComponent(JSON.stringify({ mode: c.modo }))}; path=/`
      }, caso)
      const page = await ctx.newPage()
      const errores = []

      page.on('pageerror', e => errores.push(e.message))
      await page.goto(base, { waitUntil: 'networkidle' })
      await page.waitForFunction(c => document.documentElement.lang === c.idioma && document.documentElement.hasAttribute(`data-${c.modo}`), caso)
      await asentado(page)
      assert.equal(await page.locator('html').evaluate(e => e.classList.contains('fo-contraste')), caso.ac)
      const h1 = await page.locator('h1').innerText()

      await editorial(page, caso.idioma)
      const enlace = page.locator('section[aria-labelledby="demostracion"]').getByRole('link', { name: caso.idioma === 'es' ? 'Ver los límites de este ejemplo' : 'See the limits of this example', exact: true })

      assert.equal(await enlace.count(), 1, 'demo ofrece enlace contextual único a sus límites')
      assert.equal(await enlace.getAttribute('href'), '#limites-privacidad')
      const objetivo = await enlace.boundingBox()

      assert.ok(objetivo.width >= 44 && objetivo.height >= 44, 'objetivo contextual ≥44x44')
      await page.locator('[data-bienvenida] a[href="#demostracion"]').focus()
      await page.keyboard.press('Enter')
      await destinoConFoco(page, 'demostracion')
      await enlace.focus()
      await page.keyboard.press('Enter')
      await destinoConFoco(page, 'limites-privacidad')
      await page.goBack()
      await coherente(page, '#demostracion', h1)
      await destinoConFoco(page, 'demostracion')
      const atras = await continuidadTeclado(page)

      await page.goForward()
      await coherente(page, '#limites-privacidad', h1)
      await destinoConFoco(page, 'limites-privacidad')
      const adelante = await continuidadTeclado(page)

      await page.locator('[data-bienvenida-explorar]').focus()
      await page.keyboard.press('Enter')
      await page.waitForURL('**/retos/')
      assert.equal(await page.locator('[data-escaparate-clon]').count(), 0)
      assert.equal(await page.locator('h1').count(), 1)
      await page.goBack()
      await coherente(page, '#limites-privacidad', h1)
      const regresoRetos = await continuidadTeclado(page)

      await page.locator('[data-bienvenida-explorar]').click()
      await page.waitForURL('**/retos/')

      if (caso.ancho === 390) {
        await page.getByRole('button', { name: caso.idioma === 'es' ? 'Abrir o cerrar el menú' : 'Open or close the menu', exact: true }).press('Enter')
        await asentado(page)
      }

      await page.locator(`a[href="${baseUrl.pathname}"]`).filter({ hasText: /^MAD Clon$/ }).first().press('Enter')
      await coherente(page, '', h1)

      if (caso.ancho === 390) {
        const cerrar = page.getByRole('button', { name: caso.idioma === 'es' ? 'cerrar el menú' : 'close the menu', exact: true })

        await cerrar.focus()
        await page.keyboard.press('Enter')
        await asentado(page)
      }

      await page.addScriptTag({ content: axe })
      const violaciones = await page.evaluate(async () => (await axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'] } })).violations.map(v => ({ id: v.id, nodos: v.nodes.map(n => ({ target: n.target, html: n.html })) })))

      assert.deepEqual(violaciones, [], JSON.stringify(violaciones))
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'sin desborde')

      if (caso.ancho === 1440) {
        await page.setViewportSize({ width: 720, height: 1000 })
        await asentado(page)
        assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'reflow720, equivalente de diseño200%')
        await page.setViewportSize({ width: 1440, height: 1000 })
      }

      assert.deepEqual(errores, [], 'sin errores runtime')

      if (evidencia) {
        await enlace.scrollIntoViewIfNeeded()
        await page.screenshot({ path: join(evidencia, `p03-${caso.idioma}-${caso.ancho}-${caso.modo}-${caso.ac ? 'alto' : 'normal'}.png`), fullPage: true })
      }

      resultados.push({ ...caso, editorial: 'PASS fuente/fecha/mensaje/faltantes/humano/límites', dosGestos: 'Enter demo → Enter límites, h2 con foco visible', objetivo, atras, adelante, regresoRetos, logo: 'URL+h1+contenido PASS', axe: 0 })
    } finally { await ctx.close() }
  }

  const ctx = await browser.newContext({ viewport: { width: 390, height: 1000 }, serviceWorkers: 'block' })

  try {
    const page = await ctx.newPage()

    await page.route('**/data/*.json', r => r.fulfill({ status: 503, contentType: 'application/json', body: '{}' }))
    await page.goto(base, { waitUntil: 'networkidle' })
    await page.getByText('Este bloque está en revisión', { exact: true }).waitFor({ state: 'visible' })
    await editorial(page, 'es')
    assert.equal(await page.locator('section[aria-labelledby="demostracion"] a[href="#limites-privacidad"]').count(), 1)
    resultados.push({ datos: '503', fuente: 'en revisión', demoEditorial: 'PASS sin simular datos recuperados' })
  } finally { await ctx.close() }

  await cacheReal()
} catch (error) {
  fallo = { nombre: error.name, mensaje: error.message, stack: error.stack }
} finally {
  await browser.close()
  const salida = { estado: fallo ? 'FAIL' : 'PASS', resultados, ...(fallo ? { fallo } : {}) }

  if (evidencia) writeFileSync(join(evidencia, 'p03-resultados.json'), JSON.stringify(salida, null, 2) + '\n')
  console.log(JSON.stringify(salida, null, 2))
}

if (fallo) process.exitCode = 1
