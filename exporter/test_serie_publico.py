"""serie.json con ventana: los últimos días, las medias y récords de la serie entera y su peso.

serie.json crecía un punto por noche (~485 B) y el 22/10/2026 pasó de los 64 KiB que deja
publicar public-safety.mjs: once noches sin escaparate. Desde el 01/11 viajan los últimos
VENTANA_SERIE_DIAS días (exporter/lo_reciente.py, «lo reciente manda») y, en `records` y
`medias`, las cifras que la web sacaba de recorrer la serie entera. Estas pruebas fijan el
peso (deja de crecer y no se acerca al tope) y que las medias se cuentan como las contaba la
web (el cruce exacto con los lectores de la web lo hace web/scripts/serie-publica.test.mjs).

Datos inventados; nunca toca el vault real ni web/public/data.
"""
import json
import unittest
from pathlib import Path

import export_panel as ep
from test_volcado_publico import Escenario

LR = ep._lo_reciente  # el mismo módulo que usa main()
VENTANA = LR["VENTANA_SERIE_DIAS"]


def fecha(i: int) -> str:
    """Día i a partir del 26/07/2026, como los de la serie real."""
    from datetime import date, timedelta
    return (date(2026, 7, 26) + timedelta(days=i)).isoformat()


# Cada campo con un dígito más que el máximo que alcanzó en la serie real hasta el
# 01/11/2026 (entonces el punto más pesado pesaba 487 B compactado; éste, más de 500).
KPIS_PESADOS = {"entrada_por_llamada": 999999.999, "pct_cache": 99.999, "ratio_salida_entrada": 9.999,
                "pct_local": 99.999, "pct_metered": 99.999, "pct_tokens_en_fallo": 99.999,
                "latencia_p50": 999.99, "tokens_motor_por_tarea": 9999999.999, "pct_llamadas_ok": 99.999,
                "tareas_dia": 99.999, "reintentos_por_tarea": 9.999, "pct_propuestas_atendidas": 99.999,
                "cobertura_medida": 99.999}


def punto_pesado(i: int, kpis=None) -> dict:
    """Un punto con la forma de la serie real y cifras más anchas que cualquiera de las reales."""
    return {"fecha": fecha(i), "ts": 1793536945.2325718 + i, "dias": 7,
            "contexto": {"llamadas": 99999, "tokens": 999999999, "tareas_hechas": 999,
                         "llamadas_router": 99999},
            "kpis": dict(kpis or KPIS_PESADOS)}


def punto_absurdo(i: int) -> dict:
    """Todos los KPI con diez caracteres: no ha pasado nunca, y aun así tiene que publicarse."""
    return punto_pesado(i, {k: 999999.999 for k in KPIS_PESADOS})


def intervencion_pesada(i: int) -> dict:
    return {"id": f"int-{i:06d}", "fecha": fecha(i), "ts": 1785017973.126751 + i,
            "que": "Intervención inventada de prueba con un texto tan largo como el de la real " * 2,
            "kpi": "cobertura_medida", "kpi_pedido": "cobertura_medida", "funcion": "motor",
            "propuesta": "handoff-v0.00", "notas": ""}


def linea_base() -> dict:
    return {"congelada": "2026-07-26", "ts": 1785017462.318348, "dias": 7,
            "contexto": {"llamadas": 2004, "tokens": 126253894.8572067, "tareas_hechas": 20,
                         "llamadas_router": 749},
            "kpis": {k: {"valor": v, "soporte": 2004, "nota": "nota inventada, más larga que las reales"}
                     for k, v in KPIS_PESADOS.items()}}


def historia(dias: int, intervenciones: int = 0, punto=punto_pesado) -> dict:
    return {"serie": [punto(i) for i in range(dias)], "linea_base": linea_base(),
            "intervenciones_raw": [intervencion_pesada(i) for i in range(intervenciones)]}


def peso(obj) -> int:
    return len(ep.serializa_publico(obj).encode("utf-8"))


def con_contexto(*contextos) -> list:
    return [{"fecha": fecha(i), "contexto": c} for i, c in enumerate(contextos)]


