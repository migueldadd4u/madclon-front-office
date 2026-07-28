# /goal — BUCLE DE AUTOMEJORA «WOW» DEL FRONT OFFICE MAD CLON

> Prompt listo para lanzar en una sesión nueva. Ejecuta el bucle completo, iteración tras iteración, sin pedirme confirmación salvo zona roja. Presupuesto: ~2 horas o 5 iteraciones, lo primero que llegue.

## Contexto (léelo antes de empezar)

- **Proyecto**: `/Users/madclon/MADClon-Storage/front-office/` — repo git propio, remoto `migueldadd4u/madclon-front-office` (público).
- **Web**: Next.js 16 + React 19 + tema Materialize MUI en `front-office/web/` · export estático a GitHub Pages (push a `main` → se redespliega solo).
- **Producción**: https://migueldadd4u.github.io/madclon-front-office/
- **Datos**: los JSON de `web/public/data/` los regenera un job nocturno — **no los edites a mano**.
- **Coordinación**: lee `MAD-brain/00_SISTEMA/coordinacion/TABLERO.md` al inicio; lock con `MAD-brain/00_SISTEMA/coordinacion/claim.sh acquire front-office kimi` antes de tocar nada y `release` al terminar cada iteración.
- **Yarn**: en este equipo se invoca como `npx yarn@1.22.22` (build: `cd web && npx yarn@1.22.22 build`).
- **Playwright**: disponible en `/tmp/pwshot` (`node <script>`) para capturas de verificación.

## EL BUCLE (cada iteración = UNA mejora desplegada)

1. **OBSERVA** — Abre la web en producción con Playwright (escritorio 1440px + móvil 390px, idiomas ES y EN). Lee el TABLERO y el `git log --oneline -5` del repo. Anota 3 candidatos de mejora priorizados por impacto *wow* / esfuerzo.
2. **DECIDE** — Elige UNA: la de mayor efecto sorpresa con riesgo bajo. Dila en una frase y ejecútala sin esperar permiso.
3. **CONSTRUYE** — Lock → implementa en `web/`. Reglas de la casa:
   - Estilo Materialize, modo oscuro primero.
   - **Bilingüe obligatorio**: toda cadena nueva va en ES y EN en `src/lib/i18n.tsx`.
   - **Privacidad sagrada**: solo cifras agregadas que ya existen en los JSON. Nada de nombres, correos, contenido ni datos nuevos del vault.
   - Marca: logo MAD Clon constelación (`brand/madclon-favicon.svg`), degradado indigo→teal.
4. **VERIFICA** — `build` sin errores + capturas Playwright en local (desktop + móvil, ES + EN) y **0 errores JS**. Si algo falla: arréglalo o revierte; nunca publiques roto.
5. **PUBLICA** — commit granular con prefijo `kimi:` (**nunca `git add -A`**), push a `main`, espera el workflow (`completed success`) y verifica en producción con captura.
6. **REGISTRA** — Apéndice en TABLERO, `release` del lock, y una línea en `front-office/MEJORAS.md` (bitácora wow: qué se añadió y por qué alucina).
7. **REPETIR** — Vuelve a 1 con la siguiente mejora.

## BACKLOG INICIAL (prioridad sugerida; puedes reordenar o inventar mejores)

1. **Contadores animados** — las cifras de cabecera suben con count-up al cargar (304 M crece ante tus ojos).
2. **Latido en vivo** — punto verde pulsante + «última rutina hace X min» en la cabecera; la web se siente viva.
3. **Logo que cobra vida** — en la portada, los nodos de la M constelación se conectan con una animación sutil al cargar.
4. **«Un día en la vida del clon»** — timeline de 24 h con las rutinas reales en su hora (03:00 autoauditoría, 03:43 exportación…), visual y bilingüe.
5. **Coste traducido a euros** — junto a los tokens, una cifra aproximada en € (marca claramente «estimado»).
6. **Insignias desbloqueadas** — hitos del sistema como logros: «300 M pensados», «100 días de vida», «1.000 mejoras»… con la fecha real en que ocurrieron.
7. **Comparador antes/después** — la línea base de eficiencia contada como «el clon de julio vs el clon de hoy» con animación.
8. **Micro-interacciones** — hovers con elevación, transiciones suaves entre páginas, skeletons pulidos.
9. **El clon opina, autor real** — evolución de la voz propia: borrador semanal más elaborado que Miguel aprueba antes de publicarse (requiere su OK la primera vez).
10. **Easter egg «consola»** — pulsando el logo 5 veces se abre una vista tipo terminal con el pulso del sistema en directo.

## ZONAS ROJAS (pide permiso a Miguel ANTES de tocar)

- Mostrar cualquier dato que no esté ya en los JSON públicos exportados.
- Textos públicos nuevos que hablen de personas, empresas o asuntos concretos.
- El exportador (`exporter/export_panel.py`) y la automatización nocturna.
- Zonas sagradas del workspace (`00_SISTEMA/hermes/**`, tokens, crons) — intocables siempre.

## CRITERIO DE PARADA E INFORME

Tras 5 iteraciones o 2 horas: informe final con lo desplegado (con capturas), lo que descartaste y por qué, y el backlog actualizado para la próxima tanda. Si detectas una colisión (lock ajeno, conflicto git): PARA, anota en TABLERO y avisa.
