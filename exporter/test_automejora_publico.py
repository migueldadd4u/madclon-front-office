"""Guardia del bloque de automejora del escaparate (22/11/2026).

La vista del sistema dejó de escribir «pendientes» en la línea «Cola:». El patrón del
exportador lo exigía, así que el bloque entero salió vacío y la web publicó «undefined
mejoras aplicadas» en la portada. La cifra es opcional: si no viene sale None y las demás
siguen saliendo.

    python3 -m unittest discover -s exporter -p test_automejora_publico.py
"""
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

import export_panel as ep  # noqa: E402

CON_PENDIENTES = "- Cola: 12 hechas · 3 bloqueadas · 40 aparcadas · 5 pendientes · llamadas 1.234 · **metered: 0** · top: uno 7, otro 2\n"
SIN_PENDIENTES = "- Cola: 12 hechas · 3 bloqueadas · 40 aparcadas · llamadas 1.234 · **metered: 0** · top: uno 7, otro 2\n"


class Automejora(unittest.TestCase):
    def test_la_linea_de_siempre_sigue_saliendo_entera(self):
        a = ep.parse_panel_clon(CON_PENDIENTES)["automejora"]
        self.assertEqual(a, {"hechas": 12, "bloqueadas": 3, "aparcadas": 40, "pendientes": 5,
                             "llamadas": 1234, "metered": 0, "top": "uno 7, otro 2"})

    def test_sin_pendientes_el_bloque_no_sale_vacio(self):
        a = ep.parse_panel_clon(SIN_PENDIENTES)["automejora"]
        self.assertEqual(a["hechas"], 12)
        self.assertEqual(a["bloqueadas"], 3)
        self.assertEqual(a["aparcadas"], 40)
        self.assertIsNone(a["pendientes"], "una cifra que no viene es None, nunca un cero inventado")
        self.assertEqual(a["llamadas"], 1234)
        self.assertEqual(a["top"], "uno 7, otro 2")

    def test_sin_linea_el_bloque_queda_vacio_y_no_inventa(self):
        self.assertEqual(ep.parse_panel_clon("# vista sin cola\n")["automejora"], {})


if __name__ == "__main__":
    unittest.main()
