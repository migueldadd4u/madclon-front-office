'use client'

// React Imports
import { useEffect, useState } from 'react'

// Hook Imports
import { usePublicLang } from '@/lib/public-i18n'

// Modo alto contraste: sube la opacidad de los textos secundarios y atenuados
// (globals.css, :root.fo-contraste). Persiste en localStorage y se aplica al
// instante; la clase se precarga con un script inline en app/layout.tsx para
// que no haya parpadeo al cargar.
const AltoContraste = () => {
  const { t } = usePublicLang()
  const [activo, setActivo] = useState(false)

  useEffect(() => {
    setActivo(document.documentElement.classList.contains('fo-contraste'))
  }, [])

  const alternar = () => {
    const nuevo = !activo

    setActivo(nuevo)
    document.documentElement.classList.toggle('fo-contraste', nuevo)

    try {
      localStorage.setItem('madclon-contraste', nuevo ? '1' : '0')
    } catch {
      // Sin almacenamiento (modo privado): el modo dura solo esta visita
    }
  }

  return (
    <button
      type='button'
      onClick={alternar}
      aria-label={t('contraste_aria')}
      aria-pressed={activo}
      title={t('contraste_aria')}
      className='flex items-center justify-center bs-10 is-10 rounded-full text-textPrimary transition-colors hover:bg-actionHover focus-visible:outline-2 focus-visible:outline-primary cursor-pointer'
    >
      <i className={activo ? 'ri-contrast-2-fill text-xl' : 'ri-contrast-2-line text-xl'} aria-hidden='true' />
    </button>
  )
}

export default AltoContraste
