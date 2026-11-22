// build-copia-casos.mjs — hornea dentro del build las palabras «para quien decide».
//
// Por qué existe (22/11/2026, arco «El escaparate, para quien decide»): la portada
// explicaba el clon con un único ejemplo —una asociación con solicitudes duplicadas—
// escrito dentro del React y sostenido por una exención literal en check-hardcode.
// Quien dirige una institución no se reconocía en él. Los casos por cargo, el
// recorrido de fuentes, los niveles de control, la lectura de cada página y las
// preguntas de un despacho público salen ahora de UNA fuente curada
// (exporter/casos.md), con la misma receta que historia, misiones y retos:
// el contenido que no cambia viaja con el build; del dato solo vienen las cifras.
//
// El generador no solo copia: hace cumplir las reglas del contenido. Un caso sin
// sus cuatro etapas, con un canal que el clon no ingiere, sin traducción o con una
// promesa de resultado no llega a la web.
//
//   node scripts/build-copia-casos.mjs             → regenera src/lib/copia-casos.ts
//   node scripts/build-copia-casos.mjs --comprobar → no escribe; sale 1 si está desfasado o incompleto

import { readFileSync, writeFileSync } from 'node:fs'

const CASOS_MD = new URL('../../exporter/casos.md', import.meta.url)
const DESTINO = new URL('../src/lib/copia-casos.ts', import.meta.url)

/** Los siete canales que el clon ingiere hoy. Lista cerrada: un caso no puede inventar otro. */
export const CANALES = ['correo', 'mensajeria', 'llamada', 'agenda', 'reunion', 'documento', 'voz']

/** Las alturas de un reto, tal como las nombra exporter/retos.md. */
export const ALTURAS = ['horizonte', 'frente', 'reto', 'empujon']

/** Cuántas piezas lleva cada caso. Cambiar un número aquí cambia el contrato de todos los casos. */
export const FORMA_CASO = { llega: 6, cruces: 3, decisiones: 3, compromisos: 2, avisos: 1, equipo: 5 }

const IDIOMAS = ['es', 'en']
const rango = n => Array.from({ length: n }, (_, i) => i + 1)
const bilingue = campo => IDIOMAS.map(l => `${l}_${campo}`)

const CAMPOS_TEXTO = [...bilingue('titulo'), ...bilingue('texto')]

/** Todos los campos que un bloque `caso-<clave>` tiene que traer. */
export const CAMPOS_CASO = [
  'icono',
  ...['cargo', 'quien', 'dia', 'decides', 'gana', 'reto_titulo', 'reto_paso', 'reto_fin'].flatMap(bilingue),
  'reto_altura',
  ...rango(FORMA_CASO.llega).flatMap(i => [`canal_${i}`, ...bilingue(`llega_${i}`)]),
  ...rango(FORMA_CASO.cruces).flatMap(i => [...bilingue(`cruce_${i}_titulo`), ...bilingue(`cruce_${i}_texto`)]),
  ...rango(FORMA_CASO.decisiones).flatMap(i => bilingue(`decision_${i}`)),
  ...rango(FORMA_CASO.compromisos).flatMap(i => bilingue(`compromiso_${i}`)),
  ...rango(FORMA_CASO.avisos).flatMap(i => bilingue(`aviso_${i}`)),
  ...rango(FORMA_CASO.equipo).flatMap(i => [...bilingue(`equipo_${i}_titulo`), ...bilingue(`equipo_${i}_texto`)])
]

/**
 * Los bloques de texto que las páginas NECESITAN para no salir cojas. Si falta uno,
 * `--comprobar` deja rojo el gate: una sección vacía en una web pública es peor que
 * no tenerla.
 */
