'use client'

// Third-party Imports
import classnames from 'classnames'

// Hook Imports
import useVerticalNav from '@menu/hooks/useVerticalNav'

// Util Imports
import { verticalLayoutClasses } from '@layouts/utils/layoutClasses'

const FooterContent = () => {
  // Hooks
  const { isBreakpointReached } = useVerticalNav()

  return (
    <div
      className={classnames(verticalLayoutClasses.footerContent, 'flex items-center justify-between flex-wrap gap-4')}
    >
      <p className='flex items-center gap-2'>
        <i className='ri-shield-check-line text-success' />
        <span className='text-textSecondary'>
          MAD Clon · front office — solo cifras agregadas de sistema, sin datos personales
        </span>
      </p>
      {!isBreakpointReached && (
        <span className='text-textDisabled text-sm'>
          Los paneles vivos nacen en el vault privado; un exportador trae aquí solo los agregados.
        </span>
      )}
    </div>
  )
}

export default FooterContent
