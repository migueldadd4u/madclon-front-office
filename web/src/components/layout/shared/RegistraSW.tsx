'use client'

// React Imports
import { useEffect } from 'react'

// Registra el service worker (PWA mínimo): estáticos offline, páginas con
// red primero y JSON de /data con caché de un día. Silencioso por diseño:
// si el navegador no soporta SW o el registro falla, la web funciona igual.
const RegistraSW = () => {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return

    const base = process.env.NEXT_PUBLIC_BASE_PATH ?? ''

    navigator.serviceWorker.register(`${base}/sw.js`).catch(() => {})
  }, [])

  return null
}

export default RegistraSW