export const BLOQUES_EXIGIDOS = [
  'recorrido',
  'columna-llega',
  'columna-hace',
  'columna-devuelve',
  ...CANALES.map(c => `canal-${c}`),
  ...rango(4).map(i => `hace-${i}`),
  ...rango(4).map(i => `devuelve-${i}`),
  'enlace-llega',
  'enlace-mesa',
  'cifras',
  'cifras-revision',
  'cifra-buzones',
  'cifra-agendas',
  'cifra-rutinas',
  'cifra-personas',
  'cifra-oficios',
  'casos',
  'cargos',
  'rotulo',
  'guion',
  'etapa-llega',
  'etapa-hace',
  'etapa-mesa',
  'etapa-decides',
  'mesa-decisiones',
  'mesa-compromisos',
  'mesa-aviso',
  'cambia',
  'enlace-caso',
  'ver-caso',
  'niveles',
  'etiqueta-nivel',
  ...rango(5).map(i => `nivel-${i - 1}`),
  'limites',
  'ver-limites',
  ...rango(3).map(i => `limite-${i}`),
  'siguiente',
  'siguiente-retos',
  'siguiente-preguntas',
  'lectura',
  ...['retos', 'flota', 'actividad', 'salud', 'tokens', 'eficiencia', 'hardware', 'historia'].map(p => `lectura-${p}`),
  'actividad-despacho',
  ...['propuestas', 'bandeja', 'esperas', 'decisiones'].map(c => `actividad-${c}`),
  'retos-ejemplo',
  'reto-paso',
  'reto-fin',
  'equipo-ejemplo',
  'preguntas-institucion',
  ...rango(6).map(i => `pregunta-${i}`)
]

/** Campos de más que llevan algunos bloques de texto. */
const CAMPOS_EXTRA = {
  cargos: ['orden'],
  'nivel-1': bilingue('enlace'),
  'nivel-2': bilingue('enlace'),
  'nivel-3': bilingue('enlace'),
  'nivel-4': bilingue('enlace')
}

/**
 * Lo que un caso o un texto de venta no puede prometer. Los bloques `limite-*` quedan
 * fuera a propósito: son justo los que dicen que NO se acredita nada de esto.
 */
export const VETADAS = [
  /\bahorr[oaáe]/i,
  /\bgarant[ií]/i,
  /\bcertificad/i,
  /\binfalible/i,
  /\bsin errores\b/i,
  /\bsavings?\b/i,
  /\bguarantee/i,
  /\bcertified\b/i,
  /\berror-free\b/i,
  /\b100\s?%/
]

const RE_CABECERA = /^###\s+([a-z0-9-]+)\s*$/
const RE_CAMPO = /^([a-z0-9_]+):\s*(.+?)\s*$/

/** Bloques `### <clave>` + `campo: valor`, sin esquema: el esquema se comprueba después. */
export function parsear(md) {
  const bloques = {}
  let actual = null

  for (const linea of md.split('\n')) {
    const cab = RE_CABECERA.exec(linea)

    if (cab) {
      actual = bloques[cab[1]] = {}
      continue
    }

    // Un título de sección (`## …`) cierra el bloque en curso: lo que venga debajo no es suyo.
    if (/^##\s/.test(linea)) {
      actual = null
      continue
    }

    if (!actual) continue
    const campo = RE_CAMPO.exec(linea)

    if (campo) actual[campo[1]] = campo[2]
  }

  return bloques
}

