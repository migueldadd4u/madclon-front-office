'use client'

// React Imports
import { useEffect, useState } from 'react'

import { createPortal } from 'react-dom'

// Hook Imports
import { useLang } from '@/lib/i18n'

// Modo presentación (kiosk): oculta sidebar, cabecera y pie, y pide pantalla
// completa para enseñar el panel en una tele o proyector. Sale con Esc, con
// el botón flotante o volviendo a pulsar. La clase `fo-kiosk` en <html> hace
// el trabajo visual (globals.css); el estado se sincroniza con
// fullscreenchange para no quedar atrapado si el navegador cancela.
const ModoPresentacion = () => {
  const { t } = useLang()
  const [activo, setActivo] = useState(false)

  useEffect(() => {
    const alCambiar = () => {
      const enFull = Boolean(document.fullscreenElement)

      if (!enFull) document.documentElement.classList.remove('fo-kiosk')
      setActivo(enFull)
    }

    document.addEventListener('fullscreenchange', alCambiar)

    return () => document.removeEventListener('fullscreenchange', alCambiar)
  }, [])

  const entrar = async () => {
    document.documentElement.classList.add('fo-kiosk')

    try {
      await document.documentElement.requestFullscreen()
      setActivo(true)
    } catch {
      // Sin fullscreen (permiso denegado): el modo kiosk visual sigue funcionando
      setActivo(true)
    }
  }

  const salir = async () => {
    document.documentElement.classList.remove('fo-kiosk')
    setActivo(false)
    if (document.fullscreenElement) await document.exitFullscreen().catch(() => {})
  }

  return (
    <>
      <button
        type='button'
        onClick={activo ? salir : entrar}
        aria-label={t('kiosk_entrar')}
        aria-pressed={activo}
        title={t('kiosk_entrar')}
        className='flex items-center justify-center bs-10 is-10 rounded-full text-textPrimary transition-colors hover:bg-actionHover focus-visible:outline-2 focus-visible:outline-primary cursor-pointer'
      >
        <i className={activo ? 'ri-fullscreen-exit-line text-xl' : 'ri-slideshow-line text-xl'} aria-hidden='true' />
      </button>
      {activo &&
        createPortal(
          <button type='button' onClick={salir} className='fo-kiosk-salir'>
            <i className='ri-close-line' aria-hidden='true' /> {t('kiosk_salir')}
          </button>,
          document.body
        )}
    </>
  )
}

export default ModoPresentacion
