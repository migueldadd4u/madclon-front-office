// build-copia-retos.mjs — hornea dentro del build las palabras de /retos.
//
// Por qué existe (05/09/2026, arco «El escaparate cuenta el reto»): el día que
// nació el reto, esta web sabía contar cómo funciona el clon por dentro pero no
// para qué sirve. La página que lo explica necesita texto, y ese texto no puede
// salir del vault (13/08: la fuga viajaba en un JSON de datos, por donde no miran
// ni public-safety ni check-copy) ni viajar en un JSON (12/08: el service worker
// guarda cada documento hasta 24 h y /historia salió en blanco).
//
// De ahí la misma receta que ya funcionó dos veces: UNA fuente curada
// (exporter/retos.md), horneada en el build, y cero copy escrito en React.
//
//   node scripts/build-copia-retos.mjs            → regenera src/lib/copia-retos.ts
//   node scripts/build-copia-retos.mjs --comprobar → no escribe; sale 1 si está desfasado

import { readFileSync, writeFileSync } from 'node:fs'

import { parseBloques } from './build-copia-publica.mjs'

const RETOS_MD = new URL('../../exporter/retos.md', import.meta.url)
const DESTINO = new URL('../src/lib/copia-retos.ts', import.meta.url)

const RE_CABECERA = /^###\s+([a-z0-9-]+)\s*$/
const RE_CAMPO = /^(es_titulo|es_texto|en_titulo|en_texto):\s*(.+?)\s*$/
const CAMPOS = ['es_titulo', 'es_texto', 'en_titulo', 'en_texto']

/**
 * Los bloques que la página NECESITA para no salir coja. Si falta uno, el
 * generador avisa y `--comprobar` deja rojo el gate: una sección vacía en una web
 * pública es peor que no tenerla.
 */
export const BLOQUES_EXIGIDOS = [
  'que-es',
  'altura-horizonte',
  'altura-frente',
  'altura-reto',
  'altura-empujon',
  'metodo',
  'su-momento',
  'como-propone',
  'limite',
  'no-hace-envia',
  'no-hace-decide',
  'no-hace-escribe',
  'no-hace-datos',
  'panel-privado',
  'sin-cifras'
]

export function generar() {
  const { bloques, avisos } = parseBloques(readFileSync(RETOS_MD, 'utf8'), RE_CABECERA, RE_CAMPO, CAMPOS, 'reto')

  const faltan = BLOQUES_EXIGIDOS.filter(b => !bloques[b])

  const cuerpo =
    '// GENERADO por scripts/build-copia-retos.mjs en cada build. NO EDITAR A MANO.\n' +
    '// Fuente única: exporter/retos.md (el copy público de /retos, en ES y EN).\n' +
    '//\n' +
    '// Viaja con el build a propósito: un texto colgado de un JSON se queda cacheado\n' +
    '// hasta 24 h en el navegador de quien ya nos había visitado, y la página saldría\n' +
    '// muda. Del dato solo vienen cifras y estados — y en la fase 0 ni eso.\n' +
    `export const RETOS_BUILD: Record<string, { es_titulo: string; es_texto: string; en_titulo: string; en_texto: string }> = ${JSON.stringify(bloques, null, 2)}\n`

  return { cuerpo, bloques, avisos: [...avisos, ...faltan.map(b => `falta el bloque «${b}»`)] }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const { cuerpo, bloques, avisos } = generar()
  const resumen = `${Object.keys(bloques).length} bloques`

  avisos.forEach(a => console.log(`  AVISO copia de retos · ${a}`))

  if (process.argv.includes('--comprobar')) {
    const actual = (() => {
      try {
        return readFileSync(DESTINO, 'utf8')
      } catch {
        return ''
      }
    })()

    if (actual !== cuerpo || avisos.length) {
      console.log('  FALLO · src/lib/copia-retos.ts no coincide con exporter/retos.md, o faltan bloques')
      console.log('          arréglalo con: node scripts/build-copia-retos.mjs')
      process.exit(1)
    }

    console.log(`build-copia-retos · ${resumen} · al día`)
  } else {
    writeFileSync(DESTINO, cuerpo)
    console.log(`build-copia-retos · ${resumen} horneados`)
  }
}
