'use client'

// Hook Imports
import { useLang } from '@/lib/i18n'

// Util Imports
import { buildStamp, buildHuman } from '@/lib/build-stamp'

// El sello de versión ES la puerta al panel privado (MAD, 12/08/2026).
//
// Abajo del todo, discreto, y lleva a `/entrar` del panel — que es donde se pide
// identificación. Quien no esté en la tailnet de MAD no llega ni a ver esa
// pantalla: la dirección es del rango 100.x, que no se enruta desde internet.
// Publicarla revela que existe y cómo se llama; entrar sigue exigiendo correo y
// frase de paso.
//
// La dirección va ESCRITA en el href, no en una constante importada: así el
// gate de contención la ve y la contrasta contra su salida declarada
// (scripts/public-safety.mjs → SALIDA_NAVEGABLE_DECLARADA). Cualquier otra
// dirección externa, aquí o en cualquier otro fichero, sigue tumbando el build.
//
// El candado no es decoración: sin él nadie sabría que un número de versión se
// puede pulsar. El texto visible es el sello, así que el nombre accesible se da
// aparte — un lector de pantalla no debe leer «v2026081211161659» y callarse.

const SelloVersion = () => {
  const { t } = useLang()

  const version = t('footer_version').replace('{v}', buildStamp).replace('{fecha}', buildHuman)
  const puerta = t('sello_puerta')

  return (
    <a
      href='http://macstudio-de-clon.tail89283c.ts.net/entrar'
      rel='noreferrer'
      title={`${puerta} · ${version}`}
      aria-label={`${puerta} · ${version}`}
      className='inline-flex items-center gap-1 text-textSecondary text-sm font-mono no-underline hover:text-primary'
    >
      <i className='ri-lock-2-line text-base' aria-hidden />
      <span className='underline decoration-dotted underline-offset-4'>{buildStamp}</span>
    </a>
  )
}

export default SelloVersion
