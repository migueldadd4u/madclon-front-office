// Guardia de la guardia de iconos (22/11/2026): un icono que no está en el paquete
// de la plantilla pinta un hueco vacío sin dar error. Aquí se fija que el script lo
// caza, que dice dónde, y que sin paquete no regala un verde.
import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'

import { comprobarIconos, iconosDelPaquete } from './check-iconos.mjs'

const PAQUETE = 'src/assets/iconify-icons/generated-icons.css'

/** Monta un árbol mínimo (ruta → contenido) y lo pasa por la guardia. */
function comprobar(ficheros) {
  const base = mkdtempSync(join(tmpdir(), 'iconos-'))

  try {
    for (const [relativa, contenido] of Object.entries(ficheros)) {
      mkdirSync(dirname(join(base, 'web', relativa)), { recursive: true })
      writeFileSync(join(base, 'web', relativa), contenido)
    }

    return comprobarIconos(join(base, 'web'))
  } finally {
    rmSync(base, { recursive: true, force: true })
  }
}

const CSS = '.ri-mail-line::before{content:"a"}\n.ri-flag-line,.ri-flag-2-line{mask:none}\n'

test('un icono que está en el paquete no se canta', () => {
  const r = comprobar({ [PAQUETE]: CSS, 'src/app/pagina.tsx': "<i className='ri-mail-line' />\nconst icono = 'ri-flag-2-line'\n" })

  assert.equal(r.estado, 'ok')
  assert.equal(r.usados, 2)
  assert.deepEqual(r.faltan, [])
})

test('un icono que NO está en el paquete se canta con su fichero y su línea', () => {
  const r = comprobar({ [PAQUETE]: CSS, 'src/app/pagina.tsx': "const a = 1\n<StatCard icon='ri-vote-line' />\n" })

  assert.deepEqual(r.faltan, [{ icono: 'ri-vote-line', fichero: 'src/app/pagina.tsx', linea: 2 }])
})

test('un nombre que EMPIEZA igual que uno del paquete no cuela', () => {
  // `ri-flag-line` existe; `ri-flag-line-fill` no. Comparar por prefijo daría verde.
  const r = comprobar({ [PAQUETE]: CSS, 'src/components/Tarjeta.tsx': "<i className='ri-flag-line-fill' />\n" })

  assert.deepEqual(r.faltan.map(f => f.icono), ['ri-flag-line-fill'])
})

test('también mira el copy curado del exportador, que trae su campo icono', () => {
  const r = comprobar({ [PAQUETE]: CSS, '../exporter/casos.md': '### caso-uno\nicono: ri-government-line\n' })

  assert.deepEqual(r.faltan.map(f => f.icono), ['ri-government-line'])
})

test('lo que no es un icono no se confunde con uno', () => {
  const r = comprobar({ [PAQUETE]: CSS, 'src/lib/texto.ts': "const a = 'aria-hidden primary-main matri-z'\nconst prefijo = 'ri-'\n" })

  assert.equal(r.usados, 0)
  assert.deepEqual(r.faltan, [])
})

test('sin paquete generado no hay verde: lo dice', () => {
  const r = comprobar({ 'src/app/pagina.tsx': "<i className='ri-mail-line' />\n" })

  assert.deepEqual(r, { estado: 'sin-paquete' })
})

test('el árbol real no pide ningún icono que no exista', t => {
  if (!iconosDelPaquete()) return t.skip('paquete de iconos sin generar (yarn build:icons)')

  const r = comprobarIconos()

  assert.deepEqual(r.faltan, [], 'iconos pedidos que no están en el paquete de la plantilla')
  assert.ok(r.usados > 50, `se han mirado ${r.usados} iconos: si son pocos, la guardia no está mirando`)
})
