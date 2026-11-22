'use client'

// Un día cualquiera en el despacho de quien decide, contado por cargo
// (orden de MAD, 22/11/2026): alcaldía, rectorado, alta dirección y cargo electo.
//
// Sustituye al guion único de la asociación. Ni una palabra escrita aquí: cada
// caso sale de exporter/casos.md, horneado en el build, y es inventado de
// principio a fin — por eso el rótulo «Caso ilustrativo» va siempre a la vista.
//
// Pestañas (Modern Web Guidance, guías `tabs` y `search-hidden-content`):
//  · los cuatro casos están SIEMPRE en el HTML; el no elegido va con `hidden`, y
//    donde el navegador lo admite sube a `hidden="until-found"` para que «buscar
//    en la página» encuentre el texto de otro cargo y cambie de pestaña sola;
//  · se elige al activar (Intro o Espacio), no al mover el foco: elegir cambia la
//    dirección de la página y los paneles no miden lo mismo;
//  · cada caso tiene dirección propia, `#caso-<clave>`: se puede enviar tal cual.

import { useEffect, useRef, useState } from 'react'
import type { ReactNode, SyntheticEvent } from 'react'

import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Tab from '@mui/material/Tab'
import Tabs from '@mui/material/Tabs'
import Typography from '@mui/material/Typography'

import CopiarEnlace from '@/components/dashboard/CopiarEnlace'

import { useLang } from '@/lib/i18n'
import { CARGOS, anclaDeCaso, cargoDeHash, casosPorCargo, conDato, textoCurado } from '@/lib/casos'

import styles from './ParaQuienDecide.module.css'

// Fecha editorial del guion, compartida por <time> y su texto. No es una métrica
// del sistema ni la fecha de ningún mensaje: es el día en que se escribieron los casos.
const FECHA_GUION = '2026-11-22'

const ancla = {
  scrollMarginBlockStart: 100,
  '&:focus': { outline: '2px solid', outlineColor: 'primary.main', outlineOffset: 4 }
}

const idPestana = (clave: string) => `pestana-${anclaDeCaso(clave)}`

type Props = {

  /** Lo que cierra la sección, debajo de los casos (el enlace a sus límites). */
  children?: ReactNode
}

