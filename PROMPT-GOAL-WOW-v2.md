# /goal — BUCLE DE AUTOMEJORA «WOW» DEL FRONT OFFICE MAD CLON · v2

> Prompt listo para lanzar en una sesión nueva. Ejecuta el bucle completo, iteración tras iteración, sin pedirme confirmación salvo zona roja. Presupuesto: ~5 horas o 25 iteraciones, lo primero que llegue.
> **Ya se desplegaron 10 mejoras** (listadas abajo): no las repitas; continúa desde la iteración 11.

## Contexto (léelo antes de empezar)

- **Proyecto**: `/Users/madclon/MADClon-Storage/front-office/` — repo git propio, remoto `migueldadd4u/madclon-front-office` (público).
- **Web**: Next.js 16 + React 19 + tema Materialize MUI en `front-office/web/` · export estático a GitHub Pages (push a `main` → se redespliega solo).
- **Producción**: https://migueldadd4u.github.io/madclon-front-office/
- **Datos**: los JSON de `web/public/data/` los regenera un job nocturno — **no los edites a mano**.
- **Bitácora viva**: `front-office/MEJORAS.md` — apéndice obligatorio por iteración (qué se añadió y por qué alucina) con el hash REAL del commit (léelo de `git log`, nunca lo inventes).
- **Coordinación**: lee `MAD-brain/00_SISTEMA/coordinacion/TABLERO.md` al inicio; lock con `MAD-brain/00_SISTEMA/coordinacion/claim.sh acquire front-office kimi` antes de tocar nada y `release` al terminar cada iteración. **El lock caduca a los 30 min: readquiérelo en cada iteración.**
- **Yarn**: se invoca como `npx yarn@1.22.22`.
- **Build local de verificación** (lección aprendida): el basePath de producción NO está por defecto — compila con `BASEPATH=/madclon-front-office npx yarn@1.22.22 build` y sirve `web/out` bajo la subruta (`mkdir -p /tmp/site && ln -sfn .../web/out /tmp/site/madclon-front-office && python3 -m http.server 4173 --directory /tmp/site`).
- **Despliegue** (lección aprendida): tras el workflow verde, **el CDN de Pages tarda ~2 min en propagar** — espera ~75 s antes de verificar producción o obtendrás la versión vieja.
- **Playwright**: disponible en `/tmp/pwshot` (`node <script>`) para capturas de verificación.

## Lo ya desplegado (tandas 1–10, commits entre `6c5b328` y `372b6a5`)

1. Contadores animados (count-up en cifras de Portada y Tokens).
2. Latido en vivo (punto pulsante + «última señal de vida hace X», recalculado cada 30 s).
3. Logo constelación que se dibuja solo en portada (nodos «pop» + trazo).
4. «Un día en la vida del clon» (franja 24 h con rutinas reales + línea «ahora»).
5. Insignias del sistema (6 logros desbloqueados + 4 en camino con progreso, en Historia).
6. Micro-interacciones (elevación al hover + entrada suave entre secciones).
7. Easter egg «consola» (5 clics en el logo → terminal `madclon --pulso`).
8. Comparador antes/después (línea base 26/07 vs hoy, en Eficiencia).
9. Coste traducido a euros (~3 €/M tokens, marcado como estimación; «0 € por uso variable»).
10. Actividad cobra vida (count-up en sus 6 cifras + barras de automejora animadas).

Componentes reutilizables que YA EXISTEN — úsalos en vez de reinventar: `CountUp.tsx`, `Latido.tsx`, `MadClonLogoAnimado.tsx`, `DiaEnLaVida.tsx`, `Insignias.tsx`, `ConsolaClon.tsx`, `AntesDespues.tsx` (en `web/src/components/dashboard/`); clases CSS `fo-card-hover` y `fo-page-in` en `globals.css`.

## EL BUCLE (cada iteración = UNA mejora desplegada)

