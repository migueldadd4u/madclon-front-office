'use client'

// DatoRancio — la franja que confiesa cuando los números se han quedado viejos.
//
// Regla del eje 7 (REGLAS-COPY.md §3): si el refresco nocturno no ha corrido, es
// mejor decirlo que enseñar un número muerto con cara de fresco. Por debajo del
// umbral no se pinta nada: no se alarma a nadie por un dato que está bien.

import Alert from '@mui/material/Alert'

import { useLang } from '@/lib/i18n'

const HORAS_LIMITE = 48

const DatoRancio = ({ generado }: { generado: string }) => {
  const { lang, t } = useLang()
  const sello = new Date(generado).getTime()

  if (Number.isNaN(sello)) return null

  const horas = (Date.now() - sello) / 36e5

  if (horas <= HORAS_LIMITE) return null

  const fecha = new Intl.DateTimeFormat(lang === 'en' ? 'en-GB' : 'es-ES', {
    day: '2-digit',
    month: '2-digit'
  }).format(sello)

  return (
    <Alert
      severity='warning'
      variant='outlined'
      icon={<i className='ri-time-line' />}
      data-frescura-rancia
      sx={{ alignItems: 'center' }}
    >
      {t('rancio_aviso')
        .replace('{fecha}', fecha)
        .replace('{horas}', String(Math.round(horas)))}
    </Alert>
  )
}

export default DatoRancio
