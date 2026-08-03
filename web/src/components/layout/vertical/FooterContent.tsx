'use client'

// Third-party Imports
import classnames from 'classnames'

// Hook Imports
import useVerticalNav from '@menu/hooks/useVerticalNav'
import { usePublicLang } from '@/lib/public-i18n'

// Component Imports
import CopiarEnlace from '@/components/dashboard/CopiarEnlace'

// Util Imports
import { verticalLayoutClasses } from '@layouts/utils/layoutClasses'
import { buildStamp, buildHuman } from '@/lib/build-stamp'

const FooterContent = () => {
  // Hooks
  const { isBreakpointReached } = useVerticalNav()
  const { t } = usePublicLang()

  // Sello de versión: qué build se está viendo, sin preguntar (esquema add4u-web)
  const version = t('footer_version').replace('{v}', buildStamp).replace('{fecha}', buildHuman)

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
      <div className='flex items-center gap-3 flex-wrap'>
        {!isBreakpointReached && (
          <span className='text-textDisabled text-sm'>
            {t('chrome_footer_2')}
          </span>
        )}
        <span className='text-textDisabled text-sm font-mono' title={version} aria-label={version}>
          {buildStamp}
        </span>
        <CopiarEnlace />
      </div>
    </div>
  )
}

export default FooterContent
