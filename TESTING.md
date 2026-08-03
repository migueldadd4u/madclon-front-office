# Front Office · pruebas de contención pública

Campaña: `Arquitectura del Clon mejorada para crecer y escalar sano`  
Fecha: 2026-08-03 · zona horaria Europe/Madrid  
Contrato: el escaparate es estático y de solo lectura. Mientras no exista una proyección pública aprobada, únicamente admite cinco documentos canónicos `madclon.public-containment.v1` en estado `withheld`.

## Resultado ejecutivo

- **Copia segura:** PASA. Build con `BASEPATH=/madclon-front-office`, gate completo **15 OK · 0 DEUDA · 0 FALLO**, axe A/AA/2.1 AA **0 violaciones**, cero consola, cero respuestas inesperadas, cero origen externo y cero métodos distintos de GET/HEAD.
- **Repositorio real:** BLOQUEADO de forma intencional. Las pruebas unitarias son **15/15**, TypeScript y lint pasan, y el inventario de activos da 0 hallazgos; los cinco JSON reales producen exactamente **21 hallazgos** del contrato semántico.
- **Producción:** NO-GO. El workflow automático está desactivado y no se verificó ni modificó la URL real porque la puerta de producción exige primero sanear la fuente roja con autorización de MAD.

## Matriz función a función

| Hora CEST | Función | Panel / entorno | Resultado | Evidencia | Commit | Riesgo / decisión pendiente |
|---|---|---|---|---|---|---|
| 01:51–02:07 | Build estático reproducible | Público · copia segura | PASA | Next exporta 15 páginas; postbuild `PUBLIC SAFETY OK`; 0 errores y 0 warnings con la subruta real. | `4608674` | Ninguno en la copia. |
| 01:42–02:07 | Lectura mínima / caso feliz retenido | Público · copia segura | PASA | Cinco JSON exactos; estado retenido visible en ES y EN y `html lang` correcto. | `4608674` | El caso útil con métricas queda fuera hasta aprobar un esquema público. |
| 01:42–02:16 | Vacío, incompleto, campo extra, corrupto y clave duplicada | Público · copia segura | PASA | Todos fallan cerrados; no hay eco de canarios, nombre de fichero, excepción ni comando. | `4608674` | Ninguno. |
| 02:16 | Permiso insuficiente, 503 y fuente colgada | Público · copia segura | PASA | 403, 503 y timeout acotado terminan en el mismo error neutro; gate rápido 15/15 con 7 fallos de fuente cerrados. | `31ba6db` | Ninguno. |
| 01:42–02:07 | Solo lectura / permisos | Público · copia segura | PASA | 0 POST/PUT/PATCH/DELETE, 0 formularios mutantes, 0 API/Server Actions y 0 solicitudes externas en source, artefacto y navegador. | `4608674` | Ninguno. |
| 01:42–02:07 | Recarga, navegación y atrás | Público · copia segura | PASA | Ocho rutas, enlaces internos 200, atrás conserva la ruta y no abre capas privadas. | `4608674` | Ninguno. |
| 01:42–02:07 | Móvil, tableta y escritorio | Público · copia segura | PASA | 320/375/390/834/1440 sin overflow; objetivos táctiles ≥44 px a 375. | `4608674` | Ninguno. |
| 01:42–02:07 | Teclado, foco y accesibilidad | Público · copia segura | PASA | Tab llega a un control con foco visible; sin diálogos privados; axe sobre 8 rutas × 375/390/834/1440 × ES/EN × normal/alto contraste: 0 violaciones. | `4608674` | Ninguno. |
| 01:42–02:07 | Reduced motion | Público · copia segura | PASA | Preferencia aplicada a 375; 0 animaciones y 0 vídeos activos; 0 errores/red externa. | `4608674` | Ninguno. |
| 01:42–02:07 | Privacidad del artefacto | Público · copia segura | PASA | 109 valores sensibles comparados contra 127 ficheros: 0 coincidencias tras excluir únicamente valores genéricos; 0 claves privadas, rutas locales o emails. | `4608674` | El historial remoto anterior no se saneó. |
| 01:42–02:07 | Activos binarios | Público · copia segura | PASA | Retirada la OG con métricas, hero y vídeo no usados; solo logos de marca exactos. Añadir un raster aunque lleve hash válido bloquea el gate. | `4608674` | Un activo nuevo requiere cambiar la allowlist y revisión semántica. |
| 02:08–02:12 | Lint sobre repo real | Público · real local | PASA | `npm run lint` ya ignora `out/`; TypeScript 0 errores. | `2da215f` | Ninguno. |
| 02:12–02:14 | Manifiesto PWA | Público · real local | PASA | Copy neutral de vista protegida; tamaño/hash repinneados; auditoría de activos 0 hallazgos. | `12f47ee` | Ninguno. |
| 02:09–02:14 | Datos reales vigentes | Público · real local | FALLA BLOQUEANTE | `PUBLIC SAFETY BLOQUEADO · source · 21 hallazgos`, todos concentrados en `manifest/overview/clones/tokens/serie`. | `4608674` | MAD debe autorizar sustituirlos y adaptar el exportador; el job nocturno no se toca con esa autorización. |
| 02:09–02:16 | HTTPS real y despliegue | Público · producción | PENDIENTE | No ejecutado: la propia puerta de producción está roja. Workflow reducido a `workflow_dispatch`. | `4608674` | Autoridad de zona roja + gate completo verde sobre el árbol real. |

