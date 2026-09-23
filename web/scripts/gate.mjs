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
// El barrido de accesibilidad recorre los DOS modos de color pidiendo cada uno
// por su cookie, no el que toque venir de fábrica: ver MODOS_AXE.
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
import { esperarDomAsentado, esperarQuietudDeMovimiento } from './esperas.mjs'
import { modosAxe } from './modos-color.mjs'
import { resolverPlaywrightHome } from './playwright-home.mjs'
import { auditPublicSafety, formatFinding } from './public-safety.mjs'

const RAIZ = resolve(process.cwd())
const BASE = '/madclon-front-office'
const PUERTO = Number(process.env.GATE_PORT || 4173)
const PAGINAS = ['', 'retos', 'flota', 'hardware', 'salud', 'tokens', 'eficiencia', 'actividad', 'historia', 'preguntas']
const rapido = process.argv.includes('--rapido')
const ANCHOS_AXE = rapido ? [375, 1440] : [375, 390, 834, 1440]
const ANCHOS_OVERFLOW = [320, 375, 390, 834, 1440]
const IDIOMAS = rapido ? ['es'] : ['es', 'en']
const CONTRASTES = rapido ? [false] : [false, true]

// ── LOS DOS MODOS DE COLOR, Y POR QUÉ EL OSCURO VA CON CORTE ────────────────────
// La web es estática: el modo lo resuelve el cliente leyendo la cookie de ajustes
// (`madclon-front-office` = {"mode":"light"|"dark"}), así que un barrido que no
// pone cookie mide SIEMPRE el modo de fábrica y ninguno más.
//
// Eso costó caro. Hasta el 15/09/2026 el de fábrica era el oscuro y el claro no
// lo medía nadie: el día que MAD puso el claro de arranque, este gate destapó de
// golpe siete focos de contraste que llevaban meses escondidos —avisos a 1,66:1,
// chips a 3,35, pies de tarjeta a 2,31 y el modo de ALTO CONTRASTE a 1,1:1, o
// sea inservible justo para quien lo necesita—. Están corregidos. Pedir los DOS
// modos explícitamente es lo que impide que la ceguera se dé la vuelta: ahora
// sería el oscuro el que nadie mira, y cambiar otra vez el default no movería
// esto ni un milímetro.
//
// POR QUÉ EL OSCURO NO REPITE LA MATRIZ ENTERA. Duplicarla son 160 pasadas de axe
// más, y el gate se corre a mano antes de cada publicación: lo que se alarga se
// deja de correr. El corte no es a ojo, está medido (19/09/2026, inventario de
// tinta sobre `web/out` con las 10 páginas: cada par color-texto→fondo que axe
// llega a evaluar, en las 8 combinaciones, 2.983 muestras en cada una):
//
//   · los dos modos pintan EXACTAMENTE los mismos elementos —494 elementos, 771
//     pares elemento×color, idénticos en claro y en oscuro—; lo único que cambia
//     es la TINTA: 17 de los 18 pares de color del oscuro no existen en claro.
//     Por eso el modo hay que barrerlo, y por eso basta con VER cada elemento
//     una vez.
//   · anchos: {375, 1440} ve 771/771 (100 %). 390 y 834 no aportan ni un
//     elemento exclusivo (0 cada uno); 1440 aporta 140 que el móvil no enseña y
//     375 aporta 9 que el escritorio no enseña. Los extremos bastan, el medio no.
//   · idioma: el inglés no aporta NI UN par de color nuevo (18/18 con solo ES).
//     Lo único que cambia de sitio es un chip verde que en EN sale también en
//     /retos; ese mismo par ya se mide en /eficiencia y /historia.
//   · alto contraste: SÍ aporta tinta propia en oscuro (el aviso de /retos pasa
//     de #b2bad2 a #d7daf0). No se recorta: es la superficie que peor lo pasó el
//     15/09.
//
// ⚠ Medir esto exige máquina quieta. Con otro gate corriendo a la vez, la página
// se audita a medio pintar y cada combinación mide una cosa distinta: los
// recuentos se fueron de 180 a 494 elementos y el análisis «demostraba» que el
// inglés aportaba tinta propia en las diez páginas. La medición buena se
// reconoce en que las 8 combinaciones dan el MISMO número de muestras.
//
// Resultado: el oscuro mide 10 páginas × 2 anchos × ES × normal+AC —48 pasadas
// de axe contando capa 2 y 404, en vez de las 192 de una duplicación literal— y
// aun así mira el 100 % de su tinta. El claro, que es el de fábrica, no pierde
// nada: sigue con la matriz entera.
//
// Lo que cuesta, cronometrado el 19/09/2026 sobre el mismo `web/out` y con la
// sección de navegador aislada (`--solo-navegador`), dos pasadas seguidas y con
// las 9 páginas de entonces: 176 pasadas de axe en 233 s contra 220 pasadas en
// 323 s, o sea +90 s (+39 %). Duplicar la matriz entera habrían sido ~466 s: el
// corte se ahorra unos dos minutos y medio por gate sin dejar de mirar ni un par
// de color del oscuro.
//
// Y LA PREMISA NO SE FÍA DE AQUELLA MEDICIÓN: se comprueba en cada pasada. Más
// abajo, cada casilla que recorren los dos modos tiene que haber evaluado el
// MISMO número de nodos de texto; si no, o hay una pieza que sólo existe en un
// modo —y entonces el corte está ciego— o alguien midió una página a medio
// pintar. Cualquiera de las dos tumba el check. Probado escondiendo UN solo
// elemento en oscuro (opacidad 0 justo antes de axe): FALLO nombrando las
// casillas y los números (35 nodos contra 34), que es exactamente el caso que
// contar pasadas jamás habría cazado —0 violaciones y las 48 pasadas intactas—.
// Para que esa comparación sea de fiar, el barrido espera a que el DOM deje de
// crecer (`esperarDomAsentado`) antes de medir: son ~80 s más de gate, y son el
// precio de que el número signifique algo. Medido con el Mac cargado a propósito
// da los MISMOS 12.866 nodos en claro y 3.336 en oscuro que con el Mac quieto,
// así que el guardián es determinista y no un generador de rojos falsos.
// Gate entero: 21 OK · 0 FALLO, 7 min 30 s en reposo y 7 min 32 s bajo carga.
//
// Lo que NO se recorta, por si alguien tiene la tentación: la capa 2 de /flota y
// el 404 tienen tinta que no sale en ninguna otra página, así que se abren y se
// visitan también en oscuro. Lo que no se abre, no se mide.
//
// Si mañana el corte deja de valer (una pieza que solo se pinte a 834, o un
// componente que solo exista en inglés), se arregla subiendo ese ancho o ese
// idioma en `scripts/modos-color.mjs`. La premisa se vuelve a medir con el
// inventario de tinta, no se supone.
const MODOS_AXE = modosAxe({ anchos: ANCHOS_AXE, idiomas: IDIOMAS, contrastes: CONTRASTES, rapido })

