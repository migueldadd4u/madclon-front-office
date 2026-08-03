'use client'

// React Imports
import type { HTMLAttributes, ReactElement } from 'react'

// Hook Imports
import useVerticalNav from '../../hooks/useVerticalNav'
import { useLang } from '@/lib/i18n'

// Icon Imports
import CloseIcon from '../../svg/Close'
import RadioCircleIcon from '../../svg/RadioCircle'
import RadioCircleMarkedIcon from '../../svg/RadioCircleMarked'

type NavCollapseIconsProps = HTMLAttributes<HTMLSpanElement> & {
  closeIcon?: ReactElement
  lockedIcon?: ReactElement
  unlockedIcon?: ReactElement
  onClick?: () => void
  onClose?: () => void
}

const NavCollapseIcons = (props: NavCollapseIconsProps) => {
  // Props
  const { closeIcon, lockedIcon, unlockedIcon, onClick, onClose, ...rest } = props

  // Hooks
  const { isCollapsed, collapseVerticalNav, isBreakpointReached, toggleVerticalNav } = useVerticalNav()
  const { t } = useLang()

  // Handle Lock / Unlock Icon Buttons click
  const handleClick = (action: 'lock' | 'unlock') => {
    // Setup the verticalNav to be locked or unlocked
    const collapse = action === 'lock' ? false : true

    // Tell the verticalNav to lock or unlock
    collapseVerticalNav(collapse)

    // Call onClick function if passed
    onClick && onClick()
  }

  // Handle Close button click
  const handleClose = () => {
    // Close verticalNav using toggle verticalNav function
    toggleVerticalNav(false)

    // Call onClose function if passed
    onClose && onClose()
  }

  // Enter/Espacio activan como en un botón de verdad
  const alPulsarTecla = (accion: () => void) => (e: React.KeyboardEvent<HTMLSpanElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      accion()
    }
  }

  return (
    <>
      {isBreakpointReached ? (
        <span
          role='button'
          tabIndex={0}
          aria-label={t('nav_cierra')}
          style={{ display: 'flex', cursor: 'pointer' }}
          onClick={handleClose}
          onKeyDown={alPulsarTecla(handleClose)}
          {...rest}
        >
          {closeIcon ?? <CloseIcon />}
        </span>
      ) : isCollapsed ? (
        <span
          role='button'
          tabIndex={0}
          aria-label={t('nav_fija')}
          style={{ display: 'flex', cursor: 'pointer' }}
          onClick={() => handleClick('lock')}
          onKeyDown={alPulsarTecla(() => handleClick('lock'))}
          {...rest}
        >
          {unlockedIcon ?? <RadioCircleIcon />}
        </span>
      ) : (
        <span
          role='button'
          tabIndex={0}
          aria-label={t('nav_pliega')}
          style={{ display: 'flex', cursor: 'pointer' }}
          onClick={() => handleClick('unlock')}
          onKeyDown={alPulsarTecla(() => handleClick('unlock'))}
          {...rest}
        >
          {lockedIcon ?? <RadioCircleMarkedIcon />}
        </span>
      )}
    </>
  )
}

export default NavCollapseIcons
