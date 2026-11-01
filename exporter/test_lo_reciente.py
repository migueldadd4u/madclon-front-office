"""Guardias de «Lo reciente manda» en el escaparate (orden de MAD, 01/11/2026).

    python3 -m unittest discover -s exporter -p test_lo_reciente.py
"""
import json
import runpy
import tempfile
import unittest
from datetime import date
from pathlib import Path

M = runpy.run_path(str(Path(__file__).with_name("lo_reciente.py")))
HOY = date(2026, 11, 1)


class Movimiento(unittest.TestCase):
    def test_revisada_por_mad_no_rejuvenece(self):
        linea = "- [ ] **Olot: GO a IVAL** (revisada por MAD 2026-10-31) ⟵ ^26092808421062"
        self.assertEqual(M["fechas_de_movimiento"](linea, HOY), [date(2026, 9, 28)])

    def test_la_captura_enlazada_despues_si_cuenta(self):
        linea = "- [ ] Fran (pedida por MAD 2026-09-18) ⟵ ^26091802545586 ⟵ también ^26102903134030"
        self.assertEqual(max(M["fechas_de_movimiento"](linea, HOY)), date(2026, 10, 29))

    def test_franjas_como_el_registro(self):
        del_dia = M["es_del_dia"]
        self.assertTrue(del_dia([date(2026, 10, 18)], None, HOY), "14 días: aún del día")
        self.assertFalse(del_dia([date(2026, 10, 17)], None, HOY), "15 días: parada")
        self.assertTrue(del_dia([date(2026, 7, 1)], date(2026, 11, 5), HOY), "vence esta semana: del día")
        self.assertTrue(del_dia([], None, HOY), "sin fecha no se esconde")

    def test_mismos_umbrales_que_el_panel(self):
        candidatos = [p / "panel-mad/web/src/lib/lo-reciente.ts" for p in Path(__file__).resolve().parents]
        panel = next((c for c in candidatos if c.exists()), None)
        if panel is None:
            self.skipTest("panel-mad no está al lado (CI): la guardia corre en el Mac")
        ts = panel.read_text(encoding="utf-8")
        self.assertIn(f"nuevoDias: {M['NUEVO_DIAS']},", ts)
        self.assertIn(f"paradoDias: {M['PARADO_DIAS']},", ts)
        self.assertIn(f"plazoCercaDias: {M['PLAZO_CERCA_DIAS']},", ts)


