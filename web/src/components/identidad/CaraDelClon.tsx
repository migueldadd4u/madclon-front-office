'use client'

// La cara del clon — una sola pieza para todo el escaparate.
//
// Quién es el clon (nombre, titular, foto, textos) NO se escribe aquí: viene de
// `@/lib/identidad-clon`, que genera el reparto desde la carpeta canónica del
// vault (`00_SISTEMA/identidad-visual-clon/`). Ponerle la cara a otro clon es
// cambiar allí la foto y el JSON y volver a repartir: ni esta pieza ni ninguna
// vista se tocan.
//
// Sin foto declarada (`avatar: null`) el círculo cae a las iniciales del clon.
// No hay hueco, no hay imagen rota, no hay 404.

// MUI Imports
import Avatar from '@mui/material/Avatar'
import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'
import Typography from '@mui/material/Typography'

// Hook Imports
import { useLang } from '@/lib/i18n'

// Data Imports
import { IDENTIDAD_CLON, textosIdentidad } from '@/lib/identidad-clon'

// El escaparate se publica bajo /madclon-front-office en GitHub Pages: sin este
// prefijo la foto sería un 404 en producción y se vería bien solo en local.
const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? ''

/** Ruta pública de una imagen de la identidad, o null si este clon no la tiene. */
const ruta = (relativa: string | null): string | null => (relativa ? `${BASE}/${relativa}` : null)

const AVATAR = ruta(IDENTIDAD_CLON.avatar)
const RETRATO = ruta(IDENTIDAD_CLON.retrato)

type PropsAvatar = {
  className?: string

  /** Lado del círculo en píxeles. */
  tamano?: number

  /**
   * Qué lee un lector de pantalla. Por defecto, nada: donde el avatar va pegado
   * al nombre escrito del clon, repetirlo es ruido. Se pasa texto solo cuando la
   * imagen es la ÚNICA que dice quién es.
   */
  alt?: string | null
}

/** El clon en redondo: cabecera del escaparate. */
export const AvatarClon = ({ tamano = 40, alt = null, className }: PropsAvatar) => (
  <Avatar
    src={AVATAR ?? undefined}
    alt={AVATAR && alt ? alt : undefined}
    aria-hidden={alt ? undefined : true}
    className={className}
    sx={{
      inlineSize: tamano,
      blockSize: tamano,
      flexShrink: 0,
      fontSize: Math.round(tamano * 0.38),
      fontWeight: 600,
      backgroundColor: 'primary.main',
      color: 'primary.contrastText'
    }}
  >
    {IDENTIDAD_CLON.iniciales}
  </Avatar>
)

/**
 * «Este es el clon» — la presentación de la portada pública.
 *
 * Es el trabajo que hace esta pieza: quien entra por primera vez tiene que saber
 * a quién está mirando SIN leer nada más. Retrato, nombre, de quién es y, si la
 * imagen la hizo una IA, dicho con todas las letras y a la vista — no en un
 * `title` que nadie abre.
 *
 * Sin retrato cae al avatar; sin ninguna foto, a las iniciales.
 */
export const TarjetaDelClon = () => {
  const { lang } = useLang()
  const textos = textosIdentidad(lang)

  return (
    <Box className='flex flex-wrap items-center gap-4'>
      {RETRATO ? (
        <Box
          component='img'
          src={RETRATO}
          alt={textos.retratoAlt}
          sx={{
            inlineSize: { xs: 96, sm: 124 },
            blockSize: 'auto',
            borderRadius: '16px',
            flexShrink: 0,
            border: '1px solid',
            borderColor: 'divider',
            boxShadow: 3
          }}
        />
      ) : (
        <AvatarClon tamano={96} alt={textos.avatarAlt} />
      )}
      <Box className='flex flex-col gap-1 min-is-0'>
        <Typography variant='overline' color='text.secondary' lineHeight={1.4}>
          {textos.esElClon}
        </Typography>
        <Typography variant='h5' component='p' className='font-semibold'>
          {IDENTIDAD_CLON.nombre}
        </Typography>
        <Typography variant='body2' color='text.secondary'>
          {textos.deQuien}
        </Typography>
        {RETRATO && (
          <Typography variant='body2' color='text.secondary'>
            {textos.quienEsQuien}
          </Typography>
        )}
        {IDENTIDAD_CLON.generadasPorIa && (
          <Chip
            size='small'
            variant='tonal'
            color='secondary'
            icon={<i className='ri-sparkling-2-line' />}
            label={textos.avisoIa}
            className='self-start mbs-1'
          />
        )}
      </Box>
    </Box>
  )
}
