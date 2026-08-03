'use client'

// Next Imports
import Link from 'next/link'

// MUI Imports
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'

// Type Imports
import type { Mode } from '@core/types'

// Component Imports
import MadClonLogoAnimado from '@/components/dashboard/MadClonLogoAnimado'

// Hook Imports
import { useLang } from '@/lib/i18n'

// Página 404 con personalidad MAD Clon: mensaje llano, bilingüe y con el logo
// constelación que se dibuja al cargar. El modo (claro/oscuro) lo da el tema;
// `mode` se conserva en la firma por compatibilidad con not-found.tsx.
const NotFound = ({ mode }: { mode: Mode }) => {
  void mode
  const { t } = useLang()

  return (
    <div className='flex items-center justify-center min-bs-[100dvh] relative p-6 overflow-x-hidden'>
      <div className='flex items-center flex-col text-center gap-8 max-is-[560px]'>
        <MadClonLogoAnimado size={88} />
        <div className='flex flex-col gap-3'>
          <Typography
            className='font-bold text-7xl'
            sx={{
              background: 'linear-gradient(135deg, #7A7FFF 0%, #4E8FE8 55%, #06C9A8 100%)',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              color: 'transparent'
            }}
          >
            404
          </Typography>
          <Typography component='h1' variant='h5' color='text.primary'>
            {t('nf_titulo')}
          </Typography>
          <Typography color='text.secondary'>{t('nf_sub')}</Typography>
        </div>
        <Button href='/' component={Link} variant='contained' size='large' sx={{ bgcolor: 'primary.dark' }}>
          {t('nf_boton')}
        </Button>
        <Typography variant='caption' color='text.secondary'>
          {t('nf_pie')}
        </Typography>
      </div>
    </div>
  )
}

export default NotFound
