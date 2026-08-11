'use client'

// React Imports
import { useEffect, useState } from 'react'

// Next Imports
import Link from 'next/link'

// MUI Imports
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'

// Third-party Imports
import classnames from 'classnames'

// Type Imports
import type { Mode } from '@core/types'

// Component Imports
import MadClonLogoAnimado from '@/components/dashboard/MadClonLogoAnimado'

// Hook Imports
import { useLang } from '@/lib/i18n'
import type { StrKey } from '@/lib/i18n'

// Página 404 emitida como un informativo: el error no se disculpa, se da en
// portada. Rótulo de última hora con el titular, entradilla de presentador y
// cinta de titulares rodando abajo — la parte canalla del telediario.
// Accesible: la cinta se puede parar, se para sola con prefers-reduced-motion y
// los titulares se leen también en una lista para lectores de pantalla (la cinta
// visible es decorativa, aria-hidden, y el botón de parar vive fuera de ella).
// El modo (claro/oscuro) lo da el tema; `mode` se conserva en la firma por
// compatibilidad con not-found.tsx. El plató es oscuro en los dos modos: sus
// colores son fijos, así el contraste no depende del tema.

const TITULARES: StrKey[] = ['nf_cinta_1', 'nf_cinta_2', 'nf_cinta_3', 'nf_cinta_4', 'nf_cinta_5', 'nf_cinta_6']

