# /goal — EL FRONT OFFICE, PARA HUMANOS · v5 (rutina permanente de automejora)

> Prompt listo para lanzar en una sesión nueva. **No es una tanda de «wow»**: es la rutina de madurez del escaparate. Ejecuta el bucle completo sin pedirme confirmación salvo zona roja.
> Presupuesto por tanda: ~4 h o 6 entregas, lo primero que llegue. Cada entrega deja **artefacto reutilizable** (regla, checklist, script o plantilla) o no cuenta.
> Lema de la tanda: **menos épica, más trazabilidad**. Un clon potente impresiona; un clon maduro ayuda.

---

## 0. Contexto (léelo antes de tocar nada)

- **Proyecto**: `/Users/madclon/MADClon-Storage/front-office/` — repo git propio, remoto `migueldadd4u/madclon-front-office`.
- **Web**: Next.js 16 + React 19 + tema Materialize MUI en `front-office/web/` · export estático a GitHub Pages (push a `main` → redespliegue solo).
- **Producción**: https://migueldadd4u.github.io/madclon-front-office/
- **Datos**: los 5 JSON de `web/public/data/` (`manifest`, `overview`, `clones`, `tokens`, `serie`) los regenera el job nocturno vía `exporter/export_panel.py` — **no los edites a mano, no toques el exportador** (zona roja).
- **Bitácora viva**: `front-office/MEJORAS.md` — apéndice obligatorio por entrega, con el hash REAL leído de `git log` (nunca inventado).
- **Historial**: `PROMPT-GOAL-WOW.md` … `v4.md` y `PROMPT-ANATOMIA-CLONES.md` — **31 mejoras ya desplegadas**. No repitas ninguna: esta tanda es de *madurez*, no de novedad.
- **Coordinación multiagente**: lee `MAD-brain/00_SISTEMA/coordinacion/TABLERO.md` al inicio; `claim.sh acquire front-office <agente>` **ANTES de editar**, `release` al terminar cada entrega, y **readquiere si pasan 30 min** (el lock caduca).
- **Yarn**: `npx yarn@1.22.22`. **Build de verificación**: `BASEPATH=/madclon-front-office npx yarn@1.22.22 build` y sirve `web/out` bajo la subruta (`mkdir -p /tmp/site && ln -sfn …/web/out /tmp/site/madclon-front-office && python3 -m http.server 4173 --directory /tmp/site`). Mata el servidor al terminar.
- **Playwright**: en `/tmp/pwshot` (`node <script>`); scripts `it11.js`…`it24prod.js` como referencia (capturas, `addInitScript` con `localStorage.setItem('madclon-lang', l)`, teclado real, axe).
- **CI**: `cd front-office && RUN=$(gh run list --branch main --limit 1 --json databaseId -q '.[0].databaseId') && gh run watch "$RUN" --exit-status`. El CDN de Pages tarda 2–4 min: espera ~150 s antes de verificar producción, reintenta a los 90 s antes de dar nada por roto.

---

## 1. LOS SIETE EJES DE ESTA RUTINA

Cada entrega tiene que mover al menos uno. Los ejes 1–4 son **permanentes** (se verifican en CADA entrega, para siempre); los 5–7 son **deudas concretas** que hay que saldar en esta tanda.

### Eje 1 · Accesibilidad AA — permanente, no negociable
- axe (`wcag2a`, `wcag2aa`, `wcag21aa`) **a cero violaciones serious/critical** en las 8 páginas × escritorio y móvil × ES/EN × modo normal y alto contraste. Hoy está a cero: **el listón es no bajarlo nunca**, no volver a auditarlo desde fuera.
- Toda animación nueva con su rama `prefers-reduced-motion`. Controles reales (`<button>`, nunca icono con `onClick`). Nombre accesible en todo lo interactivo. Foco visible siempre.
- Navegación completa **solo con teclado**, incluidas las capas: Tab llega, Enter abre, Esc cierra, el foco vuelve al origen.
- Contraste ≥ 4.5:1 en texto normal y ≥ 3:1 en gráficos y bordes que porten significado, en oscuro y en claro.

