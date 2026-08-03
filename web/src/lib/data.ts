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
}

export type ClonePerfil = {
  perfil: string
  rol: string
  canales: string[]
  correo: string | null
  calendarios: string[]
  mision?: string | null
}

export type Integracion = {
  nombre: string
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
const PUBLIC_SCHEMA = 'madclon.public-containment.v1'
const MAX_PUBLIC_DOCUMENT_BYTES = 64 * 1024
const PUBLIC_FETCH_TIMEOUT_MS = 2000
const PUBLIC_FILES = ['manifest', 'overview', 'clones', 'tokens', 'serie'] as const

type PublicLoadError = 'fuente-no-disponible'

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value)

const hasExactKeys = (value: Record<string, unknown>, expected: string[]) => {
  const actual = Object.keys(value).sort()
  const wanted = [...expected].sort()

  return actual.length === wanted.length && actual.every((key, index) => key === wanted[index])
}

function validUtcTimestamp(value: unknown): value is string {
  if (typeof value !== 'string') return false
  const match = value.match(/^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})(?:\.(\d{1,3}))?Z$/)

  if (!match) return false
  const milliseconds = (match[2] || '').padEnd(3, '0')
  const normalized = `${match[1]}.${milliseconds}Z`
  const parsed = new Date(normalized)

  return !Number.isNaN(parsed.getTime()) && parsed.toISOString() === normalized && parsed.getTime() <= Date.now() + 5 * 60 * 1000
}

function canonicalizarDocumentoPublico(nombre: (typeof PUBLIC_FILES)[number], value: unknown): string | null {
  if (!isRecord(value)) return null

  if (nombre === 'manifest') {
    if (
      !hasExactKeys(value, ['schema', 'generated_at']) ||
      value.schema !== PUBLIC_SCHEMA ||
      !validUtcTimestamp(value.generated_at)
    ) {
      return null
    }

    return `${JSON.stringify({ schema: value.schema, generated_at: value.generated_at })}\n`
  }

  if (nombre === 'serie') {
    if (
      !hasExactKeys(value, ['schema', 'status', 'points']) ||
      value.schema !== PUBLIC_SCHEMA ||
      value.status !== 'withheld' ||
      !Array.isArray(value.points) ||
      value.points.length !== 0
    ) {
      return null
    }

    return `${JSON.stringify({ schema: value.schema, status: value.status, points: value.points })}\n`
  }

  if (
    !hasExactKeys(value, ['schema', 'status']) ||
    value.schema !== PUBLIC_SCHEMA ||
    value.status !== 'withheld'
  ) {
    return null
  }

  return `${JSON.stringify({ schema: value.schema, status: value.status })}\n`
}

function interpretarInstantaneaPublica(documentos: unknown[]): string | null {
  if (documentos.length !== PUBLIC_FILES.length) return null
  const [manifest, overview, clones, tokens, serie] = documentos

  if (
    !isRecord(manifest) ||
    !hasExactKeys(manifest, ['schema', 'generated_at']) ||
    manifest.schema !== PUBLIC_SCHEMA ||
    !validUtcTimestamp(manifest.generated_at)
  ) {
    return null
  }

  const retenido = (value: unknown) =>
    isRecord(value) &&
    hasExactKeys(value, ['schema', 'status']) &&
    value.schema === PUBLIC_SCHEMA &&
    value.status === 'withheld'

  if (!retenido(overview) || !retenido(clones) || !retenido(tokens)) return null

  if (
    !isRecord(serie) ||
    !hasExactKeys(serie, ['schema', 'status', 'points']) ||
    serie.schema !== PUBLIC_SCHEMA ||
    serie.status !== 'withheld' ||
    !Array.isArray(serie.points) ||
    serie.points.length !== 0
  ) {
    return null
  }

  return manifest.generated_at
}

async function leerDocumentoPublico(nombre: (typeof PUBLIC_FILES)[number]): Promise<unknown> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), PUBLIC_FETCH_TIMEOUT_MS)
  let respuesta: Response

  try {
    respuesta = await fetch(`${BASE}/data/${nombre}.json`, { method: 'GET', signal: controller.signal })
  } finally {
    clearTimeout(timeout)
  }

  if (!respuesta.ok) throw new Error('fuente-no-disponible')
  const declarado = Number(respuesta.headers.get('content-length'))

  if (Number.isFinite(declarado) && declarado > MAX_PUBLIC_DOCUMENT_BYTES) {
    throw new Error('fuente-no-disponible')
  }

  const texto = await respuesta.text()

  if (new TextEncoder().encode(texto).byteLength > MAX_PUBLIC_DOCUMENT_BYTES) {
    throw new Error('fuente-no-disponible')
  }

  try {
    const value: unknown = JSON.parse(texto)

    if (texto !== canonicalizarDocumentoPublico(nombre, value)) throw new Error('fuente-no-disponible')

    return value
  } catch {
    throw new Error('fuente-no-disponible')
  }
}

export function usePanelData(): {
  data: PanelData | null
  error: PublicLoadError | null
  withheldAt: string | null
} {
  const data: PanelData | null = null
  const [error, setError] = useState<PublicLoadError | null>(null)
  const [withheldAt, setWithheldAt] = useState<string | null>(null)

  useEffect(() => {
    let cancelado = false
    let reintento: ReturnType<typeof setTimeout> | null = null

    const carga = async () => {
      const documentos = await Promise.all(PUBLIC_FILES.map(leerDocumentoPublico))
      const generado = interpretarInstantaneaPublica(documentos)

      if (!generado) throw new Error('fuente-no-disponible')
      if (!cancelado) setWithheldAt(generado)
    }

    // Un reintento a los 1,5 s: si el service worker acaba de despertar en frío
    // (offline), la primera ráfaga de peticiones puede llegar antes que él.
    carga()
      .catch(() => {
        reintento = setTimeout(() => {
          if (cancelado) return
          carga().catch(() => !cancelado && setError('fuente-no-disponible'))
        }, 1500)
      })

    return () => {
      cancelado = true
      if (reintento) clearTimeout(reintento)
    }
  }, [])

  return { data, error, withheldAt }
}