const NotFound = ({ mode }: { mode: Mode }) => {
  void mode
  const { t, lang } = useLang()
  const [hora, setHora] = useState('')
  const [parada, setParada] = useState(false)
  const [conMovimiento, setConMovimiento] = useState(true)

  // El reloj del informativo: solo tras montar, para no discutir con el HTML del
  // servidor (que se genera al construir la web y llevaría la hora equivocada).
  useEffect(() => {
    const marcar = () =>
      setHora(new Date().toLocaleTimeString(lang === 'es' ? 'es-ES' : 'en-GB', { hour: '2-digit', minute: '2-digit' }))

    marcar()

    const id = window.setInterval(marcar, 20000)

    setConMovimiento(!window.matchMedia('(prefers-reduced-motion: reduce)').matches)

    return () => window.clearInterval(id)
  }, [lang])

  const titulares = TITULARES.map(k => t(k))

  return (
    <div className='fo-nf'>
      <style>{`
        .fo-nf { min-block-size: 100dvh; display: flex; align-items: center; justify-content: center; padding: 24px 16px; }
        .fo-nf-col { inline-size: 100%; max-inline-size: 780px; display: flex; flex-direction: column; align-items: center; gap: 14px; }
        .fo-nf-tv { inline-size: 100%; position: relative; overflow: hidden; border-radius: 16px; color: #F2F5FA;
          background: radial-gradient(120% 140% at 88% -20%, #1E2534 0%, #0B0E15 62%);
          border: 1px solid rgba(255,255,255,.12); box-shadow: 0 24px 60px rgba(0,0,0,.45); }
        .fo-nf-mosca { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; padding: 12px 16px;
          border-block-end: 1px solid rgba(255,255,255,.12); font-size: .72rem; letter-spacing: .14em;
          text-transform: uppercase; color: #B7C0D0; }
        .fo-nf-canal { color: #FFFFFF; font-weight: 800; }
        .fo-nf-directo { display: inline-flex; align-items: center; gap: 7px; color: #FF9B9B; font-weight: 700; }
        .fo-nf-punto { inline-size: 8px; block-size: 8px; border-radius: 50%; background: #FF4D4D;
          animation: fo-nf-late 1.7s ease-in-out infinite; }
        .fo-nf-hora { margin-inline-start: auto; font-variant-numeric: tabular-nums; }
        .fo-nf-cuerpo { position: relative; padding: 30px 20px 26px; display: flex; flex-direction: column;
          align-items: flex-start; gap: 16px; }
        .fo-nf-agua { position: absolute; inset-block-start: -.18em; inset-inline-end: 12px; margin: 0;
          font-size: clamp(7rem, 26vw, 14rem); font-weight: 900; line-height: .82; letter-spacing: -.05em;
          color: #FFFFFF; opacity: .055; pointer-events: none; }
        .fo-nf-rotulo { position: relative; background: #C8102E; color: #FFFFFF; font-weight: 800;
          letter-spacing: .12em; text-transform: uppercase; font-size: .72rem; padding: 7px 12px; border-radius: 4px; }
        .fo-nf-titular { position: relative; margin: 0; color: #FFFFFF; font-weight: 800; line-height: 1.14;
          font-size: clamp(1.55rem, 5.2vw, 2.5rem); text-wrap: balance; }
        .fo-nf-entradilla { position: relative; margin: 0; color: #C6CEDC; max-inline-size: 62ch; }
        .fo-nf-cinta { display: flex; align-items: stretch; background: #C8102E; }
        .fo-nf-vista { flex: 1 1 auto; min-inline-size: 0; overflow: hidden; display: flex; align-items: center; }
        .fo-nf-tira { display: inline-flex; white-space: nowrap; animation: fo-nf-rueda 46s linear infinite; }
        .fo-nf-parada { animation-play-state: paused; }
        .fo-nf-grupo { display: inline-flex; }
        .fo-nf-titularillo { color: #FFFFFF; font-weight: 600; font-size: .88rem; padding-block: 13px; padding-inline: 16px; }
        .fo-nf-titularillo::after { content: '•'; padding-inline-start: 16px; opacity: .65; }
        .fo-nf-parar { flex: 0 0 auto; min-inline-size: 44px; min-block-size: 44px; display: grid; place-items: center;
          background: rgba(0,0,0,.28); color: #FFFFFF; border: 0; cursor: pointer; font-size: 1.1rem; }
        .fo-nf-parar:hover { background: rgba(0,0,0,.42); }
        .fo-nf-parar:focus-visible { outline: 2px solid #FFFFFF; outline-offset: -4px; }
        .fo-nf-lectores { position: absolute; inline-size: 1px; block-size: 1px; margin: -1px; padding: 0;
          overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
        @keyframes fo-nf-rueda { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        @keyframes fo-nf-late { 0%, 100% { opacity: 1; } 50% { opacity: .2; } }
        @media (prefers-reduced-motion: reduce) {
          .fo-nf-tira, .fo-nf-punto { animation: none; }
        }
      `}</style>

      <div className='fo-nf-col'>
        <div className='fo-nf-tv'>
          <div className='fo-nf-mosca'>
            <MadClonLogoAnimado size={22} />
            <span className='fo-nf-canal'>{t('nf_canal')}</span>
            <span className='fo-nf-directo'>
              <span className='fo-nf-punto' aria-hidden='true' />
              {t('nf_directo')}
            </span>
            {hora && <span className='fo-nf-hora'>{hora}</span>}
          </div>

          <div className='fo-nf-cuerpo'>
            <p className='fo-nf-agua' aria-hidden='true'>
              404
            </p>
            <span className='fo-nf-rotulo'>{t('nf_marca')}</span>
            <h1 className='fo-nf-titular'>{t('nf_titulo')}</h1>
            <p className='fo-nf-entradilla'>{t('nf_sub')}</p>
            {/* primary.dark, no primary.main: con blanco encima el main se queda en 4,07:1 y el gate (5) lo tumba */}
            <Button href='/' component={Link} variant='contained' size='large' sx={{ bgcolor: 'primary.dark' }}>
              {t('nf_boton')}
            </Button>
          </div>

          <div className='fo-nf-cinta' role='group' aria-label={t('nf_cinta_aria')}>
            <div className='fo-nf-vista' aria-hidden='true'>
              <div className={classnames('fo-nf-tira', { 'fo-nf-parada': parada })}>
                {[0, 1].map(copia => (
                  <span className='fo-nf-grupo' key={copia}>
                    {titulares.map(titular => (
                      <span className='fo-nf-titularillo' key={titular}>
                        {titular}
                      </span>
                    ))}
                  </span>
                ))}
              </div>
            </div>
            <ul className='fo-nf-lectores'>
              {titulares.map(titular => (
                <li key={titular}>{titular}</li>
              ))}
            </ul>
            {conMovimiento && (
              <button
                type='button'
                className='fo-nf-parar'
                onClick={() => setParada(p => !p)}
                aria-pressed={parada}
                aria-label={parada ? t('nf_cinta_sigue') : t('nf_cinta_pausa')}
                title={parada ? t('nf_cinta_sigue') : t('nf_cinta_pausa')}
              >
                <i className={parada ? 'ri-play-fill' : 'ri-pause-fill'} aria-hidden='true' />
              </button>
            )}
          </div>
        </div>

        <Typography variant='caption' color='text.secondary' className='text-center'>
          {t('nf_pie')}
        </Typography>
      </div>
    </div>
  )
}

export default NotFound
