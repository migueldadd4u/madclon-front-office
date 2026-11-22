#!/usr/bin/env node
// «Para quien decide» (22/11/2026): el recorrido de fuentes, los casos por cargo,
// los niveles de control, la lectura de cada página y los huecos que ya no se rompen.
//
// Se corre sobre el EXPORT servido bajo la subruta real (nunca `next dev`: el
// service worker serviría el JS viejo). Lo engancha el gate; a mano:
//
//   PROTOTYPE_URL=http://127.0.0.1:9361/madclon-front-office/ node scripts/test-casos.mjs
//
// Cada bloque dice qué mide. Ninguno espera a un reloj: esperan a un estado.
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { join } from 'node:path'

import { resolverPlaywrightHome } from './playwright-home.mjs'
import { esperarDomAsentado, esperarQuietudDeMovimiento } from './esperas.mjs'

const base = process.env.PROTOTYPE_URL || 'http://127.0.0.1:9361/madclon-front-office/'
const requireBrowser = createRequire(join(resolverPlaywrightHome().directorio, 'noop.js'))
const { chromium } = requireBrowser('playwright')
const browser = await chromium.launch({ headless: true })

const CARGOS = ['alcaldia', 'rectorado', 'direccion', 'electo']
const RUTAS = ['', 'retos/', 'flota/', 'actividad/', 'salud/', 'tokens/', 'eficiencia/', 'hardware/', 'historia/', 'preguntas/']
const CON_LECTURA = ['retos', 'flota', 'actividad', 'salud', 'tokens', 'eficiencia', 'hardware', 'historia']
const ROTO = /\bundefined\b|\bNaN\b|\bnull\b|\{[a-z]+\}/
const resultados = []

async function contexto({ ancho, idioma }) {
  const ctx = await browser.newContext({ viewport: { width: ancho, height: 900 }, serviceWorkers: 'block', reducedMotion: 'reduce' })

  ctx.setDefaultTimeout(15000)
  await ctx.addInitScript(l => localStorage.setItem('madclon-lang', l), idioma)

  return ctx
}

async function abrir(ctx, ruta, idioma) {
  const page = await ctx.newPage()
  const errores = []

  page.on('pageerror', e => errores.push(`pageerror: ${e.message}`))
  page.on('console', m => m.type() === 'error' && errores.push(`console: ${m.text()}`))
  await page.goto(base + ruta, { waitUntil: 'networkidle' })
  await page.waitForFunction(l => document.documentElement.lang === l, idioma)
  assert.equal(await esperarDomAsentado(page), true, `${ruta || '/'}: DOM asentado`)
  assert.equal((await esperarQuietudDeMovimiento(page)).estado, 'quieto', `${ruta || '/'}: sin movimiento perpetuo`)

  return { page, errores }
}

const sinDesborde = page => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)
const elegida = page => page.locator('[role="tab"][aria-selected="true"]').getAttribute('data-pestana-caso')
const aLaVista = page => page.locator('[data-casos-cargo] [role="tabpanel"]:not([hidden])').evaluateAll(ps => ps.map(p => p.dataset.caso))

