"""Bloque `retos` de overview.json: el avance de los retos que se dejan contar.

POR QUÉ EXISTE (24/09/2026, arco «cero a cien», fase 7). El escaparate tenía que
enseñar el avance real de los retos que MAD marca como públicos. El número NO se
calcula aquí: lo calcula el generador del índice del panel privado
(`panel-mad/web/scripts/indice-cero-a-cien.mjs --publico <fichero>`), que ya
escribe solo la porción pública (lista blanca, `publico: true` + `titulo_publico`,
como mucho los 5 retos con más actividad). Este módulo lo invoca, lo VALIDA y lo
copia. Si calculara un porcentaje propio habría dos números para la misma cosa, y
el día que no coincidieran la web pública mentiría (art. 27 del SDD).

Tres cerrojos, porque el camino de la fuga del 13/08 fue un JSON de datos:
  1. lista blanca de claves y tipos (una clave de más → fuera el bloque entero);
  2. cada título publicado tiene que ser, EXACTO, un `titulo_publico` que una
     ficha de `08_PLANIFICACION/RETOS/` declara con `publico: true`;
  3. dato de más de 24 h → «en revisión».
Si algo falla, el bloque dice «en revisión» y el resto del lote se publica igual
(`avisos.nota`): unos retos en revisión no congelan la salud ni la flota.
"""
from __future__ import annotations

import json
import os
import re
import shutil
import subprocess
import tempfile
from datetime import datetime, timezone
from pathlib import Path

EN_REVISION = "en revisión"
HORAS_MAXIMAS = 24
MAXIMO_RETOS = 5

CLAVES_RAIZ = {"version", "generado", "retos", "agregado"}
CLAVES_RETO = {"titulo_publico", "escala", "porcentaje", "hechos", "total", "unidad", "terminado"}
CLAVES_AGREGADO = {"vivos", "terminados", "avanceMedio", "porEscala", "diasDelMasParado"}
ESCALAS = {"horizonte", "frente", "reto", "empujon"}
UNIDADES = {"pasos", "retos", "niveles"}
VERSIONES = {1}

RE_PUBLICO = re.compile(r"^publico:\s*true\s*$", re.M)
RE_TITULO = re.compile(r"^titulo_publico:\s*(.+?)\s*$", re.M)


def en_revision() -> dict:
    return {"estado": EN_REVISION}


def titulos_declarados(vault: Path) -> set:
    """Los `titulo_publico` de las fichas con `publico: true` (solo su frontmatter)."""
    titulos = set()
    for ficha in sorted((vault / "08_PLANIFICACION" / "RETOS").glob("*.md")):
        texto = ficha.read_text(encoding="utf-8", errors="replace")
        if not texto.startswith("---"):
            continue
        fin = texto.find("\n---", 3)
        cabecera = texto[3:fin] if fin != -1 else ""
        m = RE_TITULO.search(cabecera)
        if not RE_PUBLICO.search(cabecera) or not m:
            continue
        valor = m.group(1).strip()
        if len(valor) >= 2 and valor[0] == valor[-1] and valor[0] in "\"'":
            valor = valor[1:-1]
        if valor and valor != "null":
            titulos.add(valor)
    return titulos


def _entero(v, minimo=0, maximo=None) -> bool:
    return isinstance(v, int) and not isinstance(v, bool) and v >= minimo and (maximo is None or v <= maximo)


