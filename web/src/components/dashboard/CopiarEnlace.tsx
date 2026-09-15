'use client'

// React Imports
import { useEffect, useRef, useState } from 'react'

// MUI Imports
import Button from '@mui/material/Button'

// Hook Imports
import { useLang } from '@/lib/i18n'

// «Compartir bonito» — copia la dirección de la página actual al portapapeles
// y lo celebra con un check durante 2 s. Botón real (teclado y lector de
// pantalla), bilingüe, sin animaciones que respetar.

const CopiarEnlace = () => {
  const { t } = useLang()
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
      // El rótulo, con la tinta del texto; el color de marca se queda en el icono.
      // Escrito con `primary.light` daba 2,80:1 sobre la página en claro (medido el
      // 15/09/2026, al poner el claro por defecto) y en verde, ya copiado, aún menos.
      // Es el mismo patrón que ya usa MigaDeCapas: el color señala, el texto se lee.
      sx={{ minBlockSize: 44, color: 'text.primary', '& i': { color: copiado ? 'success.main' : 'primary.light' } }}
    >
      {copiado ? t('share_copiado') : t('share_copiar')}
    </Button>
  )
}

export default CopiarEnlace