1. **OBSERVA** — Abre la web en producción con Playwright (escritorio 1440px + móvil 390px, idiomas ES y EN). Lee el TABLERO y el `git log --oneline -5` del repo. Anota 3 candidatos priorizados por impacto *wow* / esfuerzo.
2. **DECIDE** — Elige UNA: la de mayor efecto sorpresa con riesgo bajo. Dila en una frase y ejecútala sin esperar permiso.
3. **CONSTRUYE** — Lock → implementa en `web/`. Reglas de la casa:
   - Estilo Materialize, modo oscuro primero, degradado indigo→teal de marca.
   - **Bilingüe obligatorio**: toda cadena nueva va en ES y EN en `src/lib/i18n.tsx`.
   - **Privacidad sagrada**: solo cifras agregadas que ya existen en los JSON. Nada de nombres, correos, contenido ni datos nuevos del vault.
   - **Accesibilidad AA**: respeta `prefers-reduced-motion` en TODA animación nueva; `aria-label`/roles donde toque; contraste suficiente.
   - **Multidispositivo**: verifica Ordenador (1440), Tablet (~834) y Móvil (390).
   - **Comprensible para cualquiera**: nada de tecnicismos sin explicar; la web la puede leer alguien que no sabe lo que es un clon.
4. **VERIFICA** — build sin errores (`BASEPATH=/madclon-front-office`) + capturas Playwright en local (desktop + móvil, ES + EN) y **0 errores JS**. Si algo falla: arréglalo o revierte; nunca publiques roto.
5. **PUBLICA** — commit granular con prefijo `kimi:` (**nunca `git add -A`**), push a `main`, espera el workflow (`gh run watch --exit-status`) y verifica en producción con captura tras ~75 s (CDN).
6. **REGISTRA** — Apéndice en TABLERO, `release` del lock, y línea en `front-office/MEJORAS.md` con el hash real.
7. **REPETIR** — Vuelve a 1 con la siguiente mejora.

## BACKLOG PARA ESTA TANDA (prioridad sugerida; reordena o inventa mejores)

1. **Pulso con dos voces** — el gráfico de portada muestra también las tareas hechas por día (segunda serie teal), no solo tokens.
2. **Tablet de verdad** — pasada completa a 834 px: revisar que la franja 24 h, insignias y comparador se ven bien y ajustar lo que cojee.
3. **404 con personalidad** — página no-encontrado propia con el logo y un mensaje llano («esto no existe, pero el clon sigue trabajando») + enlace a Panel.
4. **El clon te cuenta su noche** — en portada, una franja «esta noche hice…» derivada de los datos del día (tareas, tokens, mejoras) en lenguaje llano.
5. **Barra de progreso del día** — «hoy lleva X % de un día normal» comparando `hoy` vs media de la serie.
6. **Skeletons con shimmer** — pulir la pantalla de carga con el degradado de marca.
7. **Compartir bonito** — botón «copiar enlace» en el pie + revisar og-image tras las mejoras nuevas.
8. **Lighthouse AA al día** — auditoría de contraste/foco/aria en las piezas nuevas (consola, franja 24 h, insignias) y arreglo de lo que salga.
9. **Modo presentación** — botón que oculta el sidebar y deja la portada a pantalla completa para enseñarla (kiosk).
10. **El clon opina, autor real** — borrador semanal más elaborado que Miguel aprueba antes de publicarse (**requiere OK de Miguel la primera vez**).
11. **Salud con latido** — página Salud: latido también en sus integraciones + count-up en sus cifras.
12. **La flota animada** — barras de «trabajo 30 d» de cada clon creciendo al entrar + count-up en tokens por clon.

## ZONAS ROJAS (pide permiso a Miguel ANTES de tocar)

- Mostrar cualquier dato que no esté ya en los JSON públicos exportados.
- Textos públicos nuevos que hablen de personas, empresas o asuntos concretos.
- El exportador (`exporter/export_panel.py`) y la automatización nocturna.
- Zonas sagradas del workspace (`00_SISTEMA/hermes/**`, tokens, crons) — intocables siempre.

## CRITERIO DE PARADA E INFORME

Tras 25 iteraciones o 5 horas: informe final con lo desplegado (con capturas), lo que descartaste y por qué, y el backlog actualizado para la próxima tanda. Si detectas una colisión (lock ajeno, conflicto git): PARA, anota en TABLERO y avisa. Accesibilidad AA, multidispositivo (Ordenador, Tablet y Móvil) y lenguaje comprensible para cualquier persona son requisitos de CADA iteración, no del final.
