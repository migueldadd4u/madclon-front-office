// Guardia de las esperas por estado: que drenar el ruido de carga NUNCA se
// convierta en «espero a que deje de moverse y digo que no se movía».
//
// POR QUÉ EXISTE. El check 13 del gate mide que bajo `prefers-reduced-motion` la
// página no se mueva. Medía tras un reloj fijo de 1.600 ms y bajo carga cazaba
// transiciones finitas de 300-400 ms que en máquina quieta ya habían terminado
// —FALLO espurio, 19/09/2026—. La cura es esperar al estado; el riesgo de la
// cura es que una espera lo bastante paciente acaba dando verde a CUALQUIER
// cosa. Estas pruebas fijan la frontera:
//
//   · lo transitorio se drena          → `quieto`
//   · lo perpetuo NO se espera         → `perpetuo`, y en la primera muestra
//   · lo que no termina en plazo       → `no-para`, nunca un verde
//
// Si alguien «simplifica» la espera borrando la distinción, salta aquí y no en
// producción.

import { test, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { join } from 'node:path'

import { esperarDomAsentado, esperarQuietudDeMovimiento } from './esperas.mjs'
import { resolverPlaywrightHome } from './playwright-home.mjs'

const { directorio } = resolverPlaywrightHome()
const { chromium } = createRequire(join(directorio, 'noop.js'))('playwright')

let navegador
let ctx

before(async () => {
  navegador = await chromium.launch()
  ctx = await navegador.newContext({ viewport: { width: 375, height: 900 }, reducedMotion: 'reduce' })
})

after(async () => {
  await ctx?.close()
  await navegador?.close()
})

const pagina = async html => {
  const pg = await ctx.newPage()

  await pg.setContent(`<!doctype html><meta charset="utf-8">${html}`)

  return pg
}

test('una transición finita en vuelo se drena: es el ruido de carga, no movimiento', async () => {
  // Exactamente la forma de los tres culpables reales del flake: CSSTransition,
  // iterations 1, 300-400 ms.
  const pg = await pagina(`
    <style>#caja { width: 10px; height: 10px; background: #333; transition: width 350ms linear }</style>
    <div id="caja"></div>
    <script>requestAnimationFrame(() => { document.getElementById('caja').style.width = '300px' })</script>
  `)

  const r = await esperarQuietudDeMovimiento(pg, { timeout: 5000 })

  assert.equal(r.estado, 'quieto', `una transición de 350 ms debe drenar; devolvió ${r.estado} (${r.movimiento.join(', ')})`)
  await pg.close()
})

test('una animación INFINITA tumba la espera: no se drena nunca', async () => {
  const pg = await pagina(`
    <style>
      @keyframes giro { to { transform: rotate(360deg) } }
      #noria { width: 40px; height: 40px; background: #333; animation: giro 1s linear infinite }
    </style>
    <div id="noria" class="perpetua"></div>
  `)

  const r = await esperarQuietudDeMovimiento(pg, { timeout: 5000 })

  assert.equal(r.estado, 'perpetuo', 'una animación con iterations: Infinity NO puede dar quieto')
  assert.match(r.movimiento.join(' '), /div\.perpetua/, `debe nombrar el elemento que se mueve; dijo: ${r.movimiento.join(', ')}`)
  await pg.close()
})

test('lo perpetuo se canta YA, no al agotar el plazo (o la espera estaría tapando)', async () => {
  const pg = await pagina(`
    <style>
      @keyframes latido { 50% { opacity: .2 } }
      #luz { width: 20px; height: 20px; background: #333; animation: latido 900ms ease-in-out infinite }
    </style>
    <div id="luz"></div>
  `)

  const t0 = Date.now()
  const r = await esperarQuietudDeMovimiento(pg, { timeout: 10000 })
  const tardo = Date.now() - t0

  assert.equal(r.estado, 'perpetuo')
  assert.ok(tardo < 3000, `debe cantarlo en la primera muestra, no agotando el plazo; tardó ${tardo} ms`)
  await pg.close()
})

test('movimiento que no termina en plazo es no-para, nunca un verde', async () => {
  // Finita sobre el papel (iterations 1) pero eterna en la práctica: la espera
  // no la clasifica como perpetua, así que el único desenlace honesto es agotar
  // el plazo y CONFESARLO con lo que seguía moviéndose.
  const pg = await pagina(`
    <div id="lento" class="eterna" style="width:10px;height:10px;background:#333"></div>
    <script>
      document.getElementById('lento').animate(
        [{ transform: 'translateX(0)' }, { transform: 'translateX(300px)' }],
        { duration: 600000, iterations: 1 }
      )
    </script>
  `)

  const r = await esperarQuietudDeMovimiento(pg, { timeout: 1500 })

  assert.equal(r.estado, 'no-para', 'una animación que no acaba en plazo no puede salir como quieta')
  assert.ok(r.movimiento.length > 0, 'un no-para sin detalle es un rojo mudo: hay que decir qué se movía')
  assert.match(r.movimiento.join(' '), /div\.eterna/, `debe nombrar lo que seguía moviéndose; dijo: ${r.movimiento.join(', ')}`)
  await pg.close()
})

test('una página quieta sale quieta, y sin arrastrar el estado de la anterior', async () => {
  const pg = await pagina('<p>sin movimiento</p>')

  assert.equal((await esperarQuietudDeMovimiento(pg, { timeout: 5000 })).estado, 'quieto')

  // Segunda llamada sobre el MISMO documento: los testigos internos se reinician,
  // así que una animación que arranque ahora se ve igual que la primera vez.
  await pg.evaluate(() => {
    const d = document.createElement('div')

    d.className = 'tardia'
    d.style.cssText = 'width:20px;height:20px;background:#333'
    document.body.append(d)
    d.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 800, iterations: Infinity })
  })

  const r = await esperarQuietudDeMovimiento(pg, { timeout: 5000 })

  assert.equal(r.estado, 'perpetuo', 'el testigo de quietud de la llamada anterior no puede dar por buena la siguiente')
  await pg.close()
})

test('esperarDomAsentado espera a que el DOM deje de crecer, no a un reloj', async () => {
  const pg = await pagina(`
    <div id="lista"></div>
    <script>
      let i = 0
      const t = setInterval(() => {
        document.getElementById('lista').append(document.createElement('span'))
        if (++i === 12) clearInterval(t)
      }, 60)
    </script>
  `)

  assert.equal(await esperarDomAsentado(pg, { ventana: 300, timeout: 10000 }), true)
  assert.equal(await pg.evaluate(() => document.querySelectorAll('#lista span').length), 12, 'volvió antes de que el DOM terminara de crecer')
  await pg.close()
})

test('un DOM que nunca para devuelve false, no una promesa colgada', async () => {
  const pg = await pagina(`
    <div id="lista"></div>
    <script>setInterval(() => document.getElementById('lista').append(document.createElement('span')), 40)</script>
  `)

  assert.equal(await esperarDomAsentado(pg, { ventana: 300, timeout: 1500 }), false)
  await pg.close()
})
