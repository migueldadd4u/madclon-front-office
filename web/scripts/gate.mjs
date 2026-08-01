#!/usr/bin/env node
// gate.mjs — el gate determinista del front office (PROMPT-GOAL-HUMANO-v5 §3).
//
// Regla dura: si algo se puede medir con un script, no lo decide un LLM.
// Nada se publica sin pasar este gate ENTERO en verde, en local.
//
//   npx yarn@1.22.22 gate                 → las 12 comprobaciones
//   node scripts/gate.mjs --sin-navegador → solo 1-4 (build, tipos, copy, cifras)
//   node scripts/gate.mjs --rapido        → matriz reducida (para el bucle de bugfixing)
//   node scripts/gate.mjs --saltar-build  → reutiliza web/out ya construido
//
// Playwright y axe-core se toman de /tmp/pwshot (convención del proyecto);
// se puede apuntar a otro sitio con PW_HOME=/ruta/con/node_modules.

import { execSync } from 'node:child_process'
import { createServer } from 'node:http'
import { createRequire } from 'node:module'
import { readFileSync, existsSync, statSync } from 'node:fs'
import { join, extname, resolve } from 'node:path'
import { comprobarCopy } from './check-copy.mjs'
import { comprobarHardcode } from './check-hardcode.mjs'

const RAIZ = resolve(process.cwd())
const PW_HOME = process.env.PW_HOME || '/tmp/pwshot'
const BASE = '/madclon-front-office'
const PUERTO = Number(process.env.GATE_PORT || 4173)
const PAGINAS = ['', 'flota', 'salud', 'tokens', 'eficiencia', 'actividad', 'historia', 'preguntas']
const rapido = process.argv.includes('--rapido')
const ANCHOS_AXE = rapido ? [390, 1440] : [390, 834, 1440]
const ANCHOS_OVERFLOW = [320, 390, 834, 1440]
const IDIOMAS = rapido ? ['es'] : ['es', 'en']
const CONTRASTES = rapido ? [false] : [false, true]

// ── DEUDAS ABIERTAS DEL GATE ────────────────────────────────────────────────────
// Comprobaciones que hoy NO puede pasar la web porque miden una deuda todavía sin
// saldar. Se ejecutan igual y se imprimen ALTO, pero no tumban el gate hasta que la
// entrega correspondiente las salde (entonces se borra la línea de aquí).
// Vacío desde la entrega 3 (2026-08-01): las comprobaciones 9 y 10 (eje 6) pasaron a
// verde con el panel lateral, así que ya tumban el gate como todas las demás.
const DEUDAS = {}

// Objetivos táctiles por debajo de 44 px aceptados hoy, con motivo. Cada entrada es
// una excepción real y comentada, no una alfombra bajo la que barrer.
const TACTIL_BLANCA = [
  { sel: '.MuiPaginationItem-root', motivo: 'paginación de la plantilla Materialize, sin uso en el panel' },
  {
    sel: '.fo-pista',
    motivo:
      'puntos de la franja «un día en la vida»: su tamaño ES el dato (cada punto marca una hora exacta en 24 h). ' +
      'Agrandarlos a 44 px los solaparía y destruiría la línea de tiempo. La franja entera es enfocable y se ' +
      'recorre con las flechas, y hay resumen textual: la información es accesible sin acertar el punto.'
  }
]

const log = (...a) => console.log(...a)
const resultados = []

function marca(n, nombre, ok, evidencia) {
  const deuda = DEUDAS[n]
  const estado = ok ? 'OK' : deuda ? 'DEUDA' : 'FALLO'

  resultados.push({ n, nombre, estado, evidencia })
  log(`  ${estado.padEnd(5)} ${String(n).padStart(2)} · ${nombre}${evidencia ? ` — ${evidencia}` : ''}`)
  if (!ok && deuda) log(`        ↳ deuda abierta: ${deuda}`)
}

function sh(cmd) {
  return execSync(cmd, { cwd: RAIZ, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 64 * 1024 * 1024 })
}

function contarProblemas(salida) {
  const m = salida.match(/(\d+)\s+problems?/)

  return m ? Number(m[1]) : 0
}