class Listas(unittest.TestCase):
    def test_recuentos_del_dia_y_parados_sin_textos(self):
        with tempfile.TemporaryDirectory() as d:
            v = Path(d)
            gtd = v / "08_PLANIFICACION/GTD"
            gtd.mkdir(parents=True)
            (v / "00_SISTEMA").mkdir()
            (gtd / "QUE-NECESITO.md").write_text(
                "# x\n\n## 🗂 Bandeja\n"
                "- [ ] 2026-06-21 12:44 · whatsapp · ejemplo ^ejemplo\n"
                "- [ ] 2026-10-31 09:00 · cc · nueva ^26103109000000\n"
                "- [ ] 2026-09-01 09:00 · cc · vieja ^26090109000000\n"
                "- [x] 2026-10-31 09:00 · cc · hecha\n", encoding="utf-8")
            (gtd / "ACCIONES.md").write_text(
                "## 🔥 HOY\n"
                "- [ ] Café con Alberto (revisada por MAD 2026-10-31) ⟵ ^26092803023533\n"
                "- [ ] Criptocalculadora (pedida por MAD 2026-10-26)\n"
                "## 📅 Con fecha\n- [ ] Otra (pedida por MAD 2026-10-30)\n", encoding="utf-8")
            (gtd / "ESPERANDO.md").write_text(
                "| Desde | Qué espero | De quién | Para | Reclamar si… |\n|---|---|---|---|---|\n"
                "| 2026-07-01 | Nota simple | Notaría | Peñuca | si no llega antes del 2026-07-21 |\n"
                "| 2026-10-20 | Oferta | Banco | Casa | si no llega antes del 2026-10-30 |\n"
                "| 2026-10-20 | Futura | Banco | Casa | si no llega antes del 2026-12-30 |\n"
                "| 2026-07-01 | ~~Cerrada~~ | X | Y | 2026-07-02 |\n", encoding="utf-8")
            (v / "00_SISTEMA/DECISIONES-PENDIENTES.md").write_text(
                "## 1. Vieja\nEstado: pendiente de MAD\nDesde cuando espera: 2026-06-20.\n\n"
                "## 2. Nueva\nEstado: pendiente de MAD\nDesde cuando espera: 2026-10-25.\n\n"
                "## 3. Hecha\nEstado: DECIDIDA\nDesde cuando espera: 2026-10-25.\n", encoding="utf-8")
            (gtd / "PROPUESTAS.md").write_text(
                "# 🤝 PROPUESTAS\n\n## 2026-07-07 · 2 propuesta(s)\n<!-- generado: proponedor -->\n"
                "- [ ] **P0707-01 · 🟡 gtd** Vieja propuesta\n      evidencia: x · acción: y\n"
                "- [ ] **P0707-02 · 🟡 personas** Curar lote de fichas\n"
                "      evidencia: 07_PERSONAS/_promovidas-GLM/ · acción: OK (id: personas:promovidas-glm)\n\n"
                "## 2026-10-30 · 2 propuesta(s)\n"
                "- [ ] **P1030-01 · 🟢 gtd** Reciente\n"
                "- [x] **P1030-02 · 🟢 gtd** Aprobada\n", encoding="utf-8")
            (v / "07_PERSONAS/_promovidas-GLM").mkdir(parents=True)
            (v / "07_PERSONAS/_promovidas-GLM/_LEEME.md").write_text("vacío", encoding="utf-8")

            r = M["gtd_lo_reciente"](v, HOY)

        self.assertEqual(r["umbral_dias"], 14)
        self.assertEqual(r["bandeja"], {"del_dia": 1, "parados": 1})
        self.assertEqual(r["acciones_hoy"], {"del_dia": 1, "parados": 1})
        self.assertEqual(r["esperas_vencidas"], {"del_dia": 1, "parados": 1})
        self.assertEqual(r["decisiones"], {"del_dia": 1, "parados": 1})
        # La del lote vacío no cuenta (como en el panel); la aprobada tampoco.
        self.assertEqual(r["propuestas"], {"del_dia": 1, "parados": 1})
        texto = json.dumps(r, ensure_ascii=False)
        for palabra in ("Café", "Notaría", "Oferta", "Vieja", "nueva", "Curar", "Aprobada"):
            self.assertNotIn(palabra, texto, "solo recuentos: ni un texto cruza a lo público")

    def test_lista_ilegible_no_es_cero(self):
        with tempfile.TemporaryDirectory() as d:
            r = M["gtd_lo_reciente"](Path(d), HOY)
        self.assertEqual(r, {"umbral_dias": 14})


class Serie(unittest.TestCase):
    def test_ventana_y_records_de_la_serie_entera(self):
        puntos = [{"fecha": f"2026-{m:02d}-{d:02d}", "contexto": {"tokens": t, "tareas_hechas": 1, "llamadas": 1}}
                  for (m, d, t) in [(7, 26, 9_000_000), (8, 15, 1), (9, 10, 2), (10, 20, 3), (11, 1, 4)]]
        s = M["ventana_serie"]({"serie": puntos, "linea_base": {}, "intervenciones_raw": []}, dias=60)
        self.assertEqual([p["fecha"] for p in s["serie"]], ["2026-09-10", "2026-10-20", "2026-11-01"])
        self.assertEqual(s["records"]["tokens"], {"valor": 9_000_000, "fecha": "2026-07-26"},
                         "el récord de julio sobrevive a la ventana")
        self.assertEqual(s["desde_total"], "2026-07-26")
        self.assertEqual(s["ventana_dias"], 60)

    def test_la_serie_publica_cabe_y_no_crece(self):
        punto = {"fecha": "", "ts": 1.0, "dias": 7, "contexto": {"llamadas": 2161, "tokens": 62247621, "tareas_hechas": 40,
                 "llamadas_router": 704}, "kpis": {f"k{i}": 12.345 for i in range(13)}}
        largos = []
        for n in (99, 365):
            puntos = [{**punto, "fecha": date.fromordinal(HOY.toordinal() - n + 1 + i).isoformat()} for i in range(n)]
            s = M["ventana_serie"]({"serie": puntos, "linea_base": {}, "intervenciones_raw": []})
            largos.append(len(json.dumps(s, ensure_ascii=False, indent=2).encode()))
        self.assertLess(max(largos), 64 * 1024, "por debajo del tope de la puerta de seguridad pública")
        self.assertLess(abs(largos[0] - largos[1]), 200, "con un año de serie pesa lo mismo que con tres meses")


if __name__ == "__main__":
    unittest.main()