### Eje 2 · Testing y bugfixing ANTES de desplegar — el gate
Nada se publica sin pasar el gate completo **en local**, y si el gate falla se entra en **bucle de bugfixing** (arreglar → re-ejecutar el gate entero, no solo lo que falló) hasta verde o revert. Ver §3.

### Eje 3 · Se ve bien en móvil, tablet y ordenador — permanente
- Tres anchos obligatorios en cada verificación: **390 (móvil), 834 (tablet), 1440 (escritorio)**. Añade **320** (móvil pequeño) al gate: es donde revientan las franjas y los modales.
- Cero *overflow* horizontal en `<body>` en cualquiera de los cuatro anchos (comprobación determinista: `document.documentElement.scrollWidth <= innerWidth + 1`).
- Objetivos táctiles ≥ 44×44 px. Nada que dependa de *hover* para poder usarse.
- Lo que se desliza, **confiesa que se desliza** (ya se hizo con la franja 24 h: mismo patrón para todo lo nuevo).

### Eje 4 · Autoexplicativo — la «prueba del recién llegado»
Alguien que entra por primera vez, sin que nadie le explique nada, tiene que poder responder en **≤ 5 minutos y sin ayuda**:
1. ¿Qué es esto que estoy viendo?
2. ¿De quién es y quién lo hace?
3. ¿Qué puedo hacer aquí y qué pasa si lo pulso?
4. ¿De dónde salen estas cifras y de cuándo son?
5. ¿En qué parte estoy y cómo vuelvo atrás?

Reglas derivadas, aplicables a toda pieza nueva:
- **Cero tecnicismos sin traducir en la misma frase** («gateway: la puerta por la que piensa»). Si una palabra necesita glosario, va con su glosario al lado.
- **Todo elemento interactivo anuncia su consecuencia antes de pulsarlo** (píldora, verbo, icono direccional). Nada de descubrir la función por accidente.
- **Todo dato lleva su procedencia y su fecha** al alcance de un vistazo o un `title`: «medido el 01/08, se regenera cada noche».
- **Los estados vacíos hablan en positivo** y explican por qué están vacíos, nunca un hueco mudo.
- Artefacto obligatorio del eje: `front-office/CHECKLIST-RECIEN-LLEGADO.md` con las 5 preguntas y el veredicto por página (ver §4).

### Eje 5 · El clon dice quién es — deuda a saldar
Hoy la web habla del clon **en tercera persona y a medias**: «un equipo de IA que trabaja mientras **Miguel** vive su vida» (`app/layout.tsx:32,42`, `lib/i18n.tsx:55`), «propuestas esperando a **Miguel**» (`lib/i18n.tsx:208`), FAQ en `preguntas/page.tsx`, `ClonOpina.tsx`. Un recién llegado no sabe **de quién** es esto.

- Identidad canónica y única: **«el Clon de Miguel Ángel Delgado (MAD)»**, abreviado **«el Clon de MAD»** tras la primera mención de cada página. En inglés: *«Miguel Ángel Delgado's clone (MAD)»* / *«MAD's clone»*.
- En primera persona donde el clon habla (`ClonOpina`, `EstaNoche`, `ConsolaClon`): **«Soy el Clon de Miguel Ángel Delgado»**, no «ayudo a Miguel».
- Barre **todas** las cadenas: `lib/i18n.tsx`, las 8 páginas, `layout.tsx` (title, description, OpenGraph, Twitter), el 404, el manifest de la PWA, la og-image (`exporter/og_image.py`) y el `<title>`.
- Artefacto: **regla de nomenclatura** en `front-office/REGLAS-COPY.md` + comprobador determinista que falle si aparece «Miguel» suelto sin «Ángel»/«MAD» en la misma frase (ver §3, `check-copy`).
- Cuidado: **nada de datos personales nuevos**. Es el nombre público del titular, ya presente en la marca — no se añade cargo, empresa, correo ni vida privada.

### Eje 6 · Las capas no se bloquean entre sí — deuda a saldar
Hoy la capa 2 (anatomía de cada clon, `components/dashboard/AnatomiaClon.tsx`) es un `Dialog` modal: **secuestra la capa 1** (la Flota queda inerte detrás), y desde dentro no se puede saltar a otro subclon ni se ve dónde estás. Hay que arreglarlo:

