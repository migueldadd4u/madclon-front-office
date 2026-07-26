export interface Manifest {
  generado: string
  version: number
  avisos: string[]
  fuentes: string[]
}

export interface Cron {
  nombre: string
  ambito: string
  estado: string
  ultima: string
}

export interface Overview {
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

export interface Clone {
  perfil: string
  rol: string
  canales: string[]
  correo: string | null
  calendarios: string[]
  mision?: string | null
}

export interface Integracion {
  nombre: string
  estado: string
  ultimo_ok: string | null
  ultimo_fallo: string | null
  detalle: string
}

export interface ClonesData {
  clones: Clone[]
  integraciones: Integracion[]
  salud_global?: string
  watchdog_ts?: string
}

export interface Kpi {
  estado: string
  nombre: string
  ahora: string
  base: string
  variacion: string
  ahora_num: number | null
  significado: string
}

export interface TokensData {
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

export interface PuntoSerie {
  fecha: string
  contexto?: Record<string, number>
  kpis?: Record<string, number>
}

export interface SerieData {
  serie: PuntoSerie[]
  linea_base: { congelada?: string; kpis?: Record<string, { valor: number } | number> }
  intervenciones_raw: { id: string; fecha: string; que: string; kpi: string }[]
}

export interface PanelData {
  manifest: Manifest
  overview: Overview
  clones: ClonesData
  tokens: TokensData
  serie: SerieData
}
