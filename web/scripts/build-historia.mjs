// build-historia.mjs — hornea los capítulos de /historia dentro del build.
//
// Por qué existe (incidente del 2026-08-12, ronda R7):
// los capítulos se sacaron del código a `exporter/historia.md` para que dejaran
// de envejecer, y se sirvieron por `overview.json`. Pero el service worker
// guarda cada documento de datos hasta 24 h (diseño aprobado por MAD el 03/08),
// así que quien había visitado la web antes del despliegue se quedó con JS
// nuevo + datos viejos y **la línea de tiempo desapareció entera** durante un
// día. Una página cuyo contenido histórico depende de un JSON cacheable puede
// quedarse en blanco; el histórico no cambia, así que viaja con el build.
//
// Sigue habiendo UNA sola fuente (`exporter/historia.md`) y CERO contenido
// escrito a mano en React: este fichero solo lo traduce a TypeScript.
// Se ejecuta en prebuild/predev, igual que build-stamp.mjs.
//
//   node scripts/build-historia.mjs            → regenera src/lib/historia-hitos.ts
//   node scripts/build-historia.mjs --comprobar → no escribe; sale 1 si está desfasado

import { readFileSync, writeFileSync } from 'node:fs'

const FUENTE = new URL('../../exporter/historia.md', import.meta.url)
const DESTINO = new URL('../src/lib/historia-hitos.ts', import.meta.url)

const RE_CABECERA = /^###\s+(\d{4}-\d{2}-\d{2})\s*$/
const RE_CAMPO = /^(icono|color|es_titulo|es_texto|en_titulo|en_texto|fuente):\s*(.+?)\s*$/

// Se publica solo esto: `fuente` es trazabilidad interna y se queda en el .md.
const CAMPOS = ['icono', 'color', 'es_titulo', 'es_texto', 'en_titulo', 'en_texto']
const COLORES = ['primary', 'success', 'info', 'warning', 'error', 'secondary']
const RE_ICONO = /^ri-[a-z0-9-]+$/

/** exporter/historia.md → capítulos válidos, en orden cronológico. */
export function parseHitos(md) {
  const hitos = []
  const avisos = []
  let fecha = null
  let actual = null

  const cerrar = () => {
    if (!actual) return
    const faltan = CAMPOS.filter(c => !actual[c])

    if (faltan.length) {
      avisos.push(`${fecha}: faltan ${faltan.join(', ')}`)

      return
    }

    if (!COLORES.includes(actual.color)) {
      avisos.push(`${fecha}: color inválido «${actual.color}»`)

      return
    }

    if (!RE_ICONO.test(actual.icono)) {
      avisos.push(`${fecha}: icono inválido «${actual.icono}»`)

      return
    }

    hitos.push({ fecha, ...Object.fromEntries(CAMPOS.map(c => [c, actual[c]])) })
  }

  for (const linea of md.split('\n')) {
    const cab = RE_CABECERA.exec(linea)

    if (cab) {
      cerrar()
      fecha = cab[1]
      actual = {}
      continue
    }

    if (!actual) continue
    const campo = RE_CAMPO.exec(linea)

    if (campo) actual[campo[1]] = campo[2]
  }

  cerrar()
  hitos.sort((a, b) => a.fecha.localeCompare(b.fecha))

  return { hitos, avisos }
}

export function generar() {
  const { hitos, avisos } = parseHitos(readFileSync(FUENTE, 'utf8'))

  const cuerpo =
    '// GENERADO por scripts/build-historia.mjs en cada build. NO EDITAR A MANO.\n' +
    '// Fuente única de los capítulos: exporter/historia.md (añade un bloque allí).\n' +
    '// Viajan con el build a propósito: un overview.json cacheado no puede\n' +
    '// dejar la línea de tiempo en blanco (incidente del 2026-08-12).\n' +
    "import type { Hito } from './data'\n\n" +
    `export const HITOS_BUILD: Hito[] = ${JSON.stringify(hitos, null, 2)}\n`

  return { cuerpo, hitos, avisos }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const { cuerpo, hitos, avisos } = generar()

  avisos.forEach(a => console.log(`  AVISO historia.md · ${a}`))

  if (process.argv.includes('--comprobar')) {
    const actual = (() => {
      try {
        return readFileSync(DESTINO, 'utf8')
      } catch {
        return ''
      }
    })()

    if (actual !== cuerpo) {
      console.log('  FALLO · src/lib/historia-hitos.ts no coincide con exporter/historia.md')
      console.log('          arréglalo con: node scripts/build-historia.mjs')
      process.exit(1)
    }

    console.log(`build-historia · ${hitos.length} capítulos · al día`)
  } else {
    writeFileSync(DESTINO, cuerpo)
    console.log(`build-historia · ${hitos.length} capítulos horneados (último ${hitos.at(-1)?.fecha ?? '—'})`)
  }
}
