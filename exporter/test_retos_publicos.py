"""Bloque `retos` del exportador: valida y copia; nunca calcula (arco cero-a-cien, fase 7).

Datos inventados: ningún título de aquí es de un reto real salvo el ya público por decisión de MAD.
"""
import json
import runpy
import subprocess
import tempfile
import unittest
from datetime import datetime, timedelta, timezone
from pathlib import Path

rp = runpy.run_path(str(Path(__file__).with_name("retos_publicos.py")))

AHORA = datetime(2026, 9, 24, 8, 0, tzinfo=timezone.utc)
TITULOS = ["Primer caso inventado", "Segundo caso inventado", "Tercer caso inventado", "Cuarto caso inventado", "Quinto caso inventado"]


class Avisos(list):
    def nota(self, texto):
        self.append(texto)


def reto(titulo, porcentaje=40, escala="reto"):
    return {"titulo_publico": titulo, "escala": escala, "porcentaje": porcentaje, "hechos": 2, "total": 5,
            "unidad": "pasos", "terminado": False}


def porcion(retos, agregado=None, generado=None):
    return {"version": 1, "generado": generado or (AHORA - timedelta(minutes=5)).isoformat(), "retos": retos,
            "agregado": agregado}


class Vault:
    """Un vault de prueba con fichas de reto; `publico` = lista de (titulo_publico, publico)."""

    def __init__(self, fichas):
        self.tmp = tempfile.TemporaryDirectory()
        self.vault = Path(self.tmp.name) / "MAD-brain"
        retos = self.vault / "08_PLANIFICACION" / "RETOS"
        retos.mkdir(parents=True)
        for i, (titulo, publico) in enumerate(fichas):
            (retos / f"reto-{i}.md").write_text(
                f'---\ntipo: reto\ntitulo: "Título privado {i}"\npublico: {"true" if publico else "false"}\n'
                f'titulo_publico: {json.dumps(titulo) if titulo else "null"}\n---\n\n## Pasos\n', encoding="utf-8")
        panel = Path(self.tmp.name) / "panel-mad" / "web" / "scripts"
        panel.mkdir(parents=True)
        (panel / "indice-cero-a-cien.mjs").write_text("// --publico <fich>\n", encoding="utf-8")

    def correr(self, salida, rc=0):
        """Ejecuta bloque_retos con un generador falso que escribe `salida` (dict) o nada."""
        llamadas = []

        def falso(cmd, **kw):
            llamadas.append((cmd, kw))
            if salida is not None:
                Path(cmd[cmd.index("--publico") + 1]).write_text(json.dumps(salida), encoding="utf-8")
            return subprocess.CompletedProcess(cmd, rc, "", "")

        avisos = Avisos()
        bloque = rp["bloque_retos"](self.vault, avisos, AHORA, Path(self.tmp.name) / "panel-mad", falso)
        return bloque, avisos, llamadas


