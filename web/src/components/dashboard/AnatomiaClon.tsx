'use client'

// React Imports
import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'

// MUI Imports
import Box from '@mui/material/Box'
import Dialog from '@mui/material/Dialog'
import DialogContent from '@mui/material/DialogContent'
import Divider from '@mui/material/Divider'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import { useTheme } from '@mui/material/styles'
import CustomAvatar from '@core/components/mui/Avatar'

// Component Imports
import CountUp from '@/components/dashboard/CountUp'
import BarraEntra from '@/components/dashboard/BarraEntra'
import PuntoVivo from '@/components/dashboard/PuntoVivo'

// Hook Imports
import { useLang } from '@/lib/i18n'
import type { StrKey } from '@/lib/i18n'

// Data Imports
import { fmtCorto } from '@/lib/data'
import type { ClonePerfil, PanelData } from '@/lib/data'

// Anatomía de un clon — el modal que se abre al pulsar su tarjeta en la Flota.
// Compone la ficha completa cruzando SOLO los JSON públicos ya exportados:
// puertas (canales), conexiones en vivo (correo/agendas × integraciones),
// rutinas de madrugada (crons por ámbito), cerebro (gateway propio) y
// peso en la orquesta (tokens 30 d). Nada sale del vault: si un dato no
// está en los JSON, la sección dice la verdad con gracia en vez de inventarlo.
// Accesibilidad: Dialog MUI (foco atrapado, Esc y backdrop cierran, el foco
// vuelve a la tarjeta al cerrar), aria-labelledby con el nombre del clon,
// transición desactivada con prefers-reduced-motion.

type Color = 'primary' | 'success' | 'warning' | 'error' | 'info' | 'secondary'

// Mapas de marca por perfil — fuente única, la página de la flota los importa de aquí.
export const ICONOS_CLON: Record<string, string> = {
  clon: 'ri-robot-2-line',
  ceo: 'ri-briefcase-4-line',
  patrimonio: 'ri-bank-line',
  padre: 'ri-parent-line',
  ideas: 'ri-lightbulb-flash-line',
  licitador: 'ri-auction-line',
  tecnico: 'ri-tools-line'
}

export const COLORES_CLON: Record<string, Color> = {
  clon: 'primary',
  ceo: 'info',
  patrimonio: 'success',
  padre: 'error',
  ideas: 'warning',
  licitador: 'secondary',
  tecnico: 'info'
}

type Props = {
  clon: ClonePerfil
  datos: PanelData
  icono: string
  color: Color
  open: boolean
  onClose: () => void
}

const CIERRE: Record<string, StrKey> = {
  clon: 'anat_cierre_clon',
  ceo: 'anat_cierre_ceo',
  patrimonio: 'anat_cierre_patrimonio',
  padre: 'anat_cierre_padre',
  ideas: 'anat_cierre_ideas',
  licitador: 'anat_cierre_licitador',
  tecnico: 'anat_cierre_tecnico'
}

// Órbita del mini-mapa: los seis oficios alrededor del director (ángulos en grados).
const ORBITA = [
  { perfil: 'ceo', ang: 90 },
  { perfil: 'patrimonio', ang: 30 },
  { perfil: 'padre', ang: 330 },
  { perfil: 'ideas', ang: 270 },
  { perfil: 'licitador', ang: 210 },
  { perfil: 'tecnico', ang: 150 }
] as const

const MAPA_CX = 180
const MAPA_CY = 85
const MAPA_RX = 130
const MAPA_RY = 55

const Seccion = ({ icono, titulo, sub, children }: { icono: string; titulo: string; sub: string; children: ReactNode }) => (
  <section className='flex flex-col gap-1'>
    <div className='flex items-center gap-2'>
      <i className={`${icono} text-xl text-primary`} aria-hidden />
      <Typography variant='h6' component='h3'>{titulo}</Typography>
    </div>
    <Typography variant='caption' color='text.secondary'>{sub}</Typography>
    <div className='mbs-1'>{children}</div>
  </section>
)

