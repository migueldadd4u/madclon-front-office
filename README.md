# MAD Clon — Front Office

**El cuadro de mando público del Clon de MAD, con el estilo visual de GestDocAI.**

El Clon de MAD vive en un vault privado de Obsidian (`MAD-brain/`) lleno de paneles en
Markdown que solo entiende quien conoce el sistema. Este proyecto es su **front office**:
una web que coge los mismos números y los presenta de forma visual y entendible para
cualquiera — sin necesidad de saber qué es un Second Brain — y **coherente con la imagen
corporativa de los demás servicios** (GestDocAI usa este mismo tema Materialize).

## Stack

| Capa | Elección |
|---|---|
| Framework | **Next.js 16 + React 19** (App Router, export estático) |
| Tema | **Materialize MUI v13.11.1** (MUI 7 + Tailwind 4) — el tema de GestDocAI |
| Iconos | **Iconify bundle** (Remix Icon, generado con `build:icons`) |
| Paquetes | **Yarn** (en este equipo se invoca como `npx yarn@1.22.22`) |
| Gráficas | recharts |
| Despliegue | GitHub Pages (`output: 'export'` → `web/out`) |

## Qué muestra

| Página | Contenido | Fuente en el vault |
|---|---|---|
| `/` Panel | Bienvenida, cifras de cabecera, «qué es» en 4 ideas | todos |
| `/flota` | Los 7 clones, oficio, canales y consumo | `cuadros-de-mando/` + `subclones/` |
| `/salud` | Integraciones vigiladas, gateways vivos, crons | `SISTEMA-COMPLETO.md` + `PANEL-CLON.md` |
| `/tokens` | Contador medido/estimado, cobertura, por clon y modelo | `PANEL-TOKENS.md` |
| `/eficiencia` | 13 KPIs contra la línea base + intervenciones | `PANEL-TOKENS.md` + `Monitorizacion/tokens/` |
| `/actividad` | GTD (solo conteos), cola de automejora, fichas de personas | `PANEL-CLON.md` |

Todo es **responsive**: el panel se administra igual desde un portátil que desde un móvil
(menú lateral plegable tipo drawer, tarjetas apiladas).

## Arquitectura

```
MAD-brain/  (vault privado, SOLO LECTURA)
   │  exporter/export_panel.py
   ▼
web/public/data/*.json   ← datos agregados, commiteados, público-safe
   │  Next.js (React) + Materialize MUI + recharts
   ▼
web/out/  →  GitHub Pages  (Actions: .github/workflows/deploy.yml)
```

- **`exporter/export_panel.py`** — lee los paneles vivos del vault y genera 5 JSON
  (`manifest`, `overview`, `clones`, `tokens`, `serie`). Incluye una **auditoría de
  privacidad bloqueante**: si la salida contiene emails, teléfonos, rutas locales o
  credenciales, la exportación falla y no escribe nada.
- **`web/`** — starter-kit TypeScript del tema Materialize (Next.js), adaptado:
  `serverHelpers` sin cookies (export estático), menú y marca MAD Clon, 6 páginas.

## Regla de privacidad (innegociable)

Solo se exportan **métricas agregadas de sistema**: tokens, conteos, estados, nombres de
crons e integraciones. **Nunca** textos de esperas, correos, decisiones, personas,
rutas del disco ni secretos. El exportador se autobloquea si detecta un patrón sensible.

## Uso diario

```bash
make install   # primera vez (yarn install + bundle de iconos)
make data      # regenera los JSON desde el vault (solo lectura)
make dev       # desarrollo local (next dev)
make build     # datos frescos + export estático en web/out
```

## Despliegue en GitHub Pages

Este directorio es su propio repo git, independiente del vault:

```bash
cd front-office
git remote add origin git@github.com:<usuario>/madclon-front-office.git
git push -u origin main
```

Luego, en GitHub: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
El workflow compila con `BASEPATH=/<nombre-del-repo>` y publica `web/out`.
La web quedará en `https://<usuario>.github.io/<nombre-del-repo>/`.

> ⚠️ **Licencia**: el tema Materialize es de pago (Envato/Pixinvent). Publicar su código
> fuente en un repo **público** incumple la licencia — usa un repo **privado**
> (GitHub Pages funciona en repos privados con plan Pro/Team) o confirma la licencia
> antes de hacerlo público.

Para refrescar los datos: `make data`, commit de los JSON y push.
