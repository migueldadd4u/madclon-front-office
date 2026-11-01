"""Whitelist de agregados; nunca exporta cuentas, rutas ni sesiones de CodexBar."""
import json
import math
import shutil
import subprocess
from datetime import datetime, timezone
from pathlib import Path


def numero(v):
    return isinstance(v, (int, float)) and not isinstance(v, bool) and math.isfinite(v) and v >= 0


def reciente(ts, now):
    try:
        age = (now - datetime.fromisoformat(ts.replace("Z", "+00:00"))).total_seconds()
        return 0 <= age <= 86400
    except (ValueError, TypeError, AttributeError):
        return False


def sanear(rows, manual=None, now=None):
    now = now or datetime.now(timezone.utc)
    out = []
    # Distintos proveedores se muestran separados: no se suman sesiones espejo.
    seen = set()
    for r in rows if isinstance(rows, list) else []:
        if not isinstance(r, dict):
            continue
        provider = r.get("provider")
        if provider not in ("codex", "claude") or provider in seen:
            continue
        if r.get("reportingPeriod") != "rolling:30" or r.get("historyDays") != 30:
            continue
        if not reciente(r.get("updatedAt"), now):
            continue
        totals = r.get("totals") or {}
        if not isinstance(totals, dict) or totals.get("provenance") != "listPriceEstimate":
            continue
        tokens, amount = r.get("last30DaysTokens"), r.get("last30DaysCostUSD")
        if not numero(tokens) or not numero(amount):
            continue
        seen.add(provider)
        out.append({"source": "CodexBar / " + provider, "observed_at": r["updatedAt"],
                    "days": 30, "tokens": tokens, "amount": amount, "currency": "USD", "manual": False})
    if isinstance(manual, dict) and reciente(manual.get("observed_at"), now):
        if (manual.get("days") == 30 and manual.get("currency") == "EUR"
                and numero(manual.get("tokens")) and numero(manual.get("amount"))):
            out.append({"source": "CodexBar / captura aportada", "observed_at": manual["observed_at"],
                        "days": 30, "tokens": manual["tokens"], "amount": manual["amount"],
                        "currency": "EUR", "manual": True, "approximate_tokens": True})
    return out


def collect(vault, now=None):
    rows, manual = [], None
    autorizacion = Path(vault) / "00_SISTEMA/agentes/panel-suscripciones/2026-11-01_codexbar_observacion.json"
    if not autorizacion.is_file():
        return []
    binary = shutil.which("codexbar")
    if not binary and Path("/opt/homebrew/bin/codexbar").is_file():
        binary = "/opt/homebrew/bin/codexbar"
    if binary:
        try:
            p = subprocess.run([binary, "cost", "--provider", "both", "--days", "30", "--json"],
                               capture_output=True, text=True, timeout=60, check=True)
            rows = json.loads(p.stdout)
        except (OSError, subprocess.SubprocessError, ValueError):
            pass
    try:
        manual = json.loads((Path(vault) / "00_SISTEMA/agentes/panel-suscripciones/2026-11-01_codexbar_observacion.json").read_text())
    except (OSError, ValueError):
        pass
    return sanear(rows, manual, now)
