"""Privacidad del productor: el escáner del exportador caza lo mismo que el del gate.

Los canarios son SINTÉTICOS y comunes a los dos lados (exporter/canarios-privacidad.json):
este test los pasa por `audit_privacidad`; web/scripts/public-safety.test.mjs, por el gate.

Los términos vetados reales no viven aquí: el repo es público y una lista de vetados
escrita en una guardia publica justo lo que veta. Se leen de un fichero externo
(FO_TERMINOS_VETADOS o <vault>/00_SISTEMA/front-office/terminos-vetados.txt). Los
tests usan uno inventado; el único que lee el fichero real es el que comprueba que
ningún término vetado aparece en el repo, y ese se salta donde el fichero no existe
(GitHub Actions). Ningún mensaje de fallo imprime un término.
"""
import io
import json
import os
import subprocess
import sys
import tempfile
import unittest
from contextlib import redirect_stderr, redirect_stdout
from pathlib import Path
from unittest.mock import patch

import export_panel as ep

AQUI = Path(__file__).resolve().parent
RAIZ = AQUI.parent
CANARIOS = json.loads((AQUI / "canarios-privacidad.json").read_text(encoding="utf-8"))
VETADOS_DE_PRUEBA = CANARIOS["vetados_de_prueba"]


def fichero_vetados_real():
    """El fichero real, si está en esta máquina: el de la variable o el de ../MAD-brain."""
    env = os.environ.get("FO_TERMINOS_VETADOS")
    ruta = Path(env).expanduser() if env else RAIZ.parent / "MAD-brain" / "00_SISTEMA" / "front-office" / "terminos-vetados.txt"
    return ruta if ruta.is_file() else None


def auditar(obj, requiere_vetados=False):
    if requiere_vetados:
        return ep.audit_privacidad(obj, vetados=VETADOS_DE_PRUEBA)
    return ep.audit_privacidad(obj)


class CanariosComunesTest(unittest.TestCase):
    def test_cada_canario_se_caza_como_valor(self):
        for c in CANARIOS["detectar"]:
            with self.subTest(c["tipo"]):
                self.assertTrue(auditar({"campo": c["valor"]}, c.get("requiere_vetados", False)),
                                f"el escáner del exportador no caza: {c['tipo']}")

    def test_cada_canario_se_caza_como_clave(self):
        # El gate lee el JSON entero, claves incluidas; el productor tiene que ver lo mismo.
        for c in CANARIOS["detectar"]:
            with self.subTest(c["tipo"]):
                self.assertTrue(auditar({"filas": [{c["valor"]: 1}]}, c.get("requiere_vetados", False)),
                                f"el escáner del exportador no caza como clave: {c['tipo']}")

    def test_lo_limpio_no_bloquea(self):
        for c in CANARIOS["limpios"]:
            with self.subTest(c["tipo"]):
                self.assertEqual(ep.audit_privacidad({"campo": c["valor"]}, vetados=VETADOS_DE_PRUEBA), [])

    def test_el_vetado_no_se_inventa_sin_lista(self):
        vetado = next(c for c in CANARIOS["detectar"] if c.get("requiere_vetados"))
        self.assertEqual(ep.audit_privacidad({"campo": vetado["valor"]}, vetados=[]), [])


