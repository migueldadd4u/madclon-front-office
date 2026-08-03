# MAD Clon — Front Office

**Escaparate público estático del Clon de MAD, actualmente retenido por seguridad.**

> **NO-GO de producción (2026-08-03):** las ocho rutas solo muestran un estado
> protegido y de solo lectura. Los cinco JSON reales no cumplen todavía el contrato
> público mínimo y el gate bloquea build y despliegue con 21 hallazgos. No ejecutes
> el exportador ni el workflow hasta la autorización y saneado descritos en
> `TESTING.md`.

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

## Qué mostrará tras aprobar una proyección

La tabla siguiente conserva la intención histórica de navegación; **ninguna de esas
métricas se muestra en el estado retenido actual**.

| Página | Contenido previsto | Fuente privada, nunca accesible desde el navegador |
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
   │  exporter/export_panel.py  ← ZONA ROJA, pendiente de adaptación
   ▼
web/public/data/*.json   ← cinco documentos heredados; hoy BLOQUEADOS por el gate
   │  Next.js (React) + Materialize MUI + recharts
   ▼
web/out/  →  GitHub Pages  (workflow exclusivamente manual)
```

- **`exporter/export_panel.py`** — fuente heredada en zona roja. Genera los cinco JSON,
  pero su contrato actual no basta: el gate semántico los rechaza. No se modifica ni
  ejecuta hasta autorización de MAD.
- **`web/`** — starter-kit TypeScript del tema Materialize (Next.js), adaptado:
  export estático, menú y marca MAD Clon. El runtime actual solo acepta la proyección
  canónica `madclon.public-containment.v1` en estado `withheld`.

## Regla de privacidad (innegociable)

El navegador solo acepta una allowlist exacta y versionada. Mientras no se apruebe otro
esquema, los documentos de datos no contienen métricas: únicamente `schema`, `status:
"withheld"`, una fecha UTC de comprobación y una serie vacía. **Nunca** personas ni sus
recuentos, GTD, encargos, nombres internos, rutas, texto libre, credenciales o telemetría
privada. El build falla ante cualquier campo o activo adicional.

## Uso diario

```bash
cd web
npm run test:public-safety   # regresiones herméticas
npm run check:public-safety  # debe quedar verde antes de construir
npm run gate                 # build nuevo + matriz completa local
```

`make data` y el exportador permanecen fuera del flujo autorizado actual.

## Despliegue en GitHub Pages

Este directorio es su propio repo git, independiente del vault:

```bash
cd front-office
git remote add origin git@github.com:<usuario>/madclon-front-office.git
git push -u origin main
```

El workflow solo admite `workflow_dispatch`. No debe ejecutarse mientras `TESTING.md`
mantenga la fila de datos reales en **FALLA BLOQUEANTE**. Cuando el contrato sea verde,
compilará con `BASEPATH=/<nombre-del-repo>` y publicará `web/out`.

> ⚠️ **Licencia**: el tema Materialize es de pago (Envato/Pixinvent). Publicar su código
> fuente en un repo **público** incumple la licencia — usa un repo **privado**
> (GitHub Pages funciona en repos privados con plan Pro/Team) o confirma la licencia
> antes de hacerlo público.

No hay refresco autorizado hasta adaptar el exportador y sustituir los cinco JSON con
aprobación expresa de MAD; el job nocturno queda fuera de este cambio.
