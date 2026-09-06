#!/usr/bin/env python3
"""og-image viva — regenera web/public/images/og-madclon.png con las cifras del día.

Lee los JSON públicos ya exportados (overview.json, serie.json, manifest.json) y pinta
la imagen social 1200x630: marca + tagline (como siempre) + pulso de tokens de 30 días
+ chips con las cifras vivas + fecha de los datos.

Uso:  python exporter/og_image.py
      python exporter/og_image.py --data web/public/data --out web/public/images/og-madclon.png

Quién es el clon (nombre, titular, aviso de IA, foto) sale de `identidad/identidad.json`,
que reparte `00_SISTEMA/identidad-visual-clon/repartir.py` desde el vault: aquí no hay
ningún nombre escrito a mano. Sin ese fichero, la cabecera sigue saliendo con los textos
de respaldo de más abajo.

Solo lee datos ya públicos; no toca el vault. Script nuevo e independiente:
NO forma parte de export_panel.py ni de la automatización nocturna (zona roja;
cablearlo al job nocturno requiere OK de MAD).
"""

import argparse
import json
from datetime import datetime
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFont

W, H = 1200, 630

# Degradado de marca: indigo -> azul -> teal
INDIGO = (122, 127, 255)
AZUL = (78, 143, 232)
TEAL = (6, 201, 168)


def _fonts():
    """Fuentes TTF: primero las de matplotlib (siempre presentes en el runtime gestionado)."""
    try:
        import matplotlib

        ttf = Path(matplotlib.get_data_path()) / "fonts" / "ttf"
        bold = ttf / "DejaVuSans-Bold.ttf"
        reg = ttf / "DejaVuSans.ttf"
        if bold.exists() and reg.exists():
            return str(bold), str(reg)
    except Exception:
        pass
    for bold, reg in [
        ("/System/Library/Fonts/Supplemental/Arial Bold.ttf", "/System/Library/Fonts/Supplemental/Arial.ttf"),
        ("/System/Library/Fonts/Helvetica.ttc", "/System/Library/Fonts/Helvetica.ttc"),
    ]:
        if Path(bold).exists():
            return bold, reg
    raise SystemExit("no se encontró una fuente TTF usable")


BOLD, REG = _fonts()


def font(path, size):
    return ImageFont.truetype(path, size)


def degradado():
    """Gradiente diagonal indigo -> azul -> teal, oscurecido un pelín como el og original."""
    yy, xx = np.mgrid[0:H, 0:W]
    t = (xx / W * 0.55 + yy / H * 0.45)  # 0 arriba-izquierda, 1 abajo-derecha
    img = np.zeros((H, W, 3), dtype=np.float64)
    c1, c2, c3 = np.array(INDIGO), np.array(AZUL), np.array(TEAL)
    medio = 0.55
    m1 = np.clip(t / medio, 0, 1)[..., None]
    m2 = np.clip((t - medio) / (1 - medio), 0, 1)[..., None]
    img = c1 * (1 - m1) + c2 * m1
    img = img * (1 - m2) + c3 * m2
    img *= 0.82  # tono general más oscuro, como el og de marca
    return Image.fromarray(img.astype(np.uint8), "RGB")


def fmt_millones(n):
    m = n / 1_000_000
    s = f"{m:.0f}" if m >= 100 else f"{m:.1f}"
    return f"{s} M"


