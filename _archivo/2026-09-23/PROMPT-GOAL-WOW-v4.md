# /goal — BUCLE DE AUTOMEJORA «WOW» DEL FRONT OFFICE MAD CLON · v4

> Prompt listo para lanzar en una sesión nueva. Ejecuta el bucle completo, iteración tras iteración, sin pedirme confirmación salvo zona roja. Presupuesto: ~5 horas o 25 iteraciones, lo primero que llegue.
> **Ya se desplegaron 24 mejoras** (listadas abajo): no las repitas; continúa desde la iteración 25.

## Contexto (léelo antes de empezar)

- **Proyecto**: `/Users/madclon/MADClon-Storage/front-office/` — repo git propio, remoto `migueldadd4u/madclon-front-office` (público).
- **Web**: Next.js 16 + React 19 + tema Materialize MUI en `front-office/web/` · export estático a GitHub Pages (push a `main` → se redespliega solo).
- **Producción**: https://migueldadd4u.github.io/madclon-front-office/
- **Datos**: los JSON de `web/public/data/` los regenera un job nocturno — **no los edites a mano**.
- **Bitácora viva**: `front-office/MEJORAS.md` — apéndice obligatorio por iteración (qué se añadió y por qué alucina) con el hash REAL del commit (léelo de `git log`, nunca lo inventes).
- **Coordinación**: lee `MAD-brain/00_SISTEMA/coordinacion/TABLERO.md` al inicio; lock con `MAD-brain/00_SISTEMA/coordinacion/claim.sh acquire front-office kimi` **ANTES de tocar nada** y `release` al terminar cada iteración. **El lock caduca a los 30 min: readquiérelo en cada iteración** (en la tanda 3 se editó una vez sin lock por descuido — cero veces más).
- **Yarn**: se invoca como `npx yarn@1.22.22`.
- **Build local de verificación**: compila con `BASEPATH=/madclon-front-office npx yarn@1.22.22 build` y sirve `web/out` bajo la subruta (`mkdir -p /tmp/site && ln -sfn .../web/out /tmp/site/madclon-front-office && python3 -m http.server 4173 --directory /tmp/site`). Mata el servidor al terminar (`kill $(cat /tmp/fo-http.pid)`).
- **Despliegue**: tras el workflow verde, **el CDN de Pages puede tardar 2–4 min** — espera ~150 s antes de verificar producción; si el elemento nuevo no aparece, reintenta tras 90 s más antes de asumir fallo.
- **Playwright**: disponible en `/tmp/pwshot` (`node <script>`). Hay scripts `it11.js`…`it24prod.js` de las tandas anteriores como referencia de patrones (captura tamaños, portapapeles con permisos, ralentizar JSON con `pg.route` para fotografiar skeletons, teclado real para atajos y pulso).
- **Ojo con `gh run watch`**: necesita el id del run y ejecutarse DENTRO del repo — `cd front-office && RUN=$(gh run list --branch main --limit 1 --json databaseId -q '.[0].databaseId') && gh run watch "$RUN" --exit-status`.

## Lo ya desplegado (tandas 1–3, commits entre `6c5b328` y `19683ac`)

Tanda 1 (1–10): contadores animados, latido en vivo, logo que se dibuja, «un día en la vida del clon», insignias, micro-interacciones, easter egg consola, comparador antes/después, coste en euros, Actividad con count-up.

Tanda 2 (11–20): pulso con dos voces, 404 con personalidad, «el clon te cuenta su noche», barra de progreso del día, skeletons con shimmer, compartir bonito, Salud con latido, flota animada, tablet de verdad (+ botón de menú accesible), modo presentación (kiosk).

Tanda 3 (21–24, hasta ahora):

21. **og-image viva** — la imagen social se regenera con las cifras del día (`exporter/og_image.py`: pulso 30 d + chips tokens/personas/mejoras/salud + fecha). Y el hallazgo: **la og:image estaba ROTA desde el lanzamiento** (subruta duplicada → 404 al compartir); corregida en OG y Twitter Card. ⏳ Pendiente de MAD: cablear `og_image.py` al cron nocturno (zona roja).
22. **Récords del sistema** — Historia muestra los techos medidos con su fecha (día que más pensó 75,5 M · más terminó 19 · más llamadas 1.230), calculados de `serie.json`.
23. **El pulso se puede explorar** — tooltip enriquecido (fecha completa + ambas series + % del día normal) + recorrido por teclado (← →, Inicio/Fin, Esc) con día resaltado, aria-live y anillo de foco.
24. **Atajos de teclado** — g+letra a cada sección (g h/f/s/t/e/a/r/p), ? abre la ayuda en modal accesible, botón en cabecera; inactivo en campos de texto.

⏭️ **Descartadas por honestidad de datos** (la serie medida tiene SOLO 4 días; no las intentes hasta que haya histórico): **mapa de calor anual** y **«esta semana vs la pasada»**.

Componentes reutilizables que YA EXISTEN — úsalos en vez de reinventar: `CountUp.tsx`, `Latido.tsx`, `PuntoVivo.tsx`, `BarraEntra.tsx`, `MadClonLogoAnimado.tsx`, `DiaEnLaVida.tsx`, `Insignias.tsx`, `ConsolaClon.tsx`, `AntesDespues.tsx`, `EstaNoche.tsx`, `ProgresoDia.tsx`, `CopiarEnlace.tsx`, `ModoPresentacion.tsx`, `AtajosTeclado.tsx` (en `web/src/components/dashboard/`); clases CSS `fo-card-hover`, `fo-page-in`, `fo-shimmer`, `fo-kiosk`, `fo-pulso` en `globals.css`; helper `reemplaza()` para plantillas `{x}` en `page.tsx` y `ProgresoDia.tsx`.

