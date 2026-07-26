'use client'

// Third-party Imports
import classnames from 'classnames'

// Component Imports
import NavToggle from './NavToggle'
import ModeDropdown from '@components/layout/shared/ModeDropdown'

// Util Imports
import { verticalLayoutClasses } from '@layouts/utils/layoutClasses'

const NavbarContent = () => {
  return (
    <div className={classnames(verticalLayoutClasses.navbarContent, 'flex items-center justify-between gap-4 is-full')}>
      <div className='flex items-center gap-4'>
        <NavToggle />
        <span className='hidden sm:block text-sm text-textSecondary'>Front office · cuadro de mando público</span>
      </div>
      <div className='flex items-center'>
        <ModeDropdown />
      </div>
    </div>
  )
}

export default NavbarContent
