---
tipo: evidencia
titulo: Verificacion aislada de la bienvenida publica
fecha_creacion: 2026-09-13
estado: verificado_en_worktree
---

# P-01 · Evidencia y límites

Base `d59f035a6f108cb8baa72225734996df17dd88bd`. Rama `cdx/mobbin-bienvenida-01a09b88`. La portada presenta identidad compacta, utilidad, «Explorar los retos» y acceso a «Cómo funciona». El estado conserva su resumen visible y despliega el detalle. Identidad, atribución IA, frescura y capacidades anteriores se preservan.

## Pruebas ejecutadas

- `GATE_PORT=9310 npm run gate`, desde `web`, segunda ronda: exit 0, **17 OK · 0 DEUDA · 0 FALLO**. Registro local: `scratch/frontales-mobbin-01a09b88/publico-gate-r2.log` en el workspace padre.
- Build sin errores ni avisos; TypeScript limpio. ESLint 0/28 y Stylelint 17/17 según presupuestos existentes del gate; no se eliminaron verificaciones ni se aumentaron umbrales.
- Axe: cero violaciones en nueve páginas, capa secundaria y 404, cuatro tamaños, español e inglés, modo normal y alto contraste. Sin errores JS, peticiones de escritura ni orígenes externos durante el barrido.
- Sin desbordes a 320/375/390/834/1440 px; objetivos táctiles de al menos 44 px. Navegación por teclado, foco, historial, enlaces, frescura, movimiento reducido y siete casos de degradación controlada correctos.
- Nueva guardia 16: CTA íntegramente visible a 390×844 y 1440×900 en ambos idiomas; Tab con foco visible; enlace real a retos; foco de «Cómo funciona» bajo la cabecera; detalle operable con Enter.
- Inspección manual en navegador a 390×844 y 1440×900. Critic independiente `revision_publica`: revisión visual propia en móvil y revisión del código, sin hallazgos bloqueantes en segunda vuelta.

## Hallazgos corregidos

La primera ronda del gate detectó contraste 4,07:1 en los botones añadidos. Se corrigieron los colores y se repitió el gate completo. La revisión independiente pidió comprobar los límites completos del botón y el foco bajo la cabecera; esas aserciones quedan en la guardia permanente.

## Alcance de la aceptación

Verificado en worktree aislado; no integrado en el checkout canónico ni desplegado. No acredita paridad con los productos de referencia ni completa el rediseño general. El snapshot local es anterior a la sesión; su aviso de antigüedad se conserva y la prueba de frescura pasa. El siguiente paso es revisión de uso, integración coordinada y repetición del gate en el objetivo canónico antes del PASS global.

Reversión: revertir únicamente el commit de esta pieza en la rama de integración. No hay migración de datos, dependencia nueva ni cambio de permisos.
