'use client'

// El recorrido que la portada no enseñaba (orden de MAD, 22/11/2026): muchas
// fuentes de entrada → una sola memoria que las cruza → un solo sitio donde mirar.
//
// Ni una palabra escrita aquí: todo el texto sale de exporter/casos.md, horneado en
// el build. Y las únicas cifras son las del clon de MAD, leídas de los JSON del día
// con la fecha de su lote; si falta un documento, la franja lo dice y no pinta nada.

import Link from 'next/link'

import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'

import MadClonLogo from '@components/layout/shared/MadClonLogo'

import { useLang } from '@/lib/i18n'
import { fmt, fmtFecha } from '@/lib/data'
import type { PanelDataCarga } from '@/lib/data'
import { CANALES, conDato, textoCurado } from '@/lib/casos'

import styles from './ParaQuienDecide.module.css'

const HACE = ['hace-1', 'hace-2', 'hace-3', 'hace-4']
const ICONOS_HACE = ['ri-links-line', 'ri-calendar-event-line', 'ri-draft-line', 'ri-contacts-book-line']
const DEVUELVE = ['devuelve-1', 'devuelve-2', 'devuelve-3', 'devuelve-4']
const ICONOS_DEVUELVE = ['ri-sun-line', 'ri-scales-3-line', 'ri-flag-line', 'ri-focus-3-line']

type Cifra = { clave: string; valor: number | null }

/** Las cifras de la franja, todas derivadas del dato publicado. null = el dato no vino. */
const cifrasDe = (carga: PanelDataCarga): Cifra[] | null => {
  const { overview, clones, manifest } = carga.data

  if (!overview || !clones || !manifest) return null

  return [
    { clave: 'cifra-buzones', valor: new Set(clones.clones.map(c => c.correo).filter(Boolean)).size },
    { clave: 'cifra-agendas', valor: new Set(clones.clones.flatMap(c => c.calendarios)).size },
    { clave: 'cifra-rutinas', valor: overview.crons.length },
    { clave: 'cifra-personas', valor: overview.personas.fichas_curadas ?? null },
    { clave: 'cifra-oficios', valor: clones.clones.length }
  ]
}

const CLAVES_CIFRA = ['cifra-buzones', 'cifra-agendas', 'cifra-rutinas', 'cifra-personas', 'cifra-oficios']

const RecorridoFuentes = ({ carga }: { carga: PanelDataCarga }) => {
  const { lang, t } = useLang()
  const tx = (clave: string) => textoCurado(clave, lang)
  const cifras = cifrasDe(carga)
  const generado = carga.data.manifest?.generado

  const columna = (clave: string, numero: number, centro: boolean, items: { icono: string; titulo: string; texto: string }[], pie?: { href: string; clave: string }) => (
    <div className={`${styles.columna} ${centro ? styles.centro : ''}`} data-columna={clave}>
      <div className={styles.cabeceraColumna}>
        {centro ? <MadClonLogo width={32} height={32} /> : <span className={styles.numero} aria-hidden='true'>{numero}</span>}
        <div>
          <Typography component='h3' variant='h6'>{tx(clave).titulo}</Typography>
          <Typography variant='body2' color='text.secondary'>{tx(clave).texto}</Typography>
        </div>
      </div>
      <ul className={styles.lista}>
        {items.map(item => (
          <li key={item.titulo} className={styles.item}>
            <span className={styles.icono} aria-hidden='true'><i className={item.icono} /></span>
            <span>
              <Typography component='span' fontWeight={600} className='block'>{item.titulo}</Typography>
              <Typography component='span' variant='body2' color='text.secondary' className='block'>{item.texto}</Typography>
            </span>
          </li>
        ))}
      </ul>
      {pie && (
        <Link href={pie.href} className={`${styles.enlaceNivel} ${styles.pieColumna}`}>
          {tx(pie.clave).titulo}
          <i className='ri-arrow-right-line' aria-hidden='true' />
        </Link>
      )}
    </div>
  )

  return (
    <section data-recorrido>
      <Typography component='h2' variant='h4' id='recorrido'>{tx('recorrido').titulo}</Typography>
      <Typography color='text.secondary' sx={{ mt: 2, mb: 4, maxInlineSize: '75ch' }}>{tx('recorrido').texto}</Typography>

      <div className={styles.recorrido}>
        <div className={styles.rejilla}>
          {columna(
            'columna-llega',
            1,
            false,
            CANALES.map(c => ({ icono: c.icono, titulo: tx(`canal-${c.clave}`).titulo, texto: tx(`canal-${c.clave}`).texto })),
            { href: '#ejemplo-entrada', clave: 'enlace-llega' }
          )}
          <div className={styles.flecha} aria-hidden='true'><i className='ri-arrow-right-line' /></div>
          {columna('columna-hace', 2, true, HACE.map((clave, i) => ({ icono: ICONOS_HACE[i], titulo: tx(clave).titulo, texto: tx(clave).texto })))}
          <div className={styles.flecha} aria-hidden='true'><i className='ri-arrow-right-line' /></div>
          {columna(
            'columna-devuelve',
            3,
            false,
            DEVUELVE.map((clave, i) => ({ icono: ICONOS_DEVUELVE[i], titulo: tx(clave).titulo, texto: tx(clave).texto })),
            { href: '#ejemplo-decision', clave: 'enlace-mesa' }
          )}
        </div>
      </div>

      {/* Instantánea retenida por la fuente: el aviso de estado protegido ya lo da el
          bloque del sistema; aquí no se añade un segundo cartel ni una sola cifra. */}
      {!carga.retenido && (
        <Card variant='outlined' sx={{ mt: 4 }} data-cifras-vivas={cifras ? 'ok' : carga.cargando ? 'cargando' : 'revision'}>
          <CardContent sx={{ display: 'grid', gap: 3 }}>
            {cifras || carga.cargando ? (
              <>
                <div>
                  <Typography component='h3' variant='h6'>{tx('cifras').titulo}</Typography>
                  <Typography variant='body2' color='text.secondary'>
                    {generado ? conDato(tx('cifras').texto, { fecha: fmtFecha(generado) }) : ' '}
                  </Typography>
                </div>
                <dl className={styles.cifras}>
                  {CLAVES_CIFRA.map(clave => {
                    const valor = cifras?.find(c => c.clave === clave)?.valor

                    return (
                      <div key={clave} className={`${styles.cifra} ${cifras && valor === null ? styles.cifraVacia : ''}`} data-cifra={clave}>
                        <dt>
                          {tx(clave).titulo}
                          <span className='block'>{tx(clave).texto}</span>
                        </dt>
                        <dd>{!cifras ? <span className={styles.cifraHueco} aria-hidden='true' /> : valor === null || valor === undefined ? t('sin_dato_valor') : fmt(valor)}</dd>
                      </div>
                    )
                  })}
                </dl>
              </>
            ) : (
              <div role='status'>
                <Typography fontWeight={600}>{tx('cifras-revision').titulo}</Typography>
                <Typography variant='body2' color='text.secondary'>{tx('cifras-revision').texto}</Typography>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </section>
  )
}

export default RecorridoFuentes
