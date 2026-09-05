#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Exportador Front Office — vault MAD-brain → JSON público-safe para la web.

Lee (SOLO LECTURA) los paneles vivos del vault:
  - 00_SISTEMA/Vistas-Principales/PANEL-CLON.md      (agregados GTD/flota/crons)
  - 00_SISTEMA/Vistas-Principales/PANEL-TOKENS.md    (contador, KPIs, modelos)
  - 00_SISTEMA/cuadros-de-mando/SISTEMA-COMPLETO.md  (clones + integraciones)
  - 00_SISTEMA/Monitorizacion/tokens/*.json(l)       (serie KPI + línea base)
  - 00_SISTEMA/handoffs/handoff-*.md                 (solo se CUENTAN: nº y fechas)

Y del propio repo (copy público curado, nunca del vault):
  - exporter/historia.md                             (capítulos de /historia)

Las PALABRAS de la flota ya no salen de aquí. El rol y la misión de cada clon
(exporter/misiones.md) y el nombre de cada buzón y agenda (exporter/conexiones.md)
los hornea el build en src/lib/copia-publica.ts: el service worker guarda estos
JSON hasta 24 h, y el contenido que no cambia no puede depender de un documento
cacheable. De este exportador solo salen claves de cruce, cifras y estados.

Escribe en web/public/data/:
  manifest.json · overview.json · clones.json · tokens.json · serie.json

REGLA DE PRIVACIDAD (bloqueante): solo métricas agregadas de sistema.
NUNCA se exportan textos de esperas, correos, decisiones, personas, rutas
locales ni credenciales. Si la salida contiene un patrón sensible, el
exportador FALLA y no escribe nada.
"""
from __future__ import annotations

import argparse
import hashlib
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



def slugs_de_grupo(vault: Path) -> set:
    """Slugs (y alias) de las fichas de grupo conversacional de 10_SITIOS.

    Se lee del vault en vez de mantener una lista a mano para que el exportador
    redacte EXACTAMENTE lo que la guardia G6 prohíbe (`check-grupos.sh`): si
    mañana nace un grupo nuevo, queda cubierto sin tocar este fichero. Una lista
    hardcodeada aquí se habría quedado atrás en la primera ficha nueva."""
    fuera = set()
    sitios = vault / "10_SITIOS"
    if not sitios.is_dir():
        return fuera
    for f in sitios.glob("*.md"):
        try:
            txt = f.read_text(encoding="utf-8", errors="replace")
        except OSError:
            continue
        if "subtipo: grupo-conversacional" not in txt:
            continue
        fuera.add(f.stem.lower())
        m = re.search(r"^slug:\s*(.+?)\s*$", txt, re.M)
        if m:
            fuera.add(m.group(1).strip().strip('"').strip("'").lower())
        m = re.search(r"^nombre:\s*(.+?)\s*$", txt, re.M)
        if m:
            fuera.add(m.group(1).strip().strip('"').strip("'").lower())
    return fuera


def aplica_privacidad_clones(tokens: dict, vault: Path, avisos: list) -> None:
    """Ningún slug de ficha de grupo puede salir en el material publicado.

    El 01/09/2026 `"clon": "amigos-lqdlia"` llevaba desde el 18/08 servido en
    https://migueldadd4u.github.io/madclon-front-office/data/tokens.json, y el
    refresco nocturno lo reescribía cada madrugada. `public-safety.mjs` no podía
    cazarlo porque valida FORMA y esquema, no semántica: no sabe qué texto sale
    de una ficha de grupo. La guardia que sí lo veía era G6 de
    `check-grupos.sh`, y llevaba 14 días en rojo sin que nadie la leyera.

    Se sustituye la etiqueta por «privado» y se FUNDEN las filas afectadas en
    una sola, en vez de borrarlas: así los totales de la página siguen
    cuadrando y no se publica tampoco el consumo por grupo. Mismo criterio que
    `aplica_conexiones()` — el texto privado no sale del vault, el cruce se
    conserva."""
    grupos = slugs_de_grupo(vault)
    if not grupos:
        avisos.append("⚠️ 10_SITIOS: no encuentro fichas de grupo; no puedo redactar por_clon")
        return

    filas, privada, tocados = [], None, []
    for fila in tokens.get("por_clon", []):
        nombre = str(fila.get("clon") or "").strip()
        if nombre.lower().strip("*") not in grupos:
            filas.append(fila)
            continue
        tocados.append(nombre)
        if privada is None:
            privada = dict(fila)
            privada["clon"] = "privado"
            privada["modelos"] = "—"
            filas.append(privada)
        else:
            for campo in ("tokens", "llamadas"):
                a, b = privada.get(campo), fila.get(campo)
                if isinstance(a, (int, float)) and isinstance(b, (int, float)):
                    privada[campo] = a + b
    if tocados:
        tokens["por_clon"] = filas
        avisos.append(f"🔒 por_clon: {len(tocados)} fila(s) de grupo redactadas a «privado»")


def aplica_conexiones(sistema: dict, avisos: list) -> None:
    """Sustituye TODA etiqueta de buzón/agenda por su clave derivada.

    La etiqueta era además la clave con la que la capa 2 cruza cada clon con su
    integración, así que ese cruce se conserva — pero por la clave, no por el
    texto privado, que a partir de aquí no sale del vault. El nombre visible lo
    pone el build desde exporter/conexiones.md."""
    for integra in sistema.get("integraciones", []):
        etiqueta = integra.pop("nombre", "")
        if not etiqueta:
            avisos.append("⚠️ SISTEMA-COMPLETO.md: una integración llega sin nombre")
        integra["clave"] = clave_conexion(etiqueta)

    for clon in sistema.get("clones", []):
        if clon.get("correo"):
            clon["correo"] = clave_conexion(clon["correo"])
        clon["calendarios"] = [clave_conexion(c) for c in clon.get("calendarios", [])]

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

# ------------------------------------------------------------- historia
# La línea de tiempo de /historia vivía escrita a mano dentro del React y
# envejecía en silencio (último capítulo 28/07 servido el 12/08, contador de
# bitácoras congelado en 175 cuando ya había 177). Desde la ronda R7 los
# capítulos salen de exporter/historia.md — copy público, curado, fuera del
# código — y las cifras se cuentan aquí en cada refresco. Añadir un capítulo
# ya no exige tocar React: lo publica el refresco de esa misma noche.

RE_HITO_CABECERA = re.compile(r"^###\s+(\d{4}-\d{2}-\d{2})\s*$")
RE_HITO_CAMPO = re.compile(r"^(icono|color|es_titulo|es_texto|en_titulo|en_texto|fuente):\s*(.+?)\s*$")

# Se publica solo esto: `fuente` es trazabilidad interna y se queda en el .md.
CAMPOS_PUBLICOS = ("icono", "color", "es_titulo", "es_texto", "en_titulo", "en_texto")
COLORES_VALIDOS = {"primary", "success", "info", "warning", "error", "secondary"}
RE_ICONO = re.compile(r"^ri-[a-z0-9-]+$")

# Cuántos días puede quedarse la narración por detrás del trabajo antes de que
# el sistema lo diga en voz alta (principio de MAD: nada muere en silencio).
DIAS_HISTORIA_RANCIA = 21

# ------------------------------------------------------ oficios públicos de la flota
# Misma doctrina que los capítulos, y por el mismo motivo. Hasta el 13/08/2026 el
# rol y la misión de cada tarjeta de /flota se copiaban TAL CUAL del vault (la
# tabla de SISTEMA-COMPLETO.md y el campo `**Misión:**` de cada vista de
# subclón). Así llegó a producción el nombre de una operación patrimonial viva,
# los nombres de las empresas y varios tecnicismos sin traducir: el escáner de
# privacidad audita el CÓDIGO y check-copy audita el CÓDIGO — ninguno de los dos
# mira un JSON de datos. Ahora la versión pública se escribe a mano en
# exporter/misiones.md, en los dos idiomas, y el texto del vault no sale nunca.
RE_OFICIO_CABECERA = re.compile(r"^###\s+([a-z]+)\s*$")
RE_OFICIO_CAMPO = re.compile(r"^(es_rol|en_rol|es_mision|en_mision|fuente):\s*(.+?)\s*$")
CAMPOS_OFICIO = ("es_rol", "en_rol", "es_mision", "en_mision")

# ------------------------------------------------------ conexiones públicas
# El mismo defecto, en otra columna: las etiquetas de buzón y agenda del vault
# («Correo <organización> <proveedor>») se publicaban tal cual en /salud y en la
# capa 2. Van contra la regla 1 de REGLAS-COPY («ni cargo, ni empresa»).
#
# La fuente curada (exporter/conexiones.md) NO puede indexarse por la etiqueta
# del vault: este repositorio es público, así que eso solo movería la etiqueta de
# la web al repo. Se indexa por un derivado corto y estable de la etiqueta, que
# el exportador recalcula en cada pasada. Si alguien renombra en el vault, la
# clave cambia, no encuentra bloque, y la fila sale SIN nombre y con aviso —
# nunca cayendo de vuelta a la etiqueta privada.
RE_CONEXION_CABECERA = re.compile(r"^###\s+([0-9a-f]{8})\s*$")
RE_CONEXION_CAMPO = re.compile(r"^(es_nombre|en_nombre):\s*(.+?)\s*$")
CAMPOS_CONEXION = ("es_nombre", "en_nombre")


def clave_conexion(etiqueta: str) -> str:
    """Derivado corto y estable de una etiqueta del vault. No es un secreto:
    su trabajo es que la etiqueta no quede PUBLICADA en un repo abierto."""
    return hashlib.sha256(etiqueta.encode("utf-8")).hexdigest()[:8]


def parse_hitos(md: str, avisos: list) -> list:
    """exporter/historia.md → lista de hitos publicables, en orden cronológico.

    Un bloque mal formado se descarta CON aviso: mejor un capítulo menos y un
    aviso visible que un hito a medias en producción."""
    hitos, actual, fecha = [], None, None

    def cerrar():
        if actual is None:
            return
        faltan = [c for c in CAMPOS_PUBLICOS if not actual.get(c)]
        if faltan:
            avisos.append(f"⚠️ historia.md: el hito {fecha} ignora campos {', '.join(faltan)}")
            return
        if actual["color"] not in COLORES_VALIDOS:
            avisos.append(f"⚠️ historia.md: color inválido en {fecha}: {actual['color']}")
            return
        if not RE_ICONO.match(actual["icono"]):
            avisos.append(f"⚠️ historia.md: icono inválido en {fecha}: {actual['icono']}")
            return
        hitos.append({"fecha": fecha, **{c: actual[c] for c in CAMPOS_PUBLICOS}})

    for linea in md.splitlines():
        cab = RE_HITO_CABECERA.match(linea)
        if cab:
            cerrar()
            fecha, actual = cab.group(1), {}
            continue
        if actual is None:
            continue
        campo = RE_HITO_CAMPO.match(linea)
        if campo:
            actual[campo.group(1)] = campo.group(2)
    cerrar()

    return sorted(hitos, key=lambda h: h["fecha"])


def parse_historia(fichero_hitos: Path, dir_handoffs: Path, hoy: date, avisos: list) -> dict:
    """Bloque `historia` de overview.json: capítulos curados + cifras contadas.

    Las bitácoras se cuentan del vault en cada pasada (nunca a mano) y la
    diferencia entre el último capítulo y la última bitácora es la medida de
    cuánto se ha quedado atrás la narración."""
    hitos = parse_hitos(read(fichero_hitos), avisos) if fichero_hitos.exists() else []
    if not fichero_hitos.exists():
        avisos.append(f"⚠️ fuente no encontrada: {fichero_hitos.name} (la historia se queda sin capítulos nuevos)")

    fechas = sorted(re.findall(r"20\d{6}", " ".join(p.name for p in dir_handoffs.glob("handoff-*.md"))))
    bitacoras = len(list(dir_handoffs.glob("handoff-*.md")))
    iso = lambda s: f"{s[0:4]}-{s[4:6]}-{s[6:8]}"

    historia = {
        "hitos": hitos,
        "bitacoras": bitacoras or None,
        "nacimiento": iso(fechas[0]) if fechas else None,
        "ultima_bitacora": iso(fechas[-1]) if fechas else None,
        "ultimo_hito": hitos[-1]["fecha"] if hitos else None,
        "dias_sin_capitulo": None,
    }

    if hitos:
        ultimo = date.fromisoformat(hitos[-1]["fecha"])
        historia["dias_sin_capitulo"] = max((hoy - ultimo).days, 0)
        if historia["dias_sin_capitulo"] > DIAS_HISTORIA_RANCIA:
            avisos.append(
                f"⚠️ la historia lleva {historia['dias_sin_capitulo']} días sin capítulo "
                f"(último {historia['ultimo_hito']}): añade un bloque a exporter/historia.md"
            )

    return historia


def preserva_historia(nueva: dict, overview_previo: Path, avisos: list) -> dict:
    """Nunca publicar una historia con MENOS capítulos de los que ya estaban.

    Misma regla que rige el vault: una ficha no sale de una escritura con menos
    contenido del que tenía. Si el .md desaparece o se rompe, producción
    conserva los capítulos del lote anterior y el aviso queda visible."""
    if not overview_previo.exists():
        return nueva
    try:
        previa = json.loads(overview_previo.read_text(encoding="utf-8")).get("historia") or {}
    except (json.JSONDecodeError, OSError):
        return nueva

    antes = previa.get("hitos") or []
    if len(antes) > len(nueva.get("hitos") or []):
        avisos.append(
            f"⚠️ historia: el lote nuevo trae {len(nueva.get('hitos') or [])} capítulos y el "
            f"anterior tenía {len(antes)} — se conservan los del lote anterior"
        )
        conservada = dict(nueva)
        conservada["hitos"] = antes
        conservada["ultimo_hito"] = antes[-1]["fecha"] if antes else None

        return conservada

    return nueva


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

# Un lote solo es fresco si sus FUENTES lo son. El 12/08/2026 el frontal enseñó durante dos
# días un «Correo Add4u M365 en rojo» y un «Briefing COO en error» que ya no existían: las dos
# tarjetas venían de ficheros del vault que llevaban horas —o días— sin regenerarse, mientras el
# lote nocturno seguía publicándolos puntualmente como si fueran de esa madrugada. El exportador
# no puede refrescarlos (es de SOLO LECTURA: quien los genera es `make data`), pero sí puede
# negarse a publicarlos en silencio. Umbral generoso: lo que se persigue es la foto de ANTEAYER,
# no un desfase de minutos.
HORAS_FUENTE_RANCIA = 24
FUENTES_VIGILADAS = {
    "Vistas-Principales/PANEL-CLON.md": "los crons y los agregados de GTD",
    "cuadros-de-mando/SISTEMA-COMPLETO.md": "el estado de accesos de correo y agenda",
}


def avisar_fuentes_rancias(s00: Path, avisos: list, ahora: datetime | None = None) -> None:
    """Delata la fuente que lleva demasiado sin regenerarse, antes de publicarla."""
    ahora = ahora or datetime.now(timezone.utc)
    for rel, que_cuenta in FUENTES_VIGILADAS.items():
        f = s00 / rel
        if not f.exists():
            continue
        horas = (ahora - datetime.fromtimestamp(f.stat().st_mtime, timezone.utc)).total_seconds() / 3600
        if horas > HORAS_FUENTE_RANCIA:
            avisos.append(
                f"⚠️ {Path(rel).name} lleva {int(horas)} h sin regenerarse: lo que este lote "
                f"publica sobre {que_cuenta} es una foto vieja, no el estado de ahora "
                f"(regenerar con `make data`, que llama al generador antes de exportar)"
            )


def main() -> int:
    ap = argparse.ArgumentParser(description="Exporta paneles del vault a JSON público-safe")
    raiz = Path(__file__).resolve().parent.parent
    ap.add_argument("--vault", default=str(raiz.parent / "MAD-brain"),
                    help="raíz del vault MAD-brain")
    ap.add_argument("--out", default=str(raiz / "web" / "public" / "data"),
                    help="directorio de salida (web/public/data)")
    ap.add_argument("--claves-conexiones", action="store_true",
                    help="imprime `clave ← etiqueta` de buzones y agendas y sale, sin escribir nada. "
                         "Sirve para mantener exporter/conexiones.md; su salida NO se pega en el repo")
    args = ap.parse_args()

    vault = Path(args.vault).expanduser().resolve()
    outdir = Path(args.out).expanduser().resolve()
    s00 = vault / "00_SISTEMA"

    avisos = []
    for rel in ["Vistas-Principales/PANEL-CLON.md", "Vistas-Principales/PANEL-TOKENS.md",
                "cuadros-de-mando/SISTEMA-COMPLETO.md", "Monitorizacion/tokens/serie-kpi.jsonl"]:
        if not (s00 / rel).exists():
            avisos.append(f"⚠️ fuente no encontrada: {rel}")
    avisar_fuentes_rancias(s00, avisos)

    overview = parse_panel_clon(read(s00 / "Vistas-Principales/PANEL-CLON.md"))
    tokens = parse_panel_tokens(read(s00 / "Vistas-Principales/PANEL-TOKENS.md"))
    sistema = parse_sistema_completo(read(s00 / "cuadros-de-mando/SISTEMA-COMPLETO.md"))
    serie = parse_serie(s00 / "Monitorizacion/tokens")

    if args.claves_conexiones:
        etiquetas = {i["nombre"] for i in sistema["integraciones"]}
        for clon in sistema["clones"]:
            etiquetas.update(filter(None, [clon.get("correo"), *clon.get("calendarios", [])]))
        for etiqueta in sorted(etiquetas):
            print(f"{clave_conexion(etiqueta)} ← {etiqueta}")

        return 0

    aplica_conexiones(sistema, avisos)
    aplica_privacidad_clones(tokens, vault, avisos)

    # El rol crudo del vault NO se publica. Su sustituto público tampoco viaja
    # por aquí: lo hornea el build desde exporter/misiones.md y se cruza por
    # `perfil`. Del dato solo salen claves y estados — lo que de verdad cambia.
    for clon in sistema["clones"]:
        clon.pop("rol", None)
    overview["salud_global"] = sistema.get("salud_global")
    overview["watchdog_ts"] = sistema.get("watchdog_ts")
    overview["historia"] = preserva_historia(
        parse_historia(raiz / "exporter" / "historia.md", s00 / "handoffs",
                       datetime.now(timezone.utc).date(), avisos),
        outdir / "overview.json", avisos)

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