## Lecciones aprendidas en la tanda 3

- **`button[aria-pressed]` ya NO es solo el toggle ES/EN** (el kiosk también lo usa): los tests nuevos fijan el idioma con `pg.addInitScript(l => localStorage.setItem('madclon-lang', l))` en vez de clicar.
- **Las URLs de metadata no llevan la subruta a mano**: Next añade el basePath solo; escribir `/madclon-front-office/...` en `metadata.openGraph` la duplica y da 404. Así estuvo rota la og-image desde el lanzamiento — mira siempre el HTML servido, no solo el código.
- **El alpha de PIL no mezcla en modo directo**: dibuja las capas translúcidas en un `Image.new('RGBA', …)` aparte y `alpha_composite`. Y mide píxeles reales (`im.getpixel`) antes de dar por bueno un degradado.
- **El lock se readquiere ANTES de editar**, no a mitad de iteración (un despiste, registrado en TABLERO; protocolo intacto).
- **Honestidad de datos por encima del backlog**: si una mejora necesita datos que no existen (serie de 4 días para un mapa anual), se descarta y se anota — nunca se pinta lo que no hay.

## EL BUCLE (cada iteración = UNA mejora desplegada)

1. **OBSERVA** — Abre la web en producción con Playwright (escritorio 1440px + móvil 390px, idiomas ES y EN fijado por localStorage). Lee el TABLERO y el `git log --oneline -5` del repo. Anota 3 candidatos priorizados por impacto *wow* / esfuerzo.
2. **DECIDE** — Elige UNA: la de mayor efecto sorpresa con riesgo bajo. Dila en una frase y ejecútala sin esperar permiso.
3. **CONSTRUYE** — Lock → implementa en `web/`. Reglas de la casa:
   - Estilo Materialize, modo oscuro primero, degradado indigo→teal de marca (#7A7FFF → #4E8FE8 → #06C9A8).
   - **Bilingüe obligatorio**: toda cadena nueva va en ES y EN en `src/lib/i18n.tsx` (si lleva cifras, placeholders `{x}` + `reemplaza()`).
   - **Privacidad sagrada**: solo cifras agregadas que ya existen en los JSON. Nada de nombres, correos, contenido ni datos nuevos del vault. Y nada de datos inventados: si la serie no da, la mejora espera.
   - **Accesibilidad AA**: respeta `prefers-reduced-motion` en TODA animación nueva; controles reales (`<button>`, no iconos con onClick); `aria-label`/roles donde toque; contraste suficiente.
   - **Multidispositivo**: verifica Ordenador (1440), Tablet (~834) y Móvil (390).
   - **Comprensible para cualquiera**: nada de tecnicismos sin explicar; la web la puede leer alguien que no sabe lo que es un clon.
4. **VERIFICA** — build sin errores (`BASEPATH=/madclon-front-office`) + capturas Playwright en local (desktop + móvil, ES + EN) y **0 errores JS**. Si algo falla: arréglalo o revierte; nunca publiques roto.
5. **PUBLICA** — commit granular con prefijo `kimi:` (**nunca `git add -A`**), push a `main`, espera el workflow (`gh run watch "$RUN" --exit-status`) y verifica en producción con captura tras ~150 s (CDN).
6. **REGISTRA** — Apéndice en TABLERO, `release` del lock, y línea en `front-office/MEJORAS.md` con el hash real.
7. **REPETIR** — Vuelve a 1 con la siguiente mejora.

## BACKLOG PARA ESTA TANDA (prioridad sugerida; reordena o inventa mejores)

1. **Lighthouse AA al día** — auditoría de contraste/foco/aria en las piezas nuevas de las tandas 1–3 (consola, franja 24 h, insignias, kiosk, atajos, récords, pulso explorable) y arreglo de lo que salga.
2. **La franja 24 h en tablet/móvil se puede deslizar** — scroll con sombras de borde que indiquen que hay más.
3. **Modo alto contraste opcional** — toggle que suba el contraste de textos secundarios (persistido en localStorage, como el idioma).
4. **Print bonito** — hoja de estilos de impresión: la portada como informe de una página para enseñar en papel.
5. **PWA de verdad** — la v2.2 ya tiene manifest e iconos; falta service worker mínimo para «funciona sin conexión» (solo estáticos, los JSON con caché de un día).
6. **El clon opina, autor real** — borrador semanal más elaborado que Miguel aprueba antes de publicarse (**requiere OK de Miguel la primera vez**).
7. **Cablear `og_image.py` al job nocturno** — la og-image se regenera sola cada madrugada (**zona roja: requiere OK de Miguel**; el script ya existe y es independiente).
8. ~~Mapa de calor anual~~ y ~~semana vs pasada~~ — **bloqueadas hasta que la serie medida crezca** (hoy: 4 días).

## ZONAS ROJAS (pide permiso a Miguel ANTES de tocar)

- Mostrar cualquier dato que no esté ya en los JSON públicos exportados.
- Textos públicos nuevos que hablen de personas, empresas o asuntos concretos.
- El exportador (`exporter/export_panel.py`) y la automatización nocturna (incluido cablear `og_image.py` al cron).
- Zonas sagradas del workspace (`00_SISTEMA/hermes/**`, tokens, crons) — intocables siempre.

## CRITERIO DE PARADA E INFORME

Tras 25 iteraciones o 5 horas: informe final con lo desplegado (con capturas), lo que descartaste y por qué, y el backlog actualizado para la próxima tanda. Si detectas una colisión (lock ajeno, conflicto git): PARA, anota en TABLERO y avisa. Accesibilidad AA, multidispositivo (Ordenador, Tablet y Móvil) y lenguaje comprensible para cualquier persona son requisitos de CADA iteración, no del final.