- **Migas de pan siempre visibles**, en la capa 2 y en cualquier capa futura: `Flota (capa 1) › Clon patrimonio (capa 2)`, con la capa 1 **pulsable de verdad** para volver, no solo una «X».
- **Distintivo de capa y dueño permanente**: mientras estés en la capa 2, un chip fijo con el color e icono del subclon dice **de quién es lo que estás leyendo** («Clon patrimonio · capa 2»). Ninguna cifra de la capa 2 puede aparecer sin ese distintivo a la vista, ni siquiera al hacer scroll dentro del panel (chip *sticky*).
- **Se pasa de una capa a la superior sin fricción**: Esc, la miga de pan, el botón «← volver a la flota» y el gesto de retroceso del navegador **hacen todos lo mismo**. El hash (`#clon-<perfil>`) pasa a ser **historia real** (`pushState`), no `replaceState`: en móvil, «atrás» debe cerrar la capa 2 y devolverte a la Flota, no sacarte de la web.
- **Movimiento lateral dentro de la capa 2**: «← anterior / siguiente →» entre los 7 subclones (y flechas de teclado), sin volver a la capa 1 para cambiar de clon. El foco y las migas se actualizan y se anuncian con `aria-live`.
- **La capa 1 no queda muerta**: en escritorio y tablet la capa 2 se abre como panel lateral (*drawer* derecho) con la Flota visible y legible al lado — la capa superior sigue siendo contexto, no un fondo apagado; en móvil (< 834) sí a pantalla completa, porque no cabe otra cosa, pero con la miga de pan arriba y el gesto de atrás cableado.
- **Regla general para futuras capas** (capa 3 si algún día la hay): *ninguna capa puede ser una trampa*. Toda capa expone: dónde estoy, de quién es esto, cómo subo, cómo me muevo en horizontal. Artefacto: sección «Navegación por capas» en `REGLAS-COPY.md` + componente reutilizable `MigaDeCapas.tsx`.

### Eje 7 · Cero cifras a mano — deuda a saldar y regla permanente
Toda cifra o recuento visible **se calcula de los JSON en tiempo de render**. Nada escrito a mano que envejezca en silencio. Deudas detectadas hoy:
- `lib/i18n.tsx:255` «La flota: **siete** clones, **siete** oficios» y `:257` «son **siete** perfiles… y un **octavo** actor» → derivar de `clones.json.clones.length` con placeholder `{n}` + `reemplaza()`.
- `preguntas/page.tsx:49` «**cientos de millones** de tokens al mes, una **decena** de rutinas, una flota de **siete** clones» → cifras vivas.
- Cualquier umbral de `Insignias.tsx`, récord o hito de `historia/page.tsx` escrito a mano.
- **Toda cifra lleva su fecha de medición** (de `manifest.json`), en el propio texto o en su `title`, para que se vea si el dato se ha quedado viejo.
- **Si el dato no existe o está rancio, se dice**: si `manifest.json` tiene más de 48 h, una franja discreta y bilingüe avisa («datos del 30/07; el refresco nocturno no ha corrido»). Mejor confesar que mostrar un número muerto con cara de fresco.
- Artefacto: **`web/scripts/check-hardcode.mjs`** — falla el build si encuentra numerales (dígitos o números escritos en letra: dos…doce, cien, mil, millón) dentro de las cadenas de `i18n.tsx` y de las páginas, salvo lista blanca explícita y comentada. Determinista: lo decide el script, no el criterio del modelo.

---

## 2. RUTINA DE TRABAJO (el bucle)

Cada iteración = **una entrega desplegada y verificada**. En este orden, sin saltarse pasos.

### 1) OBSERVA — y separa lo que ves de lo que interpretas
Lee TABLERO, `git log --oneline -8` y el final de `MEJORAS.md`. Abre **producción** con Playwright (390/834/1440 × ES/EN, idioma fijado por `localStorage`). Anota los hallazgos con la separación de rigor — **esto es obligatorio en el informe**:

- **EVIDENCIA** — lo que se ve o mide, con captura, selector, cifra o `fichero:línea`.
- **INFERENCIA** — lo que deduces de esa evidencia, marcado como deducción.
- **HIPÓTESIS** — lo que sospechas y aún no has comprobado (nunca se despliega sobre una hipótesis sin verificarla antes).
- **PROPUESTA** — qué harías, con coste y riesgo.

