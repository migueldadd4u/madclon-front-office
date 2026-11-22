'use client'

// «Si diriges una institución»: qué te enseña ESTA página (orden de MAD, 22/11/2026).
//
// Las páginas del sistema por dentro contaban la maquinaria y ninguna decía qué
// significa para quien decide. Este bloque lo dice en dos frases, y en tres páginas
// añade ejemplos por cargo: un reto inventado en /retos, un reparto de oficios en
// /flota y la traducción de las cuatro cifras de /actividad.
//
// Ni una palabra escrita aquí: todo sale de exporter/casos.md, horneado en el build.

import Link from 'next/link'

import Typography from '@mui/material/Typography'

import { useLang } from '@/lib/i18n'
import { anclaDeCaso, casosPorCargo, conDato, textoCurado } from '@/lib/casos'
import type { Altura } from '@/lib/casos'
import { RETOS_BUILD } from '@/lib/copia-retos'

import styles from './ParaQuienDecide.module.css'

export type PaginaLectura = 'retos' | 'flota' | 'actividad' | 'salud' | 'tokens' | 'eficiencia' | 'hardware' | 'historia'

/** El nombre público de cada altura lo pone exporter/retos.md: una sola fuente por cosa. */
const BLOQUE_ALTURA: Record<Altura, string> = {
  horizonte: 'altura-horizonte',
  frente: 'altura-frente',
  reto: 'altura-reto',
  empujon: 'altura-empujon'
}

const TRADUCCIONES = ['actividad-propuestas', 'actividad-bandeja', 'actividad-esperas', 'actividad-decisiones']

type Props = {
  pagina: PaginaLectura

  /** Valores del día para los huecos del texto (`{n}`, `{dias}`). Sin ellos, el hueco no se enseña. */
  dato?: Record<string, string>
}

const ParaQuienDecide = ({ pagina, dato }: Props) => {
  const { lang } = useLang()
  const tx = (clave: string) => textoCurado(clave, lang)
  const lectura = tx(`lectura-${pagina}`)
  const casos = pagina === 'retos' || pagina === 'flota' ? casosPorCargo(lang) : []

  // Un texto con hueco y sin dato no se enseña a medias: se omite la frase entera.
  const texto = /\{[a-z]+\}/.test(lectura.texto) && !dato ? '' : conDato(lectura.texto, dato ?? {})

  const enlaceCaso = (clave: string, cargo: string) => (
    <Link href={`/#${anclaDeCaso(clave)}`} className={styles.enlaceNivel}>
      {tx('ver-caso').titulo}
      <span className='sr-only'>{`: ${cargo}`}</span>
      <i className='ri-arrow-right-line' aria-hidden='true' />
    </Link>
  )

  return (
    <div className={styles.lectura} data-lectura={pagina}>
      <div className={styles.lecturaCabecera}>
        <span className={styles.icono} aria-hidden='true'><i className='ri-government-line' /></span>
        <div>
          <Typography variant='overline' component='p' color='text.secondary' sx={{ lineHeight: 1.6 }}>{tx('lectura').titulo}</Typography>
          <Typography component='h2' variant='h6' id={`lectura-${pagina}`}>{lectura.titulo}</Typography>
          {texto && <Typography color='text.secondary' sx={{ mt: 1, maxInlineSize: '85ch' }}>{texto}</Typography>}
        </div>
      </div>

      {pagina === 'retos' && (
        <div data-retos-ejemplo>
          <Typography component='h3' variant='subtitle1'>{tx('retos-ejemplo').titulo}</Typography>
          <Typography variant='body2' color='text.secondary' sx={{ mb: 2 }}>{tx('retos-ejemplo').texto}</Typography>
          <ul className={styles.ejemplos}>
            {casos.map(caso => (
              <li key={caso.clave} className={styles.ejemplo}>
                <span className={styles.ejemploCargo}>
                  <i className={caso.icono} aria-hidden='true' />
                  {`${caso.cargo} · ${RETOS_BUILD[BLOQUE_ALTURA[caso.reto.altura]]?.[`${lang}_titulo`] ?? ''}`}
                </span>
                <Typography component='h4' fontWeight={600}>{caso.reto.titulo}</Typography>
                <dl className={styles.definiciones}>
                  <div>
                    <dt>{tx('reto-paso').titulo}</dt>
                    <dd>{caso.reto.paso}</dd>
                  </div>
                  <div>
                    <dt>{tx('reto-fin').titulo}</dt>
                    <dd>{caso.reto.fin}</dd>
                  </div>
                </dl>
                {enlaceCaso(caso.clave, caso.cargo)}
              </li>
            ))}
          </ul>
        </div>
      )}

      {pagina === 'flota' && (
        <div data-equipo-ejemplo>
          <Typography component='h3' variant='subtitle1'>{tx('equipo-ejemplo').titulo}</Typography>
          <Typography variant='body2' color='text.secondary' sx={{ mb: 2 }}>{tx('equipo-ejemplo').texto}</Typography>
          <ul className={styles.ejemplos}>
            {casos.map(caso => (
              <li key={caso.clave} className={styles.ejemplo}>
                <span className={styles.ejemploCargo}>
                  <i className={caso.icono} aria-hidden='true' />
                  {caso.cargo}
                </span>
                <dl className={`${styles.definiciones} ${styles.oficios}`}>
                  {caso.equipo.map(oficio => (
                    <div key={oficio.titulo}>
                      <dt>{oficio.titulo}</dt>
                      <dd>{oficio.texto}</dd>
                    </div>
                  ))}
                </dl>
                {enlaceCaso(caso.clave, caso.cargo)}
              </li>
            ))}
          </ul>
        </div>
      )}

      {pagina === 'actividad' && (
        <div data-actividad-despacho>
          <Typography component='h3' variant='subtitle1' sx={{ mb: 2 }}>{tx('actividad-despacho').titulo}</Typography>
          <dl className={styles.traducciones}>
            {TRADUCCIONES.map(clave => (
              <div key={clave}>
                <dt>{tx(clave).titulo}</dt>
                <dd>{tx(clave).texto}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}
    </div>
  )
}

export default ParaQuienDecide
