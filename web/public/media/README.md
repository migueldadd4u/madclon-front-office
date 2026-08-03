# /media — tubería de vídeo ambiental del front office

Aquí van los clips en loop que dan atmósfera viva a la web (generados con
Seedance, Higgsfield o similar). **La web los recoge sola**: suelta el clip,
pon `"hero": true` en `media/manifest.json`, y entra con un fundido sobre la
aurora de canvas. Sin clip (o con el flag en `false`), la web sigue igual de
bonita con el póster + auroras. No hay que tocar código.

## Convención

| fichero | dónde aparece | formato |
|---|---|---|
| `hero-loop.webm` + `hero-loop.mp4` | fondo de la tarjeta de bienvenida (portada) | VP9/AV1 + H.264 de respaldo |

## Reglas del clip

- **3–6 s en loop perfecto** (el último fotograma casa con el primero).
- **Sin audio** (se sirve `muted`; el peso de la pista sobra).
- **1280×720 o 1600×900**, ≤ **1,5 MB** el webm (GitHub Pages lo agradece).
- Mismo universo visual que el póster `web/public/images/hero-ambiental.png`
  (cielo nocturno, auroras indigo `#7A7FFF` → teal `#06C9A8`, la constelación
  de la M a la derecha). El póster es el fotograma de referencia: úsalo como
  imagen inicial en Seedance para que el fundido sea invisible.
- Nada de texto ni logotipos dentro del clip: el texto lo pone la web.

## Prompt sugerido (Seedance, image-to-video desde el póster)

> Subtle ambient motion of a night sky: soft aurora clouds in indigo, blue and
> teal drifting very slowly, tiny stars twinkling gently, five glowing
> constellation nodes pulsing almost imperceptibly. Slow, seamless loop, calm,
> premium, no camera movement, no text.

## Compresión de referencia (ffmpeg)

```bash
ffmpeg -i bruto.mp4 -an -vf scale=1280:720 -c:v libvpx-vp9 -b:v 0 -crf 40 -deadline good media/hero-loop.webm
ffmpeg -i bruto.mp4 -an -vf scale=1280:720 -c:v libx264 -crf 28 -preset slow -movflags +faststart media/hero-loop.mp4
```

## Notas de infraestructura

- El service worker **no cachea** `/media/` (los vídeos no bloquean el modo
  offline ni inflan la caché).
- Con `prefers-reduced-motion` el vídeo ni se descarga: se muestra el póster.
- El componente que consume esto es `web/src/components/dashboard/HeroAmbiental.tsx`.
