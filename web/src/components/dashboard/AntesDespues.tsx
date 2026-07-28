'use client'

// React Imports
import { useEffect, useState } from 'react'

// MUI Imports
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import Typography from '@mui/material/Typography'

// Hook Imports
import { useLang } from '@/lib/i18n'
import type { Lang } from '@/lib/i18n'

// Data Imports
import { fmt, fmtCorto } from '@/lib/data'
import type { SerieData } from '@/lib/data'

type Metrica = {
  id: string
  nombre: Record<Lang, string>
  mejor: 'baja' | 'sube'
  formato: (n: number) => string
}

const pct = (n: number): string => `${n.toFixed(1).replace('.', ',')} %`

const METRICAS: Metrica[] = [
  {
    id: 'tokens_motor_por_tarea',
    nombre: { es: 'coste de una tarea (tokens del motor)', en: 'cost of one task (engine tokens)' },
    mejor: 'baja',
    formato: fmtCorto
  },
  {
    id: 'cobertura_medida',
    nombre: { es: 'cobertura medida', en: 'measured coverage' },
    mejor: 'sube',
    formato: pct
  },
  {
    id: 'pct_cache',
    nombre: { es: 'entrada servida por caché', en: 'input served from cache' },
    mejor: 'sube',
    formato: pct
  },
  {
    id: 'entrada_por_llamada',
    nombre: { es: 'entrada por llamada', en: 'input per call' },
    mejor: 'baja',
    formato: fmt
  }
]

/** Lee el valor de la línea base (puede venir como { valor } o número). */
function baseDe(serie: SerieData, id: string): number | null {
  const v = serie.linea_base?.kpis?.[id]

  if (v === null || v === undefined) return null

  return typeof v === 'number' ? v : (v as { valor?: number }).valor ?? null
}

type Props = { serie: SerieData }

/**
 * Comparador antes/después — la línea base congelada frente al dato de hoy,
 * en la misma escala, con las barras de «hoy» creciendo animadas al entrar.
 * Datos: serie.json (línea base + último punto), mismos números de la página.
 */
const AntesDespues = ({ serie }: Props) => {
  const { lang, t } = useLang()
  const [animado, setAnimado] = useState(false)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setAnimado(true)

      return
    }
    const id = requestAnimationFrame(() => requestAnimationFrame(() => setAnimado(true)))

    return () => cancelAnimationFrame(id)
  }, [])

  const hoy = serie.serie[serie.serie.length - 1]?.kpis ?? {}
  const fechaBase = serie.linea_base?.congelada ?? ''

  const filas = METRICAS.map(m => {
    const base = baseDe(serie, m.id)
    const ahora = hoy[m.id]

    if (base === null || ahora === null || ahora === undefined) return null
    const max = Math.max(base, ahora, 1e-9)
    const delta = base !== 0 ? ((ahora - base) / Math.abs(base)) * 100 : 0
    const bueno = m.mejor === 'baja' ? delta < 0 : delta > 0

    return { m, base, ahora, max, delta, bueno }
  }).filter((f): f is NonNullable<typeof f> => f !== null)

  if (!filas.length) return null

  return (
    <Card>
      <CardContent className='flex flex-col gap-4'>
        <div className='flex flex-wrap items-baseline justify-between gap-2'>
          <Typography variant='h6'>{t('ab_titulo')}</Typography>
          <Typography variant='caption' color='text.disabled'>{t('ab_caption')}</Typography>
        </div>
        {filas.map(({ m, base, ahora, max, delta, bueno }) => (
          <Box key={m.id} className='flex flex-col gap-1'>
            <div className='flex flex-wrap items-baseline justify-between gap-2'>
              <Typography variant='body2' fontWeight={600}>{m.nombre[lang]}</Typography>
              <Chip
                size='small'
                variant='tonal'
                color={Math.abs(delta) < 1 ? 'default' : bueno ? 'success' : 'error'}
                label={`${delta > 0 ? '+' : ''}${Math.round(delta)} %`}
              />
            </div>
            {/* barra base */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Typography variant='caption' color='text.disabled' sx={{ inlineSize: 92, flexShrink: 0 }} className='font-mono'>
                {t('ab_antes')} {fechaBase.slice(5).split('-').reverse().join('/')}
              </Typography>
              <Box sx={{ flexGrow: 1, blockSize: 14, bgcolor: 'action.hover', borderRadius: 1, overflow: 'hidden' }}>
                <Box sx={{ inlineSize: `${(base / max) * 100}%`, blockSize: '100%', bgcolor: 'text.disabled', borderRadius: 1, opacity: 0.55 }} />
              </Box>
              <Typography variant='caption' color='text.secondary' sx={{ minInlineSize: 76, textAlign: 'right' }} className='font-mono'>
                {m.formato(base)}
              </Typography>
            </Box>
            {/* barra hoy */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Typography variant='caption' color='text.primary' sx={{ inlineSize: 92, flexShrink: 0 }} className='font-mono' fontWeight={600}>
                {t('ab_hoy')}
              </Typography>
              <Box sx={{ flexGrow: 1, blockSize: 14, bgcolor: 'action.hover', borderRadius: 1, overflow: 'hidden' }}>
                <Box
                  sx={{
                    inlineSize: animado ? `${(ahora / max) * 100}%` : '0%',
                    blockSize: '100%',
                    background: 'linear-gradient(90deg, #7A7FFF, #06C9A8)',
                    borderRadius: 1,
                    transition: 'inline-size 1.1s cubic-bezier(.4,0,.2,1)',
                    '@media (prefers-reduced-motion: reduce)': { transition: 'none' }
                  }}
                />
              </Box>
              <Typography variant='caption' color='text.primary' sx={{ minInlineSize: 76, textAlign: 'right' }} className='font-mono' fontWeight={600}>
                {m.formato(ahora)}
              </Typography>
            </Box>
          </Box>
        ))}
      </CardContent>
    </Card>
  )
}

export default AntesDespues