class VentanaTest(unittest.TestCase):
    def test_historia_mas_corta_que_la_ventana_sale_entera(self):
        h = historia(VENTANA - 10, intervenciones=1)
        publica = ep.ventana_serie(h)
        self.assertEqual(publica["serie"], h["serie"])
        self.assertEqual(publica["intervenciones_raw"], h["intervenciones_raw"])
        self.assertEqual(publica["linea_base"], h["linea_base"])

    def test_sale_la_cola_reciente_en_orden(self):
        h = historia(250, intervenciones=30)
        publica = ep.ventana_serie(h)
        self.assertEqual(publica["serie"], h["serie"][-VENTANA:])
        self.assertEqual(publica["serie"][-1]["fecha"], fecha(249))
        self.assertEqual(publica["intervenciones_raw"], h["intervenciones_raw"][-LR["VENTANA_INTERVENCIONES"]:])

    def test_no_toca_la_historia_que_recibe(self):
        # pulso.json y las intervenciones de tokens.json siguen leyendo la historia entera.
        h = historia(150, intervenciones=12)
        ep.ventana_serie(h)
        self.assertEqual(len(h["serie"]), 150)
        self.assertEqual(len(h["intervenciones_raw"]), 12)

    def test_el_peso_queda_acotado(self):
        # Tres años de noches con puntos más pesados que cualquiera de los reales y decenas
        # de intervenciones: el fichero no llega al aviso del 85 % que da el exportador.
        self.assertGreater(peso(punto_pesado(0)), 487)
        aviso = int(ep.TOPE_FICHERO_PUBLICO * 0.85)
        for dias in (VENTANA, 365, 1100):
            with self.subTest(dias=dias):
                self.assertLessEqual(peso(ep.ventana_serie(historia(dias, intervenciones=60))), aviso)

    def test_ni_con_cifras_absurdas_pasa_del_tope(self):
        # Si todos los KPI crecieran a diez caracteres a la vez, el exportador avisaría,
        # pero Pages seguiría publicando: nunca otra vez PUBLIC_DATA_FILE_TOO_LARGE.
        h = historia(1100, intervenciones=60, punto=punto_absurdo)
        self.assertLess(peso(ep.ventana_serie(h)), ep.TOPE_FICHERO_PUBLICO)

    def test_el_peso_deja_de_crecer(self):
        # Con la ventana llena, una noche más no añade bytes (solo pueden cambiar las
        # cifras de las medias y los récords, que no suman un punto entero).
        lleno = peso(ep.ventana_serie(historia(VENTANA + 1, intervenciones=20)))
        anios = peso(ep.ventana_serie(historia(1100, intervenciones=60)))
        self.assertLessEqual(abs(anios - lleno), 8)


class MediasTest(unittest.TestCase):
    def test_media_tokens_cuenta_cero_el_dia_sin_dato(self):
        self.assertEqual(LR["medias_serie"](con_contexto({"tokens": 10}, {}, {"tokens": 20}))["tokens"], 10)

    def test_media_previos_excluye_el_ultimo_dia_con_tokens(self):
        m = LR["medias_serie"](con_contexto({"tokens": 10}, {"tokens": 20}, {"tokens": 60}, {}))
        self.assertEqual(m["tokens_previos"], 15)
        self.assertIsNone(LR["medias_serie"](con_contexto({"tokens": 10}, {}))["tokens_previos"])

    def test_solo_cuentan_numeros(self):
        m = LR["medias_serie"](con_contexto({"tokens": 10}, {"tokens": True}, {"tokens": "x"}, {"tokens": 20}))
        self.assertEqual(m, {"tokens": 7.5, "tokens_previos": 10})

    def test_las_medias_cuentan_toda_la_serie_aunque_salga_la_cola(self):
        h = historia(250)
        h["serie"][3]["contexto"]["tokens"] = 1
        publica = ep.ventana_serie(h)
        self.assertNotIn(h["serie"][3], publica["serie"])
        self.assertEqual(publica["medias"], LR["medias_serie"](h["serie"]))
        self.assertLess(publica["medias"]["tokens"], 999999999)
        self.assertEqual(publica["desde_total"], fecha(0))

    def test_serie_vacia(self):
        publica = ep.ventana_serie({"serie": [], "linea_base": {}, "intervenciones_raw": []})
        self.assertEqual(publica["medias"], {"tokens": 0, "tokens_previos": None})
        self.assertEqual(publica["records"], {})
        self.assertEqual(publica["serie"], [])


class ExportadorTest(unittest.TestCase):
    def test_main_publica_la_ventana_y_pulso_cuenta_la_historia(self):
        esc = Escenario()
        self.addCleanup(esc.tmp.cleanup)
        tokens_dir = esc.vault / "00_SISTEMA" / "Monitorizacion" / "tokens"
        tokens_dir.mkdir(parents=True)
        h = historia(130)
        for i, p in enumerate(h["serie"]):
            p["contexto"]["tareas_hechas"] = i
            p["contexto"]["tokens"] = 1000 * (i + 1)
        (tokens_dir / "serie-kpi.jsonl").write_text("\n".join(json.dumps(p) for p in h["serie"]) + "\n",
                                                    encoding="utf-8")
        self.assertEqual(esc.exportar(), 0, esc.err.getvalue())
        lote = esc.lote()
        self.assertEqual([p["fecha"] for p in lote["serie.json"]["serie"]],
                         [p["fecha"] for p in h["serie"][-VENTANA:]])
        self.assertEqual(lote["serie.json"]["medias"], {"tokens": 65500.0, "tokens_previos": 65000.0})
        self.assertEqual(lote["serie.json"]["records"]["tareas_hechas"], {"valor": 129, "fecha": fecha(129)})
        siete = next(i for i in lote["pulso.json"]["indicators"] if i["id"] == "tareas-despachadas-7d")
        self.assertEqual(siete["value"], sum(range(123, 130)))
        texto = (Path(esc.out) / "serie.json").read_text(encoding="utf-8")
        self.assertLessEqual(len(texto.encode("utf-8")), ep.TOPE_FICHERO_PUBLICO * 0.85)


if __name__ == "__main__":
    unittest.main()
