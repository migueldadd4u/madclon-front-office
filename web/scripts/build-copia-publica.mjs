// build-copia-publica.mjs — hornea dentro del build las palabras de la flota.
//
// Por qué existe (13/08/2026, hermano del incidente R7):
// el rol y la misión de cada clon, y el nombre de cada buzón y agenda, dejaron
// de copiarse del vault y pasaron a una fuente pública curada. Publicarlos por
// `clones.json` habría repetido el error del 12/08: el service worker guarda
// cada documento de datos hasta 24 h, así que quien hubiera visitado la web ese
// mismo día se habría quedado con JS nuevo + datos viejos — la flota sin textos
// y /salud con siete filas anónimas, durante un día entero.
//
// La regla que salió de aquello: **el contenido que no cambia viaja con el
// build; del dato solo vienen las cifras y los estados.** Aquí el dato aporta
// únicamente las claves de cruce (`perfil` y `clave`), que son estables.
//
// Sigue habiendo UNA sola fuente por cosa (exporter/misiones.md y
// exporter/conexiones.md) y CERO copy escrito en React.
// Se ejecuta en prebuild/predev, igual que build-historia.mjs.
//
//   node scripts/build-copia-publica.mjs            → regenera src/lib/copia-publica.ts
//   node scripts/build-copia-publica.mjs --comprobar → no escribe; sale 1 si está desfasado

import { readFileSync, writeFileSync } from 'node:fs'

const OFICIOS_MD = new URL('../../exporter/misiones.md', import.meta.url)
const CONEXIONES_MD = new URL('../../exporter/conexiones.md', import.meta.url)
const DESTINO = new URL('../src/lib/copia-publica.ts', import.meta.url)

const RE_OFICIO_CABECERA = /^###\s+([a-z]+)\s*$/
const RE_OFICIO_CAMPO = /^(es_rol|en_rol|es_mision|en_mision|fuente):\s*(.+?)\s*$/
const CAMPOS_OFICIO = ['es_rol', 'en_rol', 'es_mision', 'en_mision']

const RE_CONEXION_CABECERA = /^###\s+([0-9a-f]{8})\s*$/
const RE_CONEXION_CAMPO = /^(es_nombre|en_nombre):\s*(.+?)\s*$/
const CAMPOS_CONEXION = ['es_nombre', 'en_nombre']

/** Bloques `### <clave>` + `campo: valor`. Uno incompleto se descarta CON aviso. */
export function parseBloques(md, reCabecera, reCampo, campos, etiqueta) {
  const bloques = {}
  const avisos = []
  let clave = null
  let actual = null

  const cerrar = () => {
    if (!actual) return
    const faltan = campos.filter(c => !actual[c])

    if (faltan.length) {
      avisos.push(`${etiqueta} «${clave}»: faltan ${faltan.join(', ')}`)

      return
    }

    bloques[clave] = Object.fromEntries(campos.map(c => [c, actual[c]]))
  }

  for (const linea of md.split('\n')) {
    const cab = reCabecera.exec(linea)

    if (cab) {
      cerrar()
      clave = cab[1]
      actual = {}
      continue
    }

    if (!actual) continue
    const campo = reCampo.exec(linea)

    if (campo) actual[campo[1]] = campo[2]
  }

  cerrar()

  return { bloques, avisos }
}

export function generar() {
  const oficios = parseBloques(
    readFileSync(OFICIOS_MD, 'utf8'), RE_OFICIO_CABECERA, RE_OFICIO_CAMPO, CAMPOS_OFICIO, 'perfil')

  const conexiones = parseBloques(
    readFileSync(CONEXIONES_MD, 'utf8'), RE_CONEXION_CABECERA, RE_CONEXION_CAMPO, CAMPOS_CONEXION, 'conexión')

  const cuerpo =
    '// GENERADO por scripts/build-copia-publica.mjs en cada build. NO EDITAR A MANO.\n' +
    '// Fuentes únicas: exporter/misiones.md (rol y misión de cada clon) y\n' +
    '// exporter/conexiones.md (nombre de cada buzón y agenda).\n' +
    '//\n' +
    '// Viajan con el build a propósito: el service worker guarda los JSON de datos\n' +
    '// hasta 24 h, y un lote cacheado dejaría la flota sin textos y /salud con\n' +
    '// filas anónimas. Del dato solo vienen las claves de cruce y los estados.\n' +
    "import type { OficioPublico, ConexionPublica } from './data'\n\n" +
    `export const OFICIOS_BUILD: Record<string, OficioPublico> = ${JSON.stringify(oficios.bloques, null, 2)}\n\n` +
    `export const CONEXIONES_BUILD: Record<string, ConexionPublica> = ${JSON.stringify(conexiones.bloques, null, 2)}\n`

  return {
    cuerpo,
    oficios: oficios.bloques,
    conexiones: conexiones.bloques,
    avisos: [...oficios.avisos, ...conexiones.avisos]
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const { cuerpo, oficios, conexiones, avisos } = generar()
  const resumen = `${Object.keys(oficios).length} oficios · ${Object.keys(conexiones).length} conexiones`

  avisos.forEach(a => console.log(`  AVISO copia pública · ${a}`))

  if (process.argv.includes('--comprobar')) {
    const actual = (() => {
      try {
        return readFileSync(DESTINO, 'utf8')
      } catch {
        return ''
      }
    })()

    if (actual !== cuerpo) {
      console.log('  FALLO · src/lib/copia-publica.ts no coincide con exporter/*.md')
      console.log('          arréglalo con: node scripts/build-copia-publica.mjs')
      process.exit(1)
    }

    console.log(`build-copia-publica · ${resumen} · al día`)
  } else {
    writeFileSync(DESTINO, cuerpo)
    console.log(`build-copia-publica · ${resumen} horneados`)
  }
}
