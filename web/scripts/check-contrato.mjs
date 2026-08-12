#!/usr/bin/env node
// check-contrato.mjs — el contrato entre los datos y la web.
//
// check-hardcode vigila las CIFRAS escritas a mano. Este script vigila lo otro
// que envejece en silencio: el CONTENIDO escrito a mano y los mapas por perfil
// que no crecen cuando crece la flota.
//
// Nace de la ronda R7 (2026-08-12), después de que /historia sirviera durante
// dos semanas un último capítulo del 28 de julio y un contador de bitácoras
// congelado: la exención de check-hardcode cubría el fichero entero.
//
// Determinista: lo decide el script, no el criterio de un modelo.
//
//   node scripts/check-contrato.mjs   → informe + salida 1 si hay fallos

import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'

import { generar } from './build-historia.mjs'

const COLORES_VALIDOS = ['primary', 'success', 'info', 'warning', 'error', 'secondary']
const RE_ICONO = /^ri-[a-z0-9-]+$/
const RE_FECHA = /^\d{4}-\d{2}-\d{2}$/

// Días que la narración puede ir por detrás del trabajo antes de cantar. Mismo
// umbral que aplica el exportador (DIAS_HISTORIA_RANCIA) y que confiesa la web.
const DIAS_HISTORIA_RANCIA = 21

// El director no orbita: es el centro del mini-mapa de la anatomía.
const PERFIL_DIRECTOR = 'clon'

const leerJSON = ruta => JSON.parse(readFileSync(ruta, 'utf8'))

/** Claves de un objeto literal `const NOMBRE… = { a: …, b: … }` de un .tsx. */
function clavesDeMapa(fuente, nombre) {
  const inicio = fuente.indexOf(`const ${nombre}`)

  if (inicio === -1) return null
  const abre = fuente.indexOf('{', inicio)
  const cierra = fuente.indexOf('\n}', abre)

  if (abre === -1 || cierra === -1) return null

  return [...fuente.slice(abre, cierra).matchAll(/^\s{2}([a-z][a-z0-9_]*)\s*:/gim)].map(m => m[1])
}

/** Perfiles citados en el array `const ORBITA = [{ perfil: 'x', … }]`. */
function perfilesDeOrbita(fuente) {
  const inicio = fuente.indexOf('const ORBITA')

  if (inicio === -1) return null
  const cierra = fuente.indexOf('\n]', inicio)

  return [...fuente.slice(inicio, cierra).matchAll(/perfil:\s*'([^']+)'/g)].map(m => m[1])
}