## Bugs y regresiones

| Bug | Causa | Arreglo | Regresión / gate | Commit |
|---|---|---|---|---|
| Datos internos dibujados dentro de `og-madclon.png` | El hash aprobaba integridad, no significado visual. | Se retiraron OG y medios no usados, sus referencias y el copy de métricas; inventario de activos exacto. | Un raster añadido con hash correcto emite `PUBLIC_ASSET_MANIFEST_INVALID`; build/postbuild y gate 15/15. | `4608674` |
| El gate final podía reutilizar un `out` viejo | `--saltar-build` solo comprobaba que existiera `index.html`. | Esa opción solo vale en modo rápido y además audita el artefacto; el gate completo la marca FALLO. | Gate final ejecutado sin opciones y con build nuevo: 15/15. | `4608674` |
| CSS fuera del escáner de privacidad | Se había excluido todo CSS para tolerar dos clases `ri-dossier-*`. | Solo se eliminan esos dos selectores antes de examinar el resto del CSS. | `content:"fichas_curadas"` bloquea el postbuild. | `4608674` |
| Axe no certificaba AA completo | Se filtraban impactos `moderate/minor`. | Se registran todas las violaciones de los tags WCAG ejecutados. | Matriz completa: 0 violaciones. | `4608674` |
| Ensayo de manifest retenido daba falsos rojos | La intercepción omitía el salto canónico y el locator aceptaba el skeleton inicial. | Respuesta canónica con `\n` y espera del texto final ES/EN. | Estado antiguo a 72 h y retained ES/EN pasan. | `4608674` |
| `npm run lint` examinaba el build minificado | `out/` no figuraba en `ignorePatterns`. | Exclusión explícita de `out/**`. | Lint real exit 0 con el artefacto heredado presente. | `2da215f` |
| El manifiesto PWA prometía métricas retenidas | Copy histórico incoherente con el estado seguro. | Nombre/descripción neutrales y hash actualizado. | Inventario de activos 0 hallazgos; 15/15 unitarias. | `12f47ee` |
| No había caso literal de permiso denegado | El gate cubría 503 y timeout, pero no 403. | Caso 403 con canario y respuesta neutra. | Gate rápido 15/15; 7 fallos cerrados. | `31ba6db` |

## Límites conocidos

1. Los cinco JSON y `exporter/export_panel.py` son zona roja y permanecen intactos.
2. No se ha eliminado ni reescrito historial remoto, CDN, cachés ya instaladas ni releases anteriores.
3. No se ha ejecutado la URL HTTPS real porque la fuente real sigue bloqueada.
4. No se ha tocado cron, LaunchAgent, Funnel, integración o automatización.