/** Comprueba el esquema y las reglas del contenido. Devuelve los avisos; vacío = válido. */
export function validar(bloques) {
  const avisos = []
  const esCaso = clave => /^caso-[a-z]+$/.test(clave)

  for (const clave of BLOQUES_EXIGIDOS) {
    if (!bloques[clave]) avisos.push(`falta el bloque «${clave}»`)
  }

  for (const [clave, bloque] of Object.entries(bloques)) {
    const exigidos = esCaso(clave) ? CAMPOS_CASO : [...CAMPOS_TEXTO, ...(CAMPOS_EXTRA[clave] ?? [])]
    const faltan = exigidos.filter(c => !bloque[c])
    const sobran = Object.keys(bloque).filter(c => !exigidos.includes(c))

    if (faltan.length) avisos.push(`«${clave}»: faltan ${faltan.join(', ')}`)
    if (sobran.length) avisos.push(`«${clave}»: campos que no se esperan (¿errata?) ${sobran.join(', ')}`)

    if (!esCaso(clave) && !BLOQUES_EXIGIDOS.includes(clave)) avisos.push(`«${clave}»: bloque que ninguna página usa`)

    if (!clave.startsWith('limite')) {
      for (const [campo, valor] of Object.entries(bloque)) {
        const vetada = VETADAS.find(re => re.test(valor))

        if (vetada) avisos.push(`«${clave}».${campo}: promete un resultado (${vetada}) → «${valor.slice(0, 60)}»`)
      }
    }

    if (!esCaso(clave)) continue

    for (const i of rango(FORMA_CASO.llega)) {
      const canal = bloque[`canal_${i}`]

      if (canal && !CANALES.includes(canal)) avisos.push(`«${clave}».canal_${i}: «${canal}» no es un canal que el clon ingiera`)
    }

    if (bloque.reto_altura && !ALTURAS.includes(bloque.reto_altura)) avisos.push(`«${clave}».reto_altura: «${bloque.reto_altura}» no es una altura`)
    if (bloque.icono && !/^ri-[a-z0-9-]+$/.test(bloque.icono)) avisos.push(`«${clave}».icono: «${bloque.icono}» no es un icono de la plantilla`)
  }

  const orden = (bloques.cargos?.orden ?? '').split(/\s+/).filter(Boolean)
  const casos = Object.keys(bloques).filter(esCaso).map(c => c.replace(/^caso-/, ''))

  if (!orden.length) avisos.push('«cargos».orden está vacío: no hay ningún caso que enseñar')
  orden.filter(c => !casos.includes(c)).forEach(c => avisos.push(`«cargos».orden nombra «${c}» y no existe el bloque «caso-${c}»`))
  casos.filter(c => !orden.includes(c)).forEach(c => avisos.push(`el bloque «caso-${c}» no está en «cargos».orden: no se enseñaría`))
  if (new Set(orden).size !== orden.length) avisos.push('«cargos».orden repite una clave')

  return avisos
}

export function generar(md = readFileSync(CASOS_MD, 'utf8')) {
  const bloques = parsear(md)
  const avisos = validar(bloques)
  const esCaso = clave => /^caso-[a-z]+$/.test(clave)
  const orden = (bloques.cargos?.orden ?? '').split(/\s+/).filter(Boolean)

  const textos = Object.fromEntries(Object.entries(bloques).filter(([clave]) => !esCaso(clave)))

  const casos = Object.fromEntries(
    Object.entries(bloques).filter(([clave]) => esCaso(clave)).map(([clave, bloque]) => [clave.replace(/^caso-/, ''), bloque])
  )

  const cuerpo =
    '// GENERADO por scripts/build-copia-casos.mjs en cada build. NO EDITAR A MANO.\n' +
    '// Fuente única: exporter/casos.md (el copy público «para quien decide», en ES y EN).\n' +
    '//\n' +
    '// Viaja con el build a propósito: un texto colgado de un JSON se queda cacheado\n' +
    '// hasta 24 h en el navegador de quien ya nos había visitado, y la página saldría\n' +
    '// muda. Del dato solo vienen las cifras.\n' +
    `export const CASOS_ORDEN: string[] = ${JSON.stringify(orden)}\n\n` +
    `export const CASOS_TEXTOS: Record<string, Record<string, string>> = ${JSON.stringify(textos, null, 2)}\n\n` +
    `export const CASOS_FICHAS: Record<string, Record<string, string>> = ${JSON.stringify(casos, null, 2)}\n`

  return { cuerpo, bloques, textos, casos, orden, avisos }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const { cuerpo, textos, orden, avisos } = generar()
  const resumen = `${orden.length} casos · ${Object.keys(textos).length} bloques de texto`

  avisos.forEach(a => console.log(`  AVISO copia de casos · ${a}`))

  if (process.argv.includes('--comprobar')) {
    const actual = (() => {
      try {
        return readFileSync(DESTINO, 'utf8')
      } catch {
        return ''
      }
    })()

    if (actual !== cuerpo || avisos.length) {
      console.log('  FALLO · src/lib/copia-casos.ts no coincide con exporter/casos.md, o la fuente incumple sus reglas')
      console.log('          arréglalo con: node scripts/build-copia-casos.mjs')
      process.exit(1)
    }

    console.log(`build-copia-casos · ${resumen} · al día`)
  } else {
    if (avisos.length) {
      console.log('  FALLO · exporter/casos.md incumple sus reglas; no se hornea un contenido a medias')
      process.exit(1)
    }

    writeFileSync(DESTINO, cuerpo)
    console.log(`build-copia-casos · ${resumen} horneados`)
  }
}
