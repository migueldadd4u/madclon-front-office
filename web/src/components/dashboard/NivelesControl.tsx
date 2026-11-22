'use client'

// «Llegar a un nivel superior de control y gestión» (orden de MAD, 22/11/2026),
// dibujado como lo que es: una escalera. El punto de partida y cuatro niveles, y
// cada nivel enlaza a la página de esta misma web donde se ve funcionando con
// los datos de hoy — el escalón no se promete, se enseña.
//
// Texto: exporter/casos.md (bloques `nivel-*`). Aquí solo viven el orden, el
// icono y a qué página lleva cada uno.

import Link from 'next/link'

import Typography from '@mui/material/Typography'

import { useLang } from '@/lib/i18n'
import { textoCurado } from '@/lib/casos'

import styles from './ParaQuienDecide.module.css'

const NIVELES = [
  { clave: 'nivel-0', icono: 'ri-brain-line', href: null },
  { clave: 'nivel-1', icono: 'ri-inbox-line', href: '/flota/' },
  { clave: 'nivel-2', icono: 'ri-scales-3-line', href: '/actividad/' },
  { clave: 'nivel-3', icono: 'ri-shield-check-line', href: '/salud/' },
  { clave: 'nivel-4', icono: 'ri-focus-3-line', href: '/retos/' }
] as const

const NivelesControl = () => {
  const { lang } = useLang()
  const tx = (clave: string) => textoCurado(clave, lang)

  return (
    <section data-niveles>
      <Typography component='h2' variant='h4' id='niveles'>{tx('niveles').titulo}</Typography>
      <Typography color='text.secondary' sx={{ mt: 2, mb: 4, maxInlineSize: '75ch' }}>{tx('niveles').texto}</Typography>
      <div className={styles.niveles}>
        <ol className={styles.escalera}>
          {NIVELES.map((nivel, i) => (
            <li
              key={nivel.clave}
              className={`${styles.peldano} ${i === 0 ? styles.partida : ''}`}
              style={{ ['--altura' as string]: i }}
              data-nivel={i}
            >
              <span className={styles.gradoNivel}>
                <i className={nivel.icono} aria-hidden='true' />
                {i === 0 ? tx('etiqueta-nivel').texto : `${tx('etiqueta-nivel').titulo} ${i}`}
              </span>
              <Typography component='h3' variant='h6'>{tx(nivel.clave).titulo}</Typography>
              <Typography variant='body2' color='text.secondary'>{tx(nivel.clave).texto}</Typography>
              {nivel.href && (
                <Link href={nivel.href} className={styles.enlaceNivel}>
                  {tx(nivel.clave).enlace}
                  <i className='ri-arrow-right-line' aria-hidden='true' />
                </Link>
              )}
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}

export default NivelesControl
