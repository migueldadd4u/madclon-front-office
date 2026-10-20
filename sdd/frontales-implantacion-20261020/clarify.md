---
tipo: especificacion
estado: activo
fecha_creacion: 2026-10-20
agente: cdx-frontales-publico-20261020
---

# Decisiones resueltas

- El canónico local main 6d8256f está detrás del remoto en datos. Se parte del remoto verificado dabd881; sus fuentes UI/scripts/deps no han cambiado respecto de la base de P03.
- El delta incluye historia-hitos.ts generado; la fuente exporter/historia.md ya coincide en remoto y P03. El build debe regenerar lo mismo.
- No hay contacto comercial acreditado: conservar CTA a Retos y anclas; no inventar formulario ni destino.
- La fecha 18Oct de la demostración es la fecha editorial de su mensaje inventado, no la fecha de los datos reales.
- Las notas y ensayos históricos de P03 no se convierten en resultados del nuevo build. Se ejecutan de nuevo las pruebas apropiadas.
- El gate P03 acepta listener integrado autenticado del gate y por ello puede usar puerto 9362 sin rebajar la guardia de destino.

- Corrección antes de instalar: el público no tiene package-lock.json; npm ci falló sin crear node_modules. Se preserva ese rojo. Usa pnpm-lock.yaml version9 congelado mediante pnpm10.33.0; ningún lockfile/dependencia cambia. Iconos se ejecutan explícitamente con node --import tsx para evitar IPC auxiliar.

- pnpm congelado detectó que su lock heredado no incluye recharts ya declarado. No se actualizó ni se usó --no-frozen-lockfile. Yarn.lock sí contiene recharts; es el gestor congelado usado por P03. Se utiliza Yarn1.22.22 copiado físicamente a evidencia propia, sin rc global y con caché temporal propia. Dos fallos de instalación previos preservados, sin producto/build/browser ejecutados.
