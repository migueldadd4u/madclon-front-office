#!/usr/bin/env python3
"""Genera el póster ambiental del hero del front office.

Salida: web/public/images/hero-ambiental.png (1600x900)

Es la base estática del componente HeroAmbiental: se ve con
`prefers-reduced-motion`, mientras carga el vídeo (cuando exista) y como
`poster` del <video>. También es el fotograma de referencia para quien genere
el clip en Seedance: mismo encuadre, misma paleta indigo -> teal.

Reproducible: `python3 exporter/hero_poster.py` (PIL, sin dependencias raras).
"""

from pathlib import Path
import math
import random

from PIL import Image, ImageDraw, ImageFilter

W, H = 1600, 900
OUT = Path(__file__).resolve().parent.parent / "web" / "public" / "images" / "hero-ambiental.png"

# Paleta de marca
INDIGO = (122, 127, 255)   # #7A7FFF
AZUL = (78, 143, 232)      # #4E8FE8
TEAL = (6, 201, 168)       # #06C9A8
CIELO_1 = (18, 20, 43)     # #12142B
CIELO_2 = (11, 13, 30)     # #0B0D1E


def degradado_base() -> Image.Image:
    """Cielo nocturno vertical con leve diagonal."""
    im = Image.new("RGB", (W, H))
    px = im.load()
    for y in range(H):
        for x in range(0, W, 4):
            t = (y / H) * 0.85 + (x / W) * 0.15
            c = tuple(round(CIELO_1[i] + (CIELO_2[i] - CIELO_1[i]) * t) for i in range(3))
            for dx in range(4):
                if x + dx < W:
                    px[x + dx, y] = c
    return im


def capa_burbujas() -> Image.Image:
    """Tres auroras suaves indigo -> azul -> teal, desenfocadas."""
    capa = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(capa)
    # (centro_x, centro_y, radio, color, alpha)
    burbujas = [
        (W * 0.16, H * 0.20, 430, INDIGO, 105),
        (W * 0.62, H * 0.55, 520, AZUL, 85),
        (W * 0.90, H * 0.88, 460, TEAL, 95),
        (W * 0.40, H * 0.95, 300, INDIGO, 55),
    ]
    for cx, cy, r, col, a in burbujas:
        d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=col + (a,))
    return capa.filter(ImageFilter.GaussianBlur(140))


def capa_constelacion() -> Image.Image:
    """Los 5 nodos de la M constelacion con su trazo, en la mitad derecha."""
    capa = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(capa)
    nodos = [
        (W * 0.66, H * 0.72),
        (W * 0.73, H * 0.38),
        (W * 0.80, H * 0.58),
        (W * 0.87, H * 0.34),
        (W * 0.94, H * 0.70),
    ]
    # trazo
    for (x1, y1), (x2, y2) in zip(nodos, nodos[1:]):
        d.line([x1, y1, x2, y2], fill=(200, 210, 255, 90), width=3)
    # nodos con halo
    for i, (x, y) in enumerate(nodos):
        col = (INDIGO, AZUL, (150, 165, 250), TEAL, TEAL)[i]
        d.ellipse([x - 26, y - 26, x + 26, y + 26], fill=col + (45,))
        d.ellipse([x - 9, y - 9, x + 9, y + 9], fill=col + (235,))
        d.ellipse([x - 4, y - 4, x + 4, y + 4], fill=(255, 255, 255, 220))
    return capa.filter(ImageFilter.GaussianBlur(1.2))


def capa_estrellas(rng: random.Random) -> Image.Image:
    capa = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(capa)
    for _ in range(90):
        x, y = rng.uniform(0, W), rng.uniform(0, H)
        r = rng.uniform(0.6, 1.8)
        a = rng.randint(40, 130)
        d.ellipse([x - r, y - r, x + r, y + r], fill=(230, 236, 255, a))
    return capa


def capa_vineta() -> Image.Image:
    """Oscurece bordes para que el texto de la tarjeta siempre respire."""
    capa = Image.new("L", (W, H), 0)
    d = ImageDraw.Draw(capa)
    d.rectangle([0, 0, W, H], fill=90)
    d.ellipse([-W * 0.25, -H * 0.35, W * 1.25, H * 1.35], fill=0)
    capa = capa.filter(ImageFilter.GaussianBlur(180))
    negra = Image.new("RGBA", (W, H), (5, 6, 16, 255))
    negra.putalpha(capa)
    return negra


def main() -> None:
    rng = random.Random(20260731)
    im = degradado_base().convert("RGBA")
    im = Image.alpha_composite(im, capa_burbujas())
    im = Image.alpha_composite(im, capa_estrellas(rng))
    im = Image.alpha_composite(im, capa_constelacion())
    im = Image.alpha_composite(im, capa_vineta())

    OUT.parent.mkdir(parents=True, exist_ok=True)
    im.convert("RGB").save(OUT, optimize=True)
    kb = OUT.stat().st_size // 1024
    print(f"OK {OUT} ({kb} KB)")
    # medida real: esquina superior izquierda debe ser noche, no negro puro
    probe = im.convert("RGB").getpixel((80, 80))
    print("sondeo (80,80):", probe)


if __name__ == "__main__":
    main()
