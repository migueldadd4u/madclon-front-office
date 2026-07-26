# Front Office — atajos
# make data   → regenera web/public/data/*.json desde el vault (solo lectura)
# make dev    → servidor de desarrollo
# make build  → build de producción en web/dist

VAULT ?= ../MAD-brain

data:
	python exporter/export_panel.py --vault $(VAULT)

dev:
	cd web && npm run dev

build: data
	cd web && npm run build
