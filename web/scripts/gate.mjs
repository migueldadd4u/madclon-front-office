#!/usr/bin/env node
// gate.mjs — el gate determinista del front office (PROMPT-GOAL-HUMANO-v5 §3).
//
// Regla dura: si algo se puede medir con un script, no lo decide un LLM.
// Nada se publica sin pasar este gate ENTERO en verde, en local.
//
//   npm run gate                           → las 15 comprobaciones (0-14)
//   node scripts/gate.mjs --sin-navegador → solo 0-4 (seguridad, build, tipos, copy, cifras)
//   node scripts/gate.mjs --rapido        → matriz reducida (para el bucle de bugfixing)
//   node scripts/gate.mjs --rapido --saltar-build → reutiliza web/out sólo en el bucle local
//
// Playwright y axe-core se descubren en la ruta persistente compartida con el
// panel privado. /tmp/pwshot queda solo como compatibilidad: macOS puede podarlo
// dejando directorios a medias. PW_HOME sigue siendo la prioridad explícita.

import { execSync } from 'node:child_process'
import { createServer } from 'node:http'
import { createRequire } from 'node:module'
import { readFileSync, existsSync, statSync } from 'node:fs'
import { join, extname, resolve } from 'node:path'

import { comprobarContrato } from './check-contrato.mjs'
import { comprobarCopy } from './check-copy.mjs'
import { comprobarHardcode } from './check-hardcode.mjs'
import { resolverPlaywrightHome } from './playwright-home.mjs'
import { auditPublicSafety, formatFinding } from './public-safety.mjs'

const RAIZ = resolve(process.cwd())
const BASE = '/madclon-front-office'
const PUERTO = Number(process.env.GATE_PORT || 4173)
const PAGINAS = ['', 'retos', 'flota', 'salud', 'tokens', 'eficiencia', 'actividad', 'historia', 'preguntas']
const rapido = process.argv.includes('--rapido')
const ANCHOS_AXE = rapido ? [375, 1440] : [375, 390, 834, 1440]
const ANCHOS_OVERFLOW = [320, 375, 390, 834, 1440]
const IDIOMAS = rapido ? ['es'] : ['es', 'en']
const CONTRASTES = rapido ? [false] : [false, true]

const TITULOS_DOCUMENTO = {
  es: 'MAD Clon — el Clon de Miguel Ángel Domínguez',
  en: "MAD Clon — Miguel Ángel Domínguez's Clone"
}

const TITULOS_PORTADA = {
  es: 'La sala de control del Clon de MAD',
  en: 'The MAD Clone control room'
}

// El titular del informativo del 404 (views/NotFound.tsx): es el h1 de la página.
const TITULOS_404 = {
  es: 'La página que buscabas no existe, y el enlace lo sabía',
  en: "The page you were looking for doesn't exist, and the link knew it"
}

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

const resumirViolacionAxe = v => {
  const nodo = v.nodes?.[0]

  if (!nodo) return ''

  const objetivo = JSON.stringify(nodo.target?.[0] ?? nodo.target ?? 'nodo sin selector')
  const causa = String(nodo.failureSummary || '').replace(/\s+/g, ' ').trim().slice(0, 280)

  return ` · ${objetivo}${causa ? ` · ${causa}` : ''}`
}

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

