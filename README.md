# MAD Clon — Front Office

**Escaparate público estático del Clon de MAD, en producción con degradación elegante.**

> **Estado (2026-08-03):** GO de producción por decisión de MAD. La superficie
> aprobada (ocho rutas con datos reales saneados) vuelve a estar en el aire y,
> ante cualquier documento que falte o llegue roto, la sección afectada confiesa
> «en revisión» en lugar de tumbar la página: **mejor incompleto que un error**.
> La frontera de privacidad la vigila el escáner de contenido sensible del gate
> (emails, teléfonos, rutas, secretos), que sigue bloqueando build y despliegue.

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

| Página | Contenido | Fuente privada, nunca accesible desde el navegador |
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
   │  exporter/export_panel.py  ← refresco nocturno automático
   ▼
web/public/data/*.json   ← cinco documentos saneados; el gate los audita en cada build
   │  Next.js (React) + Materialize MUI + recharts
   ▼
web/out/  →  GitHub Pages  (workflow exclusivamente manual)
```

- **`exporter/export_panel.py`** — genera los cinco JSON cada noche desde los paneles
  privados. El gate semántico decide si el lote es publicable.
- **`web/`** — starter-kit TypeScript del tema Materialize (Next.js), adaptado:
  export estático, menú y marca MAD Clon. La capa de datos es **fail-soft**: cada
  documento se valida por separado y, si uno falta o llega roto, solo su sección
  confiesa «en revisión»; el resto de la página se pinta con normalidad.

## Regla de privacidad (innegociable)

El gate acepta un **contrato dual**: la proyección canónica
`madclon.public-containment.v1` en estado `withheld` (contención total, por si algún
día hay que cerrar el grifo) o los cinco documentos legados saneados de la superficie
aprobada. En ambos casos, un **escáner de contenido sensible bloquea el build** ante
cualquier email, teléfono, ruta de disco o secreto que se cuele a los datos o a los
activos. **Nunca** personas identificables, nombres internos privados, credenciales o
telemetría privada. Los activos públicos van pineados por SHA-256 y el service worker
pasa una auditoría propia (solo GET, mismo origen, caché con caducidad y purga).

## Uso diario

```bash
cd web
npm run test:public-safety   # regresiones herméticas
npm run check:public-safety  # debe quedar verde antes de construir
npm run gate                 # build nuevo + matriz completa local
```

`make data` refresca los cinco JSON desde el vault; el gate decide si el lote sale
o se queda en local.

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