const CasosPorCargo = ({ children }: Props) => {
  const { lang } = useLang()
  const tx = (clave: string) => textoCurado(clave, lang)
  const casos = casosPorCargo(lang)
  const [cargo, setCargo] = useState(CARGOS[0])
  const tituloRef = useRef<HTMLHeadingElement>(null)
  const pestanasRef = useRef<HTMLDivElement>(null)
  const panelesRef = useRef<HTMLDivElement>(null)

  // Llegar con `#caso-<clave>` (enlace compartido, atrás/adelante) elige esa pestaña
  // y trae las pestañas a la vista. `#demostracion` lleva al título de la sección.
  useEffect(() => {
    let frame: number | undefined

    const desdeHash = () => {
      const pedido = cargoDeHash(window.location.hash)
      const alTitulo = window.location.hash === '#demostracion'

      if (!pedido && !alTitulo) return
      if (pedido) setCargo(pedido)
      if (frame !== undefined) window.cancelAnimationFrame(frame)

      frame = window.requestAnimationFrame(() => {
        frame = undefined

        if (alTitulo) {
          tituloRef.current?.scrollIntoView({ behavior: 'instant', block: 'start' })
          tituloRef.current?.focus({ preventScroll: true })

          return
        }

        pestanasRef.current?.scrollIntoView({ behavior: 'instant', block: 'start' })
        document.getElementById(idPestana(pedido!))?.focus({ preventScroll: true })
      })
    }

    desdeHash()
    window.addEventListener('hashchange', desdeHash)
    window.addEventListener('popstate', desdeHash)

    return () => {
      window.removeEventListener('hashchange', desdeHash)
      window.removeEventListener('popstate', desdeHash)
      if (frame !== undefined) window.cancelAnimationFrame(frame)
    }
  }, [])

  // Mejora progresiva: los paneles ocultos pasan a `hidden="until-found"` donde
  // existe (el HTML inicial ya los trae con `hidden`, que es lo que ve Safari).
  // Si «buscar en la página» encuentra texto en uno de ellos, el navegador lo
  // destapa y avisa con `beforematch`: se elige su pestaña para que todo cuadre.
  useEffect(() => {
    const contenedor = panelesRef.current

    if (!contenedor || !('onbeforematch' in HTMLElement.prototype)) return

    contenedor.querySelectorAll<HTMLElement>('[role="tabpanel"]').forEach(panel => {
      if (panel.dataset.caso !== cargo) panel.setAttribute('hidden', 'until-found')
    })

    const alEncontrar = (evento: Event) => {
      const clave = (evento.target as HTMLElement).closest<HTMLElement>('[role="tabpanel"]')?.dataset.caso

      if (clave) setCargo(clave)
    }

    contenedor.addEventListener('beforematch', alEncontrar)

    return () => contenedor.removeEventListener('beforematch', alEncontrar)
  }, [cargo])

  // Elegir una pestaña deja su dirección en la barra sin llenar el historial: es un
  // movimiento dentro de la misma sección, igual que los saltos entre clones de /flota.
  const elegir = (_: SyntheticEvent, clave: string) => {
    setCargo(clave)
    window.history.replaceState(null, '', `#${anclaDeCaso(clave)}`)
  }

  const fechaGuion = new Date(`${FECHA_GUION}T12:00:00Z`).toLocaleDateString(lang === 'en' ? 'en-GB' : 'es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Europe/Madrid'
  })

  return (
    <section aria-labelledby='demostracion' data-casos-cargo>
      <Typography ref={tituloRef} component='h2' variant='h4' id='demostracion' tabIndex={-1} sx={ancla}>
        {tx('casos').titulo}
      </Typography>
      <Typography color='text.secondary' sx={{ mt: 2, maxInlineSize: '75ch' }}>
        {tx('casos').texto}
      </Typography>
      <Alert severity='info' sx={{ mt: 3, mb: 2 }} data-demo-sintetica>
        <Typography fontWeight={600}>{tx('rotulo').titulo}</Typography>
        <Typography variant='body2'>{tx('rotulo').texto}</Typography>
      </Alert>
      <Typography variant='body2' color='text.secondary' sx={{ mb: 3 }}>
        <time dateTime={FECHA_GUION}>{conDato(tx('guion').titulo, { fecha: fechaGuion })}</time>
        {' · '}
        {tx('guion').texto}
      </Typography>

      <div className={styles.casos}>
        <Tabs
          ref={pestanasRef}
          value={cargo}
          onChange={elegir}
          aria-label={tx('cargos').texto}
          variant='scrollable'
          scrollButtons='auto'
          allowScrollButtonsMobile
          sx={{
            scrollMarginBlockStart: 100,

            // El indicador es un BORDE, no un fondo: en modo de colores forzados los
            // fondos desaparecen y la pestaña elegida se quedaría sin marca.
            '& .MuiTabs-indicator': { backgroundColor: 'transparent', blockSize: 0, borderBlockEnd: '3px solid', borderColor: 'primary.main' },
            '& .MuiTab-root': { minBlockSize: 48, textTransform: 'none', fontSize: '0.9375rem' },
            '& .MuiTab-root.Mui-selected': { color: 'text.primary', fontWeight: 700 },
            '& .MuiTab-root.Mui-focusVisible': { outline: '3px solid', outlineColor: 'primary.main', outlineOffset: -3 },
            '& .MuiTabScrollButton-root': { inlineSize: 44, minBlockSize: 44 }
          }}
        >
          {casos.map(caso => (
            <Tab
              key={caso.clave}
              value={caso.clave}
              id={idPestana(caso.clave)}
              label={caso.cargo}
              icon={<i className={caso.icono} aria-hidden='true' />}
              iconPosition='start'
              data-pestana-caso={caso.clave}
            />
          ))}
        </Tabs>

        <div ref={panelesRef} className={styles.paneles}>
          {casos.map(caso => {
            const elegido = caso.clave === cargo

            return (
              <div
                key={caso.clave}
                role='tabpanel'
                id={anclaDeCaso(caso.clave)}
                aria-labelledby={idPestana(caso.clave)}
                hidden={!elegido}
                data-caso={caso.clave}
              >
                <div className={styles.panel}>
                  <div className={styles.cabeceraCaso}>
                    <div>
                      <Typography fontWeight={700}>{caso.quien}</Typography>
                      <Typography variant='body2' color='text.secondary'>{caso.dia}</Typography>
                    </div>
                    <CopiarEnlace ancla={anclaDeCaso(caso.clave)} rotulo={tx('enlace-caso').titulo} rotuloCopiado={tx('enlace-caso').texto} />
                  </div>

                  <div className={styles.etapas}>
                    <article className={styles.etapa} aria-labelledby={`${caso.clave}-llega`} data-demo-etapa='1'>
                      <div>
                        {/* `#ejemplo-entrada` es una dirección ya publicada: apunta siempre al caso elegido. */}
                        <Typography component='h3' variant='h6' id={`${caso.clave}-llega`}>
                          <Box component='span' id={elegido ? 'ejemplo-entrada' : undefined} tabIndex={-1} sx={ancla}>
                            {`1. ${tx('etapa-llega').titulo}`}
                          </Box>
                        </Typography>
                        <Typography variant='body2' color='text.secondary'>{tx('etapa-llega').texto}</Typography>
                      </div>
                      <ul className={styles.lista} data-demo-fuentes>
                        {caso.llega.map(entrada => (
                          <li key={entrada.texto} className={styles.entrada}>
                            <span className={styles.icono} aria-hidden='true'><i className={entrada.icono} /></span>
                            <span>
                              <span className={styles.canal}>{entrada.nombreCanal}</span>
                              {entrada.texto}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </article>

                    <article className={styles.etapa} aria-labelledby={`${caso.clave}-hace`} data-demo-etapa='2'>
                      <div>
                        <Typography component='h3' variant='h6' id={`${caso.clave}-hace`}>{`2. ${tx('etapa-hace').titulo}`}</Typography>
                        <Typography variant='body2' color='text.secondary'>{tx('etapa-hace').texto}</Typography>
                      </div>
                      <ol className={styles.cruces}>
                        {caso.cruces.map(cruce => (
                          <li key={cruce.titulo} className={styles.cruce}>
                            <span>
                              <Typography component='span' fontWeight={600} className='block'>{cruce.titulo}</Typography>
                              <Typography component='span' color='text.secondary' className='block'>{cruce.texto}</Typography>
                            </span>
                          </li>
                        ))}
                      </ol>
                    </article>

                    <article className={styles.etapa} aria-labelledby={`${caso.clave}-mesa`} data-demo-etapa='3'>
                      <div>
                        <Typography component='h3' variant='h6' id={`${caso.clave}-mesa`}>
                          <Box component='span' id={elegido ? 'ejemplo-decision' : undefined} tabIndex={-1} sx={ancla}>
                            {`3. ${tx('etapa-mesa').titulo}`}
                          </Box>
                        </Typography>
                        <Typography variant='body2' color='text.secondary'>{tx('etapa-mesa').texto}</Typography>
                      </div>
                      <div className={styles.grupoMesa} data-mesa-decisiones>
                        <Typography component='h4' variant='subtitle1'>
                          {tx('mesa-decisiones').titulo}
                          <Typography component='span' variant='body2' color='text.secondary'>{` · ${tx('mesa-decisiones').texto}`}</Typography>
                        </Typography>
                        <ul className={styles.puntos}>
                          {caso.decisiones.map(decision => (
                            <li key={decision} className={styles.punto}>
                              <i className='ri-scales-3-line' aria-hidden='true' />
                              <span>{decision}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className={styles.grupoMesa} data-mesa-compromisos>
                        <Typography component='h4' variant='subtitle1'>
                          {tx('mesa-compromisos').titulo}
                          <Typography component='span' variant='body2' color='text.secondary'>{` · ${tx('mesa-compromisos').texto}`}</Typography>
                        </Typography>
                        <ul className={styles.puntos}>
                          {caso.compromisos.map(compromiso => (
                            <li key={compromiso} className={styles.punto}>
                              <i className='ri-flag-line' aria-hidden='true' />
                              <span>{compromiso}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      {caso.avisos.map(aviso => (
                        <div key={aviso} className={styles.aviso} data-mesa-aviso>
                          <i className='ri-alarm-warning-line' aria-hidden='true' />
                          <span>
                            <Typography component='span' fontWeight={600}>{`${tx('mesa-aviso').titulo}: `}</Typography>
                            {aviso}
                          </span>
                        </div>
                      ))}
                    </article>

                    <article className={styles.etapa} aria-labelledby={`${caso.clave}-decides`} data-demo-etapa='4'>
                      <div>
                        <Typography component='h3' variant='h6' id={`${caso.clave}-decides`}>{`4. ${tx('etapa-decides').titulo}`}</Typography>
                        <Typography variant='body2' color='text.secondary'>{tx('etapa-decides').texto}</Typography>
                      </div>
                      <Typography data-demo-decides>{caso.decides}</Typography>
                      <div className={styles.cambia} data-demo-cambia>
                        <Typography component='h4' variant='subtitle1'>{tx('cambia').titulo}</Typography>
                        <Typography color='text.secondary'>{caso.gana}</Typography>
                      </div>
                    </article>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
      {children}
    </section>
  )
}

export default CasosPorCargo
