# /goal — BUCLE DE AUTOMEJORA «WOW» DEL FRONT OFFICE MAD CLON · v3

> Prompt listo para lanzar en una sesión nueva. Ejecuta el bucle completo, iteración tras iteración, sin pedirme confirmación salvo zona roja. Presupuesto: ~5 horas o 25 iteraciones, lo primero que llegue.
> **Ya se desplegaron 20 mejoras** (listadas abajo): no las repitas; continúa desde la iteración 21.

## Contexto (léelo antes de empezar)

- **Proyecto**: `/Users/madclon/MADClon-Storage/front-office/` — repo git propio, remoto `migueldadd4u/madclon-front-office` (público).
- **Web**: Next.js 16 + React 19 + tema Materialize MUI en `front-office/web/` · export estático a GitHub Pages (push a `main` → se redespliega solo).
- **Producción**: https://migueldadd4u.github.io/madclon-front-office/
- **Datos**: los JSON de `web/public/data/` los regenera un job nocturno — **no los edites a mano**.
- **Bitácora viva**: `front-office/MEJORAS.md` — apéndice obligatorio por iteración (qué se añadió y por qué alucina) con el hash REAL del commit (léelo de `git log`, nunca lo inventes).
- **Coordinación**: lee `MAD-brain/00_SISTEMA/coordinacion/TABLERO.md` al inicio; lock con `MAD-brain/00_SISTEMA/coordinacion/claim.sh acquire front-office kimi` antes de tocar nada y `release` al terminar cada iteración. **El lock caduca a los 30 min: readquiérelo en cada iteración.**
- **Yarn**: se invoca como `npx yarn@1.22.22`.
- **Build local de verificación**: compila con `BASEPATH=/madclon-front-office npx yarn@1.22.22 build` y sirve `web/out` bajo la subruta (`mkdir -p /tmp/site && ln -sfn .../web/out /tmp/site/madclon-front-office && python3 -m http.server 4173 --directory /tmp/site`).
- **Despliegue**: tras el workflow verde, **el CDN de Pages puede tardar 2–4 min** — espera ~150 s antes de verificar producción; si el elemento nuevo no aparece, reintenta tras 90 s más antes de asumir fallo.
- **Playwright**: disponible en `/tmp/pwshot` (`node <script>`). Hay scripts `it11.js`…`it20prod.js` de la tanda anterior como referencia de patrones (captura 3 tamaños, toggle ES/EN con `button[aria-pressed]`, portapapeles con permisos, ralentizar JSON con `pg.route` para fotografiar skeletons).
- **Ojo con `gh run watch`**: necesita el id del run — `RUN=$(gh run list --branch main --limit 1 --json databaseId -q '.[0].databaseId') && gh run watch "$RUN" --exit-status`.

## Lo ya desplegado (tandas 1–20, commits entre `6c5b328` y `8000a5b`)

Tanda 1 (1–10): contadores animados, latido en vivo, logo que se dibuja, «un día en la vida del clon», insignias, micro-interacciones, easter egg consola, comparador antes/después, coste en euros, Actividad con count-up.

Tanda 2 (11–20):

11. Pulso con dos voces (serie teal de tareas/día junto a tokens, ejes ocultos independientes, leyenda llana).
12. 404 con personalidad (logo animado, «404» en degradado, mensaje llano bilingüe, botón al panel).
13. El clon te cuenta su noche (franja en primera persona con la última noche medida + 3 chips).
14. Barra de progreso del día (último día vs ritmo habitual, degradado, role=progressbar).
15. Skeletons con shimmer (barrido indigo→teal, estructura real de la portada).
16. Compartir bonito (botón «copiar enlace» en el pie con check 2 s, probado con portapapeles real).
17. Salud con latido (PuntoVivo pulsante en integraciones y rutinas OK + Latido en cabecera).
18. La flota animada (BarraEntra creciendo + count-up por clon + hover).
19. Tablet de verdad (pasada 834 px sin overflow + botón de menú accesible con teclado).
20. Modo presentación (kiosk: oculta chrome + fullscreen, salida Esc o píldora flotante).

Componentes reutilizables que YA EXISTEN — úsalos en vez de reinventar: `CountUp.tsx`, `Latido.tsx`, `PuntoVivo.tsx`, `BarraEntra.tsx`, `MadClonLogoAnimado.tsx`, `DiaEnLaVida.tsx`, `Insignias.tsx`, `ConsolaClon.tsx`, `AntesDespues.tsx`, `EstaNoche.tsx`, `ProgresoDia.tsx`, `CopiarEnlace.tsx`, `ModoPresentacion.tsx` (en `web/src/components/dashboard/`); clases CSS `fo-card-hover`, `fo-page-in`, `fo-shimmer`, `fo-kiosk` en `globals.css`.

## Lecciones aprendidas en la tanda 2

- **MUI Button NO tiene `variant='tonal'`** en los tipos (Chip sí). En Button usa `variant='text'|'outlined'|'contained'`.
- **Un botón flotante dentro del header desaparece si ocultas el header** — renderízalo con `createPortal(..., document.body)`.
- **El menú móvil/tablet de la plantilla era un `<i>` con onClick** — ya es `<button>` accesible; respeta ese patrón en cualquier control nuevo (nada de iconos clicables).
- **`python -m http.server` no sirve el 404 de Next** en rutas inventadas: prueba `/404.html` directamente; en GitHub Pages sí se sirve solo.
- **Para fotografiar estados de carga** ralentiza los JSON con `pg.route('**/data/*.json', …)`.
- **El toggle ES/EN no existe fuera del layout dashboard** (el 404 usa el idioma guardado en localStorage).

