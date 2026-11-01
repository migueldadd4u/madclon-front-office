// serie.json con ventana (01/11/2026): la web enseña las mismas medias y récords con
// los últimos días más `medias` y `records` que con la serie entera.
//
// El cruce va de punta a punta: una historia más larga que la ventana pasa por el
// exportador de verdad (ventana_serie en exporter/lo_reciente.py) y lo que sale se
// lee como la lee la web: las medias con lib/serie-publica.mjs y los récords como
// recordDe en /historia. Cada cifra tiene que coincidir, bit a bit, con la cuenta
// que hacían los componentes recorriendo la serie entera (copiada abajo tal cual
// estaba en ProgresoDia, la portada y /historia).

import test from 'node:test'
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

import { mediaTokensPrevios, mediaTokensSerie } from '../src/lib/serie-publica.mjs'

const RAIZ = fileURLToPath(new URL('../../', import.meta.url))

// --- la cuenta de antes, sobre la historia entera -------------------------------
const antes = {
  media: s => {
    const tokens = s.serie.map(p => p.contexto?.tokens ?? 0)

    return tokens.length > 0 ? tokens.reduce((a, b) => a + b, 0) / tokens.length : 0
  },
  previos: s => {
    const puntos = s.serie.filter(p => p.contexto?.tokens != null)

    if (puntos.length < 2) return null
    const anteriores = puntos.slice(0, -1).map(p => p.contexto.tokens)

    return anteriores.reduce((a, b) => a + b, 0) / anteriores.length
  },
  maximo: (s, clave) =>
    s.serie.reduce((acc, p) => {
      const v = p.contexto?.[clave]

      return v != null && v > 0 && (!acc || v > acc.v) ? { v, f: p.fecha } : acc
    }, null)
}

const fecha = i => new Date(Date.UTC(2026, 6, 26 + i)).toISOString().slice(0, 10)

/** Historia inventada: récords al principio (fuera de la ventana), empates, días sin tokens y decimales. */
function historia(dias) {
  const serie = Array.from({ length: dias }, (_, i) => ({
    fecha: fecha(i),
    contexto: {
      llamadas: 1000 + ((i * 37) % 900),
      tokens: 20_000_000 + ((i * 7_919_993) % 45_000_000) + (i % 3) / 7,
      tareas_hechas: (i * 13) % 40,
      llamadas_router: 400 + ((i * 11) % 300)
    },
    kpis: { tokens_motor_por_tarea: 100_000 + i * 1.5 }
  }))

  const dia = (i, cambio) => serie[i] && cambio(serie[i])

  dia(2, p => (p.contexto.tokens = 90_000_000)) // récord de tokens fuera de la ventana
  dia(5, p => (p.contexto.tareas_hechas = 77))
  dia(150, p => (p.contexto.tareas_hechas = 77)) // empate: gana la primera fecha
  dia(20, p => delete p.contexto.tokens) // día sin dato: cuenta 0 en la media del pulso
  dia(21, p => delete p.contexto)
  serie.at(-1).contexto.llamadas = 5000 // récord en el último día

  return { serie, linea_base: { congelada: fecha(0), kpis: {} }, intervenciones_raw: [] }
}

/** Lo que publica el exportador para esa historia. */
function exportar(h) {
  const py = 'import sys, json; sys.path.insert(0, "exporter"); import export_panel as ep; ' +
    'print(ep.serializa_publico(ep.ventana_serie(json.load(sys.stdin))))'

  const r = spawnSync('python3', ['-c', py], { cwd: RAIZ, input: JSON.stringify(h), encoding: 'utf8' })

  assert.equal(r.status, 0, r.stderr)

  return JSON.parse(r.stdout)
}

/** El récord tal como lo enseña /historia cuando el lote trae `records`. */
const recordPublicado = (publica, clave) => {
  const r = publica.records?.[clave]

  return r ? { v: r.valor, f: r.fecha } : null
}

const RECORDS = ['tokens', 'tareas_hechas', 'llamadas']

test('con una historia más larga que la ventana, las cifras salen iguales que recorriéndola entera', () => {
  const h = historia(160)
  const publica = exportar(h)

  assert.equal(publica.serie.length, 60, 'la ventana deja los últimos 60 días')
  assert.deepEqual(publica.serie, h.serie.slice(-60).map(p => JSON.parse(JSON.stringify(p))))
  assert.equal(mediaTokensSerie(publica), antes.media(h))
  assert.equal(mediaTokensPrevios(publica), antes.previos(h))

  for (const clave of RECORDS) assert.deepEqual(recordPublicado(publica, clave), antes.maximo(h, clave), clave)

  // Y sin medias ni récords, la ventana sola no habría dado lo mismo: la prueba no es vacía.
  const { medias, records, ...sinTotales } = publica

  assert.ok(medias && records)
  assert.notDeepEqual(antes.maximo(sinTotales, 'tokens'), antes.maximo(h, 'tokens'))
  assert.notEqual(mediaTokensSerie(sinTotales), antes.media(h))
  assert.notEqual(mediaTokensPrevios(sinTotales), antes.previos(h))
})

test('con una historia más corta que la ventana sale entera y las cifras no cambian', () => {
  const h = historia(50)
  const publica = exportar(h)

  assert.equal(publica.serie.length, 50)
  assert.equal(mediaTokensSerie(publica), antes.media(h))
  assert.equal(mediaTokensPrevios(publica), antes.previos(h))
  assert.deepEqual(recordPublicado(publica, 'llamadas'), antes.maximo(h, 'llamadas'))
})

test('un lote sin medias (el que guarda el service worker) se cuenta como antes', () => {
  const h = historia(30)

  assert.equal(mediaTokensSerie(h), antes.media(h))
  assert.equal(mediaTokensPrevios(h), antes.previos(h))
  assert.equal(mediaTokensPrevios({ serie: h.serie.slice(0, 1) }), null)
})

test('un campo de medias torcido no rompe nada: esa cifra vuelve a contarse sobre los puntos', () => {
  const h = historia(30)
  const torcidas = ['no es un objeto', { tokens: '12', tokens_previos: Number.NaN }, { tokens: null }, []]

  for (const medias of torcidas) {
    const s = { ...h, medias }

    assert.equal(mediaTokensSerie(s), antes.media(h))
    assert.equal(mediaTokensPrevios(s), antes.previos(h))
  }
})

test('las medias bien formadas mandan, también cuando dicen «no hay días anteriores»', () => {
  const s = { serie: historia(5).serie, medias: { tokens: 7, tokens_previos: null } }

  assert.equal(mediaTokensSerie(s), 7)
  assert.equal(mediaTokensPrevios(s), null)
})
