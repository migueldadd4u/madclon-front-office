#!/usr/bin/env python3
"""Genera candidatos de hero-loop para el front office con Seedance (fal.ai).

Uso:
    python3 exporter/hero_loop_seedance.py            # envía 3 candidatos y espera
    python3 exporter/hero_loop_seedance.py --reanudar # sondea los request_id ya enviados

- La key NUNCA está en el repo ni en la conversación: se lee del Llavero de
  macOS en el momento (`security find-generic-password -s fal-api-key`),
  convención de la casa (sync-agendas.py, iCloud, restic).
- Imagen inicial: web/public/images/hero-ambiental.png (data URI base64), así
  el clip nace en el mismo encuadre que el póster y el fundido es invisible.
- Salida: scratch/hero-loop/candidato-{1,2,3}.mp4 + hoja de contacto JPG por
  candidato (scratch/ está gitignored; nada sale del workspace).
- Coste estimado: ~0,2-0,5 $ por clip de 5 s/720p (seedance lite, que fal
  redirige a 1.0 pro fast). 3 candidatos < 1,5 $.
"""

import argparse
import base64
import json
import subprocess
import sys
import time
import urllib.request
import urllib.error
from pathlib import Path

MODELO = "fal-ai/bytedance/seedance/v1/lite/image-to-video"
RAIZ = Path(__file__).resolve().parent.parent
POSTER = RAIZ / "web" / "public" / "images" / "hero-ambiental.png"
SALIDA = RAIZ.parent / "scratch" / "hero-loop"
ESTADO = SALIDA / "estado.json"

PROMPT_BASE = (
    "Subtle ambient motion of a night sky: soft aurora clouds in indigo, blue "
    "and teal drifting very slowly. Calm, premium, seamless loop feeling, "
    "fixed camera, no text, no logos."
)
VARIANTES = [
    ("deriva", PROMPT_BASE + " The aurora masses drift gently sideways, like a slow nebula."),
    ("estrellas", PROMPT_BASE + " Tiny stars twinkle softly, one by one, while the aurora breathes."),
    ("pulso", PROMPT_BASE + " The five glowing constellation nodes on the right pulse almost imperceptibly."),
]


def lee_key() -> str:
    r = subprocess.run(
        ["security", "find-generic-password", "-a", subprocess.run(["whoami"], capture_output=True, text=True).stdout.strip(),
         "-s", "fal-api-key", "-w"],
        capture_output=True, text=True,
    )
    if r.returncode != 0 or not r.stdout.strip():
        sys.exit("❌ No hay key en el Llavero (servicio fal-api-key). Ver instrucciones en conversación.")
    return r.stdout.strip()


def peticion(metodo: str, url: str, key: str, cuerpo: dict | None = None) -> dict:
    datos = json.dumps(cuerpo).encode() if cuerpo is not None else None
    req = urllib.request.Request(url, data=datos, method=metodo)
    req.add_header("Authorization", f"Key {key}")
    req.add_header("Content-Type", "application/json")
    try:
        with urllib.request.urlopen(req, timeout=60) as r:
            return json.loads(r.read())
    except urllib.error.HTTPError as e:
        sys.exit(f"❌ HTTP {e.code} en {url}: {e.read()[:400]!r}")


def enviar(key: str) -> None:
    poster_b64 = base64.b64encode(POSTER.read_bytes()).decode()
    imagen = f"data:image/png;base64,{poster_b64}"
    estado = {"pendientes": {}}
    for nombre, prompt in VARIANTES:
        res = peticion("POST", f"https://queue.fal.run/{MODELO}", key, {
            "prompt": prompt,
            "image_url": imagen,
            "aspect_ratio": "16:9",
            "resolution": "720p",
            "duration": "5",
            "camera_fixed": True,
        })
        rid = res.get("request_id")
        estado["pendientes"][nombre] = {
            "request_id": rid,
            "prompt": prompt,
            # Las URLs reales las da fal en la respuesta (el path NO lleva el
            # modelo completo: es /fal-ai/bytedance/requests/<id>…)
            "status_url": res.get("status_url") or f"https://queue.fal.run/fal-ai/bytedance/requests/{rid}/status",
            "response_url": res.get("response_url") or f"https://queue.fal.run/fal-ai/bytedance/requests/{rid}",
        }
        print(f"→ {nombre}: en cola ({rid})")
    ESTADO.write_text(json.dumps(estado, indent=2))


def sondear_y_descargar(key: str) -> list[Path]:
    estado = json.loads(ESTADO.read_text())
    videos: list[Path] = []
    for nombre, info in estado["pendientes"].items():
        rid = info["request_id"]
        status_url = info.get("status_url") or f"https://queue.fal.run/fal-ai/bytedance/requests/{rid}/status"
        response_url = info.get("response_url") or f"https://queue.fal.run/fal-ai/bytedance/requests/{rid}"
        destino = SALIDA / f"candidato-{nombre}.mp4"
        if destino.exists():
            videos.append(destino)
            continue
        while True:
            st = peticion("GET", status_url, key)
            s = st.get("status")
            print(f"  {nombre}: {s}")
            if s == "COMPLETED":
                break
            if s in ("FAILED", "ERROR"):
                sys.exit(f"❌ {nombre} falló: {json.dumps(st)[:300]}")
            time.sleep(6)
        res = peticion("GET", response_url, key)
        url = res["video"]["url"]
        urllib.request.urlretrieve(url, destino)
        print(f"✓ {nombre}: {destino.name} ({destino.stat().st_size // 1024} KB, seed {res.get('seed')})")
        videos.append(destino)
    return videos


def hojas_de_contacto(videos: list[Path]) -> None:
    for v in videos:
        jpg = v.with_suffix(".jpg")
        subprocess.run([
            "ffmpeg", "-y", "-i", str(v),
            "-vf", "select='eq(n\\,0)+eq(n\\,36)+eq(n\\,72)+eq(n\\,108)',scale=640:-1,tile=4x1",
            "-frames:v", "1", "-q:v", "4", str(jpg),
        ], capture_output=True)
        print(f"  hoja: {jpg.name}")


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--reanudar", action="store_true", help="sondea request_id ya enviados")
    args = ap.parse_args()

    SALIDA.mkdir(parents=True, exist_ok=True)
    key = lee_key()
    if not args.reanudar and ESTADO.exists() and any((SALIDA / f"candidato-{n}.mp4").exists() for n, _ in VARIANTES):
        sys.exit("Ya hay candidatos generados. Borra scratch/hero-loop/ o usa --reanudar.")
    if not args.reanudar or not ESTADO.exists():
        enviar(key)
    videos = sondear_y_descargar(key)
    hojas_de_contacto(videos)
    print("\nListo. Revisa las hojas JPG y elige candidato.")


if __name__ == "__main__":
    main()