Y **etiqueta cada hallazgo** (esto instrumenta calidad, no actividad): `ÚTIL` · `RUIDO` · `FALSO_POSITIVO` · `PENDIENTE_VALIDAR`. Al final de la tanda hay que poder decir cuántos de los hallazgos sirvieron de verdad. «16 alertas» no significa nada.

### 2) DECIDE — criterio de intervención
Elige **UNA** entrega. Antes de tocar nada, responde en una línea: **¿esto quita carga real, mejora una decisión o evita perder contexto?** Si la respuesta es «da un toque bonito», va al backlog, no a producción. No automatices ni adornes por ansiedad arquitectónica.

Prioridad de la tanda: **ejes 5, 6 y 7 primero** (son deudas que degradan el sistema cada día que pasan); los ejes 1–4 se verifican siempre.

### 3) CONSTRUYE — reglas de la casa
- Lock adquirido. Estilo Materialize, oscuro primero, degradado de marca `#7A7FFF → #4E8FE8 → #06C9A8`.
- **Bilingüe obligatorio**: toda cadena nueva en ES y EN en `src/lib/i18n.tsx`; cifras con `{x}` + `reemplaza()`.
- **Privacidad sagrada**: solo lo que ya está en los 5 JSON públicos. Ni nombres de terceros, ni contenidos, ni rutas, ni datos nuevos del vault. Nada inventado.
- **Reutiliza, no reinventes**: `CountUp`, `Latido`, `PuntoVivo`, `BarraEntra`, `CopiarEnlace`, `DataGate`, `AnatomiaClon` y las clases `fo-*` de `globals.css` ya existen.
- Commits granulares con prefijo del agente (`kimi:` / el tuyo). **Nunca `git add -A`.**

### 4) VERIFICA — el gate, y bucle de bugfixing hasta verde
Ejecuta el gate de §3 **entero**. Si algo falla: **arregla y vuelve a pasarlo entero** (un arreglo puede romper otra cosa). Tres vueltas sin verde → **revierte** la entrega, anótala como `PENDIENTE_VALIDAR` con la evidencia del fallo y pasa a la siguiente. Jamás se publica en rojo, jamás se publica «casi».

### 5) PUBLICA
Commit granular → push a `main` → `gh run watch --exit-status` → verificación **en producción** tras ~150 s con capturas en los tres anchos y los dos idiomas. Si producción no coincide con local, es un fallo de la entrega, no del CDN (reintenta una vez a los 90 s antes de concluir).

### 6) REGISTRA — artefacto o no cuenta
- Línea en `MEJORAS.md` con el **hash real** y el «por qué alucina» / qué carga quita.
- Apéndice en TABLERO + `release` del lock.
- Y el artefacto de la entrega, que debe ser **una de estas cuatro cosas**: **regla** (en `REGLAS-COPY.md`), **checklist** (en `CHECKLIST-RECIEN-LLEGADO.md`), **script** (en `web/scripts/`) o **plantilla** (componente reutilizable). Si la entrega no deja ninguna, no estaba madura: se queda en el backlog.

### 7) REPITE
Vuelve a 1. Al agotar presupuesto, informe final (§5).

---

## 3. EL GATE (determinista: lo decide un script, no el criterio del modelo)

> Regla dura: **si algo se puede medir con un script, no lo decide un LLM.** El modelo interpreta el resultado; no se inventa el estado del sistema.

Crea (o amplía) **`web/scripts/gate.mjs`**, invocable con `npx yarn@1.22.22 gate`, que ejecute y devuelva salida distinta de 0 al primer fallo:

