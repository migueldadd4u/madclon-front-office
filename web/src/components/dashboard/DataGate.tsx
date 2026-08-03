'use client'

// React Imports
import type { ReactNode } from 'react'

// MUI Imports
import Grid from '@mui/material/Grid'
import Skeleton from '@mui/material/Skeleton'
import Typography from '@mui/material/Typography'

// Hook Imports
import { useLang } from '@/lib/i18n'

// Data Imports
import { usePanelData, DOCS } from '@/lib/data'
import type { DocNombre, PanelData } from '@/lib/data'

const SkeletonPanel = () => (
  <Grid container spacing={6} aria-hidden='true'>
    <Grid size={12}>
      <Skeleton variant='rounded' height={150} animation={false} className='fo-shimmer' />
    </Grid>
    {[...Array(4)].map((_, i) => (
      <Grid key={i} size={{ xs: 12, sm: 6, lg: 3 }}>
        <Skeleton variant='rounded' height={86} animation={false} className='fo-shimmer' />
      </Grid>
    ))}
    {[...Array(4)].map((_, i) => (
      <Grid key={i} size={{ xs: 12, sm: 6, lg: 3 }}>
        <Skeleton variant='rounded' height={180} animation={false} className='fo-shimmer' />
      </Grid>
    ))}
    <Grid size={12}>
      <Skeleton variant='rounded' height={130} animation={false} className='fo-shimmer' />
    </Grid>
    <Grid size={12}>
      <Skeleton variant='rounded' height={320} animation={false} className='fo-shimmer' />
    </Grid>
  </Grid>
)

// Bloque calmado para una sección cuyos datos no llegaron completos.
// Decisión de MAD (2026-08-03): mejor datos incompletos confesados que una página de error.
const EnRevision = () => {
  const { t } = useLang()

  return (
    <div className='flex flex-col items-center gap-2 p-8 text-center' role='status'>
      <i className='ri-refresh-line text-4xl text-textSecondary' aria-hidden='true' />
      <Typography fontWeight={600}>{t('revision_titulo')}</Typography>
      <Typography variant='body2' color='text.secondary' className='max-is-md'>
        {t('revision_texto')}
      </Typography>
    </div>
  )
}

type DataGateProps = {
  children: (data: PanelData) => ReactNode

  /**
   * Documentos que esta sección necesita para pintarse. Si alguno falta,
   * solo ESTA sección pasa a «en revisión»; el resto del panel sigue vivo.
   * Por defecto exige los cinco (comportamiento histórico).
   */
  necesita?: DocNombre[]
}

const DataGate = ({ children, necesita }: DataGateProps) => {
  const requeridos = necesita ?? DOCS
  const { data, faltantes, sinNada, retenido, cargando } = usePanelData()
  const { lang, t } = useLang()

  const faltanRequeridos = requeridos.some(d => faltantes.includes(d))
  const listos = requeridos.every(d => data[d] !== undefined)

  // Instantánea retenida por la fuente: estado protegido explícito, no un fallo
  if (retenido && !cargando) {
    return (
      <div className='flex flex-col items-center gap-3 p-8 text-center' role='status'>
        <i className='ri-shield-check-line text-5xl text-success' aria-hidden='true' />
        <Typography variant='h5'>{t('retenido_titulo')}</Typography>
        <Typography color='text.secondary' className='max-is-xl'>
          {t('retenido_texto')}
        </Typography>
        <Typography variant='caption' color='text.secondary'>
          {t('retenido_fecha').replace('{fecha}', new Date(retenido).toLocaleString(lang === 'en' ? 'en-GB' : 'es-ES'))}
        </Typography>
      </div>
    )
  }

  if (sinNada && !cargando) {
    // Sin conexión y sin caché (primera visita offline): mensaje amable, no técnico
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      return (
        <div className='flex flex-col items-center gap-2 p-8 text-center' role='status'>
          <i className='ri-wifi-off-line text-4xl text-textSecondary' aria-hidden='true' />
          <Typography fontWeight={600}>{t('offline_titulo')}</Typography>
          <Typography variant='body2' color='text.secondary' className='max-is-md'>
            {t('offline_texto')}
          </Typography>
        </div>
      )
    }

    // Con red pero sin un solo documento válido: el panel entero, en revisión
    return <EnRevision />
  }

  if (cargando && !listos) return <SkeletonPanel />

  if (faltanRequeridos || !listos) return <EnRevision />

  return <>{children(data as PanelData)}</>
}

export default DataGate
