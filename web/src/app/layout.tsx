// MUI Imports
import InitColorSchemeScript from '@mui/material/InitColorSchemeScript'

// Third-party Imports
import 'react-perfect-scrollbar/dist/css/styles.css'

// Type Imports
import type { ChildrenType } from '@core/types'

// Util Imports
import { getSystemMode } from '@core/utils/serverHelpers'

// Component Imports
import { PublicLangProvider } from '@/lib/public-i18n'
import RegistraSW from '@/components/layout/shared/RegistraSW'

// Style Imports
import '@/app/globals.css'

// Generated Icon CSS Imports
import '@assets/iconify-icons/generated-icons.css'

export const metadata = {
  metadataBase: new URL('https://migueldadd4u.github.io/madclon-front-office'),
  title: 'MAD Clon — vista pública protegida',
  description: 'Vista pública protegida y de solo lectura. Los datos permanecen retenidos hasta disponer de una proyección segura.',
  applicationName: 'MAD Clon',
  manifest: `${process.env.NEXT_PUBLIC_BASE_PATH ?? ''}/manifest.webmanifest`,
  openGraph: {
    title: 'MAD Clon — vista pública protegida',
    description: 'Vista pública protegida y de solo lectura; no muestra datos internos.',
    url: 'https://migueldadd4u.github.io/madclon-front-office/',
    siteName: 'MAD Clon',
    locale: 'es_ES',
    type: 'website'
  },
  twitter: {
    card: 'summary',
    title: 'MAD Clon — vista pública protegida',
    description: 'Vista pública protegida y de solo lectura; no muestra datos internos.'
  }
}

const RootLayout = async (props: ChildrenType) => {
  const { children } = props

  // Type guard to ensure lang is a valid Locale

  // Vars

  const systemMode = await getSystemMode()
  const direction = 'ltr'

  return (
    <html id='__next' lang='es' dir={direction} suppressHydrationWarning>
      <body className='flex is-full min-bs-full flex-auto flex-col'>
        <InitColorSchemeScript attribute='data' defaultMode={systemMode} />
        {/* Precarga del modo alto contraste: evita parpadeo antes de React */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "try{if(localStorage.getItem('madclon-contraste')==='1')document.documentElement.classList.add('fo-contraste')}catch(e){}"
          }}
        />
        <PublicLangProvider>{children}</PublicLangProvider>
        <RegistraSW />
      </body>
    </html>
  )
}

export default RootLayout
