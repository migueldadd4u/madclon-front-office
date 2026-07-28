'use client'

// React Imports
import { useEffect, useMemo, useState } from 'react'

// MUI Imports
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'

// Hook Imports
import { useLang } from '@/lib/i18n'

// Data Imports
import type { Cron } from '@/lib/data'

/** Parsea «25/07 09:15» (dd/mm HH:MM, año en curso) a Date. */
function parseUltima(s: string): Date | null {
  const m = /^(\d{2})\/(\d{2})\s+(\d{2}):(\d{2})$/.exec(s?.trim() ?? '')

  if (!m) return null
  const ahora = new Date()
  let d = new Date(ahora.getFullYear(), Number(m[2]) - 1, Number(m[1]), Number(m[3]), Number(m[4]))

  // Si queda en el futuro (export de diciembre visto en enero), es del año pasado.
  if (d.getTime() > ahora.getTime() + 60_000) d = new Date(d.getFullYear() - 1, d.getMonth(), d.getDate(), d.getHours(), d.getMinutes())

  return d
}

type Props = { crons: Cron[]; generado?: string }

/**
 * Latido en vivo: punto verde pulsante + «última señal de vida hace X».
 * La señal es lo más reciente entre la exportación nocturna de datos y la
 * última rutina registrada — siempre la prueba de vida más fresca disponible.
 * Se recalcula solo cada 30 s sin recargar — la web se siente viva.
 * Accesible: la animación se apaga con prefers-reduced-motion y el texto
 * completo va en aria-label (role=status) para lectores de pantalla.
 */
const Latido = ({ crons, generado }: Props) => {
  const { lang, t } = useLang()
  const [ahora, setAhora] = useState(() => Date.now())

  useEffect(() => {
    const id = setInterval(() => setAhora(Date.now()), 30_000)

    return () => clearInterval(id)
  }, [])

  const ultima = useMemo(() => {
    const fechas = crons.map(c => parseUltima(c.ultima)).filter((d): d is Date => d !== null)
    const gen = generado ? new Date(generado) : null

    if (gen && !Number.isNaN(gen.getTime())) fechas.push(gen)

    return fechas.length ? new Date(Math.max(...fechas.map(d => d.getTime()))) : null
  }, [crons, generado])

  if (!ultima) return null

  const min = Math.max(0, Math.round((ahora - ultima.getTime()) / 60_000))
  let lapsus: string

  if (min < 1) lapsus = t('latido_ahora')
  else if (min < 60) lapsus = lang === 'en' ? `${min} ${t('latido_min')} ${t('latido_ago')}` : `${t('latido_ago')} ${min} ${t('latido_min')}`
  else if (min < 60 * 48) lapsus = lang === 'en' ? `${Math.round(min / 60)} ${t('latido_h')} ${t('latido_ago')}` : `${t('latido_ago')} ${Math.round(min / 60)} ${t('latido_h')}`
  else lapsus = lang === 'en' ? `${Math.round(min / 1440)} ${t('latido_d')} ${t('latido_ago')}` : `${t('latido_ago')} ${Math.round(min / 1440)} ${t('latido_d')}`

  const texto = `${t('latido_ultima')} · ${lapsus}`

  return (
    <Box className='flex items-center gap-2' role='status' aria-label={texto}>
      <Box
        component='span'
        aria-hidden
        sx={{
          width: 9,
          height: 9,
          borderRadius: '50%',
          bgcolor: 'success.main',
          boxShadow: '0 0 0 0 var(--mui-palette-success-main)',
          animation: 'latido-pulso 1.8s ease-out infinite',
          '@keyframes latido-pulso': {
            '0%': { boxShadow: '0 0 0 0 rgba(86, 202, 118, 0.55)' },
            '70%': { boxShadow: '0 0 0 9px rgba(86, 202, 118, 0)' },
            '100%': { boxShadow: '0 0 0 0 rgba(86, 202, 118, 0)' }
          },
          '@media (prefers-reduced-motion: reduce)': { animation: 'none' }
        }}
      />
      <Typography variant='caption' color='text.secondary' className='font-mono' aria-hidden>
        {texto}
      </Typography>
    </Box>
  )
}

export default Latido