try {
  // ── A · pestañas: nombre, estado, teclado, dirección propia ────────────────────
  for (const caso of [{ ancho: 1440, idioma: 'es' }, { ancho: 375, idioma: 'en' }]) {
    const ctx = await contexto(caso)

    try {
      const { page, errores } = await abrir(ctx, '', caso.idioma)
      const es = caso.idioma === 'es'
      const lista = page.getByRole('tablist', { name: es ? 'Casos por cargo' : 'Cases by role', exact: true })
      const pestanas = lista.getByRole('tab')

      assert.equal(await lista.count(), 1, 'la lista de pestañas tiene nombre accesible')
      assert.equal(await pestanas.count(), 4)
      assert.deepEqual(await pestanas.evaluateAll(ts => ts.map(t => t.dataset.pestanaCaso)), CARGOS, 'el orden es el de la fuente')
      assert.equal(await pestanas.evaluateAll(ts => ts.filter(t => t.hasAttribute('aria-controls')).length), 0, 'sin aria-controls: ningún lector de pantalla lo usa')
      assert.equal(await elegida(page), 'alcaldia')
      assert.deepEqual(await aLaVista(page), ['alcaldia'])

      // Cada panel se nombra con su pestaña, y los cuatro están en el documento con su texto.
      for (const clave of CARGOS) {
        const panel = page.locator(`#caso-${clave}`)

        assert.equal(await panel.getAttribute('aria-labelledby'), await page.locator(`[data-pestana-caso="${clave}"]`).getAttribute('id'))
        assert.ok((await panel.textContent()).length > 900, `${clave}: el caso entero viaja en el HTML`)
      }

      // La pestaña elegida no se distingue solo por el color: lleva un borde, no un fondo.
      const indicador = await page.locator('[data-casos-cargo] .MuiTabs-indicator').evaluate(el => {
        const e = getComputedStyle(el)

        return { borde: parseFloat(e.borderBottomWidth), fondo: e.backgroundColor }
      })

      assert.ok(indicador.borde >= 3, `indicador con borde de ${indicador.borde}px`)
      assert.match(indicador.fondo, /rgba\(0, 0, 0, 0\)|transparent/, 'el indicador no depende de un fondo')

      // Objetivo táctil y maquetación: una sola fila, sin desborde de página.
      const cajas = await pestanas.evaluateAll(ts => ts.map(t => t.getBoundingClientRect()).map(r => ({ y: Math.round(r.y), alto: r.height })))

      assert.ok(cajas.every(c => c.alto >= 44), `pestañas de ≥44 px de alto: ${JSON.stringify(cajas)}`)
      assert.equal(new Set(cajas.map(c => c.y)).size, 1, 'las pestañas van en una sola fila')
      assert.ok(await sinDesborde(page), 'las pestañas no desbordan la página')

      // Ratón: elegir cambia el panel y la dirección, sin llenar el historial.
      const historial = await page.evaluate(() => history.length)

      await page.locator('[data-pestana-caso="rectorado"]').click()
      assert.equal(await elegida(page), 'rectorado')
      assert.deepEqual(await aLaVista(page), ['rectorado'])
      assert.equal(new URL(page.url()).hash, '#caso-rectorado', 'cada caso tiene dirección propia')
      assert.equal(await page.evaluate(() => history.length), historial, 'elegir pestaña no añade entradas al historial')
      assert.equal(await page.locator('#ejemplo-entrada').evaluate(e => e.closest('[role="tabpanel"]').dataset.caso), 'rectorado', '#ejemplo-entrada apunta al caso elegido')
      assert.equal(await page.locator('#ejemplo-entrada').count(), 1, 'el ancla no se repite')

      // Teclado: las flechas mueven el foco; elegir es un gesto aparte (Intro o Espacio).
      await page.locator('[data-pestana-caso="rectorado"]').focus()
      await page.keyboard.press('ArrowRight')
      assert.equal(await page.evaluate(() => document.activeElement?.dataset.pestanaCaso), 'direccion', 'la flecha lleva el foco a la pestaña siguiente')
      assert.equal(await elegida(page), 'rectorado', 'mover el foco no cambia la selección')
      assert.equal(new URL(page.url()).hash, '#caso-rectorado', 'ni la dirección')
      await page.keyboard.press('Enter')
      assert.equal(await elegida(page), 'direccion')
      assert.equal(new URL(page.url()).hash, '#caso-direccion')
      await page.keyboard.press('ArrowLeft')
      await page.keyboard.press('ArrowLeft')
      await page.keyboard.press(' ')
      assert.equal(await elegida(page), 'alcaldia', 'Espacio también elige')

      // Foco visible en la pestaña, con anillo propio.
      const anillo = await page.evaluate(() => {
        const e = getComputedStyle(document.activeElement)

        return { estilo: e.outlineStyle, ancho: parseFloat(e.outlineWidth) }
      })

      assert.ok(anillo.estilo !== 'none' && anillo.ancho >= 2, `foco visible en la pestaña: ${JSON.stringify(anillo)}`)

      // «Buscar en la página» en un panel oculto elige su pestaña (donde el navegador lo admite).
      if (await page.evaluate(() => 'onbeforematch' in HTMLElement.prototype)) {
        assert.equal(await page.locator('#caso-electo').getAttribute('hidden'), 'until-found', 'los ocultos son buscables')
        await page.locator('#caso-electo [data-demo-decides]').evaluate(el => el.dispatchEvent(new Event('beforematch', { bubbles: true })))
        await page.waitForFunction(() => document.querySelector('[role="tab"][aria-selected="true"]')?.dataset.pestanaCaso === 'electo')
        assert.deepEqual(await aLaVista(page), ['electo'], 'el texto encontrado queda a la vista y la pestaña cuadra')
      }

      // Copiar el enlace del caso: botón de tamaño táctil dentro del panel a la vista.
      const copiar = page.locator('[data-casos-cargo] [role="tabpanel"]:not([hidden])').getByRole('button', { name: es ? 'Copiar enlace a este caso' : 'Copy link to this case', exact: true })
      const cajaCopiar = await copiar.boundingBox()

      assert.ok(cajaCopiar.height >= 44, `copiar enlace ≥44 px: ${cajaCopiar.height}`)
      assert.deepEqual(errores, [])
      resultados.push({ bloque: 'A pestañas', ...caso, resultado: 'PASS' })
    } finally { await ctx.close() }
  }

  // ── B · enlace por cargo: llegar con #caso-… y volver ──────────────────────────
  {
    const ctx = await contexto({ ancho: 1440, idioma: 'es' })

    try {
      const page = await ctx.newPage()

      await page.goto(`${base}#caso-electo`, { waitUntil: 'networkidle' })
      await page.waitForFunction(() => document.querySelector('[role="tab"][aria-selected="true"]')?.dataset.pestanaCaso === 'electo')
      assert.deepEqual(await aLaVista(page), ['electo'], 'el enlace de un cargo abre su caso')
      await page.waitForFunction(() => document.activeElement?.dataset.pestanaCaso === 'electo')
      const cajaPestanas = await page.locator('[data-casos-cargo] [role="tablist"]').boundingBox()

      assert.ok(cajaPestanas.y >= 60 && cajaPestanas.y < 400, `las pestañas quedan a la vista bajo la cabecera: y=${cajaPestanas.y}`)

      // Carga nueva (otra pestaña del navegador): un cambio de hash sobre la misma página no recarga.
      const otra = await ctx.newPage()

      await otra.goto(`${base}#caso-inexistente`, { waitUntil: 'networkidle' })
      assert.equal(await elegida(otra), 'alcaldia', 'un cargo que no existe no rompe nada: se enseña el primero')
      await otra.close()

      // Desde /retos, el ejemplo de un cargo lleva a su día completo; «atrás» vuelve.
      await page.goto(`${base}retos/`, { waitUntil: 'networkidle' })
      const enlaces = page.locator('[data-retos-ejemplo] a')

      assert.equal(await enlaces.count(), 4)
      assert.equal(new Set(await enlaces.evaluateAll(as => as.map(a => a.textContent.trim()))).size, 4, 'cuatro enlaces a cuatro destinos, cada uno con su nombre')
      await enlaces.nth(1).click()
      await page.waitForURL(u => u.hash === '#caso-rectorado')
      await page.waitForFunction(() => document.querySelector('[role="tab"][aria-selected="true"]')?.dataset.pestanaCaso === 'rectorado')
      assert.deepEqual(await aLaVista(page), ['rectorado'])
      await page.goBack()
      await page.waitForURL('**/retos/')
      assert.equal(await page.locator('h1').count(), 1)
      resultados.push({ bloque: 'B enlace por cargo', resultado: 'PASS' })
    } finally { await ctx.close() }
  }

  // ── C · el recorrido y sus cifras vivas, contra el JSON servido ────────────────
  for (const idioma of ['es', 'en']) {
    const ctx = await contexto({ ancho: 1440, idioma })

    try {
      const { page } = await abrir(ctx, '', idioma)

      assert.equal(await page.locator('[data-recorrido] [data-columna]').count(), 3)
      assert.equal(await page.locator('[data-recorrido] [data-columna="columna-llega"] li').count(), 7, 'los siete canales que el clon ingiere')

      const esperado = await page.evaluate(async () => {
        const lee = async n => (await fetch(`data/${n}.json`)).json()
        const [overview, clones] = [await lee('overview'), await lee('clones')]

        return {
          'cifra-buzones': new Set(clones.clones.map(c => c.correo).filter(Boolean)).size,
          'cifra-agendas': new Set(clones.clones.flatMap(c => c.calendarios)).size,
          'cifra-rutinas': overview.crons.length,
          'cifra-personas': overview.personas.fichas_curadas,
          'cifra-oficios': clones.clones.length
        }
      })

      assert.equal(await page.locator('[data-cifras-vivas]').getAttribute('data-cifras-vivas'), 'ok')

      for (const [clave, valor] of Object.entries(esperado)) {
        const pintado = Number((await page.locator(`[data-cifra="${clave}"] dd`).innerText()).replace(/\D/g, ''))

        assert.equal(pintado, valor, `${clave}: la web pinta lo que dice el dato`)
        assert.ok(valor > 0, `${clave}: un cero aquí sería un dato que no llegó`)
      }

      // Los dos atajos del recorrido llevan al caso elegido.
      await page.locator('[data-columna="columna-devuelve"] a').click()
      await page.waitForURL(u => u.hash === '#ejemplo-decision')
      assert.ok(await page.locator('#ejemplo-decision').isVisible())

      // Los niveles: punto de partida y cuatro, cada uno con su página viva.
      assert.equal(await page.locator('[data-niveles] [data-nivel]').count(), 5)
      const destinos = await page.locator('[data-niveles] a').evaluateAll(as => as.map(a => a.getAttribute('href')))

      assert.deepEqual(destinos.map(d => d.replace(/^.*\/madclon-front-office/, '')), ['/flota/', '/actividad/', '/salud/', '/retos/'])

      for (const destino of destinos) {
        const respuesta = await page.request.get(new URL(destino, base).href)

        assert.equal(respuesta.status(), 200, `${destino} responde`)
      }

      // «Preguntas de quien dirige» aterriza en su grupo, con el foco en el título.
      await page.locator('[aria-labelledby="siguiente-paso"] a[href$="/preguntas/#institucion"]').click()
      await page.waitForURL(u => u.pathname.endsWith('/preguntas/') && u.hash === '#institucion')
      await page.waitForFunction(() => document.activeElement?.id === 'institucion')
      const cajaTitulo = await page.locator('#institucion').boundingBox()

      assert.ok(cajaTitulo.y >= 60 && cajaTitulo.y < 700, `el grupo queda a la vista bajo la cabecera: y=${cajaTitulo.y}`)
      assert.equal(await page.locator('[data-preguntas-institucion] .MuiAccordion-root').count(), 6, 'las seis preguntas de un despacho público')
      resultados.push({ bloque: 'C recorrido, niveles y preguntas', idioma, cifras: esperado, resultado: 'PASS' })
    } finally { await ctx.close() }
  }

  // ── D · diez rutas × dos idiomas × dos anchos: nada roto, nada desbordado ──────
  for (const idioma of ['es', 'en']) {
    for (const ancho of [375, 1440]) {
      const ctx = await contexto({ ancho, idioma })

      try {
        for (const ruta of RUTAS) {
          const { page, errores } = await abrir(ctx, ruta, idioma)
          const texto = await page.locator('main').innerText()
          const nombre = ruta.replace('/', '') || 'inicio'

          assert.equal(await page.locator('h1').count(), 1, `${nombre}: un solo h1`)
          assert.doesNotMatch(texto, ROTO, `${nombre}@${ancho}/${idioma}: hueco roto en el texto`)
          assert.ok(await sinDesborde(page), `${nombre}@${ancho}/${idioma}: desborde horizontal`)
          assert.deepEqual(errores, [], `${nombre}@${ancho}/${idioma}`)

          if (CON_LECTURA.includes(nombre)) {
            const lectura = page.locator(`[data-lectura="${nombre}"]`)

            assert.equal(await lectura.count(), 1, `${nombre}: un bloque «Si diriges una institución»`)
            assert.ok((await lectura.locator('h2 + p').innerText()).length > 80, `${nombre}: el bloque dice algo`)
          }

          if (nombre === 'retos') {
            assert.equal(await page.locator('[data-retos-ejemplo] li').count(), 4)
            assert.equal(await page.locator('[data-retos-ejemplo] [role="progressbar"]').count(), 0, 'un reto inventado no lleva avance')
            assert.ok(await page.locator('[data-retos-ejemplo]').evaluate(e => e.compareDocumentPosition(document.querySelector('[data-retos-avance], [data-retos-en-revision]')) & Node.DOCUMENT_POSITION_PRECEDING), 'los ejemplos van DEBAJO de los retos de verdad')
          }

          if (nombre === 'flota') assert.equal(await page.locator('[data-equipo-ejemplo] li dt').count(), 20, 'cuatro cargos, cinco oficios cada uno')
          if (nombre === 'actividad') assert.equal(await page.locator('[data-actividad-despacho] dt').count(), 4)
          await page.close()
        }

        resultados.push({ bloque: 'D diez rutas', idioma, ancho, resultado: 'PASS' })
      } finally { await ctx.close() }
    }
  }

  // ── E · la automejora que no llega ya no publica «undefined» ───────────────────
  for (const [nombre, automejora, espera] of [
    ['vacía', {}, { motor: 'sin-dato', barras: 0 }],
    ['sin pendientes', { hechas: 12, bloqueadas: 3, aparcadas: 40, pendientes: null, llamadas: 1234, metered: 0, top: 'uno, otro' }, { motor: 'ok', barras: 3 }],
    ['completa', { hechas: 12, bloqueadas: 3, aparcadas: 40, pendientes: 5, llamadas: 1234, metered: 0, top: 'uno, otro' }, { motor: 'ok', barras: 4 }]
  ]) {
    const ctx = await contexto({ ancho: 1440, idioma: 'es' })

    try {
      await ctx.route('**/data/overview.json', async ruta => {
        const dato = await (await ruta.fetch()).json()

        dato.automejora = automejora
        await ruta.fulfill({ contentType: 'application/json', body: JSON.stringify(dato) })
      })

      // Se fija el reloj en el día en que «El clon opina» elige la plantilla de automejora.
      await ctx.addInitScript(() => {
        const real = Date.now
        const desfase = new Date(new Date().getFullYear(), 0, 2, 12).getTime() - real()

        Date.now = () => real() + desfase
      })

      const inicio = await abrir(ctx, '', 'es')

      assert.doesNotMatch(await inicio.page.locator('main').innerText(), ROTO, `automejora ${nombre}: la portada no publica un hueco`)
      assert.deepEqual(inicio.errores, [])
      const actividad = await abrir(ctx, 'actividad/', 'es')
      const tarjeta = actividad.page.locator('[data-motor]')

      assert.equal(await tarjeta.getAttribute('data-motor'), espera.motor, `automejora ${nombre}`)
      assert.equal(await tarjeta.locator('[role="progressbar"]').count(), espera.barras, `automejora ${nombre}: una barra por cifra que SÍ vino`)
      assert.doesNotMatch(await actividad.page.locator('main').innerText(), ROTO, `automejora ${nombre}: /actividad no publica un hueco`)
      if (espera.motor === 'sin-dato') assert.match(await tarjeta.getByRole('status').innerText(), /sin dato[\s\S]*Vuelven solas/, 'el hueco se explica')
      if (nombre === 'sin pendientes') assert.match(await tarjeta.innerText(), /pendientes\s*sin dato/, 'la fila que falta dice «sin dato»')
      resultados.push({ bloque: 'E automejora', caso: nombre, resultado: 'PASS' })
    } finally { await ctx.close() }
  }

  console.log(JSON.stringify({ resultado: 'PASS', resultados }, null, 2))
} catch (error) {
  console.error(error)
  console.error(JSON.stringify({ resultado: 'FAIL', hechos: resultados }, null, 2))
  process.exitCode = 1
} finally {
  await browser.close()
}
