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
import { usePanelData } from '@/lib/data'
import type { PanelData } from '@/lib/data'

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

const DataGate = ({ children }: { children: (data: PanelData) => ReactNode }) => {
  const { data, error } = usePanelData()
  const { t } = useLang()

  if (error) {
    // Sin conexión y sin caché (primera visita offline): mensaje amable, no técnico
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      return (
        <div className='flex flex-col items-center gap-2 p-8 text-center'>
          <i className='ri-wifi-off-line text-4xl text-textSecondary' />
          <Typography fontWeight={600}>{t('offline_titulo')}</Typography>
          <Typography variant='body2' color='text.secondary' className='max-is-md'>
            {t('offline_texto')}
          </Typography>
        </div>
      )
    }

    return (
      <div className='flex flex-col items-center gap-2 p-8 text-center'>
        <i className='ri-error-warning-line text-4xl text-error' />
        <Typography color='error' fontWeight={600}>No se pudieron cargar los datos del panel</Typography>
        <Typography variant='body2' color='text.secondary' className='font-mono'>{error}</Typography>
        <Typography variant='body2' color='text.secondary'>
          Ejecuta antes el exportador: <code>python exporter/export_panel.py</code>
        </Typography>
      </div>
    )
  }

  if (!data) return <SkeletonPanel />

  return <>{children(data)}</>
}

export default DataGate
