// Capa de datos del Front Office — lee los JSON agregados que genera exporter/export_panel.py

export type Manifest = {
  generado: string
  version: number
  avisos: string[]
  fuentes: string[]
}

export type Cron = { nombre: string; ambito: string; estado: string; ultima: string }

export type Overview = {
  gtd: {
    propuestas: number | null
    bandeja: number | null
    esperas_vencidas: number | null
    esperas_listadas: number | null
    decisiones: number | null
    acciones_hoy: number | null
  }
  personas: { fichas_curadas: number | null; staged: number | null }
  automejora: {
    hechas: number
    bloqueadas: number
    aparcadas: number
    pendientes: number
    llamadas: number | null
    metered: number
    top: string
  }
  crons: Cron[]
  crons_en_error: number
  gateways?: string[]
  healthcheck?: { problemas: number; ts: string; head: string }
  tokens_resumen?: { tokens_30d: number | null; cobertura_pct: number | null; indice_eficiencia?: number | null }
  salud_global?: string
  watchdog_ts?: string

  /** Historia del clon: capítulos curados + cifras contadas en cada refresco. */
  historia?: Historia
}

/**
 * Un clon de la flota. Aquí NO viajan sus palabras: el rol y la misión los pone
 * `OFICIOS_BUILD` (horneado de `exporter/misiones.md`), cruzado por `perfil`.
 *
 * Hasta el 13/08/2026 este objeto traía el texto de las vistas privadas del
 * vault palabra por palabra, y así se publicó en abierto el nombre de una
 * operación patrimonial viva.
 */
export type ClonePerfil = {
  perfil: string
  canales: string[]

  /** Claves de conexión (ver `Integracion.clave`), no etiquetas legibles. */
  correo: string | null
  calendarios: string[]
}

/** Rol y misión públicos de un clon. Fuente: `exporter/misiones.md`. */
export type OficioPublico = {
  es_rol: string
  en_rol: string
  es_mision: string
  en_mision: string
}

/** Nombre público de un buzón o agenda. Fuente: `exporter/conexiones.md`. */
export type ConexionPublica = {
  es_nombre: string
  en_nombre: string
}

/**
 * Un buzón o una agenda vigilados. `clave` es un derivado estable de la
 * etiqueta del vault: hace de cruce con `ClonePerfil.correo/calendarios` y con
 * `CONEXIONES_BUILD`, que es de donde sale el nombre visible. La etiqueta del
 * vault no viaja, porque lleva dentro el nombre de las organizaciones de MAD.
 */
export type Integracion = {
  clave: string
  estado: string
  ultimo_ok: string | null
  ultimo_fallo: string | null
  detalle: string
}

export type ClonesData = {
  clones: ClonePerfil[]
  integraciones: Integracion[]
  salud_global?: string
  watchdog_ts?: string
}

/**
 * Un capítulo de la línea de tiempo. Nace en exporter/historia.md y llega aquí
 * por el refresco nocturno: la web NO lleva hitos escritos en el código, que es
 * lo que hacía que /historia envejeciera en silencio.
 */
export type Hito = {
  fecha: string
  icono: string
  color: string
  es_titulo: string
  es_texto: string
  en_titulo: string
  en_texto: string
}

export type Historia = {
  hitos: Hito[]

  /** Bitácoras del vault, contadas en cada pasada (nunca a mano). */
  bitacoras: number | null
  nacimiento: string | null
  ultima_bitacora: string | null
  ultimo_hito: string | null

  /** Días que la narración lleva por detrás del trabajo. La web lo confiesa. */
  dias_sin_capitulo: number | null
}

export type Kpi = {
  estado: string
  nombre: string
  ahora: string
  base: string
  variacion: string
  ahora_num: number | null
  significado: string
}

export type TokensData = {
  contador: {
    medido_tokens: number | null
    medido_llamadas: number | null
    estimado_tokens: number | null
    estimado_llamadas: number | null
    total_tokens: number | null
    total_llamadas: number | null
    entrada: number | null
    salida: number | null
    cache: number | null
    razonamiento: number | null
    banda_p25: number | null
    banda_p75: number | null
    cobertura_pct: number | null
    ventana_30d: number | null
    ventana_7d: number | null
    hoy: number | null
  }
  kpis: { eficiencia: Kpi[]; eficacia: Kpi[]; honestidad: Kpi[] }
  soporte?: string
  linea_base_fecha?: string
  intervenciones: { estado: string; cambio: string; fecha: string; efecto: string }[]
  por_clon: { clon: string; tokens: number | null; llamadas: number | null; modelos: string }[]
  por_modelo: { modelo: string; total: number | null; entrada: number | null; salida: number | null; llamadas: number | null; est: string | null }[]
}

export type PuntoSerie = { fecha: string; contexto?: Record<string, number>; kpis?: Record<string, number> }

export type SerieData = {
  serie: PuntoSerie[]
  linea_base: { congelada?: string; kpis?: Record<string, { valor: number } | number> }
  intervenciones_raw: { id: string; fecha: string; que: string; kpi: string }[]
}

export type PanelData = {
  manifest: Manifest
  overview: Overview
  clones: ClonesData
  tokens: TokensData
  serie: SerieData
}

// ---------------------------------------------------------------- formatos

const nf = new Intl.NumberFormat('es-ES')

export function fmt(n: number | null | undefined): string {
  if (n === null || n === undefined || Number.isNaN(n)) return '—'

  return nf.format(n)
}

