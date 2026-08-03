'use client'

// React Imports
import { useEffect, useRef, useState } from 'react'

// MUI Imports
import Button from '@mui/material/Button'

// Hook Imports
import { usePublicLang } from '@/lib/public-i18n'

// «Compartir bonito» — copia la dirección de la página actual al portapapeles
// y lo celebra con un check durante 2 s. Botón real (teclado y lector de
// pantalla), bilingüe, sin animaciones que respetar.

const CopiarEnlace = () => {
  const { t } = usePublicLang()
  const [copiado, setCopiado] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current)
  }, [])

  const copiar = async () => {
    const url = window.location.href

    try {
      await navigator.clipboard.writeText(url)
    } catch {
      // Plan B para navegadores sin API de portapapeles
      const area = document.createElement('textarea')

      area.value = url
      document.body.appendChild(area)
      area.select()
      document.execCommand('copy')
      area.remove()
    }

    setCopiado(true)
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => setCopiado(false), 2000)
  }

  return (
    <Button
      size='small'
      variant='text'
      color={copiado ? 'success' : 'primary'}
      onClick={copiar}
      startIcon={<i className={copiado ? 'ri-check-line' : 'ri-link'} />}
      aria-live='polite'
      sx={{ minBlockSize: 44, ...(copiado ? {} : { color: 'primary.light' }) }}
    >
      {copiado ? t('share_copiado') : t('share_copiar')}
    </Button>
  )
}

export default CopiarEnlace
