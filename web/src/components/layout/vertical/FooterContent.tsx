'use client'

// Third-party Imports
import classnames from 'classnames'

// Hook Imports
import useVerticalNav from '@menu/hooks/useVerticalNav'
import { useLang } from '@/lib/i18n'

// Util Imports
import { verticalLayoutClasses } from '@layouts/utils/layoutClasses'

const FooterContent = () => {
  // Hooks
  const { isBreakpointReached } = useVerticalNav()
  const { t } = useLang()

  return (
    <div
      className={classnames(verticalLayoutClasses.footerContent, 'flex items-center justify-between flex-wrap gap-4')}
    >
      <p className='flex items-center gap-2'>
        <i className='ri-shield-check-line text-success' />
        <span className='text-textSecondary'>
          {t('chrome_footer_1')}
        </span>
      </p>
      {!isBreakpointReached && (
        <span className='text-textDisabled text-sm'>
          {t('chrome_footer_2')}
        </span>
      )}
    </div>
  )
}

export default FooterContent
