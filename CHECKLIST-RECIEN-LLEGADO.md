# CHECKLIST-RECIEN-LLEGADO.md — la prueba de los cinco minutos

> Artefacto permanente del eje 4. Alguien que entra por primera vez, **sin que nadie le
> explique nada**, tiene que poder responder cinco preguntas en ≤ 5 minutos.
> Se revisa **entero una vez por tanda**, sobre **producción**, no sobre el código.

Última pasada: **2026-08-01** · sobre `https://migueldadd4u.github.io/madclon-front-office/`
· ES y EN · 320 / 390 / 834 / 1440 px · barrido con Playwright + axe.

## Las cinco preguntas

1. **¿Qué es esto que estoy viendo?**
2. **¿De quién es y quién lo hace?**
3. **¿Qué puedo hacer aquí y qué pasa si lo pulso?**
4. **¿De dónde salen estas cifras y de cuándo son?**
5. **¿En qué parte estoy y cómo vuelvo atrás?**

## Veredicto por página

| Página | 1 · qué es | 2 · de quién | 3 · qué puedo hacer | 4 · procedencia y fecha | 5 · dónde estoy |
|---|---|---|---|---|---|
| Panel (portada) | ✅ «La sala de control del Clon de MAD» + las {n} ideas | ✅ nombre completo en la primera frase | ✅ 13 controles, todos con nombre accesible | ✅ «datos generados el …» + franja si el dato pasa de 48 h | ✅ menú con `aria-current` |
| La flota | ✅ título y entradilla derivados de los datos | ✅ «El Clon de MAD…» | ✅ píldora «ver qué hay debajo →» en cada tarjeta | ✅ «trabajo 30 d» + fecha en el pie | ✅ menú + migas al bajar a la capa 2 |
| Salud | ✅ «Salud del sistema» | ✅ pie de marca | ⚠️ página de solo lectura: no hay nada que pulsar (correcto, pero no lo dice) | ✅ «última señal hace X» por integración | ✅ menú con `aria-current` |
| Tokens | ✅ «¿Cuánto trabaja y quién lo hace?» | ✅ pie de marca | ⚠️ solo lectura | ✅ ventana de 30 d + medido/estimado por fuente | ✅ menú con `aria-current` |
| Eficiencia | ✅ «¿Está mejorando el clon?» | ✅ pie de marca | ⚠️ solo lectura | ✅ línea base con su fecha; si falta, **lo dice** en vez de dejar un guion | ✅ menú con `aria-current` |
| Actividad | ✅ «¿Qué espera de MAD ahora mismo?» | ✅ MAD en el título | ⚠️ solo lectura | ✅ **arreglado hoy**: «medido el … · se regenera solo cada noche» | ✅ menú con `aria-current` |
| Historia | ✅ «La historia del clon» | ✅ pie de marca | ⚠️ solo lectura | ✅ cada hito con su fecha | ✅ menú con `aria-current` |
| Preguntas | ✅ «Preguntas que la gente hace» | ✅ nombre completo en la primera respuesta | ✅ 8 acordeones, el primero abierto | ✅ cifras vivas de los JSON; sin datos, dice dónde mirar | ✅ menú con `aria-current` |

**Capa 2 (anatomía de un clon)** — se evalúa aparte porque es la única capa que se abre sobre otra:
1 ✅ «Un clon es una misión escrita…» abre el panel · 2 ✅ avatar, nombre y chip «capa 2» *sticky* ·
3 ✅ «Clon anterior / siguiente» y flechas ← → · 4 ✅ cada sección con su procedencia ·
5 ✅ migas «← Flota · capa 1 › X · capa 2», Esc, ✕ y el gesto de atrás.

## Lo que esta pasada encontró (y se arregló el mismo día)

- **Actividad no decía de cuándo eran sus cifras.** Ahora lleva su fecha de medición.
- **Dos tarjetas de Actividad eran un guion mudo** («—»). Un hueco no explica nada: ahora dicen
  «sin dato · el refresco de esta noche no publicó esta cifra; vuelve mañana y estará».
- **Eficiencia escribía «Desde el — hay una línea base congelada»** cuando el dato de la fecha no
  venía: una frase rota. Ahora tiene su variante honesta, que dice que la fecha falta.
- **El menú no decía en qué página estabas** para un lector de pantalla: solo cambiaba de color.
  Ahora el ítem activo lleva `aria-current="page"`.

## Lo que queda abierto (no es fallo, es honestidad)

- Cinco de las ocho páginas son de **solo lectura** y no lo advierten. No engaña a nadie, pero un
  recién llegado puede quedarse esperando a que algo pase. Candidato a la próxima tanda: una línea
  discreta del tipo «esta página solo muestra; lo que se puede pulsar está en la Flota».
- La pregunta 4 se cumple **en la página**, pero no siempre **junto a cada cifra**: hay cifras cuya
  fecha vive en la cabecera o en el pie, no en su propio `title`.
