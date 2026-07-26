# Front Office — atajos
# make data   → regenera web/public/data/*.json desde el vault (solo lectura)
# make dev    → servidor de desarrollo Next.js
# make build  → datos frescos + export estático en web/out

VAULT ?= ../MAD-brain
YARN  ?= npx --yes yarn@1.22.22

data:
	python exporter/export_panel.py --vault $(VAULT)

dev:
	cd web && $(YARN) dev

build: data
	cd web && $(YARN) build

install:
	cd web && $(YARN) install