/** Puntito rojo quieto (fallo): el estado real va siempre también en texto. */
const PuntoRojo = ({ size = 9 }: { size?: number }) => (
  <span
    aria-hidden
    style={{
      width: size,
      height: size,
      borderRadius: '50%',
      backgroundColor: 'var(--mui-palette-error-main)',
      flexShrink: 0,
      display: 'inline-block'
    }}
  />
)

const AnatomiaClon = ({ clon, datos, icono, color, open, onClose }: Props) => {
  const { lang, t } = useLang()
  const theme = useTheme()
  const [ahora, setAhora] = useState(() => Date.now())
  const [reduced, setReduced] = useState(false)

  useEffect(() => {
    setReduced(window.matchMedia('(prefers-reduced-motion: reduce)').matches)
    const id = setInterval(() => setAhora(Date.now()), 30_000)

    return () => clearInterval(id)
  }, [])

  // «hace 3 h» / «3 h ago» — mismo lenguaje que el Latido de la portada
  const haceX = (iso: string | null): string => {
    if (!iso) return t('anat_sin_senal')
    const d = new Date(iso).getTime()

    if (Number.isNaN(d)) return t('anat_sin_senal')

    const min = Math.max(0, Math.round((ahora - d) / 60_000))

    if (min < 1) return t('latido_ahora')
    if (min < 60) return lang === 'en' ? `${min} ${t('latido_min')} ${t('latido_ago')}` : `${t('latido_ago')} ${min} ${t('latido_min')}`
    if (min < 60 * 48) return lang === 'en' ? `${Math.round(min / 60)} ${t('latido_h')} ${t('latido_ago')}` : `${t('latido_ago')} ${Math.round(min / 60)} ${t('latido_h')}`

    return lang === 'en' ? `${Math.round(min / 1440)} ${t('latido_d')} ${t('latido_ago')}` : `${t('latido_ago')} ${Math.round(min / 1440)} ${t('latido_d')}`
  }

  const reemplaza = (texto: string, k: string, v: string) => texto.replace(`{${k}}`, v)

  // --- conexiones en vivo: correo + agendas cruzados con integraciones ---
  const integraPorNombre = new Map(datos.clones.integraciones.map(i => [i.nombre, i]))
  const conexiones = [clon.correo, ...clon.calendarios].filter((n): n is string => Boolean(n))

  // --- rutinas: las suyas por ámbito; si no tiene, las compartidas del sistema ---
  const propias = datos.overview.crons.filter(c => c.ambito === clon.perfil)
  const rutinas = propias.length > 0 ? propias : datos.overview.crons.filter(c => c.ambito === 'global')

  // --- cerebro: su gateway; el del director es el router a secas ---
  const gateways = datos.overview.gateways ?? []
  const esRouter = clon.perfil === 'clon'
  const gateway = esRouter ? 'gateway' : `gateway-${clon.perfil}`
  const gatewayVivo = gateways.includes(gateway)

  // --- peso en la orquesta: tokens 30 d y porcentaje del sistema entero ---
  const total = datos.tokens.por_clon.reduce((s, c) => s + (c.tokens ?? 0), 0)
  const usado = datos.tokens.por_clon.find(c => c.clon === clon.perfil)?.tokens ?? 0
  const frac = total > 0 ? usado / total : 0
  const nf = new Intl.NumberFormat(lang === 'en' ? 'en-US' : 'es-ES', { maximumFractionDigits: 1 })
  const deCada10 = Math.round(frac * 10)
  const frasePeso = deCada10 >= 1
    ? reemplaza(t('anat_peso_frase_10'), 'x', nf.format(deCada10))
    : reemplaza(t('anat_peso_frase_1000'), 'x', nf.format(Math.max(1, Math.round(frac * 1000))))

  // comparador silencioso: las barras gemelas atenuadas del resto dan escala,
  // sin interacción — solo contexto (excluye «motor» y «sin atribuir»: no son clones)
  const flotaEscala = datos.clones.clones
    .map(c => ({ perfil: c.perfil, tokens: datos.tokens.por_clon.find(p => p.clon === c.perfil)?.tokens ?? 0 }))
    .sort((a, b) => b.tokens - a.tokens)

  const tituloId = `anat-titulo-${clon.perfil}`
  const nombreVisible = clon.perfil.charAt(0).toUpperCase() + clon.perfil.slice(1)

  return (
    <Dialog
      open={open}
      onClose={onClose}
      aria-labelledby={tituloId}
      maxWidth='sm'
      fullWidth
      scroll='paper'
      transitionDuration={reduced ? 0 : 225}
      sx={{
        '& .MuiDialog-paper:not(.MuiDialog-paperFullScreen)': {
          margin: { xs: '8px', sm: '32px' }
        },
        '& .MuiDialog-paper': {
          width: { xs: 'calc(100% - 16px)', sm: 'calc(100% - 64px)' },
          maxHeight: { xs: 'calc(100% - 16px)', sm: 'calc(100% - 64px)' }
        }
      }}
    >
      <DialogContent className='flex flex-col gap-5'>
        {/* cabecera: avatar, nombre, oficio y misión */}
        <div className='flex items-start gap-3'>
          <CustomAvatar color={color} skin='light' size={46} variant='rounded'>
            <i className={`${icono} text-2xl`} />
          </CustomAvatar>
          <div className='flex-auto'>
            <Typography variant='h5' id={tituloId}>{nombreVisible}</Typography>
            <Typography variant='body2' color='text.secondary'>{clon.rol}</Typography>
          </div>
          <IconButton aria-label={t('anat_cerrar')} onClick={onClose} size='small' autoFocus>
            <i className='ri-close-line text-xl' />
          </IconButton>
        </div>

        {clon.mision && (
          <Typography variant='body2' color='text.secondary'>{clon.mision}</Typography>
        )}

        <Typography variant='body2' color='text.secondary'>
          <em>{t('anat_quees')}</em>
        </Typography>

        <Divider />

        {/* a. sus puertas */}
        <Seccion icono='ri-door-open-line' titulo={t('anat_puertas')} sub={t('anat_puertas_sub')}>
          <div className='flex flex-wrap gap-1'>
            {clon.canales.map(canal => (
              <Chip key={canal} size='small' variant='outlined' label={canal} />
            ))}
          </div>
        </Seccion>

        <Divider />

        {/* b. sus conexiones, en vivo */}
        <Seccion icono='ri-pulse-line' titulo={t('anat_conexiones')} sub={t('anat_conexiones_sub')}>
          {conexiones.length > 0 ? (
            <ul className='flex flex-col gap-2' style={{ margin: 0, padding: 0, listStyle: 'none' }}>
              {conexiones.map(nombre => {
                const integ = integraPorNombre.get(nombre)
                const ok = integ?.estado?.includes('🟢') ?? false
                const estadoTexto = integ
                  ? ok
                    ? t('anat_senal').replace('{x}', haceX(integ.ultimo_ok))
                    : (integ.estado || t('anat_sin_senal')).replace(/^[🔴🟢⚪]\s*/u, '')
                  : t('anat_sin_senal')

                return (
                  <li key={nombre} className='flex items-center gap-2'>
                    {ok ? <PuntoVivo /> : <PuntoRojo />}
                    <Typography variant='body2' className='flex-auto'>{nombre}</Typography>
                    <Typography variant='caption' color='text.secondary' className='font-mono'>{estadoTexto}</Typography>
                  </li>
                )
              })}
            </ul>
          ) : (
            <Typography variant='body2' color='text.secondary'>
              {reemplaza(t('anat_sin_conexiones'), 'canales', clon.canales.join(', '))}
            </Typography>
          )}
        </Seccion>

        <Divider />

        {/* c. sus rutinas de madrugada */}
        <Seccion icono='ri-moon-clear-line' titulo={t('anat_rutinas')} sub={t('anat_rutinas_sub')}>
          {propias.length === 0 && (
            <Typography variant='body2' color='text.secondary' className='mbe-1'>
              {t('anat_rutinas_compartidas')}
            </Typography>
          )}
          <ul className='flex flex-col gap-2' style={{ margin: 0, padding: 0, listStyle: 'none' }}>
            {rutinas.map(r => {
              const ok = r.estado === 'ok'

              return (
                <li key={r.nombre} className='flex items-center gap-2'>
                  {ok ? <PuntoVivo /> : <PuntoRojo />}
                  <Typography variant='body2' className='flex-auto'>{r.nombre}</Typography>
                  <Typography variant='caption' color='text.secondary' className='font-mono'>
                    {reemplaza(t('anat_rutina_ultima'), 'x', r.ultima)}
                  </Typography>
                </li>
              )
            })}
          </ul>
        </Seccion>

        <Divider />

        {/* d. su cerebro */}
        <Seccion icono='ri-brain-line' titulo={t('anat_cerebro')} sub=''>
          <div className='flex flex-col gap-2'>
            <div>
              <Chip
                size='small'
                color={gatewayVivo ? color : 'default'}
                variant='tonal'
                label={<span className='font-mono'>{gateway}</span>}
              />
            </div>
            <Typography variant='body2' color='text.secondary'>
              {gatewayVivo
                ? reemplaza(t(esRouter ? 'anat_cerebro_router' : 'anat_cerebro_texto'), 'gateway', gateway)
                : t('anat_cerebro_ausente')}
            </Typography>
          </div>
        </Seccion>

        <Divider />

        {/* e. su peso en la orquesta */}
        <Seccion icono='ri-scales-3-line' titulo={t('anat_peso')} sub={reemplaza(t('anat_peso_sub'), 'pct', nf.format(frac * 100))}>
          <div className='flex flex-col gap-2'>
            <Typography variant='h6' className='font-mono'>
              <CountUp to={usado} format={fmtCorto} /> {t('flota_tokens')}
            </Typography>
            <BarraEntra
              value={Math.max(frac * 100, usado > 0 ? 2 : 0)}
              color={color}
              label={`${nombreVisible} — ${t('anat_peso')}: ${fmtCorto(usado)} ${t('flota_tokens')} (${nf.format(frac * 100)} %)`}
            />
            <Typography variant='body2' color='text.secondary'>{frasePeso}</Typography>

            {/* barras gemelas atenuadas: la escala de la orquesta entera */}
            <div className='flex flex-col gap-1 mbs-2'>
              <Typography variant='caption' color='text.secondary'>{t('anat_peso_escala')}</Typography>
              {flotaEscala.map(f => {
                const esSel = f.perfil === clon.perfil
                const fPct = total > 0 ? (f.tokens / total) * 100 : 0

                return (
                  <div key={f.perfil} className='flex items-center gap-2' style={{ opacity: esSel ? 1 : 0.4 }}>
                    <Typography
                      variant='caption'
                      className='capitalize'
                      color={esSel ? 'text.primary' : 'text.secondary'}
                      sx={{ minWidth: 76, fontWeight: esSel ? 600 : 400 }}
                    >
                      {f.perfil}
                    </Typography>
                    <div className='flex-auto'>
                      <BarraEntra
                        value={Math.max(fPct, f.tokens > 0 ? 1 : 0)}
                        color={COLORES_CLON[f.perfil] ?? 'primary'}
                        label={`${f.perfil}: ${nf.format(fPct)} %`}
                      />
                    </div>
                    <Typography variant='caption' color='text.secondary' className='font-mono' sx={{ minWidth: 48, textAlign: 'right' }}>
                      {nf.format(fPct)} %
                    </Typography>
                  </div>
                )
              })}
            </div>
          </div>
        </Seccion>

        <Divider />

        {/* frase de cierre de marca — el carácter del clon en una línea */}
        <Typography
          variant='body1'
          component='p'
          sx={{
            fontStyle: 'italic',
            fontWeight: 600,
            background: 'linear-gradient(90deg, #7A7FFF, #4E8FE8, #06C9A8)',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            color: 'transparent'
          }}
        >
          {t(CIERRE[clon.perfil] ?? 'anat_cierre_clon')}
        </Typography>

        {/* mini-mapa de la orquesta — solo al pie del modal del director:
            «el director coordina a los demás» se ve sin leer */}
        {esRouter && (
          <>
            <Divider />
            <Seccion icono='ri-organization-chart' titulo={t('anat_mapa_titulo')} sub={t('anat_mapa_sub')}>
              <Box
                component='svg'
                viewBox='0 0 360 170'
                role='img'
                aria-label={t('anat_mapa_aria')}
                sx={{ inlineSize: '100%', maxInlineSize: 420, display: 'block', mx: 'auto' }}
              >
                <defs>
                  <linearGradient id='anat-orbita' x1='0' y1='0' x2='1' y2='1'>
                    <stop offset='0%' stopColor='#7A7FFF' />
                    <stop offset='100%' stopColor='#06C9A8' />
                  </linearGradient>
                </defs>
                <style>{'@keyframes anat-nodo-pulso { 0% { opacity: .8; transform: scale(1); } 70% { opacity: 0; transform: scale(2.4); } 100% { opacity: 0; transform: scale(2.4); } }'}</style>
                {ORBITA.map(o => {
                  const rad = (o.ang * Math.PI) / 180
                  const x = MAPA_CX + MAPA_RX * Math.cos(rad)
                  const y = MAPA_CY - MAPA_RY * Math.sin(rad)

                  return <line key={`linea-${o.perfil}`} x1={MAPA_CX} y1={MAPA_CY} x2={x} y2={y} stroke='url(#anat-orbita)' strokeWidth={1.2} opacity={0.45} />
                })}
                {/* halo del director — quieto con prefers-reduced-motion */}
                <circle
                  cx={MAPA_CX}
                  cy={MAPA_CY}
                  r={10}
                  fill='none'
                  stroke={theme.palette.primary.main}
                  strokeWidth={1.5}
                  style={{
                    transformOrigin: `${MAPA_CX}px ${MAPA_CY}px`,
                    animation: reduced ? 'none' : 'anat-nodo-pulso 2.4s ease-out infinite'
                  }}
                />
                <circle cx={MAPA_CX} cy={MAPA_CY} r={10} fill={theme.palette.primary.main} />
                <text x={MAPA_CX} y={MAPA_CY + 26} textAnchor='middle' fontSize={10} fontWeight={600} fill={theme.palette.text.primary}>
                  Clon
                </text>
                {ORBITA.map(o => {
                  const rad = (o.ang * Math.PI) / 180
                  const x = MAPA_CX + MAPA_RX * Math.cos(rad)
                  const y = MAPA_CY - MAPA_RY * Math.sin(rad)

                  return (
                    <g key={`nodo-${o.perfil}`}>
                      <circle cx={x} cy={y} r={6} fill={theme.palette[COLORES_CLON[o.perfil] ?? 'primary'].main} opacity={0.85} />
                      <text
                        x={x}
                        y={o.ang === 90 ? y - 12 : y + 18}
                        textAnchor='middle'
                        fontSize={9}
                        fill={theme.palette.text.secondary}
                        style={{ textTransform: 'capitalize' }}
                      >
                        {o.perfil}
                      </text>
                    </g>
                  )
                })}
              </Box>
            </Seccion>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

export default AnatomiaClon