export function comprobarContrato(base = process.cwd()) {
  const fallos = []
  const avisos = []
  const notas = []
  const falla = (regla, evidencia) => fallos.push({ regla, evidencia })

  // ── 1 · la historia llega de su fuente única, no escrita en la página ───────
  const pagina = join(base, 'src/app/(dashboard)/historia/page.tsx')
  const fuentePagina = existsSync(pagina) ? readFileSync(pagina, 'utf8') : ''

  if (/const HITOS\s*[:=]/.test(fuentePagina)) {
    falla('historia-en-codigo', 'historia/page.tsx vuelve a declarar HITOS: los capítulos van en exporter/historia.md')
  }

  // El 12/08 los capítulos se colgaron de overview.json y un documento cacheado
  // por el service worker dejó la línea de tiempo EN BLANCO durante un día.
  // El histórico tiene que viajar con el build, no con un dato cacheable.
  if (fuentePagina && !/HITOS_BUILD/.test(fuentePagina)) {
    falla('historia-colgada-del-dato',
      'historia/page.tsx ya no pinta HITOS_BUILD: si los capítulos dependen de overview.json, ' +
      'un lote cacheado deja la línea de tiempo en blanco')
  }

  // ── 1b · los capítulos horneados coinciden con exporter/historia.md ─────────
  // Se hornean en el build para que un overview.json cacheado no pueda dejar la
  // línea de tiempo en blanco (incidente del 12/08). Si alguien edita a mano el
  // fichero generado, o lo deja sin regenerar, la web y su fuente divergen.
  let horneados = []

  try {
    const { cuerpo, hitos, avisos: avisosMd } = generar()

    horneados = hitos
    avisosMd.forEach(a => avisos.push(`exporter/historia.md · ${a}`))

    const generado = join(base, 'src/lib/historia-hitos.ts')
    const enDisco = existsSync(generado) ? readFileSync(generado, 'utf8') : ''

    if (enDisco !== cuerpo) {
      falla('historia-horneada-desfasada',
        'src/lib/historia-hitos.ts no coincide con exporter/historia.md — regenera con `node scripts/build-historia.mjs`')
    }
  } catch (e) {
    falla('historia-md-ilegible', `no se pudo leer exporter/historia.md: ${e.message}`)
  }

  // ── 2 · el lote publicado trae una historia bien formada ────────────────────
  const rutaOverview = join(base, 'public/data/overview.json')

  if (!existsSync(rutaOverview)) {
    falla('overview-ausente', 'public/data/overview.json no existe: ejecuta `make data`')
  } else {
    const historia = leerJSON(rutaOverview).historia

    if (!historia) {
      falla('historia-ausente', 'overview.json no trae el bloque `historia` (exportador viejo o `make data` sin correr)')
    } else {
      const hitos = historia.hitos || []

      if (hitos.length === 0) falla('historia-vacia', 'overview.json trae `historia` sin un solo capítulo')

      hitos.forEach(h => {
        const donde = `hito ${h.fecha ?? '(sin fecha)'}`

        if (!RE_FECHA.test(h.fecha || '')) falla('hito-fecha', `${donde}: la fecha no es AAAA-MM-DD`)
        if (!RE_ICONO.test(h.icono || '')) falla('hito-icono', `${donde}: icono «${h.icono}» fuera del set ri-*`)
        if (!COLORES_VALIDOS.includes(h.color)) falla('hito-color', `${donde}: color «${h.color}» no es del tema`)

        for (const campo of ['es_titulo', 'es_texto', 'en_titulo', 'en_texto']) {
          if (!h[campo]) falla('hito-idioma', `${donde}: falta ${campo} (la web es bilingüe)`)
        }
      })

      if (historia.bitacoras == null) falla('bitacoras', 'historia.bitacoras viene vacío: el contador de la web quedaría en «—»')
      if (!historia.nacimiento) falla('nacimiento', 'historia.nacimiento viene vacío: los días de vida quedarían en «—»')

      // Frescura narrativa: avisa, NO tumba. Un capítulo con retraso no puede
      // bloquear la publicación del refresco nocturno de datos.
      const dias = historia.dias_sin_capitulo

      if (typeof dias === 'number' && dias > DIAS_HISTORIA_RANCIA) {
        avisos.push(`la historia lleva ${dias} días sin capítulo (último ${historia.ultimo_hito}) — añade un bloque a exporter/historia.md`)
      }

      // El lote y el build tienen que contar la MISMA historia: si divergen, uno
      // de los dos se publicó sin el otro.
      if (horneados.length && hitos.length && horneados.length !== hitos.length) {
        falla('historia-descuadrada',
          `el build hornea ${horneados.length} capítulos y overview.json publica ${hitos.length}: ` +
          'regenera los datos (`make data`) y vuelve a construir')
      }

      notas.push(`${hitos.length} capítulos · ${historia.bitacoras} bitácoras · último ${historia.ultimo_hito}`)
    }
  }

  // ── 3 · la flota no puede crecer sin marca ──────────────────────────────────
  const rutaClones = join(base, 'public/data/clones.json')
  const rutaAnatomia = join(base, 'src/components/dashboard/AnatomiaClon.tsx')

  if (existsSync(rutaClones) && existsSync(rutaAnatomia)) {
    const perfiles = (leerJSON(rutaClones).clones || []).map(c => c.perfil).filter(Boolean)
    const fuente = readFileSync(rutaAnatomia, 'utf8')

    const mapas = {
      ICONOS_CLON: clavesDeMapa(fuente, 'ICONOS_CLON'),
      COLORES_CLON: clavesDeMapa(fuente, 'COLORES_CLON'),
      CIERRE: clavesDeMapa(fuente, 'CIERRE')
    }

    for (const [nombre, claves] of Object.entries(mapas)) {
      if (!claves) {
        falla('mapa-ilegible', `no se pudo leer ${nombre} en AnatomiaClon.tsx`)
        continue
      }

      const huerfanos = perfiles.filter(p => !claves.includes(p))

      if (huerfanos.length) {
        falla('perfil-sin-marca', `${nombre} no cubre ${huerfanos.join(', ')}: ese clon saldría sin icono/color/texto propio`)
      }
    }

    const orbita = perfilesDeOrbita(fuente)

    if (!orbita) {
      falla('orbita-ilegible', 'no se pudo leer ORBITA en AnatomiaClon.tsx')
    } else {
      const deberian = perfiles.filter(p => p !== PERFIL_DIRECTOR)
      const faltan = deberian.filter(p => !orbita.includes(p))
      const sobran = orbita.filter(p => !deberian.includes(p))

      if (faltan.length || sobran.length) {
        falla('orbita-desalineada',
          `el mini-mapa no coincide con la flota real${faltan.length ? ` · faltan ${faltan.join(', ')}` : ''}` +
          `${sobran.length ? ` · sobran ${sobran.join(', ')}` : ''}`)
      }
    }

    notas.push(`flota ${perfiles.length} perfiles · órbita ${orbita ? orbita.length : '?'}`)
  }

  return { fallos, avisos, notas }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const { fallos, avisos, notas } = comprobarContrato()

  console.log(`check-contrato · ${notas.join(' · ')}`)
  fallos.forEach(f => console.log(`  FALLO ${f.regla} → ${f.evidencia}`))
  avisos.forEach(a => console.log(`  AVISO ${a}`))
  console.log(fallos.length === 0 ? `  OK · contrato de datos intacto${avisos.length ? ` (${avisos.length} aviso/s)` : ''}` : `  FALLO · ${fallos.length} roturas de contrato`)
  process.exit(fallos.length === 0 ? 0 : 1)
}
