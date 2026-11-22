// Acceso tipado al copy «para quien decide» (exporter/casos.md → copia-casos.ts).
//
// Aquí no hay ni una palabra para humanos: solo la forma. Las listas numeradas de
// la fuente (`es_llega_1` … `es_llega_6`) salen como arrays, y los canales traen su
// icono de la plantilla. Si la fuente pierde un bloque, el generador ya puso rojo
// el gate antes de llegar aquí; aun así ningún acceso revienta: devuelve vacío.

import type { Lang } from './i18n'
import { CASOS_FICHAS, CASOS_ORDEN, CASOS_TEXTOS } from './copia-casos'

export type Canal = 'correo' | 'mensajeria' | 'llamada' | 'agenda' | 'reunion' | 'documento' | 'voz'
export type Altura = 'horizonte' | 'frente' | 'reto' | 'empujon'

/** Los siete canales, en el orden en que se enseñan. El icono es de la plantilla (`ri-*`). */
export const CANALES: { clave: Canal; icono: string }[] = [
  { clave: 'correo', icono: 'ri-mail-line' },
  { clave: 'mensajeria', icono: 'ri-chat-3-line' },
  { clave: 'llamada', icono: 'ri-phone-line' },
  { clave: 'agenda', icono: 'ri-calendar-event-line' },
  { clave: 'reunion', icono: 'ri-record-circle-line' },
  { clave: 'documento', icono: 'ri-file-text-line' },
  { clave: 'voz', icono: 'ri-mic-line' }
]

const ICONO_CANAL = Object.fromEntries(CANALES.map(c => [c.clave, c.icono])) as Record<Canal, string>

export type TextoCurado = { titulo: string; texto: string; enlace: string }

/** Un bloque de texto de la fuente, en el idioma pedido. */
export const textoCurado = (clave: string, lang: Lang): TextoCurado => {
  const bloque = CASOS_TEXTOS[clave] ?? {}

  return {
    titulo: bloque[`${lang}_titulo`] ?? '',
    texto: bloque[`${lang}_texto`] ?? '',
    enlace: bloque[`${lang}_enlace`] ?? ''
  }
}

export type CasoCargo = {
  clave: string
  icono: string
  cargo: string
  quien: string
  dia: string
  llega: { canal: Canal; icono: string; nombreCanal: string; texto: string }[]
  cruces: { titulo: string; texto: string }[]
  decisiones: string[]
  compromisos: string[]
  avisos: string[]
  decides: string
  gana: string
  reto: { altura: Altura; titulo: string; paso: string; fin: string }
  equipo: { titulo: string; texto: string }[]
}

/** Las claves de los cargos, en el orden que fija la fuente (`cargos.orden`). */
export const CARGOS: string[] = CASOS_ORDEN

/** El ancla pública de un caso: `#caso-alcaldia`. Es la dirección que se comparte. */
export const anclaDeCaso = (clave: string) => `caso-${clave}`

/** La clave del cargo que nombra un hash, o null si el hash no es de un caso conocido. */
export const cargoDeHash = (hash: string): string | null => {
  const m = /^#caso-([a-z]+)$/.exec(hash)

  return m && CARGOS.includes(m[1]) ? m[1] : null
}

/** Recoge `prefijo_1`, `prefijo_2`… mientras existan. */
const serie = (ficha: Record<string, string>, prefijo: string): string[] => {
  const salida: string[] = []

  for (let i = 1; ficha[`${prefijo}_${i}`] !== undefined; i++) salida.push(ficha[`${prefijo}_${i}`])

  return salida
}

const pares = (ficha: Record<string, string>, prefijo: string) => {
  const salida: { titulo: string; texto: string }[] = []

  for (let i = 1; ficha[`${prefijo}_${i}_titulo`] !== undefined; i++) {
    salida.push({ titulo: ficha[`${prefijo}_${i}_titulo`], texto: ficha[`${prefijo}_${i}_texto`] ?? '' })
  }

  return salida
}

/** La ficha entera de un cargo, en el idioma pedido. */
export const casoDeCargo = (clave: string, lang: Lang): CasoCargo | null => {
  const ficha = CASOS_FICHAS[clave]

  if (!ficha) return null

  return {
    clave,
    icono: ficha.icono ?? 'ri-briefcase-4-line',
    cargo: ficha[`${lang}_cargo`] ?? '',
    quien: ficha[`${lang}_quien`] ?? '',
    dia: ficha[`${lang}_dia`] ?? '',
    llega: serie(ficha, `${lang}_llega`).map((texto, i) => {
      const canal = ficha[`canal_${i + 1}`] as Canal

      return { canal, icono: ICONO_CANAL[canal] ?? 'ri-inbox-line', nombreCanal: textoCurado(`canal-${canal}`, lang).titulo, texto }
    }),
    cruces: pares(ficha, `${lang}_cruce`),
    decisiones: serie(ficha, `${lang}_decision`),
    compromisos: serie(ficha, `${lang}_compromiso`),
    avisos: serie(ficha, `${lang}_aviso`),
    decides: ficha[`${lang}_decides`] ?? '',
    gana: ficha[`${lang}_gana`] ?? '',
    reto: {
      altura: ficha.reto_altura as Altura,
      titulo: ficha[`${lang}_reto_titulo`] ?? '',
      paso: ficha[`${lang}_reto_paso`] ?? '',
      fin: ficha[`${lang}_reto_fin`] ?? ''
    },
    equipo: pares(ficha, `${lang}_equipo`)
  }
}

/** Todos los casos, en orden. */
export const casosPorCargo = (lang: Lang): CasoCargo[] =>
  CARGOS.map(clave => casoDeCargo(clave, lang)).filter((c): c is CasoCargo => c !== null)

/** Rellena los huecos `{n}`, `{dias}`, `{fecha}` de un texto curado con el dato del día. */
export const conDato = (plantilla: string, valores: Record<string, string>) =>
  Object.entries(valores).reduce((acc, [k, v]) => acc.replaceAll(`{${k}}`, v), plantilla)