// ── 0-4 · comprobaciones estáticas ──────────────────────────────────────────────
function estaticas() {
  log('\n▸ Estáticas')

  // 0 · privacidad y superficie pública: proyección saneada, sin API/mutaciones
  //     y service worker con caché de datos segura (GET, mismo origen, caducidad).
  const seguridad = auditPublicSafety({ webRoot: RAIZ, mode: 'source' })

  marca(
    0,
    'public safety (proyección saneada + sólo GET same-origin + caché segura)',
    seguridad.length === 0,
    seguridad.length === 0
      ? '0 hallazgos'
      : `${seguridad.length} hallazgos · ${seguridad.slice(0, 3).map(formatFinding).join(' | ')}`
  )

  // 1 · build
  if (process.argv.includes('--saltar-build')) {
    const existe = existsSync(join(RAIZ, 'out/index.html'))
    const seguridadOut = existe ? auditPublicSafety({ webRoot: RAIZ, mode: 'out' }) : []

    marca(
      1,
      'build',
      rapido && existe && seguridadOut.length === 0,
      !rapido
        ? '--saltar-build no es válido en el gate completo'
        : existe && seguridadOut.length === 0
          ? 'reutiliza web/out con integridad verificada (sólo bugfix local)'
          : `${seguridadOut.length} hallazgos en web/out`
    )
  } else {
    try {
      const out = execSync('npm run build', {
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
    sh('./node_modules/.bin/tsc --noEmit')
    detalle.push('tsc limpio')
  } catch {
    ok2 = false
    detalle.push('tsc CON ERRORES')
  }

  const base = JSON.parse(readFileSync(join(RAIZ, 'scripts/lint-baseline.json'), 'utf8'))

  for (const [clave, cmd] of [
    ['eslint', './node_modules/.bin/eslint src/app src/components src/lib --ext .ts,.tsx'],
    ['stylelint', './node_modules/.bin/stylelint "src/**/*.{css,tsx}"']
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

  // 4b · contrato datos↔web: la historia llega por JSON y la flota no crece sin
  // marca. Los avisos de frescura narrativa se ven pero NO tumban el gate: un
  // capítulo con retraso jamás puede bloquear la publicación de datos frescos.
  const k = comprobarContrato(RAIZ)

  marca('4b', 'check-contrato (historia + flota)', k.fallos.length === 0,
    [k.notas.join(' · '), ...k.fallos.map(f => `${f.regla}: ${f.evidencia}`), ...k.avisos.map(a => `AVISO ${a}`)]
      .filter(Boolean).join(' · '))
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

  return new Promise(ok => srv.listen(PUERTO, '127.0.0.1', () => ok(srv)))
}

// ── 5-13 · comprobaciones en navegador ──────────────────────────────────────────
async function navegador() {
  let PW_HOME

  try {
    sh('node --test scripts/playwright-home.test.mjs')
    ;({ directorio: PW_HOME } = resolverPlaywrightHome())
  } catch (e) {
    marca(5, 'axe / navegador', false, String(e.message || e).slice(0, 500))

    return
  }

  const req = createRequire(join(PW_HOME, 'noop.js'))
  let chromium, axeSrc

  try {
    ;({ chromium } = req('playwright'))
    axeSrc = readFileSync(join(PW_HOME, 'node_modules/axe-core/axe.min.js'), 'utf8')
  } catch {
    marca(5, 'axe / navegador', false, `no hay playwright+axe en ${PW_HOME} (PW_HOME=… para cambiarlo)`)

    return
  }

  const srv = await servir()
  const url = p => `http://127.0.0.1:${PUERTO}${BASE}/${p}`
  const navegadorPw = await chromium.launch()
  const violaciones = []
  const erroresJs = []
  const respuestasMalas = []
  const metodosMutadores = []
  const origenesExternos = []
  const overflow = []
  const tactiles = []
  const problemasIdioma = []
  const origenLocal = new URL(url('')).origin

  const vigilarSuperficie = (ctx, etiqueta) => {
    ctx.on('request', request => {
      const metodo = request.method().toUpperCase()

      if (!['GET', 'HEAD'].includes(metodo)) metodosMutadores.push(`${etiqueta}: ${metodo}`)

      try {
        const destino = new URL(request.url())

        if (['http:', 'https:'].includes(destino.protocol) && destino.origin !== origenLocal) {
          origenesExternos.push(`${etiqueta}: origen externo`)
        }
      } catch {
        origenesExternos.push(`${etiqueta}: URL no verificable`)
      }
    })
  }

  log('\n▸ Navegador')

  for (const lang of IDIOMAS) {
    for (const contraste of CONTRASTES) {
      const ctx = await navegadorPw.newContext({ viewport: { width: 1440, height: 900 } })

      vigilarSuperficie(ctx, `${lang}${contraste ? '/AC' : ''}`)

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

        const documento = await pg.evaluate(() => ({
          lang: document.documentElement.lang,
          title: document.title,
          h1: [...document.querySelectorAll('h1')].map(item => item.textContent?.trim())
        }))

        if (documento.lang !== lang || documento.title !== TITULOS_DOCUMENTO[lang]) {
          problemasIdioma.push(
            `${p || 'portada'} ${lang}${contraste ? '/AC' : ''}: lang=${documento.lang} title=${JSON.stringify(documento.title)}`
          )
        }

        if (!p && (documento.h1.length !== 1 || documento.h1[0] !== TITULOS_PORTADA[lang])) {
          problemasIdioma.push(
            `portada ${lang}${contraste ? '/AC' : ''}: h1=${JSON.stringify(documento.h1)}`
          )
        }

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

            r.violations.forEach(v =>
              violaciones.push(
                `${p || 'portada'} @${w} ${lang}${contraste ? '/AC' : ''}: ${v.id} (${v.impact || 'sin impacto'}) (${v.nodes.length})${resumirViolacionAxe(v)}`
              )
            )
          }

          // 8 · objetivos táctiles, solo en móvil
          if (w === 375 && !contraste && lang === 'es') {
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

      // La capa 2 ABIERTA también se audita. Auditarla solo cerrada dejó pasar a
      // producción tres botones a 3.01:1 en la entrega 3: lo que no se abre, no se mide.
      for (const w of ANCHOS_AXE) {
        await pg.goto(url('flota'), { waitUntil: 'domcontentloaded' })
        await pg.waitForTimeout(1500)
        await pg.setViewportSize({ width: w, height: 900 })
        const abridor = pg.locator('[data-anatomia-abrir]').first()

        if ((await abridor.count()) === 0) continue
        await abridor.click()
        await pg.waitForTimeout(700)
        await pg.evaluate(axeSrc)

        const r = await pg.evaluate(async () =>
          axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa'] } })
        )

        r.violations.forEach(v =>
          violaciones.push(
            `capa2 @${w} ${lang}${contraste ? '/AC' : ''}: ${v.id} (${v.impact || 'sin impacto'}) (${v.nodes.length})${resumirViolacionAxe(v)}`
          )
        )
        await pg.keyboard.press('Escape')
      }

      await ctx.close()
    }
  }

  // El 404 es parte de la superficie pública: conserva idioma, título, un único
  // h1, navegación de vuelta, accesibilidad y anchura en los tres formatos.
  for (const lang of IDIOMAS) {
    for (const contraste of CONTRASTES) {
      for (const w of ANCHOS_AXE) {
        const variante = `${lang}${contraste ? '/AC' : ''}`
        const etiqueta404 = `404/${variante}/${w}`
        const ctx404 = await navegadorPw.newContext({ viewport: { width: w, height: 900 } })

        vigilarSuperficie(ctx404, etiqueta404)
        await ctx404.addInitScript(
          ([l, c]) => {
            localStorage.setItem('madclon-lang', l)
            localStorage.setItem('madclon-contraste', c)
          },
          [lang, contraste ? '1' : '0']
        )
        const pg404 = await ctx404.newPage()
        const destino404 = url('__gate-404__')

        pg404.on('pageerror', e => erroresJs.push(`${etiqueta404} ${e.message}`))
        pg404.on('console', m => {
          if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) {
            erroresJs.push(`${etiqueta404} consola: ${m.text().slice(0, 120)}`)
          }
        })
        pg404.on('response', r => {
          if (r.status() >= 400 && r.url() !== destino404) respuestasMalas.push(`${r.status()} ${r.url()}`)
        })
        pg404.on('requestfailed', r => {
          const err = r.failure()?.errorText || ''

          if (!/ERR_ABORTED/.test(err)) respuestasMalas.push(`${err} ${r.url().slice(0, 90)}`)
        })

        const respuesta404 = await pg404.goto(destino404, { waitUntil: 'domcontentloaded' })

        await pg404.waitForTimeout(500)

        const estado404 = await pg404.evaluate(() => ({
          lang: document.documentElement.lang,
          title: document.title,
          h1: [...document.querySelectorAll('h1')].map(item => item.textContent?.trim()),
          overflow: document.documentElement.scrollWidth - window.innerWidth
        }))

        if (
          respuesta404?.status() !== 404 ||
          estado404.lang !== lang ||
          estado404.title !== TITULOS_DOCUMENTO[lang] ||
          estado404.h1.length !== 1 ||
          estado404.h1[0] !== TITULOS_404[lang]
        ) {
          problemasIdioma.push(
            `${etiqueta404}: status=${respuesta404?.status()} lang=${estado404.lang} title=${JSON.stringify(estado404.title)} h1=${JSON.stringify(estado404.h1)}`
          )
        }

        if (estado404.overflow > 1) overflow.push(`404 @${w} +${estado404.overflow}px (${variante})`)

        const volver = await pg404.getByRole('link').getAttribute('href')

        if (volver !== `${BASE}/`) problemasIdioma.push(`${etiqueta404}: volver=${JSON.stringify(volver)}`)

        await pg404.evaluate(axeSrc)

        const a11y404 = await pg404.evaluate(async () =>
          axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa'] } })
        )

        a11y404.violations.forEach(v =>
          violaciones.push(
            `404 @${w} ${variante}: ${v.id} (${v.impact || 'sin impacto'}) (${v.nodes.length})${resumirViolacionAxe(v)}`
          )
        )
        await ctx404.close()
      }
    }
  }

  const matriz = `${PAGINAS.length} páginas + capa 2 + 404 × ${ANCHOS_AXE.join('/')} × ${IDIOMAS.join('/')} × ${CONTRASTES.length === 2 ? 'normal+AC' : 'normal'}`

  marca(
    5,
    `axe + idioma semántico (${matriz})`,
    violaciones.length === 0 && problemasIdioma.length === 0,
    [...violaciones, ...problemasIdioma].slice(0, 6).join(' | ') || '0 violaciones · lang/title/h1 404 correctos'
  )
  marca(
    6,
    'consola + red GET/HEAD same-origin en el mismo barrido',
    erroresJs.length === 0 && respuestasMalas.length === 0 && metodosMutadores.length === 0 && origenesExternos.length === 0,
    `${erroresJs.length} errores JS · ${respuestasMalas.length} respuestas ≥400 · ${metodosMutadores.length} mutaciones · ${origenesExternos.length} orígenes externos ${[...erroresJs, ...respuestasMalas].slice(0, 3).join(' | ')}`
  )
  marca(7, `overflow horizontal (${ANCHOS_OVERFLOW.join('/')})`, overflow.length === 0, overflow.slice(0, 5).join(' | ') || 'ninguna página desborda')
  marca(8, 'objetivos táctiles ≥ 44 px @375', tactiles.length === 0, tactiles.slice(0, 6).join(' | ') || `0 por debajo de 44 px`)

  // 9 · teclado: Flota → capa 2 → volver
  const ctxK = await navegadorPw.newContext({ viewport: { width: 1440, height: 900 } })

  await ctxK.addInitScript(() => localStorage.setItem('madclon-lang', 'es'))
  const k = await ctxK.newPage()

  await k.goto(url('flota'), { waitUntil: 'domcontentloaded' })
  await k.waitForTimeout(1600)

  const pasosTeclado = []
  const abridor = k.locator('[data-anatomia-abrir], button:has-text("ver qué hay debajo")').first()
  const hayAbridor = (await abridor.count()) > 0
  const retenidoK = (await k.getByRole('status').count()) > 0

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
  } else if (retenidoK) {
    await k.evaluate(() => document.body.focus())
    let llegaControl = false

    for (let i = 0; i < 80 && !llegaControl; i++) {
      await k.keyboard.press('Tab')
      llegaControl = await k.evaluate(() => ['A', 'BUTTON'].includes(document.activeElement?.tagName || ''))
    }

    const focoVisible =
      llegaControl &&
      (await k.evaluate(() => {
        const el = document.activeElement
        const s = getComputedStyle(el)

        return el.matches(':focus-visible') && (s.outlineStyle !== 'none' || s.boxShadow !== 'none')
      }))

    const sinDialogo = await k.evaluate(() => !document.querySelector('[role="dialog"], [data-capa="2"]'))

    marca(
      9,
      'teclado en estado público retenido',
      llegaControl && focoVisible && sinDialogo,
      `Tab llega a control ${llegaControl ? 'sí' : 'NO'} · foco visible ${focoVisible ? 'sí' : 'NO'} · sin diálogo ${sinDialogo ? 'sí' : 'NO'}`
    )
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

  if (hayAbridor) {
    marca(10, 'capas: migas + distintivo sticky + «atrás» cierra', capa.migas && capa.distintivo && capa.atras,
      `migas ${capa.migas ? 'sí' : 'NO'} · distintivo sticky ${capa.distintivo ? 'sí' : 'NO'} · atrás cierra ${capa.atras ? 'sí' : 'NO'}`)
  } else if (retenidoK) {
    await k.goto(url('tokens'), { waitUntil: 'domcontentloaded' })
    await k.goBack()
    await k.waitForTimeout(700)
    const atrasRetenido = new URL(k.url()).pathname.endsWith('/flota')
    const estadoRetenido = (await k.getByRole('status').count()) > 0
    const sinCapa = await k.evaluate(() => !document.querySelector('[role="dialog"], [data-capa="2"], [data-anatomia-abrir]'))

    marca(
      10,
      'estado retenido sin capa privada + «atrás»',
      atrasRetenido && estadoRetenido && sinCapa,
      `atrás ${atrasRetenido ? 'sí' : 'NO'} · retenido ${estadoRetenido ? 'sí' : 'NO'} · capa privada ausente ${sinCapa ? 'sí' : 'NO'}`
    )
  } else {
    marca(10, 'capas: migas + distintivo sticky + «atrás» cierra', false, 'sin capa interactiva ni estado retenido válido')
  }

  // 11 · frescura del dato: si el manifest tiene > 48 h, la web lo tiene que confesar
  const manifest = JSON.parse(readFileSync(join(RAIZ, 'public/data/manifest.json'), 'utf8'))
  const esRetenido = manifest.schema === 'madclon.public-containment.v1'
  const sello = new Date(manifest.generated_at || manifest.generado || manifest.generado_utc || manifest.fecha)
  const horas = (Date.now() - sello.getTime()) / 36e5

  await k.goto(url(''), { waitUntil: 'domcontentloaded' })
  await k.waitForTimeout(1600)

  const confiesa = await k.evaluate(
    retenido => !!document.querySelector(retenido ? '[role="status"]' : '[data-frescura-rancia]'),
    esRetenido
  )

  // Y el ensayo: se sirve un manifest de hace 3 días para comprobar que la confesión
  // aparece de verdad. Si solo se mirase el dato real, esta rama no se probaría nunca.
  // Contexto aparte con el service worker BLOQUEADO: si no, el SW sirve el manifest
  // de su propia caché y la interceptación no llega a la página.
  const fechaVieja = new Date(Date.now() - 72 * 36e5).toISOString()
  const viejo = esRetenido ? { ...manifest, generated_at: fechaVieja } : { ...manifest, generado: fechaVieja }
  const ctxViejo = await navegadorPw.newContext({ viewport: { width: 1440, height: 900 }, serviceWorkers: 'block' })

  await ctxViejo.addInitScript(() => localStorage.setItem('madclon-lang', 'es'))
  await ctxViejo.route(`**${BASE}/data/manifest.json`, r =>
    r.fulfill({ contentType: 'application/json', body: `${JSON.stringify(viejo)}\n` })
  )
  const pv = await ctxViejo.newPage()

  await pv.goto(url(''), { waitUntil: 'domcontentloaded' })
  await pv.waitForTimeout(2200)

  const confiesaEnsayo = await pv.evaluate(
    retenido => !!document.querySelector(retenido ? '[role="status"]' : '[data-frescura-rancia]'),
    esRetenido
  )

  await ctxViejo.close()

  marca(
    11,
    esRetenido ? 'fecha y estado de instantánea retenida' : 'frescura de datos (y el ensayo del dato rancio)',
    Number.isFinite(horas) && horas >= -5 / 60 && (esRetenido ? confiesa : horas <= 48 || confiesa) && confiesaEnsayo,
    esRetenido
      ? `sello válido · retenido visible ${confiesa ? 'sí' : 'NO'} · ensayo a 72 h retenido ${confiesaEnsayo ? 'sí' : 'NO'}`
      : `manifest de hace ${horas.toFixed(1)} h · ${horas > 48 ? (confiesa ? 'la web lo confiesa' : 'LA WEB NO LO CONFIESA') : 'fresco (no procede confesar)'} · ensayo a 72 h: ${confiesaEnsayo ? 'confiesa' : 'NO CONFIESA'}`
  )

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

      const abs = h.startsWith('http') ? h : `http://127.0.0.1:${PUERTO}${h.startsWith(BASE) ? h : BASE + h}`
      const r = await k.request.get(abs)

      if (!r.ok()) rotos.push(`${r.status()} ${h}`)
    }
  }

  const sm = await k.request.get(`http://127.0.0.1:${PUERTO}${BASE}/sitemap.xml`)

  if (!sm.ok()) rotos.push(`sitemap.xml ${sm.status()}`)
  marca(12, 'enlaces internos + og:image + sitemap', rotos.length === 0, rotos.slice(0, 5).join(' | ') || `${vistos.size} destinos, todos 200`)

  // 13 · movimiento reducido: la preferencia del sistema llega a la app y no
  // queda movimiento, vídeo, error de consola ni tráfico distinto de GET/HEAD
  // al mismo origen en ninguna de las ocho páginas.
  const ctxReducido = await navegadorPw.newContext({
    viewport: { width: 375, height: 900 },
    reducedMotion: 'reduce'
  })

  const problemasReducido = []

  ctxReducido.on('request', request => {
    const metodo = request.method().toUpperCase()

    if (!['GET', 'HEAD'].includes(metodo)) problemasReducido.push(`petición ${metodo}`)

    try {
      const destino = new URL(request.url())

      if (['http:', 'https:'].includes(destino.protocol) && destino.origin !== origenLocal) {
        problemasReducido.push('petición a origen externo')
      }
    } catch {
      problemasReducido.push('URL no verificable')
    }
  })
  await ctxReducido.addInitScript(() => localStorage.setItem('madclon-lang', 'es'))
  const pr = await ctxReducido.newPage()

  pr.on('pageerror', error => problemasReducido.push(`error JS: ${error.message}`))
  pr.on('console', mensaje => {
    if (mensaje.type() === 'error' && !/Failed to load resource/.test(mensaje.text())) {
      problemasReducido.push(`consola: ${mensaje.text().slice(0, 80)}`)
    }
  })
  pr.on('response', respuesta => {
    if (respuesta.status() >= 400) problemasReducido.push(`respuesta ${respuesta.status()}`)
  })
  pr.on('requestfailed', request => {
    const error = request.failure()?.errorText || ''

    if (!/ERR_ABORTED/.test(error)) problemasReducido.push(`red: ${error || 'fallo'}`)
  })

  for (const p of PAGINAS) {
    await pr.goto(url(p), { waitUntil: 'domcontentloaded' })
    await pr.waitForTimeout(1600)

    const estado = await pr.evaluate(() => ({
      preferencia: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
      animaciones: document.getAnimations()
        .filter(animacion => animacion.playState === 'running')
        .map(animacion => {
          const elemento = animacion.effect instanceof KeyframeEffect ? animacion.effect.target : null

          return elemento instanceof Element ? elemento.tagName.toLowerCase() : 'animación'
        })
        .slice(0, 8),
      videosActivos: [...document.querySelectorAll('video')].filter(video => !video.paused).length
    }))

    if (!estado.preferencia) problemasReducido.push(`${p || 'portada'}: preferencia no aplicada`)
    if (estado.animaciones.length) problemasReducido.push(`${p || 'portada'}: ${estado.animaciones.join(', ')}`)
    if (estado.videosActivos) problemasReducido.push(`${p || 'portada'}: ${estado.videosActivos} vídeo(s) activo(s)`)
  }

  marca(
    13,
    'prefers-reduced-motion + consola/red @375',
    problemasReducido.length === 0,
    problemasReducido.slice(0, 6).join(' | ') || 'preferencia aplicada · 0 movimiento · 0 vídeos · 0 errores/red externa'
  )
  await ctxReducido.close()

  // 14 · estados de fuente pública: degradación elegante (decisión de MAD del
  // 2026-08-03: mejor datos incompletos confesados que una página de error).
  // - Si el árbol lleva la instantánea retenida canónica, se sigue exigiendo el
  //   estado protegido en ES/EN con su html lang.
  // - Con proyección legada: un documento incompleto, corrupto o fallido deja su
  //   sección «en revisión» (role=status) SIN tumbar el resto del panel; un campo
  //   extra es tolerado (la frontera es el escáner de contenido sensible del
  //   build, no el runtime); y nunca hay eco de canarios, detalles internos ni
  //   errores no controlados.
  const problemasFuente = []
  const manifestArbol = JSON.parse(readFileSync(join(RAIZ, 'public/data/manifest.json'), 'utf8'))
  const arbolRetenido = manifestArbol.schema === 'madclon.public-containment.v1'

  if (arbolRetenido) {
    const ctxRetenido = await navegadorPw.newContext({
      viewport: { width: 375, height: 900 },
      serviceWorkers: 'block'
    })

    await ctxRetenido.addInitScript(() => localStorage.setItem('madclon-lang', 'es'))
    const paginaRetenida = await ctxRetenido.newPage()

    await paginaRetenida.goto(url(''), { waitUntil: 'domcontentloaded' })
    const avisoEs = paginaRetenida.getByRole('status').filter({ hasText: 'Instantánea pública protegida' })

    try {
      await avisoEs.waitFor({ timeout: 5000 })

      if ((await paginaRetenida.locator('html').getAttribute('lang')) !== 'es') {
        problemasFuente.push('html lang ES incorrecto')
      }
    } catch {
      problemasFuente.push('instantánea retenida ES no llega a estado seguro')
    }

    await ctxRetenido.close()

    const ctxRetenidoEn = await navegadorPw.newContext({
      viewport: { width: 375, height: 900 },
      serviceWorkers: 'block'
    })

    await ctxRetenidoEn.addInitScript(() => localStorage.setItem('madclon-lang', 'en'))
    const paginaRetenidaEn = await ctxRetenidoEn.newPage()

    await paginaRetenidaEn.goto(url(''), { waitUntil: 'domcontentloaded' })

    try {
      const avisoEn = paginaRetenidaEn.getByRole('status').filter({ hasText: 'Public snapshot protected' })

      await avisoEn.waitFor({ timeout: 5000 })

      if ((await paginaRetenidaEn.locator('html').getAttribute('lang')) !== 'en') {
        problemasFuente.push('html lang EN incorrecto')
      }
    } catch {
      problemasFuente.push('instantánea retenida EN no llega a estado seguro')
    }

    await ctxRetenidoEn.close()
  }

  // derriba: el caso deja su documento fuera de juego → la portada (que lo
  // necesita) confiesa «en revisión». campo-extra: el documento sigue siendo
  // válido (tolerancia deliberada) y la página se pinta con normalidad.
  const casosFuente = [
    {
      nombre: 'incompleto',
      fichero: 'manifest',
      derriba: true,
      responder: route => route.fulfill({ contentType: 'application/json', body: '{"generado":true}' })
    },
    {
      nombre: 'campo-extra',
      fichero: 'overview',
      derriba: false,
      responder: route => route.fulfill({
        contentType: 'application/json',
        body: '{"gtd":{},"personas":{},"automejora":{},"crons":[],"campo_nuevo":"PRIVATE_CANARY_NO_ECO"}'
      })
    },
    {
      nombre: 'corrupto',
      fichero: 'manifest',
      derriba: true,
      responder: route => route.fulfill({ contentType: 'application/json', body: '{"PRIVATE_CANARY_NO_ECO":' })
    },
    {
      // JSON.parse colapsa la clave duplicada quedándose con la ÚLTIMA:
      // para que el caso derribe, la versión final tiene que ser inválida.
      nombre: 'clave-duplicada',
      fichero: 'manifest',
      derriba: true,
      responder: route => route.fulfill({
        contentType: 'application/json',
        body: '{"generado":"2026-08-02T22:00:00Z","version":1,"version":"PRIVATE_CANARY_NO_ECO"}\n'
      })
    },
    {
      nombre: 'sin-permiso-403',
      fichero: 'manifest',
      derriba: true,
      responder: route => route.fulfill({ status: 403, contentType: 'text/plain', body: 'PRIVATE_CANARY_NO_ECO' })
    },
    {
      nombre: 'fuente-503',
      fichero: 'manifest',
      derriba: true,
      responder: route => route.fulfill({ status: 503, contentType: 'text/plain', body: 'PRIVATE_CANARY_NO_ECO' })
    },
    {
      nombre: 'fuente-colgada',
      fichero: 'manifest',
      derriba: true,
      responder: () => new Promise(() => {})
    }
  ]

  for (const caso of casosFuente) {
    const ctxCaso = await navegadorPw.newContext({
      viewport: { width: 375, height: 900 },
      serviceWorkers: 'block'
    })

    const erroresCaso = []

    await ctxCaso.addInitScript(() => localStorage.setItem('madclon-lang', 'es'))
    await ctxCaso.route(`**${BASE}/data/${caso.fichero}.json`, caso.responder)
    const paginaCaso = await ctxCaso.newPage()

    paginaCaso.on('pageerror', error => erroresCaso.push(error.message))
    paginaCaso.on('console', mensaje => {
      if (mensaje.type() === 'error' && !/Failed to load resource/.test(mensaje.text())) {
        erroresCaso.push(mensaje.text())
      }
    })
    await paginaCaso.goto(url(''), { waitUntil: 'domcontentloaded' })

    try {
      if (caso.derriba) {
        // La sección afectada confiesa «en revisión»; el fallo NUNCA es total
        // ni usa la vieja alarma de fallo cerrado («no están disponibles»).
        // Ojo: DatoRancio usa MUI Alert (role='alert') de forma legítima,
        // así que la alarma se detecta por su texto, no por el rol.
        const confesion = paginaCaso.getByRole('status').filter({ hasText: /revisión|review/i })

        await confesion.waitFor({ timeout: 15000 })

        const textoAlarma = (await paginaCaso.locator('body').textContent()) || ''

        if (/no están disponibles|is unavailable/i.test(textoAlarma)) {
          problemasFuente.push(`${caso.nombre}: usa alarma de fallo cerrado`)
        }
      } else {
        // Tolerancia a campos extra: la página se pinta y no hay sección en
        // revisión. El Latido lleva role='status' siempre: hay que filtrar
        // por el texto de la confesión, no contar roles a secas.
        await paginaCaso.waitForTimeout(4000)

        const estados = paginaCaso.getByRole('status').filter({ hasText: /revisión|review/i })

        if ((await estados.count()) > 0) {
          problemasFuente.push(`${caso.nombre}: un campo extra no debía derribar la sección`)
        }
      }

      const texto = (await paginaCaso.locator('body').textContent()) || ''

      if (/PRIVATE_CANARY_NO_ECO|fuente-no-disponible|\.json|exporter/i.test(texto)) {
        problemasFuente.push(`${caso.nombre}: eco o detalle interno`)
      }

      if (erroresCaso.length) problemasFuente.push(`${caso.nombre}: error no controlado`)
    } catch {
      problemasFuente.push(`${caso.nombre}: no degrada elegante`)
    }

    await ctxCaso.close()
  }

  marca(
    14,
    arbolRetenido
      ? 'retenido ES/EN + degradación elegante sin eco'
      : 'degradación elegante: sección en revisión, nunca fallo total',
    problemasFuente.length === 0,
    problemasFuente.slice(0, 6).join(' | ') ||
      `${arbolRetenido ? 'ES/EN+lang · ' : ''}${casosFuente.length} casos · 0 eco · 0 fallo cerrado · 0 error no controlado`
  )

  await ctxK.close()
  await navegadorPw.close()
  srv.close()
}

// ── main ────────────────────────────────────────────────────────────────────────
log(`GATE · front office${rapido ? ' (modo rápido: matriz reducida)' : ''}`)
if (!process.argv.includes('--solo-navegador')) estaticas()
if (!process.argv.includes('--sin-navegador')) await navegador()

const fallos = resultados.filter(r => r.estado === 'FALLO')
const deudas = resultados.filter(r => r.estado === 'DEUDA')

log(`\nRESULTADO · ${resultados.filter(r => r.estado === 'OK').length} OK · ${deudas.length} DEUDA · ${fallos.length} FALLO`)
if (rapido) log('⚠ modo rápido: NO sirve para publicar, solo para el bucle de bugfixing.')
deudas.forEach(d => log(`  DEUDA ${d.n} · ${DEUDAS[d.n]}`))
process.exit(fallos.length === 0 ? 0 : 1)
