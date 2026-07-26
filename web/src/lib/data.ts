import { useEffect, useState } from 'react'
import type { PanelData } from '@/types'

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

export function usePanelData(): { data: PanelData | null; error: string | null } {
  const [data, setData] = useState<PanelData | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const ficheros = ['manifest', 'overview', 'clones', 'tokens', 'serie'] as const
    Promise.all(
      ficheros.map((f) =>
        fetch(`data/${f}.json`).then((r) => {
          if (!r.ok) throw new Error(`${f}.json: HTTP ${r.status}`)
          return r.json()
        }),
      ),
    )
      .then(([manifest, overview, clones, tokens, serie]) =>
        setData({ manifest, overview, clones, tokens, serie }),
      )
      .catch((e) => setError(String(e)))
  }, [])

  return { data, error }
}

/** Emoji de estado -> clases tailwind para punto y texto */
export function colorEstado(e: string): { dot: string; text: string } {
  if (e.includes('🟢') || e.toLowerCase().includes('ok')) return { dot: 'bg-emerald-400', text: 'text-emerald-400' }
  if (e.includes('🔴') || e.toLowerCase().includes('error')) return { dot: 'bg-red-400', text: 'text-red-400' }
  if (e.includes('🟡')) return { dot: 'bg-amber-400', text: 'text-amber-400' }
  return { dot: 'bg-zinc-500', text: 'text-zinc-400' }
}