def validar_porcion(porcion, declarados: set, ahora: datetime) -> str | None:
    """None si la porción se puede publicar tal cual; si no, el motivo (para el log, no para la web)."""
    if not isinstance(porcion, dict) or set(porcion) != CLAVES_RAIZ:
        return "la raíz no es la lista blanca exacta"
    if porcion["version"] not in VERSIONES:
        return f"versión del contrato desconocida: {porcion['version']!r}"
    try:
        generado = datetime.fromisoformat(str(porcion["generado"]).replace("Z", "+00:00"))
    except ValueError:
        return "`generado` no es una fecha"
    if generado.tzinfo is None:
        return "`generado` sin zona horaria"
    if (ahora - generado).total_seconds() > HORAS_MAXIMAS * 3600:
        return f"el dato tiene más de {HORAS_MAXIMAS} h"
    retos = porcion["retos"]
    if not isinstance(retos, list) or len(retos) > MAXIMO_RETOS:
        return "`retos` no es una lista de 5 como mucho"
    for i, r in enumerate(retos):
        if not isinstance(r, dict) or set(r) != CLAVES_RETO:
            return f"retos[{i}] no es la lista blanca exacta"
        if r["titulo_publico"] not in declarados:
            return f"retos[{i}]: título que ninguna ficha declara como público"
        if r["escala"] not in ESCALAS or r["unidad"] not in UNIDADES or not isinstance(r["terminado"], bool):
            return f"retos[{i}]: escala, unidad o terminado fuera de su dominio"
        if r["porcentaje"] is not None and not _entero(r["porcentaje"], 0, 100):
            return f"retos[{i}]: porcentaje fuera de 0-100"
        if not _entero(r["hechos"]) or not _entero(r["total"]) or r["hechos"] > r["total"]:
            return f"retos[{i}]: fracción imposible"
    agregado = porcion["agregado"]
    if agregado is not None:
        if len(retos) < 5:
            return "agregado con menos de 5 retos: una media de pocos no es una tendencia"
        if not isinstance(agregado, dict) or set(agregado) != CLAVES_AGREGADO:
            return "el agregado no es la lista blanca exacta"
        if not isinstance(agregado["porEscala"], dict) or not set(agregado["porEscala"]) <= ESCALAS:
            return "porEscala con alturas desconocidas"
        numeros = [agregado["vivos"], agregado["terminados"], *agregado["porEscala"].values()]
        numeros += [x for x in (agregado["avanceMedio"], agregado["diasDelMasParado"]) if x is not None]
        if not all(_entero(x) for x in numeros):
            return "el agregado lleva algo que no es un entero"
    return None


def generador(panel_dir: Path) -> Path | None:
    script = panel_dir / "web" / "scripts" / "indice-cero-a-cien.mjs"
    try:
        # Un panel sin el modo --publico regeneraría su índice privado en vez de escribir la porción.
        return script if "--publico" in script.read_text(encoding="utf-8") else None
    except OSError:
        return None


def node_bin() -> str:
    """El `node` que corre el generador. El refresco nocturno va por launchd, con un PATH
    sin Homebrew ni ~/.local/bin: con un `node` a secas el generador no arrancaba y el
    escaparate salía «en revisión» cada noche (24/09/2026)."""
    candidatos = [os.environ.get("NODE_BIN"), shutil.which("node"),
                  "/opt/homebrew/bin/node", str(Path.home() / ".local/bin/node"), "/usr/local/bin/node"]
    for c in candidatos:
        if c and Path(c).is_file() and os.access(c, os.X_OK):
            return c
    return "node"


def bloque_retos(vault: Path, avisos, ahora: datetime | None = None, panel_dir: Path | None = None,
                 ejecutar=subprocess.run) -> dict:
    """El bloque `overview.retos`: `{estado: 'ok', ...porción}` o `{estado: 'en revisión'}`."""
    ahora = ahora or datetime.now(timezone.utc)
    panel_dir = panel_dir or Path(os.environ.get("PANEL_MAD_DIR") or vault.parent / "panel-mad")
    script = generador(panel_dir)
    if script is None:
        avisos.nota("retos en revisión: el panel privado no tiene el generador del índice con --publico")
        return en_revision()

    with tempfile.TemporaryDirectory(prefix="retos-publicos-") as tmp:
        destino = Path(tmp) / "porcion.json"
        entorno = {**os.environ, "PANEL_VAULT": str(vault), "PANEL_WORKSPACE": str(vault.parent)}
        try:
            r = ejecutar([node_bin(), "--experimental-strip-types", str(script), "--publico", str(destino)],
                         cwd=str(script.parent.parent), env=entorno, capture_output=True, text=True, timeout=180)
            if r.returncode != 0:
                avisos.nota(f"retos en revisión: el generador salió con {r.returncode}")
                return en_revision()
            porcion = json.loads(destino.read_text(encoding="utf-8"))
        except (OSError, ValueError, subprocess.SubprocessError) as e:
            avisos.nota(f"retos en revisión: {type(e).__name__}")
            return en_revision()

    motivo = validar_porcion(porcion, titulos_declarados(vault), ahora)
    if motivo:
        avisos.nota(f"retos en revisión: {motivo}")
        return en_revision()

    # Copia literal: ni un número de aquí sale de una cuenta hecha en Python.
    return {"estado": "ok", **porcion}
