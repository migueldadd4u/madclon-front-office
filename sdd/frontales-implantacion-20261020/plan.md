---
tipo: especificacion
estado: activo
fecha_creacion: 2026-10-20
agente: cdx-frontales-publico-20261020
---

# Ejecución

1. Congelar base, manifiesto de datos y delta de 18 archivos.
2. Aplicar a la candidata el diff exacto base→P03 de web/src y web/scripts.
3. Instalar dependencias propias con pnpm y su lockfile versionado, ejecutar iconos y gate con build nuevo sobre datos 20Oct.
4. Puerto 9362 exclusivamente tras censo y claim; el gate posee su servidor y browser. Supervisor independiente registra y cierra todos los procesos propios en finally.
5. Ejecutar gate completo existente con datos actuales: seguridad fuente/out, contrato, build, tipos/linters relativos a baseline, navegación, axe, seis perfiles focales P02/P03, negativos y SW. Capturas y evidencia en carpeta propia.
6. Comparar datos/config/deps/SW/@core antes/después; registrar limitaciones reales de rendimiento y ensayos humanos.
7. Commit limitado, parche frente a dabd881 y handoff a root, sin tocar canónico ni previews.
