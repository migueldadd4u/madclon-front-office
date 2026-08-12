'use client'

// React Imports
import { useEffect, useState } from 'react'

// MUI Imports
import Button from '@mui/material/Button'

// Hook Imports
import { useLang } from '@/lib/i18n'

// Puente al panel privado — y la dirección del panel NO se publica aquí.
//
// El escaparate es público y su gate de contención prohíbe cualquier destino
// externo escrito en el código (scripts/public-safety.mjs, hallazgo
// RUNTIME_EXTERNAL_SUBRESOURCE_FORBIDDEN). Este componente no escribe ninguno:
// la dirección la trae MAD una vez por navegador y vive SOLO en ese navegador.
// Ni el repositorio público ni el HTML publicado la contienen, así que un
// visitante cualquiera no ve este botón — ni sabe que existe.
//
//   Guardarla:  …/madclon-front-office/?panel=macstudio-de-clon.<tailnet>.ts.net
//   Olvidarla:  …/madclon-front-office/?panel=off
//
// Solo se aceptan direcciones de la tailnet (*.ts.net) o del propio equipo
// (localhost / 127.0.0.1). Así un enlace ajeno («?panel=sitio-de-otro») no
// puede plantarle a nadie un destino cualquiera en el pie de la página.

const CLAVE = 'madclon-panel'

/** Normaliza lo que llega en ?panel= a un origen aceptable, o null si no lo es. */
export function origenPanel(valor: string | null | undefined): string | null {
  const bruto = (valor ?? '').trim()

  if (!bruto) return null

  let url: URL

  try {
    url = new URL(/^https?:\/\//i.test(bruto) ? bruto : `http://${bruto}`)
  } catch {
    return null
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') return null

  const host = url.hostname.toLowerCase()
  const deLaTailnet = host.endsWith('.ts.net')
  const deEsteEquipo = host === 'localhost' || host === '127.0.0.1'

  if (!deLaTailnet && !deEsteEquipo) return null

  return url.origin
}

const EnlacePanelPrivado = () => {
  const { t } = useLang()
  const [destino, setDestino] = useState<string | null>(null)

  // El export es estático: esto se resuelve en el cliente, nunca en el servidor,
  // y por eso el primer pintado no enseña nada (ni hay desajuste de hidratación).
  useEffect(() => {
    const leer = () => {
      try {
        return localStorage.getItem(CLAVE)
      } catch {
        return null
      }
    }

    let guardado = leer()
    const parametro = new URLSearchParams(window.location.search).get('panel')

    if (parametro !== null) {
      const olvidar = /^(off|no)$/i.test(parametro.trim())
      const nuevo = olvidar ? null : origenPanel(parametro)

      // Un parámetro que no vale se IGNORA, no borra lo que ya tenías: si alguien
      // te pasa un «?panel=sitio-de-otro», ni te planta su destino ni te deja sin
      // el tuyo. Solo un «?panel=off» explícito olvida la dirección.
      if (olvidar || nuevo) {
        try {
          if (nuevo) localStorage.setItem(CLAVE, nuevo)
          else localStorage.removeItem(CLAVE)
        } catch {
          // Navegador sin almacenamiento: vale para esta visita y ya.
        }

        guardado = nuevo
      }

      // La dirección no se queda en la barra: si copias el enlace de esta página
      // para enseñársela a alguien, no le llevas también la puerta de tu casa.
      const limpia = new URL(window.location.href)

      limpia.searchParams.delete('panel')
      window.history.replaceState(null, '', limpia.toString())
    }

    setDestino(origenPanel(guardado))
  }, [])

  if (!destino) return null

  return (
    <Button
      size='small'
      variant='text'
      color='primary'
      href={destino}
      rel='noreferrer'
      startIcon={<i className='ri-server-line' />}
      title={t('panel_privado_ayuda')}
      sx={{ minBlockSize: 44, color: 'primary.light' }}
    >
      {t('panel_privado')}
    </Button>
  )
}

export default EnlacePanelPrivado
