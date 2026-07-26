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

export function usePanelData(): { data: PanelData | null; error: string | null } {
  const [data, setData] = useState<PanelData | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const ficheros = ['manifest', 'overview', 'clones', 'tokens', 'serie'] as const

    Promise.all(
      ficheros.map(f =>
        fetch(`${BASE}/data/${f}.json`).then(r => {
          if (!r.ok) throw new Error(`${f}.json: HTTP ${r.status}`)

          return r.json()
        })
      )
    )
      .then(([manifest, overview, clones, tokens, serie]) => setData({ manifest, overview, clones, tokens, serie }))
      .catch(e => setError(String(e)))
  }, [])

  return { data, error }
}
