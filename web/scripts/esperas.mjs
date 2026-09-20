// esperas.mjs — esperar a un ESTADO, no a un reloj.
//
// POR QUÉ EXISTE. El gate del escaparate se corre a mano y casi nunca en una
// máquina quieta: en este Mac conviven varios agentes y es normal que dos gates
// se solapen. Los puntos que medían tras un `waitForTimeout` fijo daban FALLO
// espurio bajo carga. El 19/09/2026 se cazó así:
//
//   · check 13 (prefers-reduced-motion) → `FALLO 13 · actividad: div`. Repetido
//     el gate entero con la máquina libre: 21 OK · 0 DEUDA · 0 FALLO en 6 min
//     12 s. No había nada roto en la web.
//   · el clic de la capa 2 de /flota tumbaba el gate entero con
//     «Timeout 30000ms exceeded … waiting for element to be visible, enabled and
//     stable»: Playwright exige que el elemento esté QUIETO antes de pulsarlo, y
//     con una transición de ancho en curso el contenido se recoloca debajo.
//
// QUÉ SE MIDIÓ. «Máquina cargada» no es reproducible, así que el flake se
// reprodujo a voluntad frenando la CPU por CDP (`Emulation.setCPUThrottlingRate`)
// y repitiendo la secuencia exacta del check 13 —goto + 1.600 ms + getAnimations—
// sobre el mismo `web/out`, 375×900, `reducedMotion: 'reduce'`, lang ES:
//
//     CPU ÷1  → 0 de 10 páginas con movimiento a los 1.600 ms  ← por eso sale verde en quieto
//     CPU ÷6  → 1 de 10
//     CPU ÷20 → 1-2 de 10  (la página concreta baila: es una carrera)
//
//   Los culpables son TRES familias, y las tres son transiciones FINITAS:
//     · CSSTransition width     div.ts-vertical-nav-container  dur=300  iter=1
//     · CSSTransition opacity   div.MuiBox-root                dur=350  iter=1
//     · CSSTransition transform span.MuiLinearProgress-bar     dur=400  iter=1  (×7 en /flota)
//
//   Ni una sola animación perpetua implicada. `document.getAnimations()` incluye
//   las transiciones en curso, y ahí estaba el ruido: el reloj de 1.600 ms no
//   sigue al punto en que la página se asienta, solo al de un Mac vacío.
//
// LA DECISIÓN, Y POR QUÉ ESTA Y NO LA OTRA. Había dos salidas legítimas:
//
//   (a) taparlo en la CSS. `src/app/globals.css` trata `prefers-reduced-motion`
//       como OPT-IN por clase —`.fo-page-in` (~235), `.fo-desliza` (~262),
//       `.fo-shimmer::after` (~292), y `.fo-card-hover` detrás de
//       `no-preference` (~211)— y NO hay ninguna regla que apague transiciones
//       en general: las tres familias de arriba corren bajo `reduce` por
//       omisión, no por diseño. Descartada como arreglo de esto por dos razones:
//       una transición de opacidad es justo lo que la guía de accesibilidad
//       RECOMIENDA como sustituto del movimiento bajo `reduce`, así que una
//       regla manta castigaría lo correcto junto con lo dudoso; y sobre todo,
//       una regla dentro de `@media (prefers-reduced-motion: reduce)` no toca
//       los contextos SIN esa preferencia, que son los que sufren el timeout del
//       clic. No arreglaría el segundo síntoma ni un milímetro. Queda anotado
//       como pregunta de producto —¿debe el nav lateral animar su ancho bajo
//       `reduce`?—, que es de MAD, no del gate.
//
//   (b) esperar al estado. Es lo que hace este módulo. NO baja el listón: el
//       check 13 siempre ha medido la página EN REPOSO —en máquina quieta las
//       tres familias ya habían terminado a los 1.600 ms y el check pasaba—, así
//       que drenar lo transitorio es medir lo mismo que se medía, pero en el
//       instante correcto en vez de en un instante de reloj.
//
// LA REGLA QUE NO SE PUEDE ROMPER. Esperar a que algo deje de moverse para luego
// decir que no se movía sería un verde falso. Por eso la espera separa dos cosas
// que `getAnimations()` mete en el mismo saco:
//
//   · lo TRANSITORIO —una transición, una animación con final— termina sola: es
//     el ruido de carga y se drena.
//   · lo PERPETUO —`iterations: Infinity`, duración infinita— no termina nunca.
//     Eso es el movimiento que el check 13 existe para cazar, y no se espera: se
//     devuelve en la PRIMERA muestra en que se ve, con su elemento.
//
// Y si lo transitorio no drena dentro del plazo, tampoco hay reintento a ciegas:
// se devuelve `no-para` con lo que seguía moviéndose, que también es FALLO con
// detalle. Un rojo que dice la verdad vale más que un verde por haber mirado en
// otro momento.
//
// El patrón es el de `esperarModoAplicado` en gate.mjs: muestrear, exigir que la
// muestra no cambie durante una ventana, y reportar si no llega.

