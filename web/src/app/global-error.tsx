'use client'

// Último recurso: algo rompió en el propio marco de la web (layout raíz). Esta
// pantalla sustituye al documento entero, así que no hay tema, ni menú, ni
// LangProvider: pinta su propio <html> con estilos fijos y lee el idioma que
// eligió quien visita. Dice lo mismo que el resto de la web, «en revisión», y
// ofrece reintentar. Decisión de MAD (03/08/2026): mejor incompleto que una página de error.
//
// No se lee ni se enseña la excepción: su texto puede arrastrar trozos del dato.

// React Imports
import { useEffect, useState } from 'react'

// Lib Imports
import { idiomaGuardado, traducir } from '@/lib/i18n'
import type { Lang } from '@/lib/i18n'

type Props = {
  error: Error & { digest?: string }
  reset: () => void
}

// Colores fijos del modo claro de la web. Contrastes: texto 6,8:1 sobre el fondo,
// botón blanco sobre primary.dark 4,88:1 (el mismo que el 404).
const FONDO = '#F7F7F9'
const TEXTO = '#2E263D'
const TEXTO_SUAVE = '#5A5366'
const PRIMARIO_OSCURO = '#5C61E6'

const WebEnRevision = ({ reset }: Props) => {
  const [lang, setLang] = useState<Lang>('es')

  useEffect(() => {
    const guardado = idiomaGuardado()

    if (guardado) setLang(guardado)
  }, [])

  return (
    <html lang={lang}>
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: FONDO,
          color: TEXTO,
          fontFamily: 'Inter, sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto'
        }}
      >
        <title>{`${traducir('error_pagina_titulo', lang)} — ${traducir('document_title', lang)}`}</title>
        <main style={{ maxWidth: '36rem', padding: '2rem 1rem', textAlign: 'center' }}>
          <div role='status'>
            <h1 style={{ fontSize: '1.5rem', lineHeight: 1.3, margin: '0 0 0.75rem' }}>
              {traducir('error_pagina_titulo', lang)}
            </h1>
            <p style={{ color: TEXTO_SUAVE, fontSize: '1rem', lineHeight: 1.5, margin: '0 0 1.5rem' }}>
              {traducir('error_pagina_texto', lang)}
            </p>
          </div>
          <button
            type='button'
            onClick={() => reset()}
            style={{
              minHeight: 44,
              padding: '0.625rem 1.5rem',
              border: 0,
              borderRadius: 8,
              background: PRIMARIO_OSCURO,
              color: '#FFFFFF',
              fontSize: '1rem',
              fontWeight: 500,
              cursor: 'pointer'
            }}
          >
            {traducir('error_reintentar', lang)}
          </button>
        </main>
      </body>
    </html>
  )
}

export default WebEnRevision
