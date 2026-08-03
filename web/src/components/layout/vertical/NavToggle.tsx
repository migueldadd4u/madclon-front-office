'use client'

// Hook Imports
import useVerticalNav from '@menu/hooks/useVerticalNav'
import { usePublicLang } from '@/lib/public-i18n'

// Botón de menú real: antes era un icono <i> con onClick, inalcanzable por
// teclado y mudo para lectores de pantalla. Ahora es un <button> con
// aria-label bilingüe y aria-expanded según el estado del panel lateral.
const NavToggle = () => {
  // Hooks
  const { toggleVerticalNav, isBreakpointReached, isToggled } = useVerticalNav()
  const { t } = usePublicLang()

  if (!isBreakpointReached) return null

  return (
    <button
      type='button'
      onClick={() => toggleVerticalNav()}
      aria-label={t('menu_abrir')}
      aria-expanded={Boolean(isToggled)}
      className='flex items-center justify-center bs-10 is-10 rounded-full text-textPrimary transition-colors hover:bg-actionHover focus-visible:outline-2 focus-visible:outline-primary cursor-pointer'
    >
      <i className='ri-menu-line text-xl' aria-hidden='true' />
    </button>
  )
}

export default NavToggle
