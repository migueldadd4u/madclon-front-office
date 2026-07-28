'use client'

// React Imports
import { useEffect, useState } from 'react'

// MUI Imports
import Typography from '@mui/material/Typography'

// Hook Imports
import { useLang } from '@/lib/i18n'

// Data Imports
import { fmtCorto } from '@/lib/data'
import type { PanelData } from '@/lib/data'

// Barra de progreso del día — compara el último día medido con el ritmo
// habitual (media de los días anteriores de la serie): «fue el X % de un día
// normal». La barra crece desde 0 al entrar; con prefers-reduced-motion ya
// aparece en su valor final. Solo cifras agregadas de serie.json.

const reemplaza = (plantilla: string, valores: Record<string, string>) =>
  Object.entries(valores).reduce((acc, [k, v]) => acc.replaceAll(`{${k}}`, v), plantilla)

const ProgresoDia = ({ data }: { data: PanelData }) => {
  const { t } = useLang()
  const puntos = data.serie.serie.filter(p => p.contexto?.tokens != null)

  const [montado, setMontado] = useState(false)

  useEffect(() => {
    const id = requestAnimationFrame(() => setMontado(true))

    return () => cancelAnimationFrame(id)
  }, [])

  if (puntos.length < 2) return null

  const ultimo = puntos.at(-1)!.contexto!.tokens!
  const anteriores = puntos.slice(0, -1).map(p => p.contexto!.tokens!)
  const media = anteriores.reduce((a, b) => a + b, 0) / anteriores.length

  if (media <= 0) return null

  const pct = Math.round((ultimo / media) * 100)
  const ancho = Math.min(100, Math.max(4, pct))

  return (
    <div className='flex flex-col gap-2'>
      <div className='flex flex-wrap items-baseline justify-between gap-2'>
        <Typography variant='body2' fontWeight={500}>
          {reemplaza(t('pd_frase'), { pct: String(pct), tokens: fmtCorto(ultimo), media: fmtCorto(Math.round(media)) })}
        </Typography>
        <Typography variant='caption' color='text.disabled' className='font-mono'>
          {pct} %
        </Typography>
      </div>
      <div
        role='progressbar'
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={t('pd_aria')}
        className='bs-2.5 is-full rounded-full'
        style={{ background: 'var(--mui-palette-action-hover)' }}
      >
        <div
          className='bs-full rounded-full'
          style={{
            width: montado ? `${ancho}%` : '0%',
            background: 'linear-gradient(90deg, #7A7FFF 0%, #4E8FE8 55%, #06C9A8 100%)',
            transition: 'width 1.2s cubic-bezier(.4,0,.2,1)'
          }}
        />
      </div>
      <style>{`
        @media (prefers-reduced-motion: reduce) {
          [role='progressbar'] > div { transition: none !important; }
        }
      `}</style>
    </div>
  )
}

export default ProgresoDia
