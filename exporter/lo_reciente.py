"""«Lo reciente manda» en el escaparate (orden de MAD, 01/11/2026).

En el día a día, lo que ha llegado hace poco importa más que lo que lleva
semanas parado. El panel privado aplica la regla en panel-mad/web/src/lib/
lo-reciente.ts; aquí se repite con los MISMOS umbrales para que el escaparate
no diga «ahora mismo» de algo de septiembre:

  · nuevo: movido hace 7 días o menos; parado: más de 14 (el umbral de
    «parada» del registro de entrada, registro.py).
  · lo que vence en 7 días o menos es del día aunque sea viejo.
  · un repaso que lo mantiene («revisada por MAD») no es movimiento.

Solo salen recuentos: ni un texto de la bandeja, las acciones, las esperas o las
decisiones cruza a lo público (export_panel.py, auditoría de privacidad).
"""
from __future__ import annotations

import re
from datetime import date, timedelta
from pathlib import Path

NUEVO_DIAS = 7
PARADO_DIAS = 14
PLAZO_CERCA_DIAS = 7

# La serie pública: los últimos VENTANA_SERIE_DIAS días. Entera crecía un punto
# por noche; el 22/10/2026 pasó de los 64 KB que admite la puerta de seguridad
# pública y el escaparate se quedó once noches con los datos del 21/10.
VENTANA_SERIE_DIAS = 60
RECORDS_SERIE = ("tokens", "tareas_hechas", "llamadas")
# La web no pinta intervenciones_raw, pero también crecía sin techo (las que usa
# tokens.json se leen antes, de la lista entera).
VENTANA_INTERVENCIONES = 5

ISO = re.compile(r"\b(20\d{2}-\d{2}-\d{2})\b")
ANCLA = re.compile(r"\^(\d{2})(\d{2})(\d{2})\d{6,}\b")
PROCEDENCIA = re.compile(r"\(([^()]*?)(20\d{2}-\d{2}-\d{2})")
PALABRAS_DE_PLAZO = re.compile(
    r"\b(antes del?|no más tarde del?|plazo|vence|venc(?:e|imiento)|l[íi]mite|fecha dura|caduca|deadline|para el)\b",
    re.I)


def _fecha(texto: str) -> date | None:
    try:
        return date.fromisoformat(texto)
    except ValueError:
        return None


def fecha_de_ancla(ancla: str) -> date | None:
    m = ANCLA.search(ancla if ancla.startswith("^") else f"^{ancla}")
    return _fecha(f"20{m.group(1)}-{m.group(2)}-{m.group(3)}") if m else None


def fechas_de_movimiento(linea: str, hoy: date) -> list[date]:
    """Anclas (la captura de la que nació y las enlazadas) y procedencia entre
    paréntesis, salvo «revisada por …». Las futuras son plazos, no hechos."""
    fechas = [fecha_de_ancla(m.group(0)) for m in ANCLA.finditer(linea)]
    fechas += [_fecha(m.group(2)) for m in PROCEDENCIA.finditer(linea)
               if not re.search(r"\brevisad[oa]s?\b", m.group(1), re.I)]
    return [f for f in fechas if f is not None and f <= hoy]


def plazo_escrito(texto: str, hoy: date) -> date | None:
    """La fecha que sigue a una palabra de plazo (como caducidadDe en el panel)."""
    sin_rastro = re.sub(r"\s*⟵.*$", "", texto)
    m = PALABRAS_DE_PLAZO.search(sin_rastro)
    if not m:
        return None
    cola = sin_rastro[m.start():m.start() + 60]
    iso = ISO.search(cola)
    if iso:
        return _fecha(iso.group(1))
    corta = re.search(r"\b(\d{1,2})/(\d{2})(?:/(20\d{2}))?\b", cola)
    if corta:
        return _fecha(f"{corta.group(3) or hoy.year}-{corta.group(2)}-{int(corta.group(1)):02d}")
    return None


def es_del_dia(movimientos: list[date], plazo: date | None, hoy: date) -> bool:
    """Del día: se movió en las dos últimas semanas, vence esta, o no tiene fecha
    (lo que no se puede fechar no se esconde)."""
    if plazo is not None and 0 <= (plazo - hoy).days <= PLAZO_CERCA_DIAS:
        return True
    validos = [f for f in movimientos if f <= hoy]
    return not validos or (hoy - max(validos)).days <= PARADO_DIAS


def reparto(items: list[tuple[list[date], date | None]], hoy: date) -> dict:
    del_dia = sum(1 for movs, plazo in items if es_del_dia(movs, plazo, hoy))
    return {"del_dia": del_dia, "parados": len(items) - del_dia}


def _seccion(md: str, cabecera: str) -> str:
    partes = md.split(cabecera, 1)
    if len(partes) < 2:
        return ""
    fin = re.search(r"\n## ", partes[1])
    return partes[1][: fin.start()] if fin else partes[1]


