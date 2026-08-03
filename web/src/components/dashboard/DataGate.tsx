'use client'

// MUI Imports
import Grid from '@mui/material/Grid'
import Skeleton from '@mui/material/Skeleton'
import Typography from '@mui/material/Typography'

// Hook Imports
import { usePublicLang } from '@/lib/public-i18n'

// Data Imports
import { usePanelData } from '@/lib/data'

const SkeletonPanel = ({ label }: { label: string }) => (
  <div role='status' aria-live='polite'>
    <span className='sr-only'>{label}</span>
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
  </div>
)

const DataGate = () => {
  const { error, withheldAt } = usePanelData()
  const { lang, t } = usePublicLang()

  if (error) {
    // Sin conexión y sin caché (primera visita offline): mensaje amable, no técnico
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      return (
        <div className='flex flex-col items-center gap-2 p-8 text-center' role='alert' aria-live='assertive'>
          <i className='ri-wifi-off-line text-4xl text-textSecondary' />
          <Typography fontWeight={600}>{t('offline_titulo')}</Typography>
          <Typography variant='body2' color='text.secondary' className='max-is-md'>
            {t('offline_texto')}
          </Typography>
        </div>
      )
    }

    return (
      <div className='flex flex-col items-center gap-2 p-8 text-center' role='alert'>
        <i className='ri-error-warning-line text-4xl text-error' />
        <Typography color='error' fontWeight={600}>{t('public_error_titulo')}</Typography>
        <Typography variant='body2' color='text.secondary'>
          {t('public_error_texto')}
        </Typography>
      </div>
    )
  }

  if (withheldAt) {
    return (
      <div className='flex flex-col items-center gap-3 p-8 text-center' role='status'>
        <i className='ri-shield-check-line text-5xl text-success' aria-hidden='true' />
        <Typography variant='h5'>{t('public_retenido_titulo')}</Typography>
        <Typography color='text.secondary' className='max-is-xl'>
          {t('public_retenido_texto')}
        </Typography>
        <Typography variant='caption' color='text.secondary'>
          {t('public_retenido_fecha').replace(
            '{fecha}',
            new Date(withheldAt).toLocaleString(lang === 'en' ? 'en-GB' : 'es-ES')
          )}
        </Typography>
      </div>
    )
  }

  return <SkeletonPanel label={t('public_cargando')} />
}

export default DataGate
