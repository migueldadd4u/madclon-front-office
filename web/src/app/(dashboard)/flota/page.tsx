'use client'

// React Imports
import { useEffect, useState } from 'react'

// MUI Imports
import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import CardActionArea from '@mui/material/CardActionArea'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'

import CustomAvatar from '@core/components/mui/Avatar'

// Component Imports
import DataGate from '@/components/dashboard/DataGate'
import CountUp from '@/components/dashboard/CountUp'
import BarraEntra from '@/components/dashboard/BarraEntra'
import AnatomiaClon, { COLORES_CLON as COLORES, ICONOS_CLON as ICONOS } from '@/components/dashboard/AnatomiaClon'

// Hook Imports
import { useLang } from '@/lib/i18n'

// Data Imports
import { fmtCorto } from '@/lib/data'

const FlotaPage = () => {
  const { t } = useLang()
  const [perfilAbierto, setPerfilAbierto] = useState<string | null>(null)
  const [anuncio, setAnuncio] = useState('')

  // Deep-link compartible: #clon-<perfil> abre la anatomía directamente.
  // El hash es HISTORIA REAL (pushState al abrir): así el gesto de atrás del
  // navegador cierra la capa 2 y devuelve a la Flota en vez de sacarte de la web.
  // Los saltos laterales entre clones, en cambio, van con replaceState: son un
  // movimiento DENTRO de la misma capa, y «atrás» debe seguir subiendo a la capa 1.
  useEffect(() => {
    const desdeHash = () => {
      const m = /^#clon-([a-z]+)$/.exec(window.location.hash)

      setPerfilAbierto(m ? m[1] : null)
    }

    desdeHash()
    window.addEventListener('hashchange', desdeHash)

    return () => window.removeEventListener('hashchange', desdeHash)
  }, [])

  const abrir = (perfil: string) => {
    setPerfilAbierto(perfil)
    window.history.pushState(null, '', `#clon-${perfil}`)
  }

  // Subir a la capa 1. Si la capa 2 la abrió esta sesión, se sube por el historial
  // para que «atrás» y este botón sean literalmente lo mismo; si se llegó por
  // deep-link (no hay nada detrás), se limpia el hash sin dejar rastro.
  const cerrar = () => {
    setPerfilAbierto(null)
    setAnuncio('')
    if (window.location.hash.startsWith('#clon-')) window.history.back()
    else window.history.replaceState(null, '', window.location.pathname + window.location.search)
  }

  return (
  <DataGate>
    {({ clones, tokens, ...resto }) => {
      const consumo = new Map(tokens.por_clon.map(c => [c.clon, c.tokens ?? 0]))
      const maxConsumo = Math.max(...consumo.values(), 1)
      const clonSel = clones.clones.find(c => c.perfil === perfilAbierto) ?? null
      const iSel = clones.clones.findIndex(c => c.perfil === perfilAbierto)

      // Movimiento lateral DENTRO de la capa 2: cambia de clon sin volver a la capa 1.
      // Va con replaceState a propósito (ver arriba) y se anuncia con aria-live.
      const saltar = (paso: number) => {
        const n = clones.clones.length
        const destino = clones.clones[(iSel + paso + n) % n]
        const nombre = destino.perfil.charAt(0).toUpperCase() + destino.perfil.slice(1)

        setPerfilAbierto(destino.perfil)
        window.history.replaceState(null, '', `#clon-${destino.perfil}`)
        setAnuncio(
          t('capa_anuncio')
            .replace('{nombre}', nombre)
            .replace('{pos}', t('capa_posicion').replace('{i}', String(((iSel + paso + n) % n) + 1)).replace('{total}', String(n)))
        )
      }

      return (
        <Grid container spacing={6}>
          <Grid size={12}>
            <Typography variant='h4' className='mbe-1'>{t('flota_titulo')}</Typography>
            <Typography color='text.secondary' className='max-is-3xl'>
              {t('flota_intro_1')} <em>{t('flota_intro_2')}</em>{t('flota_intro_3')}
            </Typography>
            <Typography variant='caption' color='text.secondary' className='flex items-center gap-1 mbs-2'>
              <i className='ri-cursor-line' aria-hidden />
              {t('flota_intro_4')}
            </Typography>
          </Grid>

          {clones.clones.map(c => {
            const usado = consumo.get(c.perfil) ?? 0
            const pct = Math.max((usado / maxConsumo) * 100, usado > 0 ? 2 : 0)
            const nombreVisible = c.perfil.charAt(0).toUpperCase() + c.perfil.slice(1)

            return (
              <Grid key={c.perfil} size={{ xs: 12, sm: 6, lg: 4 }}>
                <Card className='bs-full fo-card-hover'>
                  <CardActionArea
                    onClick={() => abrir(c.perfil)}
                    data-anatomia-abrir={c.perfil}
                    aria-label={t('anat_abrir_aria').replace('{nombre}', nombreVisible)}
                    sx={{ height: '100%', display: 'flex', alignItems: 'stretch', justifyContent: 'flex-start' }}
                  >
                    <CardContent className='flex flex-col gap-4 bs-full' sx={{ inlineSize: '100%' }}>
                      <div className='flex items-center gap-3'>
                        <CustomAvatar color={COLORES[c.perfil] ?? 'primary'} skin='light' size={42} variant='rounded'>
                          <i className={`${ICONOS[c.perfil] ?? 'ri-robot-2-line'} text-2xl`} />
                        </CustomAvatar>
                        <div>
                          <Typography variant='h6' className='capitalize'>{c.perfil}</Typography>
                          <Typography variant='caption' color='text.secondary'>{c.rol}</Typography>
                        </div>
                      </div>

                      {c.mision && (
                        <Typography variant='body2' color='text.secondary' className='flex-auto'>{c.mision}</Typography>
                      )}

                      <div className='flex flex-wrap gap-1'>
                        {c.canales.map(canal => (
                          <Chip key={canal} size='small' variant='outlined' label={canal} />
                        ))}
                        {c.correo && <Chip size='small' variant='outlined' icon={<i className='ri-mail-line' />} label='correo' />}
                        {c.calendarios.length > 0 && (
                          <Chip size='small' variant='outlined' icon={<i className='ri-calendar-line' />} label={`${c.calendarios.length} agendas`} />
                        )}
                      </div>

                      <div>
                        <div className='flex justify-between mbe-1'>
                          <Typography variant='caption' color='text.secondary'>{t('flota_trabajo')}</Typography>
                          <Typography variant='caption' className='font-mono'>
                            <CountUp to={usado} format={fmtCorto} /> {t('flota_tokens')}
                          </Typography>
                        </div>
                        <BarraEntra
                          value={pct}
                          color={COLORES[c.perfil] ?? 'primary'}
                          label={`${c.perfil} — ${t('flota_trabajo')}: ${fmtCorto(usado)} ${t('flota_tokens')}`}
                        />
                      </div>

                      <div className='flex justify-end'>
                        <span
                          className='flex items-center gap-1 text-xs'
                          style={{
                            border: '1px solid var(--mui-palette-primary-main)',
                            color: 'var(--mui-palette-text-primary)',
                            borderRadius: 999,
                            padding: '3px 12px'
                          }}
                        >
                          {t('anat_ver')}
                          <i className='ri-arrow-right-s-line' aria-hidden />
                        </span>
                      </div>
                    </CardContent>
                  </CardActionArea>
                </Card>
              </Grid>
            )
          })}

          {clonSel && (
            <AnatomiaClon
              clon={clonSel}
              datos={{ clones, tokens, ...resto }}
              icono={ICONOS[clonSel.perfil] ?? 'ri-robot-2-line'}
              color={COLORES[clonSel.perfil] ?? 'primary'}
              open
              onClose={cerrar}
              onAnterior={() => saltar(-1)}
              onSiguiente={() => saltar(1)}
              posicion={{ i: iSel + 1, total: clones.clones.length }}
            />
          )}

          {/* lo que cambia al saltar de clon se dice en voz alta para quien no lo ve */}
          <div role='status' aria-live='polite' className='sr-only'>
            {anuncio}
          </div>
        </Grid>
      )
    }}
  </DataGate>
  )
}

export default FlotaPage
