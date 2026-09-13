---
tipo: evidencia
titulo: Orientacion entre secciones publicas
fecha_creacion: 2026-09-13
estado: verificado_en_worktree
---

# P-03 · Orientación entre secciones

Base `6dc9f1a`. En navegador, `/salud/` presentaba cero h1, el título genérico del sitio y ningún enlace con `aria-current=page`. El menú comparaba literalmente una ruta con barra final contra un destino sin ella.

Ocho secciones reciben un h1 conservando el tamaño y estilo previos. El título de pestaña combina nombre de sección e identidad del sitio, según idioma y ruta. El menú normaliza la barra final y recupera tanto su selección visual existente como la señal para lectores de pantalla.

## Evidencia

- `GATE_PORT=9310 npm run gate`: exit 0, **17 OK · 0 DEUDA · 0 FALLO**. Log del workspace: `scratch/frontales-mobbin-01a09b88/publico-gate-p03.log`. Incluye regresión completa de P-01.
- Nueva exigencia permanente en el barrido del gate: un único h1 no vacío, título por sección e idioma, exactamente un enlace actual con destino correcto y clase de selección. Matriz de nueve páginas, cuatro tamaños de accesibilidad, ES/EN y contraste normal/alto; 404 mantiene su contrato. Cero violaciones de accesibilidad y cero errores de consola/red. Sin desbordes entre 320 y 1440 px.
- ESLint explícito en todos los TSX modificados: exit 0. `git diff --check`: limpio. Presupuestos existentes de lint intactos.
- Critic independiente `revision_publica`: sin regresión de código demostrada; pidió comprobar navegación interna y cambio de idioma sobre página montada.
- Recorrido manual CUA: recargar Salud → h1 «Salud del sistema», título «Salud — MAD Clon — el Clon de Miguel Ángel Domínguez», único enlace actual Salud. Pulsar Actividad → h1 «¿Qué espera de MAD ahora mismo?», título de Actividad y único enlace actual Actividad. Pulsar EN sin recargar → `lang=en`, título «Activity — MAD Clon — Miguel Ángel Domínguez's Clone», h1 «What is waiting for MAD right now?» y enlace actual Activity. Selección visual comprobada en captura del navegador. Volver a ES y Panel conserva el contrato de bienvenida.

## Límites e integración

Verificación en worktree, sin despliegue ni PASS canónico. Sin páginas nuevas, contenido editorial cambiado ni dependencias añadidas. Reversión por commit separado de P-01. Antes de integrar: comprobar cambios concurrentes, adquirir claim y repetir gate en el checkout canónico. La orientación arreglada no demuestra paridad general con los referentes citados por MAD.
