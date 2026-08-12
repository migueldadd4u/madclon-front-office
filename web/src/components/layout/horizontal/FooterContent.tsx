'use client'

// Third-party Imports
import classnames from 'classnames'

// Hook Imports
import useHorizontalNav from '@menu/hooks/useHorizontalNav'

// Component Imports
import SelloVersion from '@components/layout/shared/SelloVersion'

// Util Imports
import { horizontalLayoutClasses } from '@layouts/utils/layoutClasses'

const FooterContent = () => {
  // Hooks
  const { isBreakpointReached } = useHorizontalNav()

  return (
    <div
      className={classnames(horizontalLayoutClasses.footerContent, 'flex items-center justify-between flex-wrap gap-4')}
    >
      <p className='text-textSecondary'>© {new Date().getFullYear()} MAD Clon</p>
      <div className='flex items-center gap-3 flex-wrap'>
        {!isBreakpointReached && (
          <p className='text-textSecondary'>Panel público de solo lectura</p>
        )}
        {/* El sello de versión es también la puerta al panel privado. */}
        <SelloVersion />
      </div>
    </div>
  )
}

export default FooterContent