/**
 * Espera a que el DOM deje de crecer durante `ventana` ms seguidos.
 *
 * No juzga nada: solo garantiza que lo que venga después mida una página ya
 * construida y no una a medio hidratar. Con la máquina cargada, los 1.400-1.600
 * ms fijos repartidos por el gate se quedan cortos y la medición —o el clic—
 * caen sobre una página todavía en obras.
 *
 * @returns {Promise<boolean>} true si el DOM se asentó; false si expiró el plazo.
 *   No es un fallo por sí mismo: quien llama decide, y el juez sigue siendo su
 *   propia medición.
 *
 * ⚠ ASIENTA UN PROXY, NO TU MAGNITUD. Cuenta NODOS: que deje de crecer no
 * garantiza que lo que tú vas a medir se haya estabilizado. El gate del panel se
 * quemó con esto el 20/09/2026 — su comparación de tinta entre modos daba rojos
 * que no reproducían (`/nota@834`: «oscuro 8 vs claro 697», con 697 planas en
 * ocho muestras; `/triaje@375`: «3656 vs 5» a las 11:00 y nada a las 11:33)—.
 * El DOM ya estaba quieto; la TINTA no. Si vas a comparar una cuenta, asienta
 * ESA cuenta: muéstrala hasta que repita, y entonces compárala. Un rojo barato
 * sigue siendo un rojo falso, y el valor entero de un gate es que un rojo
 * signifique algo.
 *
 * El check 5 de este mismo gate cuenta tinta después de llamar aquí y de momento
 * no ha fallado —sus páginas son más simples—, pero se apoya en el mismo proxy.
 * Si algún día da una paridad que no reproduce, es esto y no el dato.
 */
export async function esperarDomAsentado(pg, { ventana = 700, timeout = 30000 } = {}) {
  await pg.evaluate(() => {
    delete window.__gateNodos
    delete window.__gateNodosDesde
  })

  try {
    await pg.waitForFunction(
      v => {
        const n = document.querySelectorAll('*').length

        if (window.__gateNodos !== n) {
          window.__gateNodos = n
          window.__gateNodosDesde = performance.now()

          return false
        }

        return performance.now() - window.__gateNodosDesde > v
      },
      ventana,
      { timeout, polling: 150 }
    )

    return true
  } catch {
    return false
  }
}

/**
 * Espera a que no quede movimiento TRANSITORIO en curso, sin tapar el perpetuo.
 *
 * @returns {Promise<{estado: 'quieto'|'perpetuo'|'no-para', movimiento: string[]}>}
 *   - `quieto`   → 0 animaciones en marcha durante `ventana` ms seguidos.
 *   - `perpetuo` → hay animación sin final (movimiento real): se devuelve YA.
 *   - `no-para`  → lo transitorio no drenó en `timeout`: también es fallo, con
 *                  la lista de lo que seguía moviéndose.
 */
export async function esperarQuietudDeMovimiento(pg, { ventana = 300, timeout = 15000 } = {}) {
  await pg.evaluate(() => {
    delete window.__gateQuietoDesde
    window.__gateMovimiento = []
  })

  try {
    const handle = await pg.waitForFunction(
      v => {
        const describir = animacion => {
          const efecto = animacion.effect
          const objetivo = efecto && typeof KeyframeEffect !== 'undefined' && efecto instanceof KeyframeEffect ? efecto.target : null

          if (!(objetivo instanceof Element)) return 'animación'

          const suClase = typeof objetivo.className === 'string' ? objetivo.className.trim() : ''
          const etiqueta = `${objetivo.tagName.toLowerCase()}${suClase ? `.${suClase.split(/\s+/)[0]}` : ''}`
          const nombre = animacion.transitionProperty || animacion.animationName || ''

          return nombre ? `${etiqueta} (${nombre})` : etiqueta
        }

        // Sin final propio: `iterations: Infinity` y, por tanto, duración activa
        // y final infinitos. Esto NO se espera: es lo que el check 13 caza.
        const sinFinal = animacion => {
          const t = animacion.effect?.getComputedTiming?.()

          if (!t) return false

          return t.iterations === Infinity || t.activeDuration === Infinity || t.endTime === Infinity
        }

        const enCurso = document.getAnimations().filter(a => a.playState === 'running')
        const perpetuas = enCurso.filter(sinFinal)

        if (perpetuas.length) {
          return { estado: 'perpetuo', movimiento: [...new Set(perpetuas.map(describir))].slice(0, 8) }
        }

        if (enCurso.length) {
          window.__gateMovimiento = [...new Set(enCurso.map(describir))].slice(0, 8)
          window.__gateQuietoDesde = undefined

          return false
        }

        if (window.__gateQuietoDesde === undefined) {
          window.__gateQuietoDesde = performance.now()

          return false
        }

        if (performance.now() - window.__gateQuietoDesde <= v) return false

        return { estado: 'quieto', movimiento: [] }
      },
      ventana,
      { timeout, polling: 100 }
    )

    const resultado = await handle.jsonValue()

    await handle.dispose()

    return resultado
  } catch {
    const pendiente = await pg.evaluate(() => window.__gateMovimiento || [])

    return { estado: 'no-para', movimiento: pendiente.length ? pendiente : ['movimiento sin identificar'] }
  }
}
