---
tipo: especificacion
estado: activo
fecha_creacion: 2026-10-20
agente: cdx-frontales-publico-20261020
---

# Contraste propio previo

- Todos los cambios trazan al diseño ya autorizado; no se añade función opcional ni se modifica el significado de los datos.
- El build y los tests actúan solo sobre worktree/evidencia propios. No se llama al refresco ni a exportadores vivos.
- Las pruebas de caché y errores usan el origen local y contextos desechables del navegador. No se navega producción.
- Las capacidades de negocio y límites permanecen probados por las guardias existentes; no se extrapola a ahorro, precisión o resultados comerciales.
- El gate completo no demuestra latencia de producción ni aceptación humana. Esas limitaciones se declararán en la entrega sin bloquear el delta de código.
- SDD breve leído por el propio implementador antes de aplicar código. Sin invocación de jueces.
