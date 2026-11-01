"""Volcado atómico del lote: o salen los seis JSON nuevos, o se quedan los seis de antes.

El exportador escribía los seis ficheros uno a uno sobre web/public/data. Un fallo a
mitad (un dato que no se serializa, el disco lleno, un kill) dejaba un lote MEZCLADO:
manifest de hoy con tokens de ayer, que el refresco nocturno podía commitear y publicar.
Mismo principio que la configuración de la sede de GestDoc: se sustituye entera de golpe,
nunca a medias.

Todo con un vault de prueba vacío y datos inventados; nunca toca el vault real ni el
web/public/data del repo.
"""
import io
import json
import os
import stat
import sys
import tempfile
import unittest
from contextlib import redirect_stderr, redirect_stdout
from pathlib import Path
from unittest.mock import patch

import export_panel as ep

NOMBRES = ["manifest.json", "overview.json", "clones.json", "tokens.json", "serie.json", "pulso.json"]
ANTERIOR = {"lote": "anterior"}


class Escenario:
    """Vault de prueba (vacío), fichero de vetados inventado y un lote anterior en disco."""

    def __init__(self):
        self.tmp = tempfile.TemporaryDirectory()
        raiz = Path(self.tmp.name)
        self.vault = raiz / "MAD-brain"
        (self.vault / "00_SISTEMA").mkdir(parents=True)
        self.vetados = raiz / "vetados.txt"
        self.vetados.write_text("# de prueba\ntermino-vetado-de-prueba\n", encoding="utf-8")
        self.out = raiz / "web" / "public" / "data"
        self.out.mkdir(parents=True)
        for n in NOMBRES:
            (self.out / n).write_text(json.dumps({**ANTERIOR, "fichero": n}), encoding="utf-8")
        self.out.chmod(0o755)

    def exportar(self, *parches):
        argv = ["export_panel.py", "--vault", str(self.vault), "--out", str(self.out)]
        self.err = io.StringIO()
        with patch.object(sys, "argv", argv), \
                patch.dict(os.environ, {"FO_TERMINOS_VETADOS": str(self.vetados)}), \
                patch.object(ep, "collect_public_hardware", lambda: {"version": 1, "hosts": []}), \
                patch.object(ep, "bloque_retos", lambda vault, avisos: {"estado": "en revisión"}), \
                redirect_stderr(self.err), redirect_stdout(io.StringIO()):
            for p in parches:
                p.start()
            try:
                return ep.main()
            except Exception as exc:  # el código viejo dejaba escapar la excepción
                return exc
            finally:
                for p in reversed(parches):
                    p.stop()

    def lote(self):
        return {n: json.loads((self.out / n).read_text(encoding="utf-8")) for n in NOMBRES}

    def hermanos(self):
        return sorted(p.name for p in self.out.parent.iterdir())


def tokens_con_basura():
    """parse_panel_tokens real + un valor que json.dumps no sabe escribir (el 4.º fichero)."""
    real = ep.parse_panel_tokens

    def falso(md):
        return {**real(md), "no_serializable": object()}
    return patch.object(ep, "parse_panel_tokens", falso)


