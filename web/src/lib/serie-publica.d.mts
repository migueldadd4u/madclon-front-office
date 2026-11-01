type SerieLeida = { serie: { fecha: string; contexto?: Record<string, number> }[]; medias?: unknown }

export function mediaTokensSerie(serie: SerieLeida): number
export function mediaTokensPrevios(serie: SerieLeida): number | null