/** 451.208.022 -> "451 M" · 76.511.939 -> "76,5 M" */
export function fmtCorto(n: number | null | undefined): string {
  if (n === null || n === undefined) return '—'

  if (Math.abs(n) >= 1_000_000) {
    const v = n / 1_000_000

    return `${v >= 100 ? Math.round(v) : v.toFixed(1).replace('.', ',')} M`
  }

  if (Math.abs(n) >= 10_000) return `${Math.round(n / 1000)} mil`

  return fmt(n)
}

export function fmtFecha(iso: string | null | undefined, conHora = true): string {
  if (!iso) return '—'
  const d = new Date(iso)

  return d.toLocaleString('es-ES', conHora
    ? { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }
    : { day: 'numeric', month: 'long', year: 'numeric' })
}

// ---------------------------------------------------------------- carga

import { useEffect, useState } from 'react'

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? ''

// ---------------------------------------------------------------- carga fail-soft
// Decisión de MAD (2026-08-03): mejor datos incompletos que una página de error.
// Cada documento se valida por separado; el que falla deja su sección «en revisión»
// y el resto del panel sigue funcionando. Nunca hay fallo total por UN documento.

export type DocNombre = 'manifest' | 'overview' | 'clones' | 'tokens' | 'serie'

export const DOCS: DocNombre[] = ['manifest', 'overview', 'clones', 'tokens', 'serie']

const MAX_DOC_BYTES = 128 * 1024
const FETCH_TIMEOUT_MS = 5000

// Esquema canónico del estado retenido (contención). Si el manifiesto lo
// declara, la web entera muestra el estado protegido: no es un fallo, es una
// decisión explícita de la fuente.
const CONTAINMENT_SCHEMA = 'madclon.public-containment.v1'

const esObjeto = (v: unknown): v is Record<string, unknown> => v !== null && typeof v === 'object' && !Array.isArray(v)

// Validadores estructurales tolerantes: exigen la forma mínima que las páginas
// necesitan y admiten campos extra (el exportador puede crecer sin romper la web).
const validadores: Record<DocNombre, (v: unknown) => boolean> = {
  manifest: v => esObjeto(v) && typeof v.generado === 'string' && typeof v.version === 'number',
  overview: v => esObjeto(v) && esObjeto(v.gtd) && esObjeto(v.personas) && esObjeto(v.automejora) && Array.isArray(v.crons),
  clones: v => esObjeto(v) && Array.isArray(v.clones) && Array.isArray(v.integraciones),
  tokens: v => esObjeto(v) && esObjeto(v.contador) && esObjeto(v.kpis) && Array.isArray(v.intervenciones),
  serie: v => esObjeto(v) && Array.isArray(v.serie) && esObjeto(v.linea_base)
}

async function leerDoc(nombre: DocNombre): Promise<unknown> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)
  let respuesta: Response

  try {
    respuesta = await fetch(`${BASE}/data/${nombre}.json`, { method: 'GET', signal: controller.signal })
  } finally {
    clearTimeout(timeout)
  }

  if (!respuesta.ok) throw new Error(`${nombre}: HTTP ${respuesta.status}`)

  const texto = await respuesta.text()

  if (new TextEncoder().encode(texto).byteLength > MAX_DOC_BYTES) throw new Error(`${nombre}: demasiado grande`)

  const valor: unknown = JSON.parse(texto)

  // Manifiesto retenido: pasa al estado protegido en lugar de validar la forma legada
  if (nombre === 'manifest' && esObjeto(valor) && valor.schema === CONTAINMENT_SCHEMA && typeof valor.generated_at === 'string') {
    return { __retenido: valor.generated_at }
  }

  if (!validadores[nombre](valor)) throw new Error(`${nombre}: forma inesperada`)

  return valor
}

export type PanelDataCarga = {
  data: Partial<PanelData>

  /** Documentos que no cargaron o no validaron: su sección se muestra «en revisión». */
  faltantes: DocNombre[]

  /** true solo cuando NINGÚN documento cargó (sin red y sin caché): mensaje offline. */
  sinNada: boolean

  /** Sello UTC si la instantánea está retenida por la fuente: estado protegido, no error. */
  retenido: string | null
  cargando: boolean
}

export function usePanelData(): PanelDataCarga {
  const [estado, setEstado] = useState<PanelDataCarga>({ data: {}, faltantes: [], sinNada: false, retenido: null, cargando: true })

  useEffect(() => {
    let cancelado = false
    let reintento: ReturnType<typeof setTimeout> | null = null

    const carga = async () => {
      const resultados = await Promise.allSettled(DOCS.map(leerDoc))

      if (cancelado) return

      const data: Partial<PanelData> = {}
      const faltantes: DocNombre[] = []
      let retenido: string | null = null

      resultados.forEach((r, i) => {
        const nombre = DOCS[i]

        if (r.status === 'fulfilled') {
          const valor = r.value as Record<string, unknown>

          if (nombre === 'manifest' && typeof valor.__retenido === 'string') {
            retenido = valor.__retenido
          } else {
            // El validador ya garantizó la forma mínima de cada documento.
            ;(data as Record<string, unknown>)[nombre] = valor
          }
        } else {
          faltantes.push(nombre)
        }
      })

      setEstado({ data, faltantes, sinNada: !retenido && faltantes.length === DOCS.length, retenido, cargando: false })
    }

    // Un reintento a los 1,5 s: si el service worker acaba de despertar en frío
    // (offline), la primera ráfaga de peticiones puede llegar antes que él.
    carga().catch(() => {
      reintento = setTimeout(() => {
        if (!cancelado) carga().catch(() => !cancelado && setEstado(s => ({ ...s, cargando: false })))
      }, 1500)
    })

    return () => {
      cancelado = true
      if (reintento) clearTimeout(reintento)
    }
  }, [])

  return estado
}
