#!/usr/bin/env node
// Recorrido focal P01. El gate completo sigue siendo la puerta de publicación.
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { readFileSync, mkdirSync } from 'node:fs'
import { join, resolve } from 'node:path'

import { resolverPlaywrightHome } from './playwright-home.mjs'
import { esperarDomAsentado, esperarQuietudDeMovimiento } from './esperas.mjs'

const base = process.env.PROTOTYPE_URL || 'http://127.0.0.1:9341/madclon-front-office/'
const evidencia = process.env.PROTOTYPE_EVIDENCE
const requireBrowser = createRequire(join(resolverPlaywrightHome().directorio, 'noop.js'))
const { chromium } = requireBrowser('playwright')
const axe = readFileSync(requireBrowser.resolve('axe-core/axe.min.js'), 'utf8')
const browser = await chromium.launch({ headless: true })
const resultados = []

async function comprobarHistorialHero(page, caso, tituloPortada) {
  const pathnamePortada = new URL(base).pathname
  const pathnameRetos = new URL('retos/', base).pathname
  const tituloRetos = caso.idioma === 'es' ? 'Un reto es algo que se empieza para terminarlo' : 'A challenge is something you start in order to finish it'
  const portadaCoherente = async hash => {
    await page.waitForFunction(({ titulo, pathname, hash }) => location.pathname === pathname && location.hash === hash && document.querySelector('h1')?.textContent === titulo, { titulo: tituloPortada, pathname: pathnamePortada, hash }, { timeout: 10000 })
    assert.equal(await page.locator('h1').count(), 1)
    assert.equal(await page.locator('[data-escaparate-clon]').count(), 1, 'el contenido de portada vuelve con su URL')
    assert.equal(await page.locator('[data-escaparate-clon] .MuiCardActionArea-root').count(), 3)
  }
  const abrirRetos = async () => {
    await page.locator('[data-bienvenida-explorar]').click()
    await page.waitForFunction(({ titulo, pathname }) => location.pathname === pathname && document.querySelector('h1')?.textContent === titulo, { titulo: tituloRetos, pathname: pathnameRetos }, { timeout: 10000 })
    assert.equal(await page.locator('[data-escaparate-clon]').count(), 0, 'Retos muestra su propio contenido')
  }
  const resultados = []

  for (const hash of ['#limites-privacidad', '#demostracion']) {
    await page.locator(`[data-bienvenida] a[href$="${hash}"]`).click()
    await page.waitForURL(url => url.hash === hash)
    await abrirRetos()
    await page.goBack({ waitUntil: 'domcontentloaded', timeout: 10000 })
    await portadaCoherente(hash)
    await abrirRetos()
    if (caso.ancho === 390) {
      await page.getByRole('button', { name: caso.idioma === 'es' ? 'Abrir o cerrar el menú' : 'Open or close the menu', exact: true }).click()
      assert.equal((await esperarQuietudDeMovimiento(page)).estado, 'quieto')
    }
    const logo = page.locator(`a[href="${pathnamePortada}"]`).filter({ hasText: /^MAD Clon$/ }).first()

    await logo.click()
    await portadaCoherente('')
    if (caso.ancho === 390) {
      const cerrarMenu = page.getByRole('button', { name: caso.idioma === 'es' ? 'cerrar el menú' : 'close the menu', exact: true })

      await cerrarMenu.focus()
      await page.keyboard.press('Enter')
      assert.equal((await esperarQuietudDeMovimiento(page)).estado, 'quieto')
    }
    resultados.push({ hash, atras: 'URL+h1+contenido PASS', logotipo: 'URL+h1+contenido PASS' })
  }

  return resultados
}