## EL BUCLE (cada iteración = UNA mejora desplegada)

1. **OBSERVA** — Abre la web en producción con Playwright (escritorio 1440px + móvil 390px, idiomas ES y EN). Lee el TABLERO y el `git log --oneline -5` del repo. Anota 3 candidatos priorizados por impacto *wow* / esfuerzo.
2. **DECIDE** — Elige UNA: la de mayor efecto sorpresa con riesgo bajo. Dila en una frase y ejecútala sin esperar permiso.
3. **CONSTRUYE** — Lock → implementa en `web/`. Reglas de la casa:
   - Estilo Materialize, modo oscuro primero, degradado indigo→teal de marca (#7A7FFF → #4E8FE8 → #06C9A8).
   - **Bilingüe obligatorio**: toda cadena nueva va en ES y EN en `src/lib/i18n.tsx` (si lleva cifras, placeholders `{x}` + replace).
   - **Privacidad sagrada**: solo cifras agregadas que ya existen en los JSON. Nada de nombres, correos, contenido ni datos nuevos del vault.
   - **Accesibilidad AA**: respeta `prefers-reduced-motion` en TODA animación nueva; controles reales (`<button>`, no iconos con onClick); `aria-label`/roles donde toque; contraste suficiente.
   - **Multidispositivo**: verifica Ordenador (1440), Tablet (~834) y Móvil (390).
   - **Comprensible para cualquiera**: nada de tecnicismos sin explicar; la web la puede leer alguien que no sabe lo que es un clon.
4. **VERIFICA** — build sin errores (`BASEPATH=/madclon-front-office`) + capturas Playwright en local (desktop + móvil, ES + EN) y **0 errores JS**. Si algo falla: arréglalo o revierte; nunca publiques roto.
5. **PUBLICA** — commit granular con prefijo `kimi:` (**nunca `git add -A`**), push a `main`, espera el workflow (`gh run watch "$RUN" --exit-status`) y verifica en producción con captura tras ~150 s (CDN).
6. **REGISTRA** — Apéndice en TABLERO, `release` del lock, y línea en `front-office/MEJORAS.md` con el hash real.
7. **REPETIR** — Vuelve a 1 con la siguiente mejora.

## BACKLOG PARA ESTA TANDA (prioridad sugerida; reordena o inventa mejores)

1. **Lighthouse AA al día** — auditoría de contraste/foco/aria en las piezas nuevas de las tandas 1–2 (consola, franja 24 h, insignias, kiosk) y arreglo de lo que salga.
2. **og-image viva** — regenerar la imagen social con las cifras de hoy (304 M, insignias, pulso) para que compartir el enlace ya alucine antes de abrir.
3. **Récords del sistema** — «el día que más pensó», «la noche con más tareas»: máximos reales de la serie con su fecha, en Historia.
4. **El pulso se puede explorar** — tooltip enriquecido en el gráfico de portada (fecha completa + ambas series + % del día normal) y teclado para recorrerlo.
5. **Sonido opcional del latido** — NO; en su lugar: modo alto contraste opcional (toggle) que suba contraste de textos secundarios.
6. **La franja 24 h en tablet/móvil se puede deslizar** — scroll con sombras de borde que indiquen que hay más.
7. **«Esta semana vs la pasada»** — mini-tarjeta en Actividad comparando propuestas/mejoras con la ventana anterior.
8. **Mapa de calor anual** — vista Historia tipo «GitHub contributions» con la intensidad de cada día (tokens), degradado indigo→teal.
9. **Atajos de teclado** — g+h Panel, g+f Flota, g+s Salud… con ayuda al pulsar «?» (modal accesible).
10. **El clon opina, autor real** — borrador semanal más elaborado que Miguel aprueba antes de publicarse (**requiere OK de Miguel la primera vez**).
11. **Print bonito** — hoja de estilos de impresión: la portada como informe de una página para enseñar en papel.
12. **PWA mínima** — manifest + icono para «añadir a pantalla de inicio» y que se abra sin chrome del navegador.

## ZONAS ROJAS (pide permiso a Miguel ANTES de tocar)

- Mostrar cualquier dato que no esté ya en los JSON públicos exportados.
- Textos públicos nuevos que hablen de personas, empresas o asuntos concretos.
- El exportador (`exporter/export_panel.py`) y la automatización nocturna.
- Zonas sagradas del workspace (`00_SISTEMA/hermes/**`, tokens, crons) — intocables siempre.

## CRITERIO DE PARADA E INFORME

Tras 25 iteraciones o 5 horas: informe final con lo desplegado (con capturas), lo que descartaste y por qué, y el backlog actualizado para la próxima tanda. Si detectas una colisión (lock ajeno, conflicto git): PARA, anota en TABLERO y avisa. Accesibilidad AA, multidispositivo (Ordenador, Tablet y Móvil) y lenguaje comprensible para cualquier persona son requisitos de CADA iteración, no del final.
