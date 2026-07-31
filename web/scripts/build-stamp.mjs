// Sella cada build con el instante en que se generó: es la «versión» que se ve en el footer.
// Mismo esquema que add4u-web: vAñoMesDiaHoraMinutoSegundo + centésimas, hora de Madrid.
// Se ejecuta solo (prebuild/predev), así que el sello del sitio desplegado siempre corresponde
// al build que se subió, sin depender de que nadie se acuerde de tocar un número a mano.
import { writeFileSync } from 'node:fs'

const now = new Date()

// Hora de Madrid: la versión la lee Miguel contra su propio reloj, no contra UTC.
const parts = new Intl.DateTimeFormat('es-ES', {
  timeZone: 'Europe/Madrid',
  hour12: false,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit'
}).formatToParts(now).reduce((acc, part) => ({ ...acc, [part.type]: part.value }), {})

const hour = parts.hour === '24' ? '00' : parts.hour
const hundredths = String(Math.floor(now.getMilliseconds() / 10)).padStart(2, '0')
const stamp = `${parts.year}${parts.month}${parts.day}${hour}${parts.minute}${parts.second}${hundredths}`
const human = `${parts.day}/${parts.month}/${parts.year} ${hour}:${parts.minute}`

writeFileSync(new URL('../src/lib/build-stamp.ts', import.meta.url),
  '// Generado por scripts/build-stamp.mjs en cada build. No editar a mano.\n' +
  `export const buildStamp = 'v${stamp}'\n` +
  `export const buildHuman = '${human}'\n`)

console.log(`build-stamp v${stamp} (${human})`)