try {
  for (const caso of [
    { ancho: 390, idioma: 'es', modo: 'light' },
    { ancho: 1440, idioma: 'es', modo: 'light' },
    { ancho: 390, idioma: 'en', modo: 'light' },
    { ancho: 1440, idioma: 'en', modo: 'dark' }
  ]) {
    const context = await browser.newContext({ viewport: { width: caso.ancho, height: 1000 }, serviceWorkers: 'block', reducedMotion: 'reduce' })
    context.setDefaultTimeout(15000)
    context.setDefaultNavigationTimeout(20000)
    const page = await context.newPage()
    const erroresRuntime = []

    page.on('pageerror', error => erroresRuntime.push(error.message))
    page.on('console', mensaje => {
      if (mensaje.type() === 'error' && /Element type is invalid|Hydration failed|hydrating/i.test(mensaje.text())) erroresRuntime.push(mensaje.text())
    })

    await page.addInitScript(({ idioma, modo }) => {
      localStorage.setItem('madclon-lang', idioma)
      document.cookie = `madclon-front-office=${encodeURIComponent(JSON.stringify({ mode: modo }))}; path=/`
    }, caso)
    await page.goto(base, { waitUntil: 'networkidle' })
    await page.locator('html').waitFor({ state: 'attached' })
    await page.waitForFunction(({ idioma, modo }) => document.documentElement.lang === idioma && document.documentElement.hasAttribute(`data-${modo}`), caso)
    assert.equal(await page.locator('h1').count(), 1, 'un solo h1')
    assert.match(await page.locator('h1').innerText(), caso.idioma === 'es' ? /siguiente paso claro/ : /clear next step/)
    const historialHero = await comprobarHistorialHero(page, caso, await page.locator('h1').innerText())
    assert.equal(await page.locator('[data-escaparate-clon] .MuiCardActionArea-root').count(), 3)
    assert.match(await page.locator('[data-demo-sintetica]').innerText(), caso.idioma === 'es' ? /Demostración sintética/ : /Synthetic demonstration/)
    const accesoPrivacidad = page.locator('[data-bienvenida]').getByRole('link', { name: caso.idioma === 'es' ? 'Privacidad y límites' : 'Privacy and limits', exact: true })

    await accesoPrivacidad.focus()
    await page.keyboard.press('Enter')
    await page.waitForURL(url => url.hash === '#limites-privacidad')
    await page.waitForFunction(() => document.activeElement?.id === 'limites-privacidad')
    const tituloLimites = await page.locator('#limites-privacidad').boundingBox()

    assert.equal(await page.locator('#limites-privacidad').evaluate(nodo => getComputedStyle(nodo).scrollMarginBlockStart), '100px')
    assert.ok(tituloLimites.y >= 80 && tituloLimites.y + tituloLimites.height <= page.viewportSize().height, `título con foco visible bajo cabecera: ${tituloLimites.y}`)
    const privacidad = page.getByRole('button', { name: caso.idioma === 'es' ? '¿Qué se publica de mis datos?' : 'What is published from my data?' })

    await privacidad.focus()
    await page.keyboard.press('Enter')
    assert.equal(await privacidad.getAttribute('aria-expanded'), 'true', 'segundo gesto abre privacidad')
    assert.ok(await page.locator('#limite-1-contenido').isVisible())
    assert.equal((await esperarQuietudDeMovimiento(page)).estado, 'quieto')
    const subir = page.getByRole('button', { name: caso.idioma === 'es' ? 'Volver al principio' : 'Back to top', exact: true })

    await subir.waitFor({ state: 'visible' })
    const objetivo = await subir.boundingBox()

    assert.ok(objetivo.width >= 44 && objetivo.height >= 44, `objetivo de subir ≥44 × 44: ${objetivo.width} × ${objetivo.height}`)
    await page.getByRole('link', { name: caso.idioma === 'es' ? /Ver una entrada de ejemplo/ : /See a sample entry/ }).click()
    await page.waitForURL(url => url.hash === '#ejemplo-entrada')
    assert.equal(new URL(page.url()).hash, '#ejemplo-entrada')
    await page.locator('#ejemplo-entrada').waitFor({ state: 'visible' })
    await page.getByRole('link', { name: caso.idioma === 'es' ? /Ver una propuesta de ejemplo/ : /See a sample proposal/ }).click()
    await page.waitForURL(url => url.hash === '#ejemplo-decision')
    assert.equal(new URL(page.url()).hash, '#ejemplo-decision')
    assert.match(await page.locator('#ejemplo-decision').locator('..').innerText(), caso.idioma === 'es' ? /No hay base para recomendar/ : /no basis to recommend/)
    const sistema = page.getByRole('button', { name: caso.idioma === 'es' ? 'Ver el sistema por dentro' : 'See inside the system' })

    assert.equal(await sistema.getAttribute('aria-expanded'), 'false')
    await sistema.click()
    assert.equal(await sistema.getAttribute('aria-expanded'), 'true')
    assert.ok(await page.locator('#sistema-contenido').isVisible())
    await sistema.click()
    assert.equal(await esperarDomAsentado(page), true, 'DOM asentado después del acordeón')
    assert.equal((await esperarQuietudDeMovimiento(page)).estado, 'quieto', 'transición terminada, sin movimiento perpetuo')
    await page.addScriptTag({ content: axe })
    const auditoria = await page.evaluate(async () => (await axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'] } })).violations.map(v => ({ id: v.id, impacto: v.impact, nodos: v.nodes.map(n => ({ target: n.target, html: n.html })) })))

    assert.deepEqual(auditoria, [], JSON.stringify(auditoria))
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1), 'sin desborde horizontal')
    if (caso.ancho === 1440 && caso.idioma === 'es') {
      await page.setViewportSize({ width: 390, height: 844 })
      assert.equal(await esperarDomAsentado(page), true)
      assert.equal((await esperarQuietudDeMovimiento(page)).estado, 'quieto')
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1), 'resize 1440→390 sin desborde')
      const hero = await page.locator('[data-bienvenida]').boundingBox()

      assert.ok(hero.width > 280 && hero.width <= 390, `hero móvil legible: ${hero.width}`)
      await page.setViewportSize({ width: caso.ancho, height: 1000 })
      assert.equal(await esperarDomAsentado(page), true)
      assert.equal((await esperarQuietudDeMovimiento(page)).estado, 'quieto')
    }
    assert.deepEqual(erroresRuntime, [], 'sin errores de hidratación ni lazy imports')
    const primerCTA = page.locator('[data-bienvenida-explorar]')

    assert.match(await primerCTA.getAttribute('href'), /\/retos\/$/)
    if (evidencia) {
      mkdirSync(resolve(evidencia), { recursive: true })
      await page.evaluate(() => window.scrollTo(0, 0))
      await page.screenshot({ path: join(resolve(evidencia), `p01-publico-${caso.idioma}-${caso.ancho}-${caso.modo}.png`), fullPage: true })
    }
    await primerCTA.click()
    await page.waitForURL(url => /\/retos\/$/.test(url.pathname))
    assert.match(new URL(page.url()).pathname, /\/retos\/$/)
    resultados.push({ ...caso, historialHero, privacidadDesdeHero: '2 gestos, foco y margen PASS', subir: { ancho: objetivo.width, alto: objetivo.height }, anclas: 'PASS', acordeones: 'PASS', retos: 'PASS', axe: auditoria.length, overflow: 0 })
    await context.close()
  }

  const context = await browser.newContext({ viewport: { width: 390, height: 1000 }, serviceWorkers: 'block' })
  const page = await context.newPage()

  await page.route('**/data/*.json', route => route.fulfill({ status: 503, contentType: 'application/json', body: '{}' }))
  await page.goto(base, { waitUntil: 'networkidle' })
  await page.getByText('Este bloque está en revisión', { exact: true }).waitFor({ state: 'visible' })
  assert.equal(await page.locator('h1').count(), 1)
  assert.ok(await page.locator('[data-demo-sintetica]').isVisible())
  assert.equal(await page.locator('[data-escaparate-clon] .MuiCardActionArea-root').count(), 3)
  resultados.push({ datos: '503', explicacion: 'PASS', aviso: 'En revisión', demoSintetica: 'PASS' })
  await context.close()
  console.log(JSON.stringify({ estado: 'PASS', resultados }, null, 2))
} finally {
  await browser.close()
}
