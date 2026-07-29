'use client'

// Third-party Imports
import classnames from 'classnames'

// Component Imports
import NavToggle from './NavToggle'
import ModeDropdown from '@components/layout/shared/ModeDropdown'
import LangToggle from '@components/layout/shared/LangToggle'
import AltoContraste from '@components/layout/shared/AltoContraste'
import ModoPresentacion from '@/components/dashboard/ModoPresentacion'
import AtajosTeclado from '@/components/dashboard/AtajosTeclado'

// Hook Imports
import { useLang } from '@/lib/i18n'

// Util Imports
import { verticalLayoutClasses } from '@layouts/utils/layoutClasses'

const NavbarContent = () => {
  const { t } = useLang()

  return (
    <div className={classnames(verticalLayoutClasses.navbarContent, 'flex items-center justify-between gap-4 is-full')}>
      <div className='flex items-center gap-4'>
        <NavToggle />
        <span className='hidden sm:block text-sm text-textSecondary'>{t('chrome_tagline')}</span>
      </div>
      <div className='flex items-center'>
        <AtajosTeclado />
        <ModoPresentacion />
        <AltoContraste />
        <LangToggle />
        <ModeDropdown />
      </div>
    </div>
  )
}

export default NavbarContent
