'use client'

// Selector de idioma ES/EN del Front Office — va en la barra superior, junto al modo claro/oscuro.

// MUI Imports
import ButtonBase from '@mui/material/ButtonBase'
import Typography from '@mui/material/Typography'

// Hook Imports
import { useLang } from '@/lib/i18n'
import type { Lang } from '@/lib/i18n'

const OPCIONES: { codigo: Lang; etiqueta: string }[] = [
  { codigo: 'es', etiqueta: 'ES' },
  { codigo: 'en', etiqueta: 'EN' }
]

const LangToggle = () => {
  const { lang, setLang } = useLang()

  return (
    <div className='flex items-center gap-1 border border-solid border-divider rounded-full p-0.5 mie-1'>
      {OPCIONES.map(o => (
        <ButtonBase
          key={o.codigo}
          onClick={() => setLang(o.codigo)}
          aria-pressed={lang === o.codigo}
          className={
            lang === o.codigo
              ? 'rounded-full bg-primary text-textPrimary px-2.5 py-0.5'
              : 'rounded-full text-textSecondary px-2.5 py-0.5'
          }
        >
          <Typography variant='caption' fontWeight={700} color='inherit'>
            {o.etiqueta}
          </Typography>
        </ButtonBase>
      ))}
    </div>
  )
}

export default LangToggle
