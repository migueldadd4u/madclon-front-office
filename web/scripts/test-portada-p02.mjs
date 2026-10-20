#!/usr/bin/env node
// P02: recorrido público, bloques conservados y controles de navegación.
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { resolverPlaywrightHome } from './playwright-home.mjs'
import { esperarDomAsentado, esperarQuietudDeMovimiento } from './esperas.mjs'

const base = process.env.PROTOTYPE_URL || 'http://127.0.0.1:9352/madclon-front-office/'
const evidencia = process.env.PROTOTYPE_EVIDENCE
const requireBrowser = createRequire(join(resolverPlaywrightHome().directorio, 'noop.js'))
const { chromium } = requireBrowser('playwright')
const axe = readFileSync(requireBrowser.resolve('axe-core/axe.min.js'), 'utf8')
const browser = await chromium.launch({ headless: true })
const resultados = []
const casos = [
  { ancho: 390, idioma: 'es', modo: 'light', ac: false },
  { ancho: 1440, idioma: 'es', modo: 'light', ac: false },
  { ancho: 390, idioma: 'en', modo: 'light', ac: false },
  { ancho: 1440, idioma: 'en', modo: 'dark', ac: false },
  { ancho: 390, idioma: 'es', modo: 'light', ac: true },
  { ancho: 1440, idioma: 'en', modo: 'light', ac: true }
]
const titulos = {
  es: ['El clon opina', 'Esta noche, mientras MAD dormía', 'Un día en la vida del clon', 'El pulso de los últimos días'],
  en: ['The clone speaks', 'Last night, while MAD was asleep', 'A day in the life of the clone', 'The pulse of the last few days']
}
async function contexto(caso) {
  const ctx = await browser.newContext({ viewport: { width: caso.ancho, height: 1000 }, serviceWorkers: 'block', reducedMotion: 'reduce' })
  ctx.setDefaultTimeout(15000)
  await ctx.addInitScript(c => {
    localStorage.setItem('madclon-lang', c.idioma)
    localStorage.setItem('madclon-contraste', c.ac ? '1' : '0')
    document.cookie = `madclon-front-office=${encodeURIComponent(JSON.stringify({ mode: c.modo }))}; path=/`
  }, caso)
  return ctx
}
async function asentado(page) {
  assert.equal(await esperarDomAsentado(page), true)
  assert.equal((await esperarQuietudDeMovimiento(page)).estado, 'quieto')
}
async function abrirMenu(page, caso) {
  if (caso.ancho === 390) {
    const cerrar = page.getByRole('button', { name: caso.idioma === 'es' ? 'cerrar el menú' : 'close the menu', exact: true })
    const caja = await cerrar.boundingBox()

    if (!caja || caja.x < 0 || caja.x + caja.width > caso.ancho) {
      await page.getByRole('button', { name: caso.idioma === 'es' ? 'Abrir o cerrar el menú' : 'Open or close the menu', exact: true }).click()
      await asentado(page)
    }
  }
}
try {
  for (const caso of casos) {
    const ctx = await contexto(caso)
    try {
      const page = await ctx.newPage()
      const errores = []
      page.on('pageerror', e => errores.push(e.message))
      await page.goto(base, { waitUntil: 'networkidle' })
      await page.waitForFunction(c => document.documentElement.lang === c.idioma && document.documentElement.hasAttribute(`data-${c.modo}`), caso)
      await asentado(page)
      assert.equal(await page.locator('html').evaluate(el => el.classList.contains('fo-contraste')), caso.ac, 'alto contraste solicitado aplicado')
      const sistema = page.getByRole('button', { name: caso.idioma === 'es' ? 'Ver el sistema por dentro' : 'See inside the system', exact: true })
      assert.equal(await sistema.getAttribute('aria-expanded'), 'false')
      const posiciones = []
      for (const titulo of titulos[caso.idioma]) {
        const bloque = page.getByText(titulo, { exact: true })
        assert.equal(await bloque.count(), 1, `${titulo}: una sola instancia`)
        assert.equal(await page.getByRole('heading', { name: titulo, level: 2, exact: true }).count(), 1, `${titulo}: encabezado de sección h2`)
        assert.ok(await bloque.isVisible(), `${titulo}: visible sin abrir el sistema`)
        assert.equal(await bloque.evaluate(el => !!el.closest('.MuiAccordion-root')), false, `${titulo}: fuera del acordeón`)
        posiciones.push((await bloque.boundingBox()).y)
      }
      assert.ok(posiciones.every((y, i) => i === 0 || y > posiciones[i - 1]), 'orden opinión → noche → día → pulso')
      assert.ok(posiciones[0] > (await sistema.boundingBox()).y, 'los cuatro bloques están al final tras detalle opcional')
      await sistema.press('Enter')
      await asentado(page)
      await sistema.press('Enter')
      await asentado(page)
      for (const titulo of titulos[caso.idioma]) assert.ok(await page.getByText(titulo, { exact: true }).isVisible())
      const resumenRutinas = page.locator('[data-rutinas-accesibles] > summary')
      const cajaResumen = await resumenRutinas.boundingBox()

      assert.ok(cajaResumen.height >= 44, 'resumen de rutinas ofrece objetivo44px')
      await resumenRutinas.focus()
      assert.ok(await resumenRutinas.evaluate(el => getComputedStyle(el).outlineStyle !== 'none' && parseFloat(getComputedStyle(el).outlineWidth) >= 2), 'foco de resumen visible')
      await page.keyboard.press('Enter')
      assert.notEqual(await resumenRutinas.locator('..').getAttribute('open'), null)
      const overview = await page.request.get(new URL('data/overview.json', base).href).then(r => r.json())
      const filasRutinas = page.locator('[data-rutinas-accesibles] li')

      assert.equal(await filasRutinas.count(), overview.crons.length)
      for (let i = 0; i < overview.crons.length; i++) {
        const texto = await filasRutinas.nth(i).innerText()

        assert.ok(texto.includes(overview.crons[i].nombre), 'nombre de rutina exacto de fuente pública')
        assert.ok(texto.includes(overview.crons[i].ultima || '—'), 'última ejecución exacta o dato desconocido')
      }
      await resumenRutinas.focus()
      await page.keyboard.press('Enter')
      assert.equal(await resumenRutinas.locator('..').getAttribute('open'), null)
      assert.equal(await page.locator('.fo-pista button').count(), 0, 'el gráfico no simula botones diminutos sin acción')
      const pista = page.locator('.fo-pista')

      assert.equal(await pista.getAttribute('tabindex'), '0', 'franja desplazable accesible por teclado')
      await pista.focus()
      assert.ok(await pista.evaluate(el => getComputedStyle(el).outlineStyle !== 'none' && parseFloat(getComputedStyle(el).outlineWidth) >= 2), 'foco de franja visible')
      const desbordePista = await pista.evaluate(el => el.scrollWidth - el.clientWidth)

      if (desbordePista > 1) {
        await pista.evaluate(el => { el.scrollLeft = 0 })
        await page.keyboard.press('ArrowRight')
        await page.waitForFunction(() => document.querySelector('.fo-pista').scrollLeft > 0)
        const derecha = await pista.evaluate(el => el.scrollLeft)

        await page.keyboard.press('ArrowLeft')
        await page.waitForFunction(x => document.querySelector('.fo-pista').scrollLeft < x, derecha)
        assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'scroll local no crea desborde global')
      }
      const pulso = page.getByRole('group', { name: caso.idioma === 'es' ? /^Gráfico del pulso/ : /^Pulse chart/ })
      const live = pulso.locator('..').locator('[aria-live="polite"]')
      const serie = await page.request.get(new URL('data/serie.json', base).href).then(r => r.json())
      const validarDia = async indice => {
        const d = serie.serie[indice]
        const texto = await live.innerText()
        const fecha = new Date(d.fecha).toLocaleDateString(caso.idioma === 'en' ? 'en-GB' : 'es-ES', { day: 'numeric', month: 'long' })
        assert.ok(texto.toLowerCase().includes(fecha.toLowerCase()), `día anunciado coincide con fuente: ${fecha}`)
        assert.ok(texto.includes(new Intl.NumberFormat('es-ES').format(d.contexto?.tareas_hechas ?? 0)), 'tareas anunciadas coinciden con dato público')
        const tokensAnunciados = /:\s*([\d.,\u00a0 ]+?)\s*(M|mil)?\s+(?:de trabajo de IA|of AI work)/.exec(texto)

        assert.ok(tokensAnunciados, 'el anuncio contiene volumen de tokens')
        const cantidad = tokensAnunciados[1].trim()
        const unidad = tokensAnunciados[2]
        const escala = unidad === 'M' ? 1e6 : unidad === 'mil' ? 1e3 : 1
        const valor = Number(cantidad.replace(/\./g, '').replace(',', '.')) * escala
        const resolucion = unidad === 'M' ? (cantidad.includes(',') ? 1e5 : 1e6) : escala

        assert.ok(Math.abs(valor - (d.contexto?.tokens ?? 0)) <= resolucion / 2 + 1, 'tokens anunciados corresponden al día elegido, dentro de su redondeo visible')
      }
      await pulso.focus()
      await page.keyboard.press('End')
      await validarDia(serie.serie.length - 1)
      await page.keyboard.press('ArrowLeft')
      await validarDia(serie.serie.length - 2)
      await page.keyboard.press('Home')
      await validarDia(0)
      await page.keyboard.press('ArrowRight')
      await validarDia(1)
      await page.keyboard.press('Escape')
      assert.equal((await live.innerText()).trim(), '')
      assert.ok(await pulso.evaluate(el => el === document.activeElement), 'Escape no expulsa foco del gráfico')
      await page.getByRole('button', { name: caso.idioma === 'es' ? 'Volver al principio' : 'Back to top', exact: true }).click()
      await asentado(page)
      const modo = page.getByRole('button', { name: caso.idioma === 'es' ? /^Cambiar apariencia: / : /^Change appearance: / })
      const verificarFocoSelector = async () => {
        assert.ok(await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches), 'preferencia de movimiento reducido aplicada')
        await page.waitForFunction(() => {
          const el = document.querySelector('#selector-apariencia')
          const estilo = getComputedStyle(el)

          return el === document.activeElement && estilo.outlineStyle !== 'none' && parseFloat(estilo.outlineWidth) >= 2
        })
        const perpetuas = await modo.evaluate(el => document.getAnimations().filter(animacion => {
          const objetivo = animacion.effect?.target
          const tiempo = animacion.effect?.getComputedTiming()

          return animacion.playState === 'running' && objetivo instanceof Element && el.contains(objetivo) && (tiempo?.iterations === Infinity || tiempo?.activeDuration === Infinity || tiempo?.endTime === Infinity)
        }).map(animacion => animacion.animationName || 'animación de foco'))

        assert.deepEqual(perpetuas, [], 'selector restaurado conserva foco estático sin animación perpetua')
        const quietud = await esperarQuietudDeMovimiento(page)

        assert.equal(quietud.estado, 'quieto', JSON.stringify(quietud))
      }

      await modo.focus()
      await page.keyboard.press('Enter')
      const menuModo = page.getByRole('menu', { name: caso.idioma === 'es' ? 'Apariencia' : 'Appearance', exact: true })
      await menuModo.waitFor({ state: 'visible' })
      const elegido = caso.modo === 'dark' ? (caso.idioma === 'es' ? 'Oscuro' : 'Dark') : (caso.idioma === 'es' ? 'Claro' : 'Light')
      assert.equal(await menuModo.getByRole('menuitem', { name: elegido, exact: true }).evaluate(el => el === document.activeElement), true)
      await page.keyboard.press('ArrowDown')
      assert.equal(await menuModo.isVisible(), true, 'Arrow no cierra selector')
      await page.keyboard.press('Escape')
      await menuModo.waitFor({ state: 'hidden' })
      assert.ok(await modo.evaluate(el => el === document.activeElement), 'Escape devuelve foco al selector')
      await verificarFocoSelector()
      await page.keyboard.press('Enter')
      await menuModo.waitFor({ state: 'visible' })
      await page.keyboard.press('Home')
      await page.keyboard.press('ArrowDown')
      await page.keyboard.press('Enter')
      await page.waitForFunction(() => document.documentElement.hasAttribute('data-dark'))
      await menuModo.waitFor({ state: 'hidden' })
      assert.ok(await modo.evaluate(el => el === document.activeElement), 'seleccionar devuelve foco')
      await verificarFocoSelector()
      if (caso.modo !== 'dark') {
        await modo.press('Enter')
        await menuModo.waitFor({ state: 'visible' })
        await page.keyboard.press('Home')
        await page.keyboard.press('Enter')
        await page.waitForFunction(() => document.documentElement.hasAttribute('data-light'))
      }
      await abrirMenu(page, caso)
      const tecnico = page.getByRole('button', { name: caso.idioma === 'es' ? 'El sistema por dentro' : 'Inside the system', exact: true })
      await page.addScriptTag({ content: axe })
      const verificarGrupo = async abierto => {
        await asentado(page)
        assert.equal(await tecnico.getAttribute('aria-expanded'), String(abierto), 'aria-expanded coincide con despliegue real')
        for (const ruta of ['flota', 'hardware', 'salud', 'tokens', 'eficiencia', 'actividad']) {
          const hijo = tecnico.locator('..').locator(`a[href$="/${ruta}/"]`)

          assert.equal(await hijo.count(), 1)
          assert.equal(await hijo.isVisible(), abierto, `${ruta}: visibilidad coincide con estado anunciado`)
        }
        const contrasteGrupo = await page.evaluate(async () => (await axe.run(document.querySelector('.ts-submenu-root'), { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'] } })).violations.map(v => ({ id: v.id, nodos: v.nodes.map(n => n.target) })))

        assert.deepEqual(contrasteGrupo, [], `grupo técnico ${abierto ? 'abierto' : 'cerrado'}: ${JSON.stringify(contrasteGrupo)}`)
      }

      await verificarGrupo(false)
      const hardware = page.getByRole('link', { name: 'Hardware', exact: true }).first()
      assert.equal(await hardware.isVisible(), false, 'detalle técnico a segundo nivel')
      await tecnico.focus()
      await page.keyboard.press('Enter')
      await asentado(page)
      assert.equal(await tecnico.getAttribute('aria-expanded'), 'true')
      assert.ok(await hardware.isVisible())
      await verificarGrupo(true)
      await page.keyboard.press('Space')
      await asentado(page)
      assert.equal(await tecnico.getAttribute('aria-expanded'), 'false', 'Space cierra una vez')
      await verificarGrupo(false)
      await page.keyboard.press('Space')
      await asentado(page)
      await hardware.focus()
      await page.keyboard.press('Enter')
      await page.waitForURL('**/hardware/')
      await page.getByRole('heading', { level: 1 }).waitFor()
      assert.match(await page.getByRole('heading', { level: 1 }).innerText(), /hardware/i)
      await page.goBack({ waitUntil: 'networkidle' })
      assert.match(await page.getByRole('heading', { level: 1 }).innerText(), caso.idioma === 'es' ? /siguiente paso claro/ : /clear next step/)
      await abrirMenu(page, caso)
      await verificarGrupo(false)
      await tecnico.press('Enter')
      await verificarGrupo(true)
      await hardware.press('Enter')
      await page.waitForURL('**/hardware/')
      await abrirMenu(page, caso)
      await verificarGrupo(true)
      await page.getByRole('link', { name: caso.idioma === 'es' ? 'Inicio' : 'Home', exact: true }).press('Enter')
      await page.waitForURL(base)
      await abrirMenu(page, caso)
      await verificarGrupo(false)
      if (caso.ancho === 390) {
        const cerrar = page.getByRole('button', { name: caso.idioma === 'es' ? 'cerrar el menú' : 'close the menu', exact: true })
        const cajaCerrar = await cerrar.boundingBox()

        if (cajaCerrar && cajaCerrar.x >= 0 && cajaCerrar.x + cajaCerrar.width <= caso.ancho) {
          await cerrar.focus()
          await page.keyboard.press('Enter')
        }
      }
      await asentado(page)
      const violaciones = await page.evaluate(async () => (await axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'] } })).violations.map(v => ({ id: v.id, nodos: v.nodes.map(n => n.target) })))
      assert.deepEqual(violaciones, [], JSON.stringify(violaciones))
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'sin desborde')
      if (caso.ancho === 1440) {
        await page.setViewportSize({ width: 720, height: 500 })
        await asentado(page)
        assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'reflow equivalente200% sin desborde')
        await page.setViewportSize({ width: caso.ancho, height: 1000 })
        await asentado(page)
      }
      assert.deepEqual(errores, [])
      if (evidencia) {
        mkdirSync(resolve(evidencia), { recursive: true })
        await page.screenshot({ path: join(resolve(evidencia), `p02-${caso.idioma}-${caso.ancho}-${caso.modo}${caso.ac ? '-ac' : ''}.png`), fullPage: true })
      }
      resultados.push({ ...caso, bloques: 'cuatro visibles al final', teclado: 'pulso + modo + grupo técnico PASS', axe: 0 })
    } finally { await ctx.close() }
  }
  for (const estado of ['ausente', 'rancio', 'retenido']) {
    const ctx = await contexto(casos[0])
    try {
      if (estado === 'ausente') await ctx.route('**/data/tokens.json', r => r.fulfill({ status: 503, body: 'PRIVATE_CANARY_NO_ECO' }))
      else if (estado === 'retenido') await ctx.route('**/data/manifest.json', r => r.fulfill({ json: { schema: 'madclon.public-containment.v1', generated_at: new Date().toISOString() } }))
      else await ctx.route('**/data/manifest.json', async r => {
        const data = await (await r.fetch()).json()
        data.generado = new Date(Date.now() - 72 * 36e5).toISOString()
        await r.fulfill({ contentType: 'application/json', body: JSON.stringify(data) })
      })
      const page = await ctx.newPage()
      await page.goto(base, { waitUntil: 'networkidle' })
      assert.equal(await page.locator('h1').count(), 1)
      assert.equal(await page.locator('[data-escaparate-clon] .MuiCardActionArea-root').count(), 3)
      if (estado === 'ausente') {
        assert.ok(await page.getByRole('status').filter({ hasText: /revisión/ }).isVisible())
        assert.equal(await page.locator('.fo-pulso').count(), 0, 'dato ausente no fabrica gráfico ni cero')
      } else if (estado === 'retenido') {
        assert.ok(await page.getByRole('status').filter({ hasText: 'Instantánea pública protegida' }).isVisible())
        assert.equal(await page.locator('.fo-pulso').count(), 0)
        assert.equal(await page.locator('[data-actividad-publica]').count(), 0, 'retención no enseña actividad residual')
      } else {
        assert.ok(await page.locator('[data-frescura-rancia]').isVisible())
        assert.equal(await page.locator('[data-frescura-rancia]').evaluate(el => !!el.closest('.MuiAccordion-root')), false)
        assert.ok(await page.getByText(titulos.es[3], { exact: true }).isVisible())
      }
      assert.doesNotMatch(await page.locator('body').innerText(), /PRIVATE_CANARY_NO_ECO|exporter|\.json/i)
      resultados.push({ estado, resultado: 'degradación honesta PASS' })
    } finally { await ctx.close() }
  }
  console.log(JSON.stringify({ resultado: 'PASS', resultados }, null, 2))
} catch (error) {
  console.error(error)
  process.exitCode = 1
} finally {
  if (evidencia) { mkdirSync(resolve(evidencia), { recursive: true }); writeFileSync(join(resolve(evidencia), 'p02-resultados.json'), JSON.stringify({ resultados, exitCode: process.exitCode || 0 }, null, 2)) }
  await browser.close()
}