class TerminosVetadosTest(unittest.TestCase):
    def setUp(self):
        tmp = tempfile.TemporaryDirectory()
        self.addCleanup(tmp.cleanup)
        self.dir = Path(tmp.name)

    def test_lee_un_termino_por_linea_sin_comentarios(self):
        f = self.dir / "vetados.txt"
        f.write_text("# cabecera\n\n  Uno-Inventado  \n# otro comentario\ndos-inventado\n", encoding="utf-8")
        self.assertEqual(ep.cargar_terminos_vetados(f), ["uno-inventado", "dos-inventado"])

    def test_sin_fichero_o_sin_terminos_falla_cerrado(self):
        with self.assertRaises(ep.SinTerminosVetados):
            ep.cargar_terminos_vetados(self.dir / "no-existe.txt")
        vacio = self.dir / "vacio.txt"
        vacio.write_text("# solo cabecera\n\n", encoding="utf-8")
        with self.assertRaises(ep.SinTerminosVetados):
            ep.cargar_terminos_vetados(vacio)

    def test_ruta_por_variable_o_por_vault(self):
        vault = self.dir / "MAD-brain"
        with patch.dict(os.environ, {"FO_TERMINOS_VETADOS": str(self.dir / "otro.txt")}):
            self.assertEqual(ep.ruta_terminos_vetados(vault), self.dir / "otro.txt")
        with patch.dict(os.environ, {}, clear=False):
            os.environ.pop("FO_TERMINOS_VETADOS", None)
            self.assertEqual(ep.ruta_terminos_vetados(vault),
                             vault / "00_SISTEMA" / "front-office" / "terminos-vetados.txt")

    def test_una_fila_por_clon_con_termino_vetado_se_redacta(self):
        tokens = {"por_clon": [{"clon": "ceo", "tokens": 5, "llamadas": 1, "modelos": "m"},
                               {"clon": "Termino-Vetado-De-Prueba", "tokens": 7, "llamadas": 2, "modelos": "x"}]}
        avisos = ep.Avisos()
        ep.aplica_privacidad_clones(tokens, self.dir / "vault-sin-sitios", avisos, vetados=VETADOS_DE_PRUEBA)
        self.assertEqual([f["clon"] for f in tokens["por_clon"]], ["ceo", "privado"])
        self.assertEqual(tokens["por_clon"][1]["tokens"], 7)
        self.assertEqual(ep.audit_privacidad(tokens, vetados=VETADOS_DE_PRUEBA), [])

    def exportar(self, vetados, *extra, hardware=None, retos=None):
        """main() contra un vault vacío de prueba; nunca el real ni web/public/data."""
        self.out = self.dir / "web" / "public" / "data"
        self.out.mkdir(parents=True, exist_ok=True)
        (self.out / "manifest.json").write_text('{"lote": "anterior"}', encoding="utf-8")
        argv = ["export_panel.py", "--vault", str(self.dir / "MAD-brain"), "--out", str(self.out), *extra]
        self.err = io.StringIO()
        with patch.object(sys, "argv", argv), \
                patch.dict(os.environ, {"FO_TERMINOS_VETADOS": str(vetados)}), \
                patch.object(ep, "collect_public_hardware", hardware or (lambda: {"version": 1, "hosts": []})), \
                patch.object(ep, "bloque_retos", retos or (lambda vault, avisos: {"estado": "en revisión"})), \
                redirect_stderr(self.err), redirect_stdout(io.StringIO()):
            return ep.main()

    def test_el_exportador_sin_fichero_no_escribe_nada(self):
        def no_debia_llegar():
            raise AssertionError("no debía llegar aquí")
        rc = self.exportar(self.dir / "no-existe.txt", hardware=no_debia_llegar)
        self.assertNotEqual(rc, 0)
        self.assertIn("FO_TERMINOS_VETADOS", self.err.getvalue())
        self.assertEqual(sorted(p.name for p in self.out.iterdir()), ["manifest.json"])
        self.assertEqual((self.out / "manifest.json").read_text(encoding="utf-8"), '{"lote": "anterior"}')

    def test_modo_prueba_sin_vetados_exporta_pero_marca_el_lote_como_no_publicable(self):
        rc = self.exportar(self.dir / "no-existe.txt", "--prueba-sin-vetados")
        self.assertEqual(rc, 0, self.err.getvalue())
        manifest = json.loads((self.out / "manifest.json").read_text(encoding="utf-8"))
        self.assertTrue(any("términos vetados" in a for a in manifest["avisos_bloqueantes"]))

    def test_un_termino_vetado_en_cualquier_campo_bloquea_sin_escribir(self):
        f = self.dir / "vetados.txt"
        f.write_text("\n".join(VETADOS_DE_PRUEBA) + "\n", encoding="utf-8")
        rc = self.exportar(f, retos=lambda vault, avisos: {"estado": "ok", "retos": [
            {"titulo_publico": "Reto de Termino-Vetado-De-Prueba"}]})
        self.assertEqual(rc, 2)
        self.assertIn("término vetado", self.err.getvalue())
        self.assertNotIn(VETADOS_DE_PRUEBA[0], self.err.getvalue().lower(), "el aviso hace eco del término")
        self.assertEqual((self.out / "manifest.json").read_text(encoding="utf-8"), '{"lote": "anterior"}')


class RepoSinTerminosVetadosTest(unittest.TestCase):
    """Ningún fichero versionado del repo público contiene un término vetado."""

    @unittest.skipUnless(fichero_vetados_real(), "sin fichero de términos vetados en esta máquina (CI)")
    def test_ningun_fichero_versionado_lleva_un_termino_vetado(self):
        # Lectura propia, sin pasar por el exportador: este test vigila también al exportador.
        terminos = [ln.strip().lower() for ln in fichero_vetados_real().read_text(encoding="utf-8").splitlines()
                    if ln.strip() and not ln.strip().startswith("#")]
        self.assertTrue(terminos, "el fichero de términos vetados no tiene ninguno")
        nombres = subprocess.run(["git", "ls-files", "-z"], cwd=RAIZ, capture_output=True, check=True).stdout
        sucios = []
        for nombre in filter(None, nombres.decode("utf-8").split("\0")):
            ruta = RAIZ / nombre
            if not ruta.is_file():
                continue
            texto = ruta.read_bytes().decode("utf-8", errors="ignore").lower()
            sucios += [f"{nombre} (término nº {i + 1} del fichero)" for i, t in enumerate(terminos) if t in texto]
        self.assertEqual(sucios, [], "términos vetados en claro en el repo público")


if __name__ == "__main__":
    unittest.main()