const TITULOS_DOCUMENTO = {
  es: 'MAD Clon — el Clon de Miguel Ángel Domínguez',
  en: "MAD Clon — Miguel Ángel Domínguez's Clone"
}

const SECCIONES = {
  retos: { es: 'Retos', en: 'Challenges' },
  flota: { es: 'La flota', en: 'The fleet' },
  hardware: { es: 'Hardware', en: 'Hardware' },
  salud: { es: 'Salud', en: 'Health' },
  tokens: { es: 'Tokens', en: 'Tokens' },
  eficiencia: { es: 'Eficiencia', en: 'Efficiency' },
  actividad: { es: 'Actividad', en: 'Activity' },
  historia: { es: 'Historia', en: 'Story' },
  preguntas: { es: 'Preguntas', en: 'FAQ' }
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

  try {
    // Retos (fase 7 de cero-a-cien): el exportador valida y copia la porción pública, nunca calcula.
    execSync("npm run test:public-safety && python3 -m unittest discover -s ../exporter -p 'test_*publico*.py'", { cwd: RAIZ, stdio: 'pipe' })
    marca('0b', 'contrato y privacidad Hardware y Retos: productor + consumidor', true, 'regresiones numéricas y canarios verdes')
  } catch {
    marca('0b', 'contrato y privacidad Hardware y Retos: productor + consumidor', false, 'falló una regresión de la proyección pública')
  }

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

  // 4c · el color de arranque. Norma de MAD del 15/09/2026: los frontales del
  // clon salen SIEMPRE en claro. Vive aquí porque es la única forma de que una
  // rama vieja no lo devuelva a oscuro sin que nadie se entere: el gate lo mide
  // antes de publicar, y la prueba lee el VALOR exportado, no el comentario.
  try {
    sh('node --test scripts/tema-claro.test.mjs')
    marca('4c', 'tema claro por defecto (norma 15/09/2026)', true, "themeConfig.mode = 'light'")
  } catch (e) {
    const salida = String(e.stdout || e.message || e)
    const motivo = (salida.match(/^\s*(?:Error: )?(.*(?:exige 'light'|oscuro literal).*)$/m) || [, ''])[1]

    marca('4c', 'tema claro por defecto (norma 15/09/2026)', false, (motivo || salida).trim().slice(0, 300))
  }

  // 4d · y el reverso de 4c: que el barrido siga mirando LOS DOS modos. 4c vigila
  // con cuál arranca la web; esto vigila que el otro no se quede sin medir, que
  // es justo la ceguera que el 15/09 costó siete focos de contraste. Vive en
  // `scripts/modos-color.mjs` para que la prueba lea el valor, no el comentario.
  try {
    sh('node --test scripts/modos-color.test.mjs')
    marca('4d', 'el barrido mira los dos modos de color', true, MODOS_AXE.map(m => m.id).join(' + '))
  } catch (e) {
    const salida = String(e.stdout || e.message || e)
    const motivo = (salida.match(/^\s*(?:AssertionError.*|Error: )?(.*(?:debe barrer|se quedó sin|no mide|perdió|misma cookie).*)$/m) || [, ''])[1]

    marca('4d', 'el barrido mira los dos modos de color', false, (motivo || salida).trim().slice(0, 300))
  }
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

// Un modo que no llega a aplicarse no es un fallo de accesibilidad: es el gate
// midiendo otra página. Se distingue con su propio tipo para que el check 5 lo
// cuente como lo que es —«no he podido mirar aquí»— y no se confunda con un
// error de Playwright, que sí debe reventar.
class ErrorModoNoAplicado extends Error {}

/**
 * Espera a que el modo de color TERMINE de aplicarse, ANTES de medir nada.
 *
 * El modo no está en el HTML servido: la web es estática, sale con el modo de
 * fábrica pintado, y es React quien lo cambia tras hidratar leyendo la cookie de
 * ajustes. Medido en `web/out` con la cookie de oscuro puesta:
 *     t = 110 ms  html[data-light]  body=rgb(247,247,249)   ← todavía el de fábrica
 *     t = 370 ms  html[data-dark]   body=rgb(40,42,66)      ← ya el pedido
 * Auditar dentro de esa ventana es medir una página a medio cambiar: axe vería
 * la tinta de un modo sobre el fondo del otro y cantaría contrastes que no
 * existen. Es exactamente lo que tumbó 13 noches el gate del panel privado.
 *
 * No es un reintento a ciegas ni tapa un fallo: espera a que se cumpla la
 * precondición que el propio check asume —que la página esté en el modo que dice
 * auditar— y si no llega, LANZA. Un rojo que dice la verdad vale más que un
 * verde por haber medido otra página.
 */
async function esperarModoAplicado(pg, modo) {
  try {
    await pg.waitForFunction(a => document.documentElement.hasAttribute(a), modo.atributo, { timeout: 15000 })
  } catch {
    const tiene = await pg.evaluate(() => [...document.documentElement.attributes].map(a => a.name).join(' '))

    throw new ErrorModoNoAplicado(`el modo ${modo.id} no llegó a aplicarse en 15 s: <html> sigue sin ${modo.atributo} (tiene: ${tiene})`)
  }

  // Y esperar a que el tema DEJE DE MOVERSE: el atributo no es el final, el color
  // del texto se anima después. Se mira el par tinta/fondo y se exige que no
  // cambie durante 250 ms seguidos.
  try {
    await pg.waitForFunction(
      () => {
        const el = document.querySelector('main') || document.body
        const ahora = `${getComputedStyle(el).color}|${getComputedStyle(document.body).backgroundColor}`

        if (window.__gateTema !== ahora) {
          window.__gateTema = ahora
          window.__gateTemaDesde = performance.now()

          return false
        }

        return performance.now() - window.__gateTemaDesde > 250
      },
      null,
      { timeout: 15000, polling: 100 }
    )
  } catch {
    const visto = await pg.evaluate(() => window.__gateTema ?? 'sin muestra')

    throw new ErrorModoNoAplicado(`el tema del modo ${modo.id} no dejó de cambiar en 15 s (última muestra: ${visto})`)
  }
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

  // Cuántas veces ha corrido axe en cada modo. Un «0 violaciones» que no dice
  // cuántas pasadas ha dado es el verde más barato que existe: si un día la
  // cookie de modo deja de aplicarse y el bucle se salta entero, el gate seguiría
  // en verde sin haber mirado nada. Aquí se cuenta, se imprime, y un modo con
  // cero pasadas TUMBA el check.
  const pasadasAxe = Object.fromEntries(MODOS_AXE.map(m => [m.id, 0]))
  const problemasModo = []

  // Cuánta TINTA ha llegado a mirar cada modo en cada casilla de la matriz.
  // Contar pasadas dice que el bucle corrió; no dice que mirara algo. Un nodo
  // que axe no llega a ver —porque está a opacidad 0, o porque la página aún no
  // lo había pintado— no genera violación y la pasada cuenta igual: el modo
  // tendría sus 48 pasadas habiendo mirado menos tinta de la que cree. Esto es
  // lo que lo caza, y de paso VIGILA LA PREMISA DEL CORTE (ver MODOS_AXE): el
  // oscuro puede medirse con menos anchos y un solo idioma porque los dos modos
  // pintan los MISMOS elementos. Si eso deja de ser verdad, el corte se queda
  // ciego — y aquí se entera el gate, no el que lo vuelva a medir a mano.
  const tintaPorModo = Object.fromEntries(MODOS_AXE.map(m => [m.id, new Map()]))

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
  // P-01: el siguiente gesto debe caber en la primera pantalla, también en EN.
  const problemasBienvenida = []

  for (const lang of ['es', 'en']) {
    for (const [width, height] of [[390, 844], [1440, 900]]) {
      const ctxInicio = await navegadorPw.newContext({ viewport: { width, height } })
      await ctxInicio.addInitScript(l => localStorage.setItem('madclon-lang', l), lang)
      const inicio = await ctxInicio.newPage()

      try {
        await inicio.goto(url(''))
        const explorar = inicio.locator('[data-bienvenida-explorar]')
        await explorar.waitFor({ state: 'visible' })
        const caja = await explorar.boundingBox()

        if (!caja || caja.x < 0 || caja.x + caja.width > width || caja.y < 0 || caja.y + caja.height > height || caja.height < 44) {
          problemasBienvenida.push(`${lang}@${width}: acción principal fuera de pantalla o menor de 44px`)
        }
        const como = inicio.locator('[data-bienvenida] a[href="#como-funciona"]')
        const cajaComo = await como.boundingBox()

        if (!cajaComo || cajaComo.x < 0 || cajaComo.x + cajaComo.width > width || cajaComo.y < 0 || cajaComo.y + cajaComo.height > height || cajaComo.height < 44) {
          problemasBienvenida.push(`${lang}@${width}: explicación fuera de pantalla o menor de 44px`)
        }
        await inicio.locator('h1').evaluate(el => { el.setAttribute('tabindex', '-1'); el.focus() })
        for (const accion of [explorar, como]) {
          await inicio.keyboard.press('Tab')
          const foco = await accion.evaluate(el => {
            const estilo = getComputedStyle(el)
            return el === document.activeElement && el.matches(':focus-visible') && estilo.outlineStyle !== 'none' && parseFloat(estilo.outlineWidth) >= 2
          })
          if (!foco) problemasBienvenida.push(`${lang}@${width}: acción sin foco visible al tabular`)
        }
        await como.press('Enter')
        const destino = inicio.locator('h2#como-funciona')
        const focoDestino = await destino.evaluate(el => el === document.activeElement)
        await inicio.waitForTimeout(500)
        const cajaDestino = await destino.boundingBox()

        if (!(await destino.isVisible()) || !focoDestino || !cajaDestino || cajaDestino.y < 80 || cajaDestino.y + cajaDestino.height > height || !inicio.url().endsWith('#como-funciona')) {
          problemasBienvenida.push(`${lang}@${width}: explicación sin navegación o foco`)
        }
        await inicio.goto(url(''))
        const resumen = inicio.locator('details > summary')
        await resumen.focus()
        await resumen.press('Enter')
        if (!(await inicio.locator('details[open]').count())) problemasBienvenida.push(`${lang}@${width}: estado no abre con teclado`)
        await resumen.press('Enter')
        if (await inicio.locator('details[open]').count()) problemasBienvenida.push(`${lang}@${width}: estado no cierra con teclado`)
        await explorar.click()
        await inicio.waitForURL('**/retos/')
      } catch (e) {
        problemasBienvenida.push(`${lang}@${width}: ${String(e.message).slice(0, 150)}`)
      } finally {
        await ctxInicio.close()
      }
    }
  }
  marca(16, 'bienvenida: siguiente gesto, explicación y estado con teclado', problemasBienvenida.length === 0, problemasBienvenida.join(' | ') || 'ES/EN · 390×844 y 1440×900')

  const problemasHardware = []

  for (const lang of ['es', 'en']) {
    for (const width of [390, 1440]) {
      const ctx = await navegadorPw.newContext({ viewport: { width, height: 900 }, serviceWorkers: 'block' })
      await ctx.addInitScript(l => localStorage.setItem('madclon-lang', l), lang)
      vigilarSuperficie(ctx, `hardware@${width}/${lang}`)
      // Synthetic numeric fixture: a host being offline must not break the gate.
      const hardwareFixture = { version: 1, hosts: ['mac', 'dgx'].map(id => ({
        id, sampled_at: new Date().toISOString(), cpu_percent: 20, gpu_percent: 0,
        ram_total_bytes: 1024, ram_available_bytes: 512, swap_used_bytes: 0,
        gpu_temperature_c: null, gpu_power_w: null, disk_total_bytes: null, disk_available_bytes: null
      })) }
      const overviewFixture = JSON.parse(readFileSync(join(RAIZ, 'public/data/overview.json'), 'utf8'))
      await ctx.route('**/data/overview.json', route => route.fulfill({ json: { ...overviewFixture, hardware: hardwareFixture } }))
      const p = await ctx.newPage()
      try {
        await p.goto(url(''))
        const section = p.locator('section[aria-labelledby="hardware-home-title"]')
        await section.getByRole('progressbar').first().waitFor()
        if (await section.getByRole('progressbar').count() !== 6) problemasHardware.push(`indicadores@${width}/${lang}`)
        const card = section.getByRole('link', { name: /Mac Studio/ })
        if (!(await card.getAttribute('href'))?.endsWith('/hardware/')) problemasHardware.push('destino público incorrecto')
        await card.focus()
        await card.press('Enter')
        await p.waitForURL(url('hardware/'))
        if (await p.getByRole('heading', { level: 1 }).textContent() !== 'Hardware') problemasHardware.push('no llega al detalle anónimo')
        if (!await p.getByRole('heading', { name: 'DGX Spark', exact: true }).isVisible()) problemasHardware.push('falta DGX')
        await ctx.route('**/data/tokens.json', route => route.fulfill({ status: 503, body: '' }))
        await p.goto(url(''))
        await p.getByRole('status').first().waitFor()
        await section.getByRole('link', { name: /Mac Studio/ }).waitFor()
        if (!await section.isVisible() || await section.getByRole('progressbar').count() !== 6) problemasHardware.push('Hardware desaparece al fallar tokens')
      } catch (e) {
        problemasHardware.push(`${width}/${lang}: ${String(e.message).slice(0, 120)}`)
      }
      await ctx.close()
    }
  }
  marca(17, 'Hardware: portada → detalle anónimo y tolerancia a fallo ajeno', problemasHardware.length === 0, problemasHardware.join(' | ') || 'ES/EN · 390/1440 · CPU/GPU/RAM por host · tokens503 no lo oculta')

  // 18 · /retos cuenta el avance que llega del dato, y solo eso (arco cero-a-cien, fase 7).
  // Tres lotes sintéticos (títulos inventados, nunca de un reto real): un caso suelto →
  // «un caso, no una estadística» y sin medias; cinco con agregado → las cifras y ningún aviso de
  // «sin cifras»; «en revisión» → lo confiesa con role=status y no pinta ni una barra.
  const problemasRetos = []

  const overviewBase = JSON.parse(readFileSync(join(RAIZ, 'public/data/overview.json'), 'utf8'))

  const sintetico = (n, agregado) => ({
    estado: 'ok', version: 1, generado: new Date().toISOString(), agregado,
    retos: Array.from({ length: n }, (_, i) => ({
      titulo_publico: `Caso sintético ${i + 1}`, escala: ['reto', 'frente', 'empujon', 'reto', 'horizonte'][i],
      porcentaje: i * 20, hechos: i, total: 5, unidad: 'pasos', terminado: false
    }))
  })

  const lotesRetos = [
    { id: 'uno', retos: sintetico(1, null), barras: 1, caso: 1, cifras: 0, sinCifras: 1, revision: 0 },
    {
      id: 'cinco',
      retos: sintetico(5, { vivos: 5, terminados: 0, avanceMedio: 40, porEscala: { reto: 2, frente: 1, empujon: 1, horizonte: 1 }, diasDelMasParado: 7 }),
      barras: 5, caso: 0, cifras: 1, sinCifras: 0, revision: 0
    },
    { id: 'revision', retos: { estado: 'en revisión' }, barras: 0, caso: 0, cifras: 0, sinCifras: 1, revision: 1 }
  ]

  for (const lote of lotesRetos) {
    for (const width of [375, 1440]) {
      const ctx = await navegadorPw.newContext({ viewport: { width, height: 900 }, serviceWorkers: 'block' })

      vigilarSuperficie(ctx, `retos-${lote.id}@${width}`)
      await ctx.route('**/data/overview.json', route => route.fulfill({ json: { ...overviewBase, retos: lote.retos } }))
      const p = await ctx.newPage()

      try {
        await p.goto(url('retos/'))
        await p.locator(lote.revision ? '[data-retos-en-revision]' : '[data-retos-avance]').waitFor()

        const medido = await p.evaluate(() => ({
          barras: document.querySelectorAll('[data-reto-publico] [role="progressbar"]').length,
          caso: document.querySelectorAll('[data-retos-caso]').length,
          cifras: document.querySelectorAll('[data-retos-cifras]').length,
          sinCifras: document.querySelectorAll('[data-sin-cifras]').length,
          revision: document.querySelectorAll('[data-retos-en-revision][role="status"]').length,
          procedencias: document.querySelectorAll('[data-retos-procedencia]').length,
          desborde: document.documentElement.scrollWidth - document.documentElement.clientWidth
        }))

        for (const k of ['barras', 'caso', 'cifras', 'sinCifras', 'revision']) {
          if (medido[k] !== lote[k]) problemasRetos.push(`${lote.id}@${width}: ${k}=${medido[k]} (esperado ${lote[k]})`)
        }

        if (medido.procedencias !== lote.barras) problemasRetos.push(`${lote.id}@${width}: ${medido.procedencias} procedencias para ${lote.barras} barras`)
        if (medido.desborde > 1) problemasRetos.push(`${lote.id}@${width}: desborde +${medido.desborde}px`)
      } catch (e) {
        problemasRetos.push(`${lote.id}@${width}: ${String(e.message).slice(0, 120)}`)
      }

      await ctx.close()
    }
  }

  marca(18, 'Retos: el avance llega del dato (1 caso · 5 con cifras · en revisión)', problemasRetos.length === 0,
    problemasRetos.join(' | ') || '3 lotes sintéticos × 375/1440 · barras, procedencia y aviso cuadran')

  // Una lista plana de combinaciones en vez de tres bucles anidados: cada modo
  // trae SU corte (idiomas, anchos, contrastes), así que la matriz del oscuro no
  // es la del claro y el cuerpo del barrido no tiene que saberlo.
  const combinaciones = MODOS_AXE.flatMap(modo =>
    modo.idiomas.flatMap(lang => modo.contrastes.map(contraste => ({ modo, lang, contraste })))
  )

  // Envoltorio único: si el modo no llega a aplicarse se anota y se ABANDONA esa
  // página, en vez de medirla a medio cambiar. Cualquier otro error sigue
  // reventando, que para eso es un error de verdad.
  const enModo = async (pg, modo, donde) => {
    try {
      await esperarModoAplicado(pg, modo)

      return true
    } catch (e) {
      if (!(e instanceof ErrorModoNoAplicado)) throw e
      problemasModo.push(`${donde}: ${e.message}`)

      return false
    }
  }

  for (const { modo, lang, contraste } of combinaciones) {
    const variante = `${modo.id}/${lang}${contraste ? '/AC' : ''}`
    const ctx = await navegadorPw.newContext({ viewport: { width: 1440, height: 900 } })

    vigilarSuperficie(ctx, variante)

    // La cookie de ajustes es lo ÚNICO que decide el modo en una web estática.
    // Se pide el modo aunque sea el de fábrica: así cambiar el default no
    // convierte este barrido en «un modo medido y el otro por accidente».
    await ctx.addCookies([{ name: 'madclon-front-office', value: modo.cookie, url: origenLocal }])
    await ctx.addInitScript(
      ([l, c]) => {
        localStorage.setItem('madclon-lang', l)
        localStorage.setItem('madclon-contraste', c)
      },
      [lang, contraste ? '1' : '0']
    )
    const pg = await ctx.newPage()

    pg.on('pageerror', e => erroresJs.push(`${variante} ${e.message}`))
    pg.on('console', m => {
      // «Failed to load resource» ya lo cubren los dos vigilantes de red de abajo:
      // contarlo aquí duplicaría el mismo hecho.
      if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) {
        erroresJs.push(`${variante} consola: ${m.text().slice(0, 120)}`)
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
      // La página ENTERA antes de medir nada, no sólo el reloj. Hace falta para
      // la comparación de tinta de más abajo: si una pasada audita una página a
      // medio construir y la otra no, los dos modos ven distinto número de
      // nodos y el check cantaría un desajuste que no existe. Además es lo que
      // el propio axe necesita para mirar todo lo que hay que mirar.
      await esperarDomAsentado(pg)
      if (!(await enModo(pg, modo, `${p || 'portada'} ${variante}`))) continue

      // El idioma semántico —lang, título por sección, h1 único y ruta
      // seleccionada— no puede depender del color: lo pinta el mismo HTML en
      // los dos modos. Se comprueba solo en el de referencia para no contar
      // dos veces el mismo fallo y no comerse los huecos de la evidencia.
      if (modo.referencia) {
        const documento = await pg.evaluate(() => ({
          lang: document.documentElement.lang,
          title: document.title,
          h1: [...document.querySelectorAll('h1')].map(item => item.textContent?.trim()),
          actual: [...document.querySelectorAll('a[aria-current="page"]')].map(item => ({ href: item.getAttribute('href'), activa: item.classList.contains('ts-active') }))
        }))

        const tituloEsperado = p ? `${SECCIONES[p][lang]} — ${TITULOS_DOCUMENTO[lang]}` : TITULOS_DOCUMENTO[lang]

        if (documento.lang !== lang || documento.title !== tituloEsperado) {
          problemasIdioma.push(
            `${p || 'portada'} ${lang}${contraste ? '/AC' : ''}: lang=${documento.lang} title=${JSON.stringify(documento.title)}`
          )
        }

        if (documento.actual.length !== 1 || documento.actual[0].href !== `${BASE}/${p ? `${p}/` : ''}` || !documento.actual[0].activa) {
          problemasIdioma.push(`${p || 'portada'} ${lang}: seleccion=${JSON.stringify(documento.actual)}`)
        }

        if (documento.h1.length !== 1 || !documento.h1[0] || (!p && documento.h1[0] !== TITULOS_PORTADA[lang])) {
          problemasIdioma.push(
            `${p || 'portada'} ${lang}${contraste ? '/AC' : ''}: h1=${JSON.stringify(documento.h1)}`
          )
        }
      }

      // El overflow y los objetivos táctiles son GEOMETRÍA: miden cajas, y las
      // cajas son las mismas en los dos modos (medido: 448 elementos idénticos
      // en claro y en oscuro). El modo de referencia recorre los cinco anchos
      // del check 7; el otro solo visita los suyos de axe.
      for (const w of modo.referencia ? ANCHOS_OVERFLOW : modo.anchos) {
        await pg.setViewportSize({ width: w, height: 900 })
        await pg.waitForTimeout(320)

        if (modo.referencia) {
          const desborde = await pg.evaluate(
            () => document.documentElement.scrollWidth - window.innerWidth
          )

          if (desborde > 1) overflow.push(`${p || 'portada'} @${w} +${desborde}px (${lang})`)
        }

        if (modo.anchos.includes(w)) {
          await pg.evaluate(axeSrc)
          pasadasAxe[modo.id] += 1

          const r = await pg.evaluate(async () => {
            const res = await axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa'] } })

            // Los tres cubos sumados: que un nodo pase de «pasa» a «dudoso»
            // —cosa que sí puede depender del esquema de color, por ejemplo
            // sobre un degradado— no mueve este número. Que axe no lo VEA, sí.
            const nodosTinta = [...res.passes, ...res.violations, ...res.incomplete]
              .filter(x => x.id === 'color-contrast')
              .reduce((n, x) => n + x.nodes.length, 0)

            return { violations: res.violations, nodosTinta }
          })

          tintaPorModo[modo.id].set(`${p || 'portada'}@${w} ${lang}${contraste ? '/AC' : ''}`, r.nodosTinta)

          r.violations.forEach(v =>
            violaciones.push(
              `${p || 'portada'} @${w} ${variante}: ${v.id} (${v.impact || 'sin impacto'}) (${v.nodes.length})${resumirViolacionAxe(v)}`
            )
          )
        }

        // 8 · objetivos táctiles, solo en móvil
        if (w === 375 && !contraste && lang === 'es' && modo.referencia) {
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
    // Y por eso se abre TAMBIÉN en oscuro: su tinta no sale en ningún otro sitio
    // del barrido, así que un modo que no la abre no la mide.
    for (const w of modo.anchos) {
      await pg.goto(url('flota'), { waitUntil: 'domcontentloaded' })
      await pg.waitForTimeout(1500)
      if (!(await enModo(pg, modo, `capa2 ${variante}@${w}`))) continue
      await pg.setViewportSize({ width: w, height: 900 })
      const abridor = pg.locator('[data-anatomia-abrir]').first()

      if ((await abridor.count()) === 0) continue

      // Y aquí, DESPUÉS del resize, no antes: `setViewportSize` es justo lo que
      // dispara la transición de ancho del nav lateral (300 ms), y `.click()` no
      // pulsa hasta que el elemento está «visible, enabled and stable». Con la
      // máquina cargada eso agotaba los 30 s de actionability y tumbaba el gate
      // ENTERO por aquí (19/09/2026). Esperar antes del resize no serviría de
      // nada: se estaría esperando a que se calme una página que aún no se ha
      // movido.
      await esperarDomAsentado(pg)
      await esperarQuietudDeMovimiento(pg)
      await abridor.click()
      await pg.waitForTimeout(700)
      await pg.evaluate(axeSrc)
      pasadasAxe[modo.id] += 1

      const r = await pg.evaluate(async () =>
        axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa'] } })
      )

      r.violations.forEach(v =>
        violaciones.push(
          `capa2 @${w} ${variante}: ${v.id} (${v.impact || 'sin impacto'}) (${v.nodes.length})${resumirViolacionAxe(v)}`
        )
      )
      await pg.keyboard.press('Escape')
    }

    await ctx.close()
  }

  // El 404 es parte de la superficie pública: conserva idioma, título, un único
  // h1, navegación de vuelta, accesibilidad y anchura en los tres formatos. Y
  // tiene tinta propia —su informativo no se pinta en ninguna otra página—, así
  // que también se recorre en los dos modos, con el mismo corte.
  for (const { modo, lang, contraste } of combinaciones) {
    for (const w of modo.anchos) {
      const variante = `${modo.id}/${lang}${contraste ? '/AC' : ''}`
      const etiqueta404 = `404/${variante}/${w}`
      const ctx404 = await navegadorPw.newContext({ viewport: { width: w, height: 900 } })

      vigilarSuperficie(ctx404, etiqueta404)
      await ctx404.addCookies([{ name: 'madclon-front-office', value: modo.cookie, url: origenLocal }])
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

      if (!(await enModo(pg404, modo, etiqueta404))) {
        await ctx404.close()
        continue
      }

      // Igual que arriba: el estatus, el idioma y la anchura no dependen del
      // color. Se acreditan en el modo de referencia; el otro viene a por tinta.
      if (modo.referencia) {
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
      }

      await pg404.evaluate(axeSrc)
      pasadasAxe[modo.id] += 1

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

  // La matriz se IMPRIME entera, modo a modo: quien lee el gate tiene que poder
  // ver de un vistazo con qué corte se ha medido cada modo, sin abrir el código.
  const matriz = MODOS_AXE.map(
    m =>
      `${m.id} ${m.anchos.join('/')} × ${m.idiomas.join('/')} × ${m.contrastes.length === 2 ? 'normal+AC' : 'normal'}`
  ).join(' · ')

  const modosSinMedir = MODOS_AXE.filter(m => pasadasAxe[m.id] === 0).map(m => m.id)

  // LA PREMISA DEL CORTE, COMPROBADA EN CADA PASADA. El oscuro se mide con menos
  // anchos y un solo idioma porque está medido que los dos modos pintan los
  // mismos elementos (ver MODOS_AXE). Aquí se exige: en cada casilla que los dos
  // recorren —misma página, mismo ancho, mismo idioma, mismo contraste— axe tiene
  // que haber evaluado el MISMO número de nodos de texto. Si no, una de dos, y
  // las dos importan: o hay una pieza que sólo existe en un modo y el corte se
  // ha quedado ciego, o una de las dos pasadas midió una página a medio pintar.
  // Cualquiera de las dos invalida el barrido, así que tumba el check.
  const referenciaAxe = MODOS_AXE.find(m => m.referencia)
  const desajustesTinta = []
  let casillasComunes = 0

  for (const modo of MODOS_AXE) {
    if (modo.referencia) continue

    for (const [casilla, nodos] of tintaPorModo[modo.id]) {
      const enReferencia = tintaPorModo[referenciaAxe.id].get(casilla)

      // El corte del modo secundario es un SUBCONJUNTO del de referencia, así que
      // toda casilla suya debería tener pareja. Si no la tiene, el corte se ha
      // salido de la matriz del de fábrica y esto ya no compara nada: se dice.
      if (enReferencia === undefined) {
        desajustesTinta.push(`${casilla}: ${modo.id} la mide y ${referenciaAxe.id} no — el corte se salió de la matriz de referencia`)
        continue
      }

      casillasComunes += 1
      if (enReferencia !== nodos) {
        desajustesTinta.push(`${casilla}: ${referenciaAxe.id} evaluó ${enReferencia} nodos y ${modo.id} ${nodos}`)
      }
    }
  }

  const tintaVista = MODOS_AXE.map(
    m => `${m.id} ${pasadasAxe[m.id]} pasadas/${[...tintaPorModo[m.id].values()].reduce((a, b) => a + b, 0)} nodos de tinta`
  ).join(' · ')
  const recuento = tintaVista

  marca(
    5,
    `axe + idioma semántico (${matriz})`,
    violaciones.length === 0 &&
      problemasIdioma.length === 0 &&
      modosSinMedir.length === 0 &&
      problemasModo.length === 0 &&
      desajustesTinta.length === 0,
    modosSinMedir.length || problemasModo.length || desajustesTinta.length
      ? [
          modosSinMedir.length ? `el barrido NO midió ${modosSinMedir.join(' ni ')} (${recuento})` : '',
          ...problemasModo.slice(0, 3),
          desajustesTinta.length
            ? `los modos no vieron la misma tinta en ${desajustesTinta.length} casilla(s) — ${desajustesTinta.slice(0, 2).join(' ; ')}`
            : ''
        ]
          .filter(Boolean)
          .join(' | ')
      : [...violaciones, ...problemasIdioma].slice(0, 6).join(' | ') ||
        `0 violaciones en ${recuento} · los dos modos vieron la misma tinta en las ${casillasComunes} casillas comunes · idioma, titulo por seccion, h1 y seleccion de ruta correctos; 404 intacto`
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

  // Recorrer la página a Tab exige que la página EXISTA entera: con el DOM aún
  // creciendo, el abridor de la capa 2 puede no estar todavía y el check diría
  // «Tab no llega» sobre una /flota a medio construir.
  await esperarDomAsentado(k)

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
    // `.click()` no pulsa hasta que el elemento está «visible, enabled and
    // stable», y la transición de ancho del nav lateral recoloca el contenido
    // debajo: con la máquina cargada eso agotaba los 30 s de actionability y
    // tumbaba el gate ENTERO, no solo este check (19/09/2026). Se espera al
    // estado —DOM construido y sin movimiento transitorio— antes de pulsar.
    await esperarDomAsentado(k)
    await esperarQuietudDeMovimiento(k)
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
  //
  // MIDE LA PÁGINA EN REPOSO, y desde el 19/09/2026 espera a ese reposo en vez de
  // a un reloj. Medía tras `waitForTimeout(1600)` y bajo carga cazaba tres
  // familias de TRANSICIONES finitas —nav lateral (width 300 ms), fade de
  // contenido (opacity 350 ms) y las barras de progreso determinadas
  // (transform 400 ms)— que en máquina quieta ya habían terminado: FALLO espurio
  // con el gate entero verde al repetirlo en un Mac libre. El porqué completo,
  // con la reproducción por frenado de CPU y las dos salidas que se barajaron,
  // está en `scripts/esperas.mjs`.
  //
  // La espera NO puede tapar: lo perpetuo (`iterations: Infinity`) se canta en la
  // primera muestra y lo que no drena en plazo sale como `no-para`. Esa frontera
  // la fija `scripts/esperas.test.mjs`, y se corre aquí mismo: si alguien
  // convierte la espera en «espero a que pare y digo que no se movía», este check
  // cae con ella.
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

  // La guardia de la propia espera, antes de fiarse de ella.
  try {
    sh('node --test scripts/esperas.test.mjs')
  } catch (e) {
    const salida = String(e.stdout || e.message || e)
    const motivo = (salida.match(/^\s*(?:AssertionError.*|Error: )?(.*(?:perpetu|drenar|no-para|quieta?|tapando|DOM).*)$/m) || [, ''])[1]

    problemasReducido.push(`la espera por estado no cumple su contrato: ${(motivo || salida).trim().slice(0, 200)}`)
  }

  for (const p of PAGINAS) {
    await pr.goto(url(p), { waitUntil: 'domcontentloaded' })

    // El suelo de 1.600 ms se queda: garantiza que el dato haya llegado y que no
    // se mida una página que aún no ha empezado a pintar —medir demasiado pronto
    // sería el verde falso simétrico—. Lo que se añade encima es el ESTADO.
    await pr.waitForTimeout(1600)
    await esperarDomAsentado(pr)

    const quietud = await esperarQuietudDeMovimiento(pr)

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

    if (quietud.estado === 'perpetuo') {
      problemasReducido.push(`${p || 'portada'}: movimiento perpetuo · ${quietud.movimiento.join(', ')}`)
    } else if (quietud.estado === 'no-para') {
      problemasReducido.push(`${p || 'portada'}: el movimiento no paró en 15 s · ${quietud.movimiento.join(', ')}`)
    } else if (estado.animaciones.length) {
      // Quieto al esperar y moviéndose al medir: algo arrancó en medio. Se canta
      // igual, que para eso el snapshot sigue siendo el juez final.
      problemasReducido.push(`${p || 'portada'}: ${estado.animaciones.join(', ')}`)
    }

    if (estado.videosActivos) problemasReducido.push(`${p || 'portada'}: ${estado.videosActivos} vídeo(s) activo(s)`)
  }

  // EL NAV LATERAL NO SE DESLIZA BAJO REDUCE (decisión de MAD del 20/09/2026).
  //
  // El recorrido de arriba NO basta para vigilar esto. Mide la página EN REPOSO,
  // y el deslizamiento del nav sólo existe mientras algo lo dispara: es una
  // transición de 300 ms sobre `inline-size` que arranca con el redimensionado
  // (`src/@menu/styles/vertical/StyledVerticalNav.tsx:25`). Esperar a pillarla
  // de pasada al cargar es exactamente la carrera que costó el FALLO espurio del
  // 19/09. Así que aquí no se espera: se PROVOCA el disparador y se mira.
  //
  // Tres patas, y las tres hacen falta:
  //   1. el elemento EXISTE. Sin esto la guardia pasaría en vacío el día que la
  //      plantilla renombre la clase, que es el verde falso más barato que hay.
  //   2. su `transition-duration` computado bajo reduce es 0. Es la pata
  //      determinista: acredita que la REGLA se aplica, no que hoy no se haya
  //      visto moverse.
  //   3. al CARGAR la página no corre ninguna transición sobre él. Es la pata de
  //      comportamiento: lo que un humano con `reduce` sufre es el nav
  //      deslizándose al entrar.
  //
  // POR QUÉ LA PATA 3 FRENA LA CPU A PROPÓSITO. La primera versión provocaba el
  // movimiento redimensionando de 375 a 1440, y salió VERDE sobre un build sin
  // la regla: medido, el nav ocupa 260 px en los dos anchos, así que el resize no
  // cambia nada y no había transición que ver. Una pata que no puede fallar no
  // mide. El disparador de verdad es la hidratación, y ahí manda el reloj de la
  // máquina; medido sobre el build sin regla, 6 cargas por nivel:
  //
  //     CPU ÷1  → deslizamiento cazado en 1 de 6 cargas   ← cara o cruz
  //     CPU ÷10 → 6 de 6
  //     CPU ÷20 → 6 de 6
  //
  // Así que el frenado por CDP no es un apaño, es el INSTRUMENTO: alargar la
  // ventana sólo puede hacer el movimiento MÁS visible, nunca inventar quietud,
  // de modo que no hay forma de que esto fabrique un verde. Sin frenar, esta
  // pata daría verde cinco de cada seis veces sobre una web que sí se mueve.
  //
  // Límite conocido y asumido: vigila el elemento del nav, no sus hijos. Si la
  // plantilla mudara la transición a un descendiente, la pata 1 seguiría verde;
  // lo cazaría la pata 2 al quedarse sin regla que acreditar.
  const SEL_NAV = '.ts-vertical-nav-container'

  await pr.goto(url(''), { waitUntil: 'domcontentloaded' })
  await pr.waitForTimeout(1600)
  await esperarDomAsentado(pr)
  await esperarQuietudDeMovimiento(pr)

  const nav = await pr.evaluate(sel => {
    const el = document.querySelector(sel)

    if (!el) return { existe: false }

    return { existe: true, duracion: getComputedStyle(el).transitionDuration }
  }, SEL_NAV)

  if (!nav.existe) {
    problemasReducido.push(`nav lateral: no existe ${SEL_NAV} — la guardia del deslizamiento no mide nada`)
  } else {
    const duraciones = nav.duracion.split(',').map(d => d.trim())

    if (duraciones.some(d => d !== '0s')) {
      problemasReducido.push(`nav lateral: sigue con transición bajo reduce (transition-duration: ${nav.duracion})`)
    }

    const cdp = await ctxReducido.newCDPSession(pr)

    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 20 })
    await pr.goto(url(''), { waitUntil: 'domcontentloaded' })

    const movimientoNav = await pr.evaluate(
      async sel => {
        const visto = new Set()
        const hasta = performance.now() + 4000

        while (performance.now() < hasta && visto.size === 0) {
          const el = document.querySelector(sel)

          if (el) {
            for (const a of document.getAnimations()) {
              if (a.playState !== 'running') continue

              const objetivo = a.effect instanceof KeyframeEffect ? a.effect.target : null

              if (objetivo === el) visto.add(a.transitionProperty || a.animationName || 'movimiento')
            }
          }

          await new Promise(listo => setTimeout(listo, 30))
        }

        return [...visto]
      },
      SEL_NAV
    )

    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 })
    await cdp.detach()

    if (movimientoNav.length) {
      problemasReducido.push(`nav lateral: se desliza al cargar bajo reduce (${movimientoNav.join(', ')})`)
    }
  }

  marca(
    13,
    'prefers-reduced-motion + consola/red @375 + nav sin deslizamiento',
    problemasReducido.length === 0,
    problemasReducido.slice(0, 6).join(' | ') ||
      'preferencia aplicada · 0 movimiento · 0 vídeos · 0 errores/red externa · nav sin transición ni deslizamiento al cargar'
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