class RetosPublicosTest(unittest.TestCase):
    def vault(self, fichas):
        v = Vault(fichas)
        self.addCleanup(v.tmp.cleanup)
        return v

    def test_copia_literal_de_un_reto_publico(self):
        v = self.vault([("Que el clon organice la vida en retos", True), (None, False)])
        p = porcion([reto("Que el clon organice la vida en retos", 0)])
        bloque, avisos, llamadas = v.correr(p)
        self.assertEqual(bloque, {"estado": "ok", **p})
        self.assertEqual(avisos, [])
        cmd, kw = llamadas[0]
        self.assertIn("--publico", cmd)
        self.assertEqual(kw["env"]["PANEL_VAULT"], str(v.vault))

    def test_cinco_mas_activos_con_agregado_se_copian_sin_recalcular(self):
        v = self.vault([(t, True) for t in TITULOS])
        # Un avance medio que NO es la media de los porcentajes: si el exportador recalculase, cambiaría.
        agregado = {"vivos": 5, "terminados": 0, "avanceMedio": 33, "porEscala": {"reto": 5}, "diasDelMasParado": 12}
        p = porcion([reto(t, 20 * i) for i, t in enumerate(TITULOS)], agregado)
        bloque, _, _ = v.correr(p)
        self.assertEqual(bloque["estado"], "ok")
        self.assertEqual(bloque["agregado"]["avanceMedio"], 33)
        self.assertEqual([r["titulo_publico"] for r in bloque["retos"]], TITULOS)

    def test_titulo_no_declarado_deja_en_revision(self):
        v = self.vault([("Primer caso inventado", True), ("Segundo caso inventado", False)])
        for titulo in ["Título privado 0", "Segundo caso inventado", "Primer caso inventado "]:
            bloque, avisos, _ = v.correr(porcion([reto(titulo)]))
            self.assertEqual(bloque, {"estado": "en revisión"}, titulo)
            self.assertNotIn(titulo.strip(), " ".join(avisos), "el aviso no repite el título")

    def test_clave_fuera_de_la_lista_blanca(self):
        v = self.vault([("Primer caso inventado", True)])
        r = {**reto("Primer caso inventado"), "casa": "04_IDEAS/PLAN"}
        self.assertEqual(v.correr(porcion([r]))[0], {"estado": "en revisión"})
        self.assertEqual(v.correr({**porcion([reto("Primer caso inventado")]), "piezas": []})[0]["estado"], "en revisión")

    def test_dato_viejo_version_desconocida_y_agregado_de_pocos(self):
        v = self.vault([("Primer caso inventado", True)])
        viejo = porcion([reto("Primer caso inventado")], generado=(AHORA - timedelta(hours=25)).isoformat())
        self.assertEqual(v.correr(viejo)[0]["estado"], "en revisión")
        self.assertEqual(v.correr({**porcion([]), "version": 2})[0]["estado"], "en revisión")
        pocos = porcion([reto("Primer caso inventado")], {"vivos": 1, "terminados": 0, "avanceMedio": 40,
                                                         "porEscala": {"reto": 1}, "diasDelMasParado": 1})
        self.assertEqual(v.correr(pocos)[0]["estado"], "en revisión")

    def test_generador_que_falla_o_no_existe(self):
        v = self.vault([("Primer caso inventado", True)])
        self.assertEqual(v.correr(None, rc=2)[0], {"estado": "en revisión"})
        self.assertEqual(v.correr(None)[0], {"estado": "en revisión"}, "sale 0 pero no escribe")
        avisos = Avisos()
        otro = Path(v.tmp.name) / "sin-panel"
        self.assertEqual(rp["bloque_retos"](v.vault, avisos, AHORA, otro), {"estado": "en revisión"})
        self.assertTrue(avisos)

    def test_el_exportador_no_calcula_porcentajes(self):
        fuente = Path(__file__).with_name("retos_publicos.py").read_text(encoding="utf-8")
        for prohibido in ("round(", "sum(", "/ len(", "mean("):
            self.assertNotIn(prohibido, fuente)


if __name__ == "__main__":
    unittest.main()


class NodeBinTest(unittest.TestCase):
    """Bajo launchd el PATH no trae node: el generador tiene que encontrarlo igual."""

    def test_encuentra_node_con_path_minimo(self):
        import os
        antes = os.environ.get("PATH")
        os.environ["PATH"] = "/usr/bin:/bin"
        try:
            node = rp["node_bin"]()
        finally:
            os.environ["PATH"] = antes or ""
        self.assertNotEqual(node, "node", "con PATH mínimo debe resolver una ruta absoluta")
        self.assertTrue(Path(node).is_file())

    def test_node_bin_manda(self):
        import os
        os.environ["NODE_BIN"] = "/bin/sh"
        try:
            self.assertEqual(rp["node_bin"](), "/bin/sh")
        finally:
            del os.environ["NODE_BIN"]
