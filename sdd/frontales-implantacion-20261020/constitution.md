---
tipo: especificacion
estado: activo
fecha_creacion: 2026-10-20
agente: cdx-frontales-publico-20261020
---

# Reglas del corte público

- MAD autoriza implementar las mejoras de ambos frontales. Se traslada el público aprobado, conservando sus cuatro bloques finales reales.
- Base actual verificada por fetch: origin/main dabd881f041babcd77d58fdbd79878b4d05fb465. No cambiar el checkout canónico, ni datos JSON, exportadores, SW, dependencias, configuración, @core o servicios.
- Fuente de la mejora: candidato f1911dc820c0a242b4c3a03a527f72c6c7adda46. Solo delta web/src y web/scripts, sin datos 18/19Oct.
- Jueces solo por petición expresa de MAD: este corte usa comprobaciones propias, sin jueces ni notas.
- No publicar, push ni merge; entregar commits y parche revisables a root.
- Instalación propia congelada con pnpm install --frozen-lockfile --ignore-scripts; nunca node_modules compartido. Recursos propios con identidad y limpieza finally.
