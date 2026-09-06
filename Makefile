# Front Office — atajos
# make panel  → regenera los paneles del vault (fuente de los datos)
# make data   → paneles frescos + web/public/data/*.json (el exportador es solo lectura)
# make dev    → servidor de desarrollo Next.js
# make build  → datos frescos + export estático en web/out

VAULT ?= ../MAD-brain
YARN  ?= npx --yes yarn@1.22.22
# `python` a secas no existe bajo pyenv (12/08/2026: `make data` moría con «command not found»
# y nadie lo notó porque el productor llamaba al exportador a pelo). El intérprete, explícito:
PY    ?= python3
# El generador del PANEL-CLON vive en el motor, no aquí. Con su venv si existe; si no, se salta.
PANEL_GEN ?= ../services/automejora/orchestrator/panel_clon.py
PANEL_PY  ?= ../services/automejora/.venv/bin/python

# 12/08/2026: el lote nocturno exportaba PANEL-CLON.md todas las noches, pero NADIE lo
# regeneraba (`com.clonmad.panel` está sin instalar). Resultado: el frontal publicó durante
# dos días un «Briefing COO en error» que ya estaba arreglado, con fecha de esa madrugada.
# Publicar una foto vieja con fecha de hoy es peor que no publicar. Por eso `data` depende
# de `panel`: la foto se toma en el momento en que se publica.
# Best-effort a propósito: si el motor no está disponible, el lote SIGUE (mejor un dato viejo
# que ningún dato) — y el exportador mete un aviso visible en manifest.json.
panel:
	@if [ -f "$(PANEL_GEN)" ]; then \
		GEN_PY="$(PANEL_PY)"; [ -x "$$GEN_PY" ] || GEN_PY="$(PY)"; \
		echo "→ regenerando paneles del vault con $$GEN_PY"; \
		$$GEN_PY "$(PANEL_GEN)" || echo "⚠️  no se pudo regenerar el panel — se exporta lo que haya (mira los avisos)"; \
	else \
		echo "⚠️  generador no encontrado en $(PANEL_GEN) — se exporta lo que haya"; \
	fi

data: panel
	$(PY) exporter/export_panel.py --vault $(VAULT)

dev:
	cd web && $(YARN) dev

build: data
	cd web && $(YARN) build

install:
	cd web && $(YARN) install
