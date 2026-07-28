# MEJORAS.md — Bitácora wow del Front Office

> Una línea por mejora desplegada: qué se añadió y por qué alucina.

## 2026-07-28

- **Contadores animados (count-up)** — Las cifras de cabecera (304 M tokens, clones, gateways, rutinas y los tres totales de la página Tokens) suben desde 0 hasta su valor real al cargar, con ease-out suave. El número más grande del panel crece ante tus ojos: convierte una cifra estática en un pequeño momento «wow». Accesible: respeta `prefers-reduced-motion` (salta al valor final) y expone `aria-label` con la cifra completa para lectores de pantalla. Commit `6c5b328`.
- **Latido en vivo** — Punto verde pulsante junto al «Todo OK» con la «última señal de vida hace X», recalculada cada 30 s sin recargar. La señal es lo más fresco entre la exportación nocturna y la última rutina registrada, así nunca miente. La portada deja de ser una foto: respira. El pulso se apaga con `prefers-reduced-motion` y el texto va en `role=status` para lectores de pantalla. Commit `278ce7b`.