// ── 1-4 · comprobaciones estáticas ──────────────────────────────────────────────
function estaticas() {
  log('\n▸ Estáticas')

  // 1 · build
  if (process.argv.includes('--saltar-build')) {
    marca(1, 'build', existsSync(join(RAIZ, 'out/index.html')), 'reutiliza web/out (--saltar-build)')
  } else {
    try {
      const out = execSync('npx yarn@1.22.22 build', {
        cwd: RAIZ,
        encoding: 'utf8',
        env: { ...process.env, BASEPATH: BASE },
        maxBuffer: 64 * 1024 * 1024
      })
      const warns = (out.match(/\bwarn(ing)?\b/gi) || []).length

      marca(1, 'build BASEPATH=/madclon-front-office', warns === 0, `0 errores, ${warns} warnings`)
    } catch (e) {
      marca(1, 'build BASEPATH=/madclon-front-office', false, String(e.stdout || e.message).slice(-400))
    }
  }

  // 2 · tipos y linters (linters contra línea base: la plantilla Materialize
  //     llega con miles de avisos de formato que no son nuestros).
  let detalle = []
  let ok2 = true

  try {
    sh('npx tsc --noEmit')
    detalle.push('tsc limpio')
  } catch (e) {
    ok2 = false
    detalle.push('tsc CON ERRORES')
  }

  const base = JSON.parse(readFileSync(join(RAIZ, 'scripts/lint-baseline.json'), 'utf8'))

  for (const [clave, cmd] of [
    ['eslint', 'npx eslint src/app src/components src/lib --ext .ts,.tsx'],
    ['stylelint', 'npx stylelint "src/**/*.{css,tsx}"']
  ]) {
    let salida = ''

    try {
      salida = sh(cmd)
    } catch (e) {
      salida = String(e.stdout || '') + String(e.stderr || '')
    }
    const n = contarProblemas(salida)

    if (n > base[clave]) ok2 = false
    detalle.push(`${clave} ${n}/${base[clave]}`)
  }

  marca(2, 'tsc + eslint + stylelint (sin regresión)', ok2, detalle.join(' · '))

  // 3 · cifras a mano
  const h = comprobarHardcode(RAIZ)

  marca(3, 'check-hardcode (eje 7)', h.fallos.length === 0, `${h.fallos.length} fallos · ${h.deudas.length} deudas`)

  // 4 · identidad y tecnicismos
  const c = comprobarCopy(RAIZ)

  marca(4, 'check-copy (eje 5)', c.fallos.length === 0, `${c.fallos.length} fallos · ${c.deudas.length} deudas`)
}

// ── servidor estático mínimo para web/out bajo la subruta real ──────────────────
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.webm': 'video/webm',
  '.mp4': 'video/mp4',
  '.txt': 'text/plain',
  '.xml': 'application/xml',
  '.woff2': 'font/woff2'
}

function servir() {
  const raizOut = join(RAIZ, 'out')
  const srv = createServer((req, res) => {
    let ruta = decodeURIComponent(req.url.split('?')[0])

    if (!ruta.startsWith(BASE)) {
      res.writeHead(404).end('fuera de la subruta')

      return
    }
    ruta = ruta.slice(BASE.length) || '/'
    let f = join(raizOut, ruta)

    try {
      if (statSync(f).isDirectory()) f = join(f, 'index.html')
    } catch {
      if (existsSync(f + '.html')) f = f + '.html'
    }
    if (!existsSync(f)) {
      res.writeHead(404, { 'content-type': 'text/html; charset=utf-8' }).end(
        existsSync(join(raizOut, '404.html')) ? readFileSync(join(raizOut, '404.html')) : 'no está'
      )

      return
    }
    res.writeHead(200, { 'content-type': MIME[extname(f)] || 'application/octet-stream' })
    res.end(readFileSync(f))
  })

  return new Promise(ok => srv.listen(PUERTO, () => ok(srv)))
}

