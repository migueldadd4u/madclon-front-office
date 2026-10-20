'use client'

import Button from '@mui/material/Button'

import { useLang } from '@/lib/i18n'

const SubirAlInicio = () => {
  const { lang } = useLang()

  return (
    <Button variant='contained' aria-label={lang === 'en' ? 'Back to top' : 'Volver al principio'} sx={{ width: 44, height: 44, minWidth: 44, minHeight: 44 }} className='rounded-full p-0 flex items-center justify-center'>
      <i className='ri-arrow-up-line' aria-hidden='true' />
    </Button>
  )
}

export default SubirAlInicio
