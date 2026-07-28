'use client'

// React Imports
import { useEffect, useMemo, useState } from 'react'

// MUI Imports
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'

// Hook Imports
import { useLang } from '@/lib/i18n'

// Data Imports
import type { Cron } from '@/lib/data'

/** Extrae la hora (0-23,99) de «25/07 09:15». */
function horaDe(s: string): number | null {
  const m = /(\d{2}):(\d{2})$/.exec(s?.trim() ?? '')

  return m ? Number(m[1]) + Number(m[2]) / 60 : null
}

type Punto = { nombre: string; hora: number; estado: string; carril: number }

type Props = { crons: Cron[] }

/**
 * «Un día en la vida del clon» — franja de 24 h con un punto por rutina real,
 * en la hora en que corrió por última vez, y una línea «ahora» que se mueve.
 * Solo usa los datos ya públicos de overview.json. Accesible: cada punto es
 * un botón con tooltip también por teclado; la franja entera tiene resumen
 * textual para lectores de pantalla.
 */
const DiaEnLaVida = ({ crons }: Props) => {
  const { lang, t } = useLang()
  const [ahora, setAhora] = useState(() => new Date())

  useEffect(() => {
    const id = setInterval(() => setAhora(new Date()), 60_000)

    return () => clearInterval(id)
  }, [])

  const puntos = useMemo<Punto[]>(() => {
    const base = crons
      .map(c => ({ nombre: c.nombre, hora: horaDe(c.ultima), estado: c.estado, carril: 0 }))
      .filter((p): p is Punto => p.hora !== null)
      .sort((a, b) => a.hora - b.hora)

    // Reparte en 3 carriles los puntos que se pisan (< 1,2 h de separación en el mismo carril)
    const carriles: number[] = []

    for (const p of base) {
      let carril = carriles.findIndex(h => p.hora - h > 1.2)

      if (carril === -1) {
        carril = carriles.length
        carriles.push(-99)
      }
      if (carril > 2) carril = 2
      p.carril = carril
      carriles[carril] = p.hora
    }

    return base
  }, [crons])

  const horaAhora = ahora.getHours() + ahora.getMinutes() / 60
  const pctAhora = (horaAhora / 24) * 100
  const resumen = puntos.map(p => `${p.nombre} ${Math.floor(p.hora)}:${String(Math.round((p.hora % 1) * 60)).padStart(2, '0')}`).join(', ')

  return (
    <Card>
      <CardContent className='flex flex-col gap-3'>
        <div className='flex flex-wrap items-baseline justify-between gap-2'>
          <Typography variant='h6'>{t('dia_titulo')}</Typography>
          <Typography variant='caption' color='text.disabled'>{t('dia_caption')}</Typography>
        </div>
        <Box sx={{ overflowX: 'auto', pb: 1 }} role='img' aria-label={`${t('dia_titulo')}: ${resumen}`}>
          <Box sx={{ position: 'relative', minWidth: 560, height: 96, mx: 1 }}>
            {/* regla de horas */}
            {[0, 6, 12, 18, 24].map(h => (
              <Box
                key={h}
                sx={{
                  position: 'absolute',
                  left: `${(h / 24) * 100}%`,
                  top: 62,
                  transform: h === 0 ? 'none' : h === 24 ? 'translateX(-100%)' : 'translateX(-50%)',
                  textAlign: 'center'
                }}
              >
                <Box sx={{ width: 1, height: 8, bgcolor: 'divider', mx: 'auto' }} />
                <Typography variant='caption' color='text.disabled' className='font-mono' sx={{ fontSize: 10 }} aria-hidden>
                  {String(h).padStart(2, '0')}:00
                </Typography>
              </Box>
            ))}
            {/* pista */}
            <Box sx={{ position: 'absolute', left: 0, right: 0, top: 58, height: 2, bgcolor: 'divider', borderRadius: 1 }} aria-hidden />
            {/* puntos de rutinas en 3 carriles */}
            {puntos.map(p => (
              <Tooltip
                key={p.nombre}
                title={`${p.nombre} · ${String(Math.floor(p.hora)).padStart(2, '0')}:${String(Math.round((p.hora % 1) * 60)).padStart(2, '0')}`}
                arrow
              >
                <Box
                  component='button'
                  type='button'
                  aria-label={`${p.nombre}, ${String(Math.floor(p.hora)).padStart(2, '0')}:${String(Math.round((p.hora % 1) * 60)).padStart(2, '0')}`}
                  sx={{
                    position: 'absolute',
                    left: `${(p.hora / 24) * 100}%`,
                    top: 12 + p.carril * 17,
                    transform: 'translateX(-50%)',
                    width: 13,
                    height: 13,
                    borderRadius: '50%',
                    border: '2px solid var(--mui-palette-background-paper)',
                    bgcolor: p.estado === 'ok' ? 'success.main' : 'warning.main',
                    cursor: 'default',
                    p: 0,
                    transition: 'transform .15s ease',
                    '&:hover, &:focus-visible': { transform: 'translateX(-50%) scale(1.35)', outline: 'none' }
                  }}
                />
              </Tooltip>
            ))}
            {/* línea «ahora» */}
            <Tooltip title={`${t('dia_ahora')} ${String(ahora.getHours()).padStart(2, '0')}:${String(ahora.getMinutes()).padStart(2, '0')}`} arrow>
              <Box
                sx={{
                  position: 'absolute',
                  left: `${pctAhora}%`,
                  top: 4,
                  bottom: 14,
                  width: 2,
                  transform: 'translateX(-50%)',
                  background: 'linear-gradient(180deg, #7A7FFF, #06C9A8)',
                  borderRadius: 1,
                  cursor: 'default'
                }}
                aria-label={t('dia_ahora')}
                component='button'
                type='button'
              />
            </Tooltip>
          </Box>
        </Box>
        <Typography variant='caption' color='text.secondary'>
          {t('dia_leyenda')}
        </Typography>
      </CardContent>
    </Card>
  )
}

export default DiaEnLaVida
