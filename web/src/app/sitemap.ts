import type { MetadataRoute } from 'next'

import { buildStamp } from '@/lib/build-stamp'

// Export estático (GitHub Pages): el sitemap se prerenderiza en el build.
export const dynamic = 'force-static'

// La fecha sale del sello del build (vYYYYMMDDHHMMSS…), así que se actualiza sola en cada
// despliegue: una fecha escrita a mano se queda vieja al primer cambio de contenido.
// Mismo patrón que add4u-web.
function lastModifiedFromBuild(): Date {
  const m = /^v(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/.exec(buildStamp)

  if (!m) return new Date()
  const [, y, mo, d, h, mi, s] = m

  return new Date(`${y}-${mo}-${d}T${h}:${mi}:${s}Z`)
}

export default function sitemap(): MetadataRoute.Sitemap {
  const base = 'https://migueldadd4u.github.io/madclon-front-office'
  const lastModified = lastModifiedFromBuild()

  // Las 8 páginas publicadas; todas muestran datos que se regeneran cada noche.
  const paths = ['', '/flota', '/salud', '/tokens', '/eficiencia', '/actividad', '/historia', '/preguntas']

  return paths.map(path => ({
    url: `${base}${path}`,
    lastModified,
    changeFrequency: 'daily',
    priority: path === '' ? 1 : 0.7
  }))
}
