#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Exportador Front Office — vault MAD-brain → JSON público-safe para la web.

Lee (SOLO LECTURA) los paneles vivos del vault:
  - 00_SISTEMA/Vistas-Principales/PANEL-CLON.md      (agregados GTD/flota/crons)
  - 00_SISTEMA/Vistas-Principales/PANEL-TOKENS.md    (contador, KPIs, modelos)
  - 00_SISTEMA/cuadros-de-mando/SISTEMA-COMPLETO.md  (clones + integraciones)
  - 00_SISTEMA/Vistas-Principales/subclones/*.md     (misión de cada clon)
  - 00_SISTEMA/Monitorizacion/tokens/*.json(l)       (serie KPI + línea base)

Escribe en web/public/data/:
  manifest.json · overview.json · clones.json · tokens.json · serie.json

REGLA DE PRIVACIDAD (bloqueante): solo métricas agregadas de sistema.
NUNCA se exportan textos de esperas, correos, decisiones, personas, rutas
locales ni credenciales. Si la salida contiene un patrón sensible, el
exportador FALLA y no escribe nada.
"""
from __future__ import annotations

import argparse
import json
import re
import sys
from datetime import date, datetime, timezone
from pathlib import Path

# ---------------------------------------------------------------- utilidades

def num_es(s: str):
    """'423.101.422' -> 423101422 · '68,6' -> 68.6 · ''/'—' -> None"""
    if s is None:
        return None
    s = s.strip().strip("*").replace("\u00a0", " ")
    s = re.sub(r"[%sa-zA-Z€ ]", "", s)
    s = re.sub(r"(?<=\d)\.$", "", s)  # punto final de frase: '77.139.' -> '77.139'
    if not s or s in {"—", "-", "–"}:
        return None
    try:
        if "," in s:  # decimal español
            return float(s.replace(".", "").replace(",", "."))
        if "." in s and re.fullmatch(r"\d{1,3}(\.\d{3})+", s):  # miles
            return int(s.replace(".", ""))
        return float(s) if "." in s else int(s)
    except ValueError:
        return None


def read(path: Path) -> str:
    return path.read_text(encoding="utf-8") if path.exists() else ""


def tabla_md(lineas):
    """Filas de una tabla markdown -> lista de celdas limpias."""
    filas = []
    for ln in lineas:
        ln = ln.strip()
        if not ln.startswith("|"):
            if filas:
                break
            continue
        celdas = [c.strip() for c in ln.strip("|").split("|")]
        if all(re.fullmatch(r":?-{2,}:?", c) for c in celdas):  # separador
            continue
        filas.append(celdas)
    return filas


def seccion(texto: str, inicio_re: str, fin_re: str = r"\n## ") -> str:
    m = re.search(inicio_re, texto)
    if not m:
        return ""
    resto = texto[m.start():]
    f = re.search(fin_re, resto[len(m.group(0)):])
    return resto[: len(m.group(0)) + (f.start() if f else len(resto))]

# ------------------------------------------------------- PANEL-CLON (overview)

def parse_panel_clon(md: str) -> dict:
    out: dict = {"gtd": {}, "personas": {}, "automejora": {}, "crons": []}

    def cap(pat, cast=int):
        m = re.search(pat, md)
        return cast(m.group(1)) if m else None

    g = out["gtd"]
    g["propuestas"] = cap(r"Decidir (\d+) propuesta")
    g["bandeja"] = cap(r"Triar (\d+) captura")
    g["esperas_vencidas"] = cap(r"Reclamar (\d+) espera")
    g["decisiones"] = cap(r"posponer (\d+) decisi")
    m = re.search(r"Acciones HOY: (\d+)", md)
    g["acciones_hoy"] = int(m.group(1)) if m else None
    # esperas totales = ítems listados bajo "Esperando" (solo conteo, nunca texto)
    sec_esp = seccion(md, r"Esperando \(venc[^\n]*\n", r"\n## ")
    g["esperas_listadas"] = len(re.findall(r"^\s+- \d{4}-\d{2}-\d{2}", sec_esp, re.M))

    m = re.search(r"Healthcheck: \*\*(\d+) problemas\*\* · ([^·]+) · HEAD `([^`]+)`", md)
    if m:
        head = m.group(3).strip().replace("@", " · ")  # 'rama@hash' no es un email
        out["healthcheck"] = {"problemas": int(m.group(1)), "ts": m.group(2).strip(),
                              "head": head}
    m = re.search(r"Gateways vivos \((\d+)\): ([^\n]+)", md)
    if m:
        out["gateways"] = [x.strip() for x in m.group(2).split(",")]

    m = re.search(r"Crons / digests \((\d+) en error\)", md)
    out["crons_en_error"] = int(m.group(1)) if m else 0
    sec_crons = seccion(md, r"## .*Crons / digests[^\n]*\n", r"\n## ")
    for c in tabla_md(sec_crons.splitlines())[1:]:
        if len(c) >= 4:
            out["crons"].append({"nombre": c[0], "ambito": c[1],
                                 "estado": c[2], "ultima": c[3]})

    m = re.search(r"Fichas curadas: \*\*([\d.]+)\*\* · staged esperando gate: \*\*(\d+)\*\*", md)
    if m:
        out["personas"] = {"fichas_curadas": num_es(m.group(1)),
                           "staged": int(m.group(2))}

    m = re.search(r"Cola: (\d+) hechas · (\d+) bloqueadas · (\d+) aparcadas · (\d+) pendientes · "
                  r"llamadas ([\d.]+) · \*\*metered: (\d+)\*\* · top: ([^\n]+)", md)
    if m:
        out["automejora"] = {"hechas": int(m.group(1)), "bloqueadas": int(m.group(2)),
                             "aparcadas": int(m.group(3)), "pendientes": int(m.group(4)),
                             "llamadas": num_es(m.group(5)), "metered": int(m.group(6)),
                             "top": m.group(7).strip()}

    m = re.search(r"30 d: \*\*([\d.]+) tokens\*\* · cobertura medida ([\d.,]+) %", md)
    if m:
        out["tokens_resumen"] = {"tokens_30d": num_es(m.group(1)),
                                 "cobertura_pct": num_es(m.group(2))}
    m = re.search(r"Índice de eficiencia \(tokens del motor por tarea hecha\): \*\*([\d.]+)\*\*", md)
    if m:
        out.setdefault("tokens_resumen", {})["indice_eficiencia"] = num_es(m.group(1))
    return out

# ------------------------------------------------- PANEL-TOKENS (tokens.json)

def parse_panel_tokens(md: str) -> dict:
    out: dict = {"contador": {}, "kpis": {}, "intervenciones": [],
                 "por_clon": [], "por_modelo": []}
    c = out["contador"]

    sec = seccion(md, r"## Contador común\n", r"\n## ")
    for fila in tabla_md(sec.splitlines()):
        if len(fila) < 3:
            continue
        nombre = re.sub(r"[*✅≈🧮]", "", fila[0]).strip().lower()
        if "medido" in nombre:
            c["medido_tokens"], c["medido_llamadas"] = num_es(fila[1]), num_es(fila[2])
        elif "estimado" in nombre:
            c["estimado_tokens"], c["estimado_llamadas"] = num_es(fila[1]), num_es(fila[2])
        elif "total" in nombre:
            c["total_tokens"], c["total_llamadas"] = num_es(fila[1]), num_es(fila[2])
    m = re.search(r"Entrada ([\d.]+) · salida ([\d.]+) · de los cuales caché\s*([\d.]+) "
                  r"y razonamiento ([\d.]+)", md)
    if m:
        c.update({"entrada": num_es(m.group(1)), "salida": num_es(m.group(2)),
                  "cache": num_es(m.group(3)), "razonamiento": num_es(m.group(4))})
    m = re.search(r"Banda de la estimación \(p25–p75\): ([\d.]+) – ([\d.]+)", md)
    if m:
        c["banda_p25"], c["banda_p75"] = num_es(m.group(1)), num_es(m.group(2))
    m = re.search(r"Cobertura medida: ([\d.,]+) %", md)
    if m:
        c["cobertura_pct"] = num_es(m.group(1))
    m = re.search(r"Ventanas: 30 d ([\d.]+) · 7 d ([\d.]+) · hoy ([\d.]+)", md)
    if m:
        c["ventana_30d"], c["ventana_7d"], c["hoy"] = (num_es(m.group(i)) for i in (1, 2, 3))
    m = re.search(r"Línea base congelada[^\(]*\((\d{4}-\d{2}-\d{2})\)", md)
    if m:
        out["linea_base_fecha"] = m.group(1)

    # KPIs por sección (⚙️ Eficiencia / 🎯 Eficacia / 🔍 Honestidad)
    for clave, emoji in (("eficiencia", "⚙️"), ("eficacia", "🎯"), ("honestidad", "🔍")):
        sec = seccion(md, rf"### {emoji} [^\n]*\n", r"\n### |\n## ")
        filas = []
        for f in tabla_md(sec.splitlines()):
            if len(f) >= 6 and f[0] in {"🟢", "🔴", "⚪", "🟡"}:
                filas.append({"estado": f[0],
                              "nombre": f[1].strip("*"),
                              "ahora": f[2], "base": f[3], "variacion": f[4],
                              "ahora_num": num_es(f[2]),
                              "significado": f[5]})
        out["kpis"][clave] = filas

    m = re.search(r"\*Soporte de la lectura: ([^*]+)\*", md)
    if m:
        out["soporte"] = m.group(1).strip()

    sec = seccion(md, r"## Intervenciones[^\n]*\n", r"\n## ")
    for f in tabla_md(sec.splitlines()):
        if len(f) >= 4 and f[0] in {"⏳", "✅", "❌", "🟢", "🔴"}:
            out["intervenciones"].append({"estado": f[0], "cambio": f[1],
                                          "fecha": f[2], "efecto": f[3]})

    sec = seccion(md, r"## Qué modelos usa cada clon[^\n]*\n", r"\n## ")
    for f in tabla_md(sec.splitlines()):
        if len(f) >= 4 and f[0] != "Clon":  # salta solo la cabecera
            nombre = f[0].strip("*")
            out["por_clon"].append({"clon": nombre, "tokens": num_es(f[1]),
                                    "llamadas": num_es(f[2]), "modelos": f[3]})

    sec = seccion(md, r"## Por modelo[^\n]*\n", r"\n## ")
    for f in tabla_md(sec.splitlines()):
        if len(f) >= 5 and f[0] != "Modelo":
            out["por_modelo"].append({"modelo": f[0], "total": num_es(f[1]),
                                      "entrada": num_es(f[2]), "salida": num_es(f[3]),
                                      "llamadas": num_es(f[4]),
                                      "est": f[5] if len(f) > 5 else None})
    return out

# -------------------------------------------- cuadros de mando (clones.json)

def parse_sistema_completo(md: str) -> dict:
    out = {"clones": [], "integraciones": []}
    m = re.search(r"Estado global de accesos:\*\* (.+)", md)
    if m:
        out["salud_global"] = m.group(1).strip()
    m = re.search(r"Último chequeo watchdog:\*\* (\S+)", md)
    if m:
        out["watchdog_ts"] = m.group(1).strip()

    sec = seccion(md, r"## Clones / gateway\n", r"\n## ")
    for f in tabla_md(sec.splitlines()):
        if len(f) >= 5 and f[0] != "Perfil":
            out["clones"].append({"perfil": f[0], "rol": f[1],
                                  "canales": [x.strip() for x in f[2].split(",") if x.strip() and x.strip() != "—"],
                                  "correo": None if f[3] == "—" else f[3],
                                  "calendarios": [] if f[4] == "—" else [x.strip() for x in f[4].split(",")]})
    sec = seccion(md, r"## Estado operativo consolidado\n", r"\n## ")
    for f in tabla_md(sec.splitlines()):
        if len(f) >= 5 and f[0] != "Integración":
            out["integraciones"].append({"nombre": f[0], "estado": f[1],
                                         "ultimo_ok": None if f[2] == "—" else f[2],
                                         "ultimo_fallo": None if f[3] == "—" else f[3],
                                         "detalle": f[4]})
    return out


def parse_misiones(dir_subclones: Path) -> dict:
    mapa = {"CEO": "ceo", "Clon-COO": "clon", "Ideas": "ideas", "Licitador": "licitador",
            "Padre": "padre", "Patrimonio": "patrimonio", "Tecnico": "tecnico"}
    misiones = {}
    for stem, perfil in mapa.items():
        md = read(dir_subclones / f"{stem}.md")
        m = re.search(r"\*\*Misión:\*\*\s*(.+)", md)
        if m:
            misiones[perfil] = m.group(1).strip()
    return misiones

# ---------------------------------------------------------- serie KPI jsonl

def parse_serie(tokens_dir: Path) -> dict:
    serie = []
    for ln in read(tokens_dir / "serie-kpi.jsonl").splitlines():
        ln = ln.strip()
        if ln:
            try:
                serie.append(json.loads(ln))
            except json.JSONDecodeError:
                pass
    try:
        base = json.loads(read(tokens_dir / "linea-base.json") or "{}")
    except json.JSONDecodeError:
        base = {}
    intervenciones = []
    for ln in read(tokens_dir / "intervenciones.jsonl").splitlines():
        ln = ln.strip()
        if ln:
            try:
                intervenciones.append(json.loads(ln))
            except json.JSONDecodeError:
                pass
    return {"serie": serie, "linea_base": base, "intervenciones_raw": intervenciones}

# ----------------------------------------------------- pulso.json (loquedigalaia)

LANZAMIENTO_LQDIA = date(2026, 8, 2)  # lanzamiento público de Lo que diga la IA


def build_pulso(tokens: dict, sistema: dict, serie: dict, hoy: date) -> dict:
    """Pulso diario conforme al contrato público de loquedigalaia-web
    (data/schema/pulso.schema.json): esquema cerrado, solo agregados, sin
    identificadores internos. Lo consume su scripts/snapshot.mjs con gate de
    calidad; el indicador obligatorio es tokens-consumidos-total (monotónico)."""
    hoy_s = hoy.isoformat()
    indicadores = []

    total = tokens.get("contador", {}).get("total_tokens")
    if total is not None:
        indicadores.append({
            "id": "tokens-consumidos-total",
            "label": "Tokens consumidos (total acumulado)",
            "value": total, "unit": "tokens", "asOf": hoy_s,
            "source": "front-office", "monotonic": True,
        })

    indicadores.append({
        "id": "dias-construyendo",
        "label": "Días construyendo en público",
        "value": max((hoy - LANZAMIENTO_LQDIA).days, 0), "unit": "días",
        "asOf": hoy_s, "source": "front-office", "monotonic": True,
    })

    puntos = [p for p in serie.get("serie", [])
              if isinstance(p.get("contexto"), dict)
              and isinstance(p["contexto"].get("tareas_hechas"), (int, float))]
    if puntos:
        tareas7 = int(sum(p["contexto"]["tareas_hechas"] for p in puntos[-7:]))
        indicadores.append({
            "id": "tareas-despachadas-7d",
            "label": "Tareas despachadas (últimos 7 días)",
            "value": tareas7, "unit": "tareas",
            "asOf": puntos[-1].get("fecha", hoy_s), "source": "front-office",
        })

    canales = sorted({c for clon in sistema.get("clones", [])
                      for c in clon.get("canales", [])})
    if canales:
        indicadores.append({
            "id": "canales-vigilados",
            "label": "Canales de entrada vigilados",
            "value": len(canales), "unit": "canales",
            "asOf": hoy_s, "source": "front-office",
        })

    return {
        "clone": "clonmadv3",
        "asOf": datetime.now(timezone.utc).isoformat(timespec="seconds").replace("+00:00", "Z"),
        "indicators": indicadores,
    }

# ------------------------------------------------------------ privacidad

PATRONES_PROHIBIDOS = [
    (r"@", "posible email"),
    (r"/Users/", "ruta local"),
    (r"(?<!\d)(?:\+?34[ .-]?)?[6-9]\d{2}[ .-]?\d{2}[ .-]?\d{2}[ .-]?\d{2}(?!\d)", "posible teléfono"),
    (r"(?i)(password|token[_-]?de|secret|api[_-]?key|bearer)", "posible credencial"),
]


def audit_privacidad(obj, ruta="$"):
    """Recorre el JSON; devuelve lista de violaciones (solo valores string)."""
    hallazgos = []
    if isinstance(obj, dict):
        for k, v in obj.items():
            hallazgos += audit_privacidad(v, f"{ruta}.{k}")
    elif isinstance(obj, list):
        for i, v in enumerate(obj):
            hallazgos += audit_privacidad(v, f"{ruta}[{i}]")
    elif isinstance(obj, str):
        for patron, que in PATRONES_PROHIBIDOS:
            if re.search(patron, obj):
                hallazgos.append(f"{ruta}: {que} → {obj[:80]!r}")
    return hallazgos

# --------------------------------------------------------------------- main

def main() -> int:
    ap = argparse.ArgumentParser(description="Exporta paneles del vault a JSON público-safe")
    raiz = Path(__file__).resolve().parent.parent
    ap.add_argument("--vault", default=str(raiz.parent / "MAD-brain"),
                    help="raíz del vault MAD-brain")
    ap.add_argument("--out", default=str(raiz / "web" / "public" / "data"),
                    help="directorio de salida (web/public/data)")
    args = ap.parse_args()

    vault = Path(args.vault).expanduser().resolve()
    outdir = Path(args.out).expanduser().resolve()
    s00 = vault / "00_SISTEMA"

    avisos = []
    for rel in ["Vistas-Principales/PANEL-CLON.md", "Vistas-Principales/PANEL-TOKENS.md",
                "cuadros-de-mando/SISTEMA-COMPLETO.md", "Monitorizacion/tokens/serie-kpi.jsonl"]:
        if not (s00 / rel).exists():
            avisos.append(f"⚠️ fuente no encontrada: {rel}")

    overview = parse_panel_clon(read(s00 / "Vistas-Principales/PANEL-CLON.md"))
    tokens = parse_panel_tokens(read(s00 / "Vistas-Principales/PANEL-TOKENS.md"))
    sistema = parse_sistema_completo(read(s00 / "cuadros-de-mando/SISTEMA-COMPLETO.md"))
    misiones = parse_misiones(s00 / "Vistas-Principales/subclones")
    serie = parse_serie(s00 / "Monitorizacion/tokens")

    for clon in sistema["clones"]:
        clon["mision"] = misiones.get(clon["perfil"])
    overview["salud_global"] = sistema.get("salud_global")
    overview["watchdog_ts"] = sistema.get("watchdog_ts")

    # las intervenciones del md vienen truncadas: recuperar el texto completo del jsonl
    for itv in tokens["intervenciones"]:
        for raw in serie["intervenciones_raw"]:
            if raw.get("fecha") == itv["fecha"] and len(raw.get("que", "")) > len(itv["cambio"]):
                itv["cambio"] = raw["que"]
                break

    ahora = datetime.now(timezone.utc).isoformat(timespec="seconds")
    salidas = {
        "manifest.json": {"generado": ahora, "version": 1, "avisos": avisos,
                          "fuentes": ["PANEL-CLON", "PANEL-TOKENS", "cuadros-de-mando",
                                      "Monitorizacion/tokens"]},
        "overview.json": overview,
        "clones.json": sistema,
        "tokens.json": tokens,
        "serie.json": serie,
        "pulso.json": build_pulso(tokens, sistema, serie, datetime.now(timezone.utc).date()),
    }

    # --- auditoría de privacidad: cualquier hallazgo bloquea la escritura ---
    violaciones = []
    for nombre, obj in salidas.items():
        violaciones += [f"{nombre}::{v}" for v in audit_privacidad(obj)]
    if violaciones:
        print("⛔ EXPORTACIÓN BLOQUEADA por privacidad:", file=sys.stderr)
        for v in violaciones:
            print(f"  - {v}", file=sys.stderr)
        return 2

    outdir.mkdir(parents=True, exist_ok=True)
    for nombre, obj in salidas.items():
        (outdir / nombre).write_text(json.dumps(obj, ensure_ascii=False, indent=2),
                                     encoding="utf-8")
    print(f"✅ exportados {len(salidas)} ficheros a {outdir}")
    for a in avisos:
        print(a)
    print(f"   crons={len(overview.get('crons', []))} clones={len(sistema['clones'])} "
          f"integraciones={len(sistema['integraciones'])} "
          f"kpis={sum(len(v) for v in tokens['kpis'].values())} "
          f"puntos_serie={len(serie['serie'])}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
