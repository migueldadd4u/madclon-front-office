// MUI Imports
import InitColorSchemeScript from '@mui/material/InitColorSchemeScript'

// Third-party Imports
import 'react-perfect-scrollbar/dist/css/styles.css'

// Type Imports
import type { ChildrenType } from '@core/types'

// Util Imports
import { getSystemMode } from '@core/utils/serverHelpers'

// Component Imports
import { LangProvider } from '@/lib/i18n'

// Style Imports
import '@/app/globals.css'

// Generated Icon CSS Imports
import '@assets/iconify-icons/generated-icons.css'

export const metadata = {
  metadataBase: new URL('https://migueldadd4u.github.io/madclon-front-office'),
  title: 'MAD Clon — Front Office',
  description:
    'Cuadro de mando público del Clon de MAD: salud del sistema, flota de clones, consumo y eficiencia de la IA, explicados para personas.',
  applicationName: 'MAD Clon',
  manifest: `${process.env.NEXT_PUBLIC_BASE_PATH ?? ''}/manifest.webmanifest`,
  openGraph: {
    title: 'MAD Clon — Front Office',
    description: 'Un equipo de IA que trabaja mientras Miguel vive su vida — los números del clon, explicados para personas.',
    url: 'https://migueldadd4u.github.io/madclon-front-office/',
    siteName: 'MAD Clon',
    images: [{ url: '/images/og-madclon.png', width: 1200, height: 630, alt: 'MAD Clon — Front Office' }],
    locale: 'es_ES',
    type: 'website'
  },
  twitter: {
    card: 'summary_large_image',
    title: 'MAD Clon — Front Office',
    description: 'Un equipo de IA que trabaja mientras Miguel vive su vida — los números del clon, explicados para personas.',
    images: ['/images/og-madclon.png']
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
        <LangProvider>{children}</LangProvider>
      </body>
    </html>
  )
}

export default RootLayout
