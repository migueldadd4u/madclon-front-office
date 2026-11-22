'use client'

// El cuerpo de la portada, para quien decide (orden de MAD, 22/11/2026).
//
// Hasta ese día explicaba el clon con un único guion —una asociación con
// solicitudes duplicadas— escrito aquí dentro. Quien dirige una institución no se
// reconocía en él ni veía el recorrido entero. Ahora son cinco piezas, en el orden
// en que se entiende:
//   1. el recorrido: muchas puertas → una memoria → una sola mesa (+ cifras vivas);
//   2. un día en tu despacho, por cargo;
//   3. el nivel de control que se gana, escalón a escalón;
//   4. qué se puede comprobar y cuáles son los límites;
//   5. por dónde se empieza.
// Ni una palabra escrita aquí: todo el texto sale de exporter/casos.md.

import { useEffect, useRef } from 'react'

import Link from 'next/link'

import Accordion from '@mui/material/Accordion'
import AccordionDetails from '@mui/material/AccordionDetails'
import AccordionSummary from '@mui/material/AccordionSummary'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import Typography from '@mui/material/Typography'

import RecorridoFuentes from '@/components/dashboard/RecorridoFuentes'
import CasosPorCargo from '@/components/dashboard/CasosPorCargo'
import NivelesControl from '@/components/dashboard/NivelesControl'

import { useLang } from '@/lib/i18n'
import type { PanelDataCarga } from '@/lib/data'
import { textoCurado } from '@/lib/casos'

const LIMITES = ['limite-1', 'limite-2', 'limite-3']

const ancla = {
  scrollMarginBlockStart: 100,
  '&:focus': { outline: '2px solid', outlineColor: 'primary.main', outlineOffset: 4 }
}

const foco = { '&.Mui-focusVisible': { outline: '3px solid', outlineColor: 'primary.main', outlineOffset: 3 } }

const EscaparateClon = ({ carga }: { carga: PanelDataCarga }) => {
  const { lang } = useLang()
  const tx = (clave: string) => textoCurado(clave, lang)
  const limitesRef = useRef<HTMLHeadingElement>(null)

  // `#limites-privacidad` (enlace de la cabecera y del final de los casos): lleva la
  // vista y el foco al título. `#demostracion` y `#caso-…` los atiende CasosPorCargo.
  useEffect(() => {
    let frame: number | undefined

    const sincronizarAncla = () => {
      if (frame !== undefined) window.cancelAnimationFrame(frame)

      frame = window.requestAnimationFrame(() => {
        frame = undefined

        if (window.location.pathname !== `${process.env.NEXT_PUBLIC_BASE_PATH ?? ''}/`) return
        if (window.location.hash !== '#limites-privacidad') return

        const destino = limitesRef.current

        if (!destino?.isConnected) return

        destino.scrollIntoView({ behavior: 'instant', block: 'start' })
        destino.focus({ preventScroll: true })
      })
    }

    window.addEventListener('popstate', sincronizarAncla)
    window.addEventListener('hashchange', sincronizarAncla)
    sincronizarAncla()

    return () => {
      window.removeEventListener('popstate', sincronizarAncla)
      window.removeEventListener('hashchange', sincronizarAncla)
      if (frame !== undefined) window.cancelAnimationFrame(frame)
    }
  }, [])

  return (
    <Box sx={{ display: 'grid', gap: 8 }} data-escaparate-clon>
      <RecorridoFuentes carga={carga} />

      <CasosPorCargo>
        <Button component={Link} href='#limites-privacidad' variant='text' color='inherit' sx={{ mt: 4, minBlockSize: 48, ...foco }}>
          {tx('ver-limites').titulo}
        </Button>
      </CasosPorCargo>

      <NivelesControl />

      <section aria-labelledby='limites-privacidad'>
        <Typography ref={limitesRef} component='h2' variant='h4' id='limites-privacidad' tabIndex={-1} sx={{ ...ancla, mb: 4 }}>
          {tx('limites').titulo}
        </Typography>
        {LIMITES.map((clave, indice) => (
          <Accordion key={clave} defaultExpanded={indice === 0}>
            <AccordionSummary
              id={`limite-${indice}-cabecera`}
              aria-controls={`limite-${indice}-contenido`}
              expandIcon={<i className='ri-arrow-down-s-line' aria-hidden='true' />}
              sx={{ minBlockSize: 56, ...foco }}
            >
              <Typography component='span' fontWeight={600}>
                {tx(clave).titulo}
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography color='text.secondary' sx={{ maxInlineSize: '85ch' }}>
                {tx(clave).texto}
              </Typography>
            </AccordionDetails>
          </Accordion>
        ))}
      </section>

      <Card variant='outlined' component='section' aria-labelledby='siguiente-paso'>
        <CardContent sx={{ display: 'grid', gap: 3 }}>
          <Chip label='MAD Clon' variant='outlined' sx={{ justifySelf: 'start' }} />
          <Typography component='h2' variant='h4' id='siguiente-paso'>
            {tx('siguiente').titulo}
          </Typography>
          <Typography color='text.secondary' sx={{ maxInlineSize: '75ch' }}>
            {tx('siguiente').texto}
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 3 }}>
            <Button component={Link} href='/retos/' variant='contained' sx={{ minBlockSize: 48, bgcolor: 'text.primary', color: 'background.paper', '&:hover': { bgcolor: 'text.primary' }, ...foco }}>
              {tx('siguiente-retos').titulo}
            </Button>
            <Button component={Link} href='/preguntas/#institucion' variant='text' color='inherit' sx={{ minBlockSize: 48, ...foco }}>
              {tx('siguiente-preguntas').titulo}
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  )
}

export default EscaparateClon
