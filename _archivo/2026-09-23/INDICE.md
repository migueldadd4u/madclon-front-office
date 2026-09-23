---
tipo: indice
fecha_creacion: 2026-09-23
titulo: Archivo de la raíz de front-office (limpieza del 23/09/2026)
---

# Archivo de la raíz de front-office · 23/09/2026

MAD pidió el 23/09 dejar en la raíz solo lo vigente. Estos 4 prompts salen de la raíz con `git mv`
(el historial se conserva con `git log --follow`). Nada se ha borrado.

**Cómo volver (cualquiera):** desde la raíz del repo, `git mv _archivo/2026-09-23/<fichero> <fichero>` y commit.
Para deshacer el lote entero: `git revert <commit del lote>`.

| fichero | qué era | por qué sale (evidencia) | cómo volver |
|---|---|---|---|
| `PROMPT-GOAL-WOW.md` | `/goal` del bucle de automejora «WOW» del escaparate, v1 (primera tanda; v2 parte de 10 mejoras ya desplegadas) | Único commit 28/07; superado por v2-v4 y por `PROMPT-GOAL-HUMANO-v5.md`, que lo cita como historial (su línea 16 apunta ya aquí) | `git mv _archivo/2026-09-23/PROMPT-GOAL-WOW.md PROMPT-GOAL-WOW.md` |
| `PROMPT-GOAL-WOW-v2.md` | Bucle «WOW», v2 (desde la iteración 11) | Único commit 29/07; superado por v3 | `git mv _archivo/2026-09-23/PROMPT-GOAL-WOW-v2.md PROMPT-GOAL-WOW-v2.md` |
| `PROMPT-GOAL-WOW-v3.md` | Bucle «WOW», v3 (desde la iteración 21) | Único commit 29/07; superado por v4 | `git mv _archivo/2026-09-23/PROMPT-GOAL-WOW-v3.md PROMPT-GOAL-WOW-v3.md` |
| `PROMPT-GOAL-WOW-v4.md` | Bucle «WOW», v4 (desde la iteración 25) | Único commit 29/07; superado por `PROMPT-GOAL-HUMANO-v5.md`; sus mejoras constan en `MEJORAS.md` | `git mv _archivo/2026-09-23/PROMPT-GOAL-WOW-v4.md PROMPT-GOAL-WOW-v4.md` |

## Se quedan en la raíz (y por qué)

- `Makefile`, `MEJORAS.md`, `REGLAS-COPY.md`: los usa o los cita el código y el refresco nocturno.
- `PROMPT-GOAL-HUMANO-v5.md`: prompt vigente.