class VolcadoAtomicoTest(unittest.TestCase):
    def escenario(self):
        e = Escenario()
        self.addCleanup(e.tmp.cleanup)
        return e

    def assertLoteAnteriorIntacto(self, e):
        for n, doc in e.lote().items():
            self.assertEqual(doc, {**ANTERIOR, "fichero": n}, f"{n} cambió: el lote quedó mezclado")
        self.assertEqual(sorted(p.name for p in e.out.iterdir()), sorted(NOMBRES))
        self.assertEqual(e.hermanos(), ["data"], "quedó una carpeta temporal junto a data/")

    def test_fallo_a_mitad_del_volcado_no_deja_lote_mezclado(self):
        e = self.escenario()
        rc = e.exportar(tokens_con_basura())
        self.assertNotEqual(rc, 0)
        self.assertLoteAnteriorIntacto(e)

    def test_disco_que_falla_al_escribir_el_cuarto(self):
        e = self.escenario()
        real = ep.escribe_json

        def falla_en_tokens(ruta, obj):
            if ruta.name == "tokens.json":
                raise OSError(28, "No space left on device")
            return real(ruta, obj)
        rc = e.exportar(patch.object(ep, "escribe_json", falla_en_tokens))
        self.assertNotEqual(rc, 0)
        self.assertIn("intactos", e.err.getvalue())
        self.assertLoteAnteriorIntacto(e)

    def test_lo_escrito_se_relee_y_si_no_parsea_no_se_publica(self):
        e = self.escenario()
        real = ep.escribe_json

        def trunca_clones(ruta, obj):
            real(ruta, obj)
            if ruta.name == "clones.json":
                ruta.write_text(ruta.read_text(encoding="utf-8")[:10], encoding="utf-8")
        rc = e.exportar(patch.object(ep, "escribe_json", trunca_clones))
        self.assertNotEqual(rc, 0)
        self.assertLoteAnteriorIntacto(e)

    def test_lo_escrito_se_vuelve_a_escanear_antes_de_publicar(self):
        e = self.escenario()
        real = ep.escribe_json

        def cuela_un_correo(ruta, obj):
            real(ruta, obj)
            if ruta.name == "serie.json":
                ruta.write_text(json.dumps({"serie": [], "linea_base": {}, "x": "canario.inventado@ejemplo.invalid"}),
                                encoding="utf-8")
        rc = e.exportar(patch.object(ep, "escribe_json", cuela_un_correo))
        self.assertNotEqual(rc, 0)
        self.assertLoteAnteriorIntacto(e)

    def test_falla_el_intercambio_de_carpetas(self):
        e = self.escenario()

        def roto(a, b):
            raise OSError(5, "Input/output error")
        rc = e.exportar(patch.object(ep, "intercambia_directorios", roto))
        self.assertNotEqual(rc, 0)
        self.assertLoteAnteriorIntacto(e)

    def test_sin_intercambio_atomico_falla_el_tercer_reemplazo_y_se_deshace(self):
        e = self.escenario()
        real = os.replace
        llamadas = []

        def replace_que_falla(a, b):
            llamadas.append(Path(b).name)
            if len(llamadas) == 3:
                raise OSError(5, "Input/output error")
            return real(a, b)
        rc = e.exportar(patch.object(ep, "intercambia_directorios", lambda a, b: False),
                        patch.object(ep.os, "replace", replace_que_falla))
        self.assertNotEqual(rc, 0)
        self.assertGreaterEqual(len(llamadas), 3)
        self.assertLoteAnteriorIntacto(e)

    def test_volcado_correcto_sustituye_el_lote_entero(self):
        for atomico in (True, False):
            with self.subTest(intercambio_atomico=atomico):
                e = self.escenario()
                parches = [] if atomico else [patch.object(ep, "intercambia_directorios", lambda a, b: False)]
                rc = e.exportar(*parches)
                self.assertEqual(rc, 0, e.err.getvalue())
                lote = e.lote()
                self.assertTrue(all("lote" not in doc for doc in lote.values()), "quedó algún fichero viejo")
                self.assertEqual(lote["manifest.json"]["version"], 1)
                self.assertEqual(sorted(p.name for p in e.out.iterdir()), sorted(NOMBRES))
                self.assertEqual(e.hermanos(), ["data"])
                self.assertEqual(stat.S_IMODE(e.out.stat().st_mode), 0o755, "data/ cambió de permisos")

    def test_primera_vez_sin_carpeta_previa(self):
        e = self.escenario()
        for n in NOMBRES:
            (e.out / n).unlink()
        e.out.rmdir()
        self.assertEqual(e.exportar(), 0, e.err.getvalue())
        self.assertEqual(sorted(p.name for p in e.out.iterdir()), sorted(NOMBRES))
        self.assertEqual(e.hermanos(), ["data"])

    def test_barre_temporales_de_una_pasada_que_murio(self):
        e = self.escenario()
        for resto in (".data-nuevo-muerto", ".data-viejo-muerto"):
            (e.out.parent / resto).mkdir()
            (e.out.parent / resto / "tokens.json").write_text("{}", encoding="utf-8")
        (e.out.parent / ".otra-cosa").mkdir()  # lo que no es nuestro no se toca
        self.assertEqual(e.exportar(), 0, e.err.getvalue())
        self.assertEqual(e.hermanos(), [".otra-cosa", "data"])


if __name__ == "__main__":
    unittest.main()