| # | Comprobación | Criterio de aprobado |
|---|---|---|
| 1 | `build` con `BASEPATH=/madclon-front-office` | 0 errores, 0 warnings nuevos |
| 2 | `tsc --noEmit` + eslint + stylelint | limpio |
| 3 | **`check-hardcode.mjs`** (eje 7) | 0 numerales fuera de la lista blanca |
| 4 | **`check-copy.mjs`** (eje 5) | 0 «Miguel» sin «Ángel»/«MAD» en la frase; 0 tecnicismos de la lista negra sin su glosario |
| 5 | **axe** wcag2a/2aa/21aa, 8 páginas × {390, 834, 1440} × {ES, EN} × {normal, alto contraste} | 0 serious, 0 critical |
| 6 | **Errores de consola** en ese mismo barrido | 0 errores JS, 0 peticiones 404 |
| 7 | **Overflow horizontal** en {320, 390, 834, 1440} | `scrollWidth <= innerWidth + 1` en las 8 páginas |
| 8 | **Objetivos táctiles** < 44 px en móvil | 0 (lista blanca comentada si hay excepción justificada) |
| 9 | **Teclado**: recorrido completo Flota → capa 2 → lateral → volver | sin trampas de foco, foco visible en cada parada |
| 10 | **Capas** (eje 6): «atrás» del navegador cierra la capa 2; miga de pan presente; distintivo de subclon visible tras scroll | los 3 pasan |
| 11 | **Frescura de datos**: `manifest.json` con antigüedad > 48 h | la web lo confiesa en pantalla (no falla el gate: falla si NO lo confiesa) |
| 12 | **Enlaces internos** de las 8 páginas + og:image + sitemap | 200, sin subruta duplicada |

Cada comprobación imprime `OK` / `FALLO` con la evidencia (fichero, selector o captura). El resultado del gate se pega, tal cual, en el apéndice de `MEJORAS.md`. **El gate corre en local antes de publicar y en el CI después**: lo que no pasa el gate no llega a `main`.

---

## 4. LOS TRES ARTEFACTOS PERMANENTES

1. **`front-office/REGLAS-COPY.md`** — identidad («Clon de Miguel Ángel Delgado (MAD)»), glosario de tecnicismos con su traducción llana obligatoria, tono, reglas de navegación por capas y de procedencia de datos. Cada regla nace de una entrega real: nada de reglas teóricas.
2. **`front-office/CHECKLIST-RECIEN-LLEGADO.md`** — las 5 preguntas del eje 4 × las 8 páginas, con veredicto y fecha de la última pasada. Se revisa entero **una vez por tanda**.
3. **`web/scripts/gate.mjs`** (+ `check-hardcode.mjs`, `check-copy.mjs`) — el gate de §3, cableado a `yarn gate` y al workflow del CI.

---

## 5. ZONAS ROJAS (pide permiso a MAD ANTES)

- Mostrar cualquier dato que no esté ya en los 5 JSON públicos exportados.
- El exportador `exporter/export_panel.py`, la automatización nocturna y el cron.
- Textos públicos que hablen de personas, empresas o asuntos concretos (el eje 5 usa el nombre del **titular**, nada más: ni cargo, ni empresa, ni contacto).
- Publicar cualquier texto en primera persona que **opine** sobre terceros.
- Zonas sagradas del workspace (`00_SISTEMA/hermes/**`, tokens, crons) — intocables siempre.

---

## 6. CRITERIO DE PARADA E INFORME

Para al agotar el presupuesto, o antes si detectas colisión (lock ajeno, conflicto git): en ese caso **PARA, anota en TABLERO y avisa**.

Informe final, en este formato y sin épica:

- **EVIDENCIA** — qué se desplegó, con hash, capturas y salida del gate.
- **INFERENCIA** — qué mejoró de verdad para un humano que entra por primera vez.
- **HIPÓTESIS** — qué sospechas que sigue flojo y no has podido comprobar.
- **PROPUESTA** — backlog priorizado para la siguiente tanda, con coste y riesgo.
- **Recuento de hallazgos** por etiqueta: `ÚTIL` / `RUIDO` / `FALSO_POSITIVO` / `PENDIENTE_VALIDAR`. Si el ruido supera a lo útil, dilo y propón cómo recalibrar el gate.
- **Crítica honesta al propio sistema**: una cosa que hicimos peor de lo que creíamos. Obligatoria.
- **Artefactos dejados**: regla / checklist / script / plantilla por entrega. Una entrega sin artefacto se declara incompleta.

Accesibilidad AA, los cuatro anchos, el lenguaje llano y la identidad correcta **no son el final de la tanda: son requisito de cada entrega**.
