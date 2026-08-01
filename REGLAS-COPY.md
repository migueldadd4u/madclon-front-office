# REGLAS-COPY.md — cómo habla y cómo se navega el Front Office

> Artefacto permanente. **Cada regla nace de una entrega real**: si no hay una entrega
> detrás, no entra aquí. Lo que se puede medir, lo mide `web/scripts/gate.mjs`; lo que
> no, se revisa a mano en `CHECKLIST-RECIEN-LLEGADO.md`.

Última revisión: **2026-08-01** (entregas 1-5 de la tanda v5).

---

## 1 · Identidad — de quién es esto

| Regla | Cómo se comprueba |
|---|---|
| La identidad canónica es **«el Clon de Miguel Ángel Domínguez (MAD)»**. Tras la primera mención de cada página, **«el Clon de MAD»**. | `check-copy.mjs`, regla `identidad` |
| En inglés: **«Miguel Ángel Domínguez's clone (MAD)»** / **«MAD's clone»**. | ídem |
| **«Miguel» nunca va suelto**: en la misma frase tiene que aparecer «Ángel» o «MAD». | ídem — falla el gate |
| Donde el clon habla (`ClonOpina`, `EstaNoche`, `ConsolaClon`), habla **en primera persona**: «Soy el Clon de Miguel Ángel Domínguez», no «ayudo a Miguel». | revisión manual + checklist |
| **Nada de datos personales nuevos**: es el nombre público del titular. Ni cargo, ni empresa, ni correo, ni vida privada. | zona roja del prompt |

Estado a 2026-08-01: **saldado**. `check-copy.mjs` se quedó sin lista blanca en la entrega 2:
cualquier «Miguel» suelto tumba el build. Y estrena la regla `identidad-prohibida`, que falla si
reaparece «Delgado» — un apellido equivocado que llegué a publicar y que corrigió MAD.

## 2 · Lenguaje llano — cero tecnicismos sin traducir

- Si una página usa una palabra técnica, **esa misma página trae su traducción llana**.
  No vale explicarla en otra sección: quien entra por «Tokens» no ha leído «Preguntas».
- Traducciones canónicas (las exige `check-copy.mjs`):

  | Palabra | Traducción obligatoria en la misma página |
  |---|---|
  | gateway | «la puerta por la que piensa» / *the door it thinks through* |
  | vault | «la memoria privada» / *the private memory* |
  | token | «palabras pensadas», «unidad de trabajo» / *words thought* |
  | cron | «cada noche», «automático» / *every night* |
  | service worker | «sin internet» / *offline* |
  | prompt | «instrucción» / *instruction* |
  | commit | «cambio guardado» / *saved change* |
  | router | «reparte» / *routes* |

- Añadir una palabra técnica nueva = añadirla a esa tabla **y** a `TECNICISMOS` en `check-copy.mjs`.

## 3 · Procedencia de los datos

- **Toda cifra visible se calcula de los 5 JSON en tiempo de render.** Nada escrito a mano:
  lo escrito a mano envejece en silencio y nadie se entera. Lo vigila `check-hardcode.mjs`.
- Numerales en letra (siete, decena, cientos…) cuentan como cifra a mano: también fallan.
- La forma correcta es `{n}` + `reemplaza()`, con la cadena en ES y EN.
- **Toda cifra lleva su fecha de medición** (de `manifest.json`), en el texto o en su `title`.
- **Si el dato está rancio, se dice.** Con `manifest.json` de más de 48 h la web lo confiesa
  en pantalla; el gate (comprobación 11) falla si NO lo confiesa.
- Excepciones permitidas (lista blanca comentada en `check-hardcode.mjs`): constantes del
  mundo (24 h, un token ≈ 3-4 letras), extremos de escala (0 %, 100 %), unidades de precio
  (€/millón), ventanas fijas de medición (30 días, 7 días), horas de reloj (03:00), nombres de
  capa («capa 2») y los hitos fechados de la línea de tiempo — que cuentan lo que pasó ESE día
  y actualizarlos sería reescribir la historia. `check-hardcode.mjs` está **sin deudas** desde
  la entrega 4: cualquier cifra nueva a mano falla el build.

## 3 bis · Estados vacíos (nacida de la entrega 5)

- **Un hueco mudo no es un estado vacío, es un error.** Si una cifra no viene en los JSON, la
  tarjeta dice «sin dato» y explica por qué y qué va a pasar: «el refresco de esta noche no
  publicó esta cifra; vuelve mañana y estará». Nunca un «—» suelto.
- **Una frase con un dato ausente se reescribe entera**, no se rellena con un guion: «Desde el —
  hay una línea base congelada» es una frase rota, no una frase con un hueco.

## 4 · Navegación por capas — *ninguna capa puede ser una trampa*

Regla general, aplicable también a capas futuras. Toda capa expone **cuatro cosas**:

1. **Dónde estoy** — migas de pan siempre visibles (`Flota (capa 1) › Clon patrimonio (capa 2)`),
   con la capa superior **pulsable de verdad**, no solo una «✕».
2. **De quién es esto** — distintivo de capa y dueño permanente (chip *sticky* con el color y
   el icono del subclon). Ninguna cifra de la capa 2 se lee sin ese distintivo a la vista,
   ni siquiera al hacer scroll dentro del panel.
3. **Cómo subo** — Esc, la miga de pan, el botón «← volver» y el **gesto de atrás del navegador**
   hacen todos lo mismo. El hash es historia real (`pushState`), no `replaceState`.
4. **Cómo me muevo en horizontal** — «← anterior / siguiente →» entre hermanos, con flechas de
   teclado; el foco y las migas se actualizan y se anuncian con `aria-live`.

Y una quinta, de contexto: **la capa superior no queda muerta**. En escritorio y tablet la capa 2
se abre como panel lateral con la capa 1 legible al lado; en móvil (< 834) a pantalla completa,
pero con la miga arriba y el gesto de atrás cableado.

Estado a 2026-08-01: **saldado** en la entrega 3. Las comprobaciones 9 y 10 del gate ya tumban el build.

## 5 · Reglas de forma que ya son ley (nacidas de la entrega 1)

- **Objetivos táctiles ≥ 44×44 px.** Excepción única y comentada: los puntos de la franja
  «un día en la vida», donde el tamaño *es* el dato (cada punto marca una hora en 24 h) y la
  franja entera es enfocable y recorrible con las flechas.
- **Foco visible siempre**, con anillo propio: el velo translúcido de MUI no cuenta como foco.
- **Cuatro anchos, no tres**: 320, 390, 834 y 1440. El 320 es donde revientan las franjas y las cabeceras.
- **Con las utilidades de tailwind de esta plantilla no se pelea**: se emiten dentro de `@layer`
  con `!important`, y para las declaraciones importantes el orden de capas se invierte — una
  regla suelta con `!important` **pierde**. Si hay choque, se quita la utilidad, no se sube la apuesta.

## 6 · Cómo se publica

1. `npx yarn@1.22.22 gate` **entero y en verde** (12 comprobaciones). El modo `--rapido` es
   solo para el bucle de bugfixing: no sirve para publicar.
2. Si algo falla: arreglar y **volver a pasar el gate entero** (un arreglo rompe otra cosa).
   Tres vueltas sin verde → revertir la entrega.
3. Commit granular con prefijo de agente. **Nunca `git add -A`.**
4. Línea en `MEJORAS.md` con el **hash real** leído de `git log`, y la salida del gate pegada tal cual.
