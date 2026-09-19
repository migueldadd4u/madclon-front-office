// modos-color.mjs — los DOS modos de color del escaparate, y el corte de cada uno.
//
// Vive fuera de gate.mjs por la misma razón que `tema-claro.test.mjs`: para que
// una prueba pueda leer el VALOR que se usa de verdad, no el comentario que lo
// acompaña. La norma que protege es la del 15/09/2026 — «un modo que no es el de
// por defecto NO está medido, aunque exista»— y un comentario no sobrevive a una
// fusión: si alguien borra el oscuro de aquí, la prueba lo canta antes del gate.

/**
 * Construye la lista de modos que barre el check 5.
 *
 * @param {object} matriz — la matriz del modo de REFERENCIA (el de fábrica).
 * @param {number[]} matriz.anchos      anchos de la rejilla de axe.
 * @param {string[]} matriz.idiomas     idiomas del barrido.
 * @param {boolean[]} matriz.contrastes normal y/o alto contraste.
 * @param {boolean} [matriz.rapido]     bucle de bugfixing: los dos modos con la misma matriz reducida.
 */
export function modosAxe({ anchos, idiomas, contrastes, rapido = false }) {
  if (!anchos?.length || !idiomas?.length || !contrastes?.length) {
    throw new Error('modosAxe: el modo de referencia no puede tener una matriz vacía')
  }

  // Los extremos de la rejilla. Medido el 19/09/2026 sobre `web/out`: {375, 1440}
  // ve 707/707 pares elemento×color; 390 y 834 no aportan ni un elemento exclusivo.
  const extremos = [...new Set([Math.min(...anchos), Math.max(...anchos)])]

  return [
    {
      id: 'claro',
      cookie: encodeURIComponent(JSON.stringify({ mode: 'light' })),
      atributo: 'data-light',
      // El de fábrica (themeConfig.mode, vigilado por el check 4c): matriz entera.
      // Y es el que acredita lo que NO depende del color —idioma semántico,
      // overflow y objetivos táctiles—, para no contar dos veces el mismo hallazgo.
      referencia: true,
      idiomas,
      anchos,
      contrastes
    },
    {
      id: 'oscuro',
      cookie: encodeURIComponent(JSON.stringify({ mode: 'dark' })),
      atributo: 'data-dark',
      referencia: false,
      // El corte del oscuro, medido y no supuesto: ver la cabecera de gate.mjs.
      idiomas: [idiomas[0]],
      anchos: rapido ? anchos : extremos,
      contrastes
    }
  ]
}
