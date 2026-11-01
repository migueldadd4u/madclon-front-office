'use client'

// Frontera de error de las páginas del panel. Si una página revienta al pintarse
// (un dato con una forma que nadie previó), se queda dentro del marco de la web
// —menú, cabecera y pie siguen vivos— y confiesa «en revisión», como DataGate hace
// con un bloque. Decisión de MAD (03/08/2026): mejor incompleto que una página de error.
//
// No se lee ni se enseña la excepción: su texto puede arrastrar trozos del dato.

// MUI Imports
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'

// Hook Imports
import { useLang } from '@/lib/i18n'

type Props = {
  error: Error & { digest?: string }
  reset: () => void
}

const PaginaEnRevision = ({ reset }: Props) => {
  const { t } = useLang()

  return (
    <section className='flex flex-col items-center gap-4 p-8 text-center'>
      <div className='flex flex-col items-center gap-2' role='status'>
        <i className='ri-refresh-line text-4xl text-textSecondary' aria-hidden='true' />
        <Typography variant='h5' component='h1'>
          {t('error_pagina_titulo')}
        </Typography>
        <Typography color='text.secondary' className='max-is-md'>
          {t('error_pagina_texto')}
        </Typography>
      </div>
      {/* primary.dark, no primary.main: con blanco encima el main se queda en 4,07:1 */}
      <Button variant='contained' size='large' onClick={() => reset()} sx={{ bgcolor: 'primary.dark', minBlockSize: 44 }}>
        {t('error_reintentar')}
      </Button>
    </section>
  )
}

export default PaginaEnRevision
