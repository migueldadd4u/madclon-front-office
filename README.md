# MAD Clon — Front Office

**El cuadro de mando público del Clon de MAD, explicado para personas.**

El Clon de MAD vive en un vault privado de Obsidian (`MAD-brain/`) lleno de paneles en
Markdown que solo entiende quien conoce el sistema. Este proyecto es su **front office**:
una web estática que coge los mismos números y los presenta de forma visual y entendible
para cualquiera — sin necesidad de saber qué es un Second Brain.

## Qué muestra

| Sección | Contenido | Fuente en el vault |
|---|---|---|
| Hero | Cifras de cabecera (tokens 30 d, clones, gateways, crons) | todos |
| ¿Qué es? | Explicación en 4 ideas para no técnicos | (copy editorial) |
| La flota | Los 7 clones, su oficio, canales y consumo | `cuadros-de-mando/` + `subclones/` |
| Salud | Integraciones vigiladas, gateways vivos, crons | `SISTEMA-COMPLETO.md` + `PANEL-CLON.md` |
| Tokens | Contador medido/estimado, cobertura, por clon y modelo | `PANEL-TOKENS.md` |
| Eficiencia | 13 KPIs contra la línea base + intervenciones | `PANEL-TOKENS.md` + `Monitorizacion/tokens/` |
| Actividad | GTD (solo conteos), cola de automejora, fichas de personas | `PANEL-CLON.md` |

## Arquitectura

```
MAD-brain/  (vault privado, SOLO LECTURA)
   │  exporter/export_panel.py
   ▼
web/public/data/*.json   ← datos agregados, commiteados, público-safe
   │  React + Vite + Tailwind + recharts
   ▼
web/dist/  →  GitHub Pages  (Actions: .github/workflows/deploy.yml)
```

- **`exporter/export_panel.py`** — lee los paneles vivos del vault y genera 5 JSON
  (`manifest`, `overview`, `clones`, `tokens`, `serie`). Incluye una **auditoría de
  privacidad bloqueante**: si la salida contiene emails, teléfonos, rutas locales o
  credenciales, la exportación falla y no escribe nada.
- **`web/`** — app estática (React + TypeScript + Vite + Tailwind + shadcn/ui + recharts).
  `base: './'`, funciona bajo cualquier nombre de repo en GitHub Pages.

## Regla de privacidad (innegociable)

Solo se exportan **métricas agregadas de sistema**: tokens, conteos, estados, nombres de
crons e integraciones. **Nunca** textos de esperas, correos, decisiones, personas,
rutas del disco ni secretos. El exportador se autobloquea si detecta un patrón sensible.

## Uso diario

```bash
make data    # regenera los JSON desde el vault (solo lectura)
make dev     # desarrollo local
make build   # datos frescos + build de producción en web/dist
```

## Despliegue en GitHub Pages

Este directorio es su propio repo git, independiente del vault:

```bash
cd front-office
git remote add origin git@github.com:<usuario>/madclon-front-office.git
git push -u origin main
```

Luego, en GitHub: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
El workflow `.github/workflows/deploy.yml` compila `web/` y publica `web/dist` en cada push.
La web quedará en `https://<usuario>.github.io/madclon-front-office/`.

Para refrescar los datos: ejecuta `make data`, commitea los JSON y push. (Candidato
natural a un cron del propio clon más adelante.)