def gtd_lo_reciente(vault: Path, hoy: date) -> dict:
    """Recuentos del día y parados de las cuatro listas que /actividad enseña.
    Una lista que no se deja leer se queda fuera (null en la web), nunca a 0."""
    gtd = vault / "08_PLANIFICACION" / "GTD"
    out: dict = {"umbral_dias": PARADO_DIAS}

    def leer(p: Path) -> str | None:
        try:
            return p.read_text(encoding="utf-8")
        except OSError:
            return None

    md = leer(gtd / "QUE-NECESITO.md")
    if md is not None:
        bandeja = _seccion(md, "## 🗂 Bandeja")
        capturas = [ln for ln in bandeja.splitlines() if ln.startswith("- [ ] ") and "^ejemplo" not in ln]
        out["bandeja"] = reparto([([f] if (f := _fecha(ln[6:16])) else [], plazo_escrito(ln, hoy))
                                  for ln in capturas], hoy)

    md = leer(gtd / "ACCIONES.md")
    if md is not None:
        hoy_md = _seccion(md, "## 🔥 HOY")
        acciones = [ln for ln in hoy_md.splitlines() if ln.startswith("- [ ] ")]
        out["acciones_hoy"] = reparto([(fechas_de_movimiento(ln, hoy), plazo_escrito(ln, hoy)) for ln in acciones], hoy)

    md = leer(gtd / "ESPERANDO.md")
    if md is not None:
        esperas = []
        for ln in md.splitlines():
            celdas = [c.strip() for c in ln.strip().strip("|").split("|")]
            if len(celdas) < 5 or not ISO.fullmatch(celdas[0]) or "~~" in ln or "CERRAD" in ln.upper():
                continue
            reclamar = [f for f in (_fecha(x) for x in ISO.findall(celdas[4])) if f]
            if not any(f < hoy for f in reclamar):
                continue  # aún no ha vencido
            desde = _fecha(celdas[0])
            esperas.append(([f for f in [desde, *reclamar] if f], max(reclamar)))
        out["esperas_vencidas"] = reparto(esperas, hoy)

    md = leer(vault / "00_SISTEMA" / "DECISIONES-PENDIENTES.md")
    if md is not None:
        decisiones = []
        for bloque in re.split(r"\n(?=## \d+\.)", md):
            if not re.match(r"## \d+\.", bloque) or "pendiente de MAD" not in bloque:
                continue
            m = re.search(r"Desde cuando espera:\s*(20\d{2}-\d{2}-\d{2})", bloque)
            decisiones.append(([f] if m and (f := _fecha(m.group(1))) else [], None))
        out["decisiones"] = reparto(decisiones, hoy)

    return out


def _es_numero(v) -> bool:
    return isinstance(v, (int, float)) and not isinstance(v, bool)


def _media(valores: list):
    # Suma a mano y en orden: sum() de Python 3.12 compensa el redondeo y el
    # último decimal no saldría igual que el reduce con el que contaba la web.
    total = 0
    for v in valores:
        total += v
    return total / len(valores)


def medias_serie(puntos: list) -> dict:
    """Las dos medias de tokens que la web contaba recorriendo la serie: la del
    «día normal» de la portada (un día sin dato cuenta 0) y la de ProgresoDia
    (los días medidos menos el último)."""
    tokens = [(p.get("contexto") or {}).get("tokens") for p in puntos]
    medidos = [t for t in tokens if _es_numero(t)]
    return {"tokens": _media([t if _es_numero(t) else 0 for t in tokens]) if tokens else 0,
            "tokens_previos": _media(medidos[:-1]) if len(medidos) >= 2 else None}


def ventana_serie(serie: dict, dias: int = VENTANA_SERIE_DIAS) -> dict:
    """Los últimos `dias` de la serie y, sobre la serie ENTERA, lo que la web
    contaba recorriéndola: los récords de /historia (valor y fecha) y las medias
    de la portada y de ProgresoDia, para que la ventana no los cambie."""
    puntos = serie.get("serie", [])
    records = {}
    for clave in RECORDS_SERIE:
        mejor = None
        for p in puntos:
            v = (p.get("contexto") or {}).get(clave)
            if isinstance(v, (int, float)) and v > 0 and (mejor is None or v > mejor["valor"]):
                mejor = {"valor": v, "fecha": p.get("fecha")}
        if mejor:
            records[clave] = mejor
    extra = {"records": records, "medias": medias_serie(puntos), "ventana_dias": dias,
             "intervenciones_raw": serie.get("intervenciones_raw", [])[-VENTANA_INTERVENCIONES:]}
    fechas = sorted(f for f in (str(p.get("fecha", ""))[:10] for p in puntos) if _fecha(f))
    if not fechas:
        return {**serie, **extra}
    corte = (_fecha(fechas[-1]) - timedelta(days=dias - 1)).isoformat()
    recientes = [p for p in puntos if str(p.get("fecha", ""))[:10] >= corte]
    return {**serie, **extra, "serie": recientes, "desde_total": fechas[0]}
