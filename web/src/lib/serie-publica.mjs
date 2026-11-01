// Las medias de serie.json que no caben en su ventana (01/11/2026).
//
// serie.json ya no trae la historia entera: trae los últimos días, que son los
// que pintan los gráficos, y en `medias` lo que antes salía de recorrerla toda
// (el «día normal» de la portada y el de ProgresoDia). Lo calcula el exportador
// sobre la serie completa del vault (medias_serie en exporter/lo_reciente.py),
// con la misma cuenta que hacían aquí los componentes. Los récords de /historia
// viajan aparte, en `records`.
//
// Si `medias` no llega o un campo no tiene la forma esperada —un lote anterior
// que el service worker guarda hasta 24 h—, se calcula como antes sobre los puntos
// que haya: mejor la cifra de la ventana que ninguna.

const esNumero = v => typeof v === 'number' && Number.isFinite(v)
const esObjeto = v => v !== null && typeof v === 'object' && !Array.isArray(v)
const mediasDe = serie => (esObjeto(serie?.medias) ? serie.medias : {})

/** «Día normal» del pulso de la portada: media de tokens de todos los días medidos (sin dato = 0). */
export function mediaTokensSerie(serie) {
  const { tokens: media } = mediasDe(serie)

  if (esNumero(media)) return media
  const tokens = serie.serie.map(p => p.contexto?.tokens ?? 0)

  return tokens.length > 0 ? tokens.reduce((a, b) => a + b, 0) / tokens.length : 0
}

/** ProgresoDia: media de los días con tokens anteriores al último que los tiene; null si no hay dos. */
export function mediaTokensPrevios(serie) {
  const { tokens_previos: media } = mediasDe(serie)

  if (esNumero(media) || media === null) return media
  const tokens = serie.serie.filter(p => p.contexto?.tokens != null).map(p => p.contexto.tokens)

  if (tokens.length < 2) return null
  const anteriores = tokens.slice(0, -1)

  return anteriores.reduce((a, b) => a + b, 0) / anteriores.length
}