// ── 5-12 · comprobaciones en navegador ──────────────────────────────────────────
async function navegador() {
  const req = createRequire(join(PW_HOME, 'noop.js'))
  let chromium, axeSrc

  try {
    ;({ chromium } = req('playwright'))
    axeSrc = readFileSync(join(PW_HOME, 'node_modules/axe-core/axe.min.js'), 'utf8')
  } catch (e) {
    marca(5, 'axe / navegador', false, `no hay playwright+axe en ${PW_HOME} (PW_HOME=… para cambiarlo)`)

    return
  }

  const srv = await servir()
  const url = p => `http://localhost:${PUERTO}${BASE}/${p}`
  const navegadorPw = await chromium.launch()
  const violaciones = []
  const erroresJs = []
  const respuestasMalas = []
  const overflow = []
  const tactiles = []

  log('\n▸ Navegador')

  for (const lang of IDIOMAS) {
    for (const contraste of CONTRASTES) {
      const ctx = await navegadorPw.newContext({ viewport: { width: 1440, height: 900 } })

      await ctx.addInitScript(
        ([l, c]) => {
          localStorage.setItem('madclon-lang', l)
          localStorage.setItem('madclon-contraste', c)
        },
        [lang, contraste ? '1' : '0']
      )
      const pg = await ctx.newPage()

      pg.on('pageerror', e => erroresJs.push(`${lang}${contraste ? '/AC' : ''} ${e.message}`))
      pg.on('console', m => {
        // «Failed to load resource» ya lo cubren los dos vigilantes de red de abajo:
        // contarlo aquí duplicaría el mismo hecho.
        if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) {
          erroresJs.push(`${lang} consola: ${m.text().slice(0, 120)}`)
        }
      })
      pg.on('response', r => r.status() >= 400 && respuestasMalas.push(`${r.status()} ${r.url()}`))
      // ERR_ABORTED = prefetch de Next cancelado porque el gate navega/redimensiona
      // deprisa. Es un efecto del propio barrido, no un fallo de la web.
      pg.on('requestfailed', r => {
        const err = r.failure()?.errorText || ''

        if (!/ERR_ABORTED/.test(err)) respuestasMalas.push(`${err} ${r.url().slice(0, 90)}`)
      })

      for (const p of PAGINAS) {
        await pg.goto(url(p), { waitUntil: 'domcontentloaded' })
        await pg.waitForTimeout(1600)

        for (const w of ANCHOS_OVERFLOW) {
          await pg.setViewportSize({ width: w, height: 900 })
          await pg.waitForTimeout(320)

          const desborde = await pg.evaluate(
            () => document.documentElement.scrollWidth - window.innerWidth
          )

          if (desborde > 1) overflow.push(`${p || 'portada'} @${w} +${desborde}px (${lang})`)

          if (ANCHOS_AXE.includes(w)) {
            await pg.evaluate(axeSrc)
            const r = await pg.evaluate(async () =>
              axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa'] } })
            )

            r.violations
              .filter(v => v.impact === 'serious' || v.impact === 'critical')
              .forEach(v => violaciones.push(`${p || 'portada'} @${w} ${lang}${contraste ? '/AC' : ''}: ${v.id} (${v.nodes.length})`))
          }

          // 8 · objetivos táctiles, solo en móvil
          if (w === 390 && !contraste && lang === 'es') {
            const chicos = await pg.evaluate(blanca => {
              const out = []

              for (const el of document.querySelectorAll('a[href], button, [role="button"], input, select, summary')) {
                if (blanca.some(s => el.closest(s))) continue
                const r = el.getBoundingClientRect()

                if (r.width === 0 || r.height === 0) continue
                if (getComputedStyle(el).visibility === 'hidden') continue
                if (r.width < 44 || r.height < 44) {
                  out.push(
                    `${el.tagName.toLowerCase()}${el.className && typeof el.className === 'string' ? '.' + el.className.split(' ')[0] : ''} ${Math.round(r.width)}×${Math.round(r.height)} «${(el.getAttribute('aria-label') || el.textContent || '').trim().slice(0, 24)}»`
                  )
                }
              }

              return out
            }, TACTIL_BLANCA.map(t => t.sel))

            chicos.forEach(c => tactiles.push(`${p || 'portada'}: ${c}`))
          }
        }
      }
      await ctx.close()
    }
  }

  const matriz = `${PAGINAS.length} páginas × ${ANCHOS_AXE.join('/')} × ${IDIOMAS.join('/')} × ${CONTRASTES.length === 2 ? 'normal+AC' : 'normal'}`

  marca(5, `axe wcag2a/2aa/21aa (${matriz})`, violaciones.length === 0, violaciones.slice(0, 6).join(' | ') || '0 serious, 0 critical')
  marca(6, 'consola y red en el mismo barrido', erroresJs.length === 0 && respuestasMalas.length === 0,
    `${erroresJs.length} errores JS · ${respuestasMalas.length} respuestas ≥400 ${[...erroresJs, ...respuestasMalas].slice(0, 3).join(' | ')}`)
  marca(7, `overflow horizontal (${ANCHOS_OVERFLOW.join('/')})`, overflow.length === 0, overflow.slice(0, 5).join(' | ') || 'ninguna página desborda')
  marca(8, 'objetivos táctiles ≥ 44 px @390', tactiles.length === 0, tactiles.slice(0, 6).join(' | ') || `0 por debajo de 44 px`)

  // 9 · teclado: Flota → capa 2 → volver
  const ctxK = await navegadorPw.newContext({ viewport: { width: 1440, height: 900 } })

  await ctxK.addInitScript(() => localStorage.setItem('madclon-lang', 'es'))
  const k = await ctxK.newPage()

  await k.goto(url('flota'), { waitUntil: 'domcontentloaded' })
  await k.waitForTimeout(1600)

  const pasosTeclado = []
  const abridor = k.locator('[data-anatomia-abrir], button:has-text("ver qué hay debajo")').first()
  const hayAbridor = (await abridor.count()) > 0

  pasosTeclado.push(`abridor de capa 2: ${hayAbridor ? 'sí' : 'NO'}`)
  if (hayAbridor) {
    // Con Tab de verdad: `.focus()` programático no dispara :focus-visible y daría
    // un «foco invisible» falso.
    await k.evaluate(() => document.body.focus())
    let llega = false

    for (let i = 0; i < 80 && !llega; i++) {
      await k.keyboard.press('Tab')
      llega = await k.evaluate(() => !!document.activeElement?.closest('[data-anatomia-abrir]'))
    }
    pasosTeclado.push(`Tab llega al abridor: ${llega ? 'sí' : 'NO'}`)
    const focoVisible =
      llega &&
      (await k.evaluate(() => {
        const el = document.activeElement
        const s = getComputedStyle(el)

        return el.matches(':focus-visible') && (s.outlineStyle !== 'none' || s.boxShadow !== 'none')
      }))

    pasosTeclado.push(`foco visible: ${focoVisible ? 'sí' : 'NO'}`)
    await k.keyboard.press('Enter')
    await k.waitForTimeout(700)
    const abierta = await k.evaluate(() => !!document.querySelector('[role="dialog"], [data-capa="2"]'))

    pasosTeclado.push(`Enter abre: ${abierta ? 'sí' : 'NO'}`)
    const lateral = await k.evaluate(() => !!document.querySelector('[data-capa-lateral]'))

    pasosTeclado.push(`movimiento lateral: ${lateral ? 'sí' : 'NO'}`)
    await k.keyboard.press('Escape')
    await k.waitForTimeout(500)
    const cerrada = await k.evaluate(() => !document.querySelector('[role="dialog"], [data-capa="2"]'))
    const focoVuelve = await k.evaluate(() => document.activeElement?.textContent?.includes('debajo') ?? false)

    pasosTeclado.push(`Esc cierra: ${cerrada ? 'sí' : 'NO'}`, `foco vuelve: ${focoVuelve ? 'sí' : 'NO'}`)
    marca(9, 'teclado: flota → capa 2 → volver', abierta && cerrada && focoVisible && lateral, pasosTeclado.join(' · '))
  } else {
    marca(9, 'teclado: flota → capa 2 → volver', false, pasosTeclado.join(' · '))
  }

  // 10 · capas (eje 6): migas, distintivo sticky, «atrás» del navegador
  await k.goto(url('flota'), { waitUntil: 'domcontentloaded' })
  await k.waitForTimeout(1400)
  const capa = { migas: false, distintivo: false, atras: false }

  if (hayAbridor) {
    await abridor.click()
    await k.waitForTimeout(700)
    capa.migas = await k.evaluate(() => !!document.querySelector('[data-migas], nav[aria-label*="miga" i], nav[aria-label*="breadcrumb" i]'))
    capa.distintivo = await k.evaluate(() => {
      const d = document.querySelector('[data-distintivo-capa]')

      return !!d && getComputedStyle(d).position === 'sticky'
    })
    await k.goBack()
    await k.waitForTimeout(700)
    capa.atras = await k.evaluate(() => !document.querySelector('[role="dialog"], [data-capa="2"]'))
  }

  marca(10, 'capas: migas + distintivo sticky + «atrás» cierra', capa.migas && capa.distintivo && capa.atras,
    `migas ${capa.migas ? 'sí' : 'NO'} · distintivo sticky ${capa.distintivo ? 'sí' : 'NO'} · atrás cierra ${capa.atras ? 'sí' : 'NO'}`)

  // 11 · frescura del dato: si el manifest tiene > 48 h, la web lo tiene que confesar
  const manifest = JSON.parse(readFileSync(join(RAIZ, 'public/data/manifest.json'), 'utf8'))
  const sello = new Date(manifest.generado || manifest.generado_utc || manifest.fecha)
  const horas = (Date.now() - sello.getTime()) / 36e5

  await k.goto(url(''), { waitUntil: 'domcontentloaded' })
  await k.waitForTimeout(1600)
  const confiesa = await k.evaluate(() => !!document.querySelector('[data-frescura-rancia]'))

  marca(11, 'frescura de datos', horas <= 48 || confiesa,
    `manifest de hace ${horas.toFixed(1)} h · ${horas > 48 ? (confiesa ? 'la web lo confiesa' : 'LA WEB NO LO CONFIESA') : 'fresco (no procede confesar)'}`)

  // 12 · enlaces internos, og:image y sitemap
  const rotos = []
  const vistos = new Set()

  for (const p of PAGINAS) {
    await k.goto(url(p), { waitUntil: 'domcontentloaded' })
    await k.waitForTimeout(700)
    const hrefs = await k.evaluate(() => [...document.querySelectorAll('a[href^="/"]')].map(a => a.getAttribute('href')))
    const og = await k.evaluate(() => document.querySelector('meta[property="og:image"]')?.content || '')

    for (const h of [...hrefs, og].filter(Boolean)) {
      if (vistos.has(h)) continue
      vistos.add(h)
      if (/\/madclon-front-office\/madclon-front-office/.test(h)) {
        rotos.push(`subruta duplicada: ${h}`)
        continue
      }
      const abs = h.startsWith('http') ? h : `http://localhost:${PUERTO}${h.startsWith(BASE) ? h : BASE + h}`
      const r = await k.request.get(abs)

      if (!r.ok()) rotos.push(`${r.status()} ${h}`)
    }
  }

  const sm = await k.request.get(`http://localhost:${PUERTO}${BASE}/sitemap.xml`)

  if (!sm.ok()) rotos.push(`sitemap.xml ${sm.status()}`)
  marca(12, 'enlaces internos + og:image + sitemap', rotos.length === 0, rotos.slice(0, 5).join(' | ') || `${vistos.size} destinos, todos 200`)

  await ctxK.close()
  await navegadorPw.close()
  srv.close()
}

// ── main ────────────────────────────────────────────────────────────────────────
log(`GATE · front office${rapido ? ' (modo rápido: matriz reducida)' : ''}`)
estaticas()
if (!process.argv.includes('--sin-navegador')) await navegador()

const fallos = resultados.filter(r => r.estado === 'FALLO')
const deudas = resultados.filter(r => r.estado === 'DEUDA')

log(`\nRESULTADO · ${resultados.filter(r => r.estado === 'OK').length} OK · ${deudas.length} DEUDA · ${fallos.length} FALLO`)
if (rapido) log('⚠ modo rápido: NO sirve para publicar, solo para el bucle de bugfixing.')
deudas.forEach(d => log(`  DEUDA ${d.n} · ${DEUDAS[d.n]}`))
process.exit(fallos.length === 0 ? 0 : 1)