def sparkline(base, serie, y_top, y_bot):
    """Pulso de tokens de los últimos días, sutil, a lo ancho del pie.
    Se pinta en una capa aparte y se fusiona: el alpha de PIL en modo directo no mezcla."""
    toks = [d.get("contexto", {}).get("tokens", 0) for d in serie[-30:]]
    toks = [t for t in toks if t]
    if len(toks) < 2:
        return
    lo, hi = min(toks), max(toks)
    rango = (hi - lo) or 1
    n = len(toks)
    x0, x1 = 60, W - 60
    pts = []
    for i, v in enumerate(toks):
        x = x0 + (x1 - x0) * i / (n - 1)
        y = y_bot - (v - lo) / rango * (y_bot - y_top)
        pts.append((x, y))
    capa = Image.new("RGBA", base.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(capa)
    poly = pts + [(x1, y_bot + 20), (x0, y_bot + 20)]
    d.polygon(poly, fill=(255, 255, 255, 22))
    d.line(pts, fill=(255, 255, 255, 135), width=3, joint="curve")
    # punto final (hoy) destacado en teal claro
    x, y = pts[-1]
    d.ellipse([x - 7, y - 7, x + 7, y + 7], fill=(140, 255, 226, 235))
    base.alpha_composite(capa)


# Respaldo si un repo todavía no tiene la identidad repartida: la cabecera sale
# igual, con lo que decía este script antes de que existiera el manifiesto.
IDENTIDAD_RESPALDO = {
    "nombre": "MAD Clon",
    "titular_publico": "Miguel Ángel Domínguez",
    "titular_corto": "MAD",
    "avatar": None,
    "textos": {"es": {"aviso_ia": "imagen generada con IA"}},
}


def leer_identidad(raiz, fichero=None):
    """Quién es el clon, del manifiesto repartido. Nunca revienta la og-image."""
    fichero = Path(fichero) if fichero else Path(raiz) / "identidad" / "identidad.json"
    try:
        datos = json.loads(fichero.read_text(encoding="utf-8"))
    except Exception:
        return IDENTIDAD_RESPALDO

    # Se leen solo las claves que esta imagen usa, y cada una con su respaldo: un
    # manifiesto a medias no debe dejar la tarjeta social con un hueco.
    fusion = dict(IDENTIDAD_RESPALDO)
    for clave in ("nombre", "titular_publico", "titular_corto", "avatar"):
        if datos.get(clave):
            fusion[clave] = datos[clave]
    aviso = (datos.get("textos", {}).get("es", {}) or {}).get("aviso_ia")
    if aviso:
        fusion["textos"] = {"es": {"aviso_ia": aviso}}
    fusion["generadas_por_ia"] = bool(datos.get("generadas_por_ia", True))
    return fusion


def envolver(draw, texto, fnt, ancho):
    """Parte el texto en líneas que caben en `ancho`, midiendo de verdad.

    El tagline venía con el salto de línea escrito a mano y su primera línea
    medía 1.309 px sobre un lienzo de 1.200: se salía por la derecha, y con
    cualquier otro clon —otro nombre, otro titular— se saldría por otro sitio.
    """
    lineas, actual = [], ""
    for palabra in texto.split():
        prueba = f"{actual} {palabra}".strip()
        if actual and draw.textlength(prueba, font=fnt) > ancho:
            lineas.append(actual)
            actual = palabra
        else:
            actual = prueba
    if actual:
        lineas.append(actual)
    return "\n".join(lineas)


def chip(draw, xy, texto, fnt, anclaje_x, punto=None):
    """Chip redondeado con texto; devuelve la x siguiente."""
    x, y = xy
    pad_x, alto = 16, 46
    tw = draw.textlength(texto, font=fnt)
    ancho = pad_x * 2 + tw + (24 if punto else 0)
    draw.rounded_rectangle([x, y, x + ancho, y + alto], radius=23, fill=(10, 24, 60, 150))
    tx = x + pad_x
    if punto:
        cx, cy = x + pad_x + 2, y + alto / 2
        draw.ellipse([cx - 6, cy - 6, cx + 6, cy + 6], fill=punto)
        tx += 24
    draw.text((tx, y + alto / 2), texto, font=fnt, fill=(255, 255, 255, 235), anchor="lm")
    return x + ancho + 12


def main():
    ap = argparse.ArgumentParser()
    raiz = Path(__file__).resolve().parent.parent
    ap.add_argument("--data", default=str(raiz / "web" / "public" / "data"))
    ap.add_argument("--out", default=str(raiz / "web" / "public" / "images" / "og-madclon.png"))
    ap.add_argument("--logo", default=str(raiz / "web" / "public" / "images" / "logo-512.png"))
    ap.add_argument("--avatar", default=None, help="por defecto, la que diga identidad/identidad.json")
    ap.add_argument("--identidad", default=None, help="otro manifiesto (para probar la tarjeta de otro clon)")
    args = ap.parse_args()

    identidad = leer_identidad(raiz, args.identidad)
    nombre_clon = identidad["nombre"]
    titular = f"{identidad['titular_publico']} ({identidad['titular_corto']})"
    # El aviso viene del manifiesto tal cual («Imagen generada con IA»), así que el
    # pie se arma con el NOMBRE delante y no con un «el clon ·» que dejaría la
    # mayúscula del aviso a media frase.
    pie_cara = f"{nombre_clon} · {identidad['textos']['es']['aviso_ia']}" if identidad["generadas_por_ia"] else nombre_clon

    data = Path(args.data)
    overview = json.loads((data / "overview.json").read_text())
    serie = json.loads((data / "serie.json").read_text()).get("serie", [])
    manifest = json.loads((data / "manifest.json").read_text())

    tokens_30d = overview.get("tokens_resumen", {}).get("tokens_30d", 0)
    personas = overview.get("personas", {}).get("fichas_curadas", 0)
    mejoras = overview.get("automejora", {}).get("hechas", 0)
    salud = overview.get("salud_global", "").replace("🟢", "").replace("🟡", "").replace("🔴", "").strip() or "Todo OK"
    ok = "OK" in salud and "🟡" not in overview.get("salud_global", "") and "🔴" not in overview.get("salud_global", "")

    gen = manifest.get("generado", "")
    try:
        fecha = datetime.fromisoformat(gen.replace("Z", "+00:00")).strftime("%d/%m/%Y")
    except Exception:
        fecha = datetime.now().strftime("%d/%m/%Y")

    base = degradado().convert("RGBA")
    draw = ImageDraw.Draw(base, "RGBA")

    # --- cabecera: logo + nombre + tagline (como el og original) ---
    logo = Image.open(args.logo).convert("RGBA").resize((190, 190), Image.LANCZOS)
    base.alpha_composite(logo, (72, 92))

    f_nombre = font(BOLD, 88)
    f_sub = font(REG, 40)
    f_tag = font(REG, 33)
    f_fecha = font(REG, 24)

    # La cara del clon ocupa la columna derecha; el texto se queda en la izquierda
    # y no la pisa. Sin foto (`avatar.png` no existe para este clon) el texto
    # recupera todo el ancho y la cabecera queda como estaba.
    # `avatar` del manifiesto es la ruta PÚBLICA («identidad/avatar.png»), o sea
    # que en disco cuelga de web/public/. Confundirlas dejaba la tarjeta sin cara
    # y sin avisar: el único síntoma era un PNG 60 KB más pequeño.
    cara = Path(args.avatar) if args.avatar else (raiz / "web" / "public" / (identidad["avatar"] or "identidad/avatar.png"))
    lado_cara = 200
    x_cara = W - 56 - lado_cara
    ancho_texto = (x_cara - 72 - 32) if cara.is_file() else (W - 72 - 56)

    draw.text((300, 108), nombre_clon, font=f_nombre, fill=(255, 255, 255, 255))
    draw.text((303, 214), "Front Office · la sala de control", font=f_sub, fill=(255, 255, 255, 225))
    draw.text(
        (72, 330),
        envolver(
            draw,
            f"Un equipo de IA que trabaja mientras {titular} vive su vida — "
            f"los números de {nombre_clon}, explicados para personas.",
            f_tag,
            ancho_texto,
        ),
        font=f_tag,
        fill=(255, 255, 255, 205),
        spacing=10,
    )

    # Esta imagen es la que sale cuando alguien comparte el enlace: quien la ve en
    # LinkedIn o en un WhatsApp tiene que reconocer al clon sin abrir nada. Y que
    # la foto la hizo una IA se dice también aquí, no solo en la web.
    if cara.is_file():
        foto = Image.open(cara).convert("RGBA").resize((lado_cara, lado_cara), Image.LANCZOS)
        mascara = Image.new("L", (lado_cara * 4, lado_cara * 4), 0)
        ImageDraw.Draw(mascara).ellipse([0, 0, lado_cara * 4 - 1, lado_cara * 4 - 1], fill=255)
        foto.putalpha(mascara.resize((lado_cara, lado_cara), Image.LANCZOS))
        y_cara = 62
        # Aro claro: sobre el degradado, un círculo a hueso se funde con el fondo.
        draw.ellipse(
            [x_cara - 5, y_cara - 5, x_cara + lado_cara + 5, y_cara + lado_cara + 5],
            fill=(255, 255, 255, 70),
        )
        base.alpha_composite(foto, (x_cara, y_cara))
        draw.text(
            (W - 56, y_cara + lado_cara + 14),
            pie_cara,
            font=font(REG, 20),
            fill=(255, 255, 255, 195),
            anchor="ra",
        )

    # --- pulso vivo de los últimos 30 días ---
    sparkline(base, serie, y_top=450, y_bot=505)

    # --- chips con las cifras de hoy (auto-ajuste: baja la fuente hasta que quepan) ---
    color_punto = (52, 211, 153) if ok else (251, 191, 36)
    textos = [
        (f"{fmt_millones(tokens_30d)} tokens · 30 días", None),
        (f"{personas} personas recordadas", None),
        (f"{mejoras} mejoras aplicadas", None),
        (salud, color_punto),
    ]
    limite = W - 2 * 56
    for talla in (24, 23, 22, 21, 20):
        f_chip = font(BOLD, talla)
        total = sum(draw.textlength(t, font=f_chip) + 16 * 2 + (24 if p else 0) for t, p in textos) + 12 * (len(textos) - 1)
        if total <= limite:
            break
    x = 72
    for texto, punto in textos:
        x = chip(draw, (x, 552), texto, f_chip, x, punto=punto)

    # --- fecha de los datos, discreta ---
    draw.text((72, 44), f"datos del {fecha}", font=f_fecha, fill=(255, 255, 255, 150))

    out = Path(args.out)
    out.parent.mkdir(parents=True, exist_ok=True)
    base.convert("RGB").save(out, "PNG", optimize=True)
    print(f"og-image regenerada: {out} ({out.stat().st_size} bytes) — datos del {fecha}")


if __name__ == "__main__":
    main()
