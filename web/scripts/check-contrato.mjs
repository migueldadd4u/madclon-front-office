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
import { generar as generarCopia } from './build-copia-publica.mjs'
import { generar as generarRetos } from './build-copia-retos.mjs'

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
  /** Lee un fichero o devuelve null: un fichero que falta es un fallo con nombre, no una excepción. */
  const leerSiExiste = url => {
    try {
      return readFileSync(url, 'utf8')
    } catch {
      return null
    }
  }

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

  // ── 4 · las palabras de la flota: horneadas, y del sitio correcto ──────────
  // El 13/08/2026 /flota llevaba meses publicando el `**Misión:**` de las vistas
  // privadas de subclones y el `rol` de la tabla del vault, palabra por palabra:
  // el nombre de una operación patrimonial viva, los nombres de las empresas y
  // varios tecnicismos sin traducir. Ni public-safety ni check-copy lo vieron,
  // porque los dos auditan el CÓDIGO y esto viajaba en un JSON de DATOS.
  //
  // Se arregló en dos movimientos, y esta regla vigila los dos:
  //   a) el copy vive en exporter/misiones.md + exporter/conexiones.md, curado;
  //   b) viaja HORNEADO en el build, no en el lote — que es cacheable 24 h y
  //      dejaría la flota muda (misma lección que la regla 1b, de /historia).
  //
  // No enumera palabras prohibidas: eso solo detecta el pasado. Exige que el
  // fichero horneado SEA, carácter a carácter, el de sus fuentes, y que el lote
  // no traiga texto ninguno — solo las claves con las que se cruza.
  let horneada = null

  try {
    const { cuerpo, oficios, conexiones, avisos: avisosMd } = generarCopia()

    horneada = { oficios, conexiones }
    avisosMd.forEach(a => avisos.push(`copia pública · ${a}`))

    const generado = join(base, 'src/lib/copia-publica.ts')
    const enDisco = existsSync(generado) ? readFileSync(generado, 'utf8') : ''

    if (enDisco !== cuerpo) {
      falla('copia-publica-desfasada',
        'src/lib/copia-publica.ts no coincide con exporter/misiones.md + conexiones.md — ' +
        'regenera con `node scripts/build-copia-publica.mjs`')
    }
  } catch (e) {
    falla('copia-publica-ilegible', `no se pudieron leer las fuentes de copy público: ${e.message}`)
  }

  // Las páginas tienen que pintar lo horneado. Si alguien vuelve a colgar el
  // copy del dato, esto falla aunque el lote de ese día lo traiga y se vea bien.
  for (const [ruta, simbolo] of [
    ['src/app/(dashboard)/flota/page.tsx', 'OFICIOS_BUILD'],
    ['src/components/dashboard/AnatomiaClon.tsx', 'OFICIOS_BUILD'],
    ['src/components/dashboard/AnatomiaClon.tsx', 'CONEXIONES_BUILD'],
    ['src/app/(dashboard)/salud/page.tsx', 'CONEXIONES_BUILD']
  ]) {
    const fuente = existsSync(join(base, ruta)) ? readFileSync(join(base, ruta), 'utf8') : ''

    if (fuente && !fuente.includes(simbolo)) {
      falla('copia-colgada-del-dato',
        `${ruta} ya no pinta ${simbolo}: si el copy vuelve a depender del lote, ` +
        'un dato cacheado deja la página muda')
    }
  }

  if (existsSync(rutaClones) && horneada) {
    const datos = leerJSON(rutaClones)
    const clones = datos.clones || []
    const integraciones = datos.integraciones || []

    // a) ni el texto del vault ni su sustituto público viajan en el lote
    const PROHIBIDAS_CLON = ['rol', 'mision', 'es_rol', 'en_rol', 'es_mision', 'en_mision']
    const PROHIBIDAS_INTEGRA = ['nombre', 'es_nombre', 'en_nombre']

    clones.forEach(c => {
      for (const campo of PROHIBIDAS_CLON) {
        if (campo in c) {
          falla('flota-texto-en-el-lote',
            `clon «${c.perfil}»: clones.json trae «${campo}» — las palabras van horneadas, ` +
            'y si son del vault además son privadas')
        }
      }

      if (!horneada.oficios[c.perfil]) {
        falla('flota-sin-copia-publica',
          `clon «${c.perfil}»: no tiene bloque en exporter/misiones.md — su tarjeta saldría muda`)
      }
    })

    // b) las conexiones se cruzan por clave, y cada clave tiene nombre público
    const claves = new Set()

    integraciones.forEach(i => {
      for (const campo of PROHIBIDAS_INTEGRA) {
        if (campo in i) {
          falla('conexion-texto-en-el-lote',
            `integración «${i.clave ?? '?'}»: el lote trae «${campo}» — la etiqueta del vault ` +
            'lleva dentro el nombre de las organizaciones, y el nombre público va horneado')
        }
      }

      if (!i.clave) {
        falla('conexion-sin-clave', 'una integración llega sin `clave`: nada puede cruzarla con su clon')

        return
      }

      claves.add(i.clave)

      if (!horneada.conexiones[i.clave]) {
        falla('conexion-sin-nombre-publico',
          `integración «${i.clave}»: sin bloque en exporter/conexiones.md — saldría anónima en /salud ` +
          '(saca la clave con `python3 exporter/export_panel.py --claves-conexiones`)')
      }
    })

    // c) el cruce cierra: toda conexión citada por un clon existe arriba
    clones.forEach(c => {
      for (const clave of [c.correo, ...(c.calendarios || [])].filter(Boolean)) {
        if (!claves.has(clave)) {
          falla('conexion-huerfana',
            `clon «${c.perfil}» cita la conexión «${clave}», que no está en integraciones: ` +
            'su capa 2 la pintaría como «sin señal»')
        }
      }
    })

    notas.push(`copia horneada ${Object.keys(horneada.oficios).length} oficios · ${integraciones.length} conexiones`)
  }

  // ── 5) La página de los retos (arco «El escaparate cuenta el reto», 05/09/2026) ──
  // Tres cosas que no se pueden romper sin que nadie se entere:
  //   a) lo horneado coincide con exporter/retos.md y no falta ningún bloque;
  //   b) «lo que el clon no hace» está en la MISMA tarjeta que «cómo propone» —
  //      contado a medias, esto parece vigilancia (decisión de MAD, P-7);
  //   c) en la fase 0 la página no pinta cifras: no hay retos suficientes para que
  //      una media signifique algo, y un número inventado es peor que ninguno.
  {
    const retos = generarRetos()

    if (retos.avisos.length) {
      retos.avisos.forEach(a => falla('copia-retos-incompleta', `exporter/retos.md: ${a}`))
    }

    const horneadoRetos = leerSiExiste(new URL('../src/lib/copia-retos.ts', import.meta.url))

    if (horneadoRetos !== retos.cuerpo) {
      falla('copia-retos-desfasada',
        'src/lib/copia-retos.ts no coincide con exporter/retos.md — regenera con ' +
        '`node scripts/build-copia-retos.mjs`')
    }

    const pagina = leerSiExiste(new URL('../src/app/(dashboard)/retos/page.tsx', import.meta.url))

    if (!pagina) {
      falla('retos-sin-pagina', 'src/app/(dashboard)/retos/page.tsx no existe: el menú apuntaría a un 404')
    } else {
      const iCom = pagina.indexOf('data-como-propone')
      const iNo = pagina.indexOf('data-no-hace')
      const cierre = iCom === -1 ? -1 : pagina.indexOf('</Card>', iCom)

      if (iCom === -1 || iNo === -1 || iNo < iCom || (cierre !== -1 && iNo > cierre)) {
        falla('contrapeso-separado',
          '«lo que el clon no hace» (data-no-hace) tiene que ir DENTRO de la misma tarjeta que ' +
          '«cómo propone» (data-como-propone): separarlos deja media verdad en una web pública')
      }

      if (!pagina.includes('data-sin-cifras')) {
        falla('retos-sin-aviso-de-cifras',
          'la fase 0 no publica agregados: la página debe llevar el bloque data-sin-cifras que lo dice')
      }
    }

    notas.push(`copia de retos ${Object.keys(retos.bloques).length} bloques`)
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
