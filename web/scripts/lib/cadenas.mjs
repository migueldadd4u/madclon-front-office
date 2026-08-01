// Extractor común de "cadenas de copy" (texto que ve un humano) desde el código fuente.
// Lo usan check-copy.mjs (eje 5) y check-hardcode.mjs (eje 7).
// Determinista: mismo fichero → mismo resultado. Sin dependencias externas.

import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'

// Ficheros donde vive el copy propio del front office (no la plantilla Materialize).
export const RAICES_COPY = ['src/lib/i18n.tsx', 'src/app', 'src/components/dashboard']

// Un literal que NO es copy: clases, selectores, rutas, colores, valores CSS, iconos, ids.
const NO_ES_COPY = [
  /\d+(px|rem|em|vh|vw|ms|fr|deg|s)\b/, // valores CSS y duraciones
  /\bvar\(--|rgba?\(|hsla?\(|#[0-9a-fA-F]{3,8}$/, // colores y variables CSS
  /cubic-bezier|ease-|translate|scale\(|linear-gradient/, // funciones de animación
  /\b(Mui[A-Z]|ri-[a-z0-9-]+|tabler-)/, // clases de la plantilla / iconos
  /^(https?:|mailto:|\/|\.\/|\.\.\/)/, // urls y rutas
  /[{}<>]|=>|\$\{/, // trozos de código
  /\?\.|\.\w+\(|^\s*[)\]]|[;)]\s*$/, // fragmentos entre dos plantillas (`…` `…`)
  /^[A-Za-z0-9_.-]+\.(json|png|webm|mp4|svg|css|js|mjs|tsx?)$/ // nombres de fichero
]

// Lista de clases utilitarias (tailwind/MUI): todos los tokens en minúscula con guiones.
const TOKEN_CLASE = /^[a-z]+([:/-][a-z0-9./[\]%-]+)*$/

/** ¿Este literal es texto para humanos? */
export function esCopy(s) {
  // Los huecos de `reemplaza()` ({n}, {x}, {fecha}…) son copy, no código.
  const t = s.replace(/\{[a-z0-9_]+\}/gi, '§').trim()

  if (t.length < 15) return false
  if (t.split(/\s+/).length < 3) return false
  if (NO_ES_COPY.some(re => re.test(t))) return false
  if (t.split(/\s+/).every(tok => TOKEN_CLASE.test(tok))) return false

  // Tiene que tener al menos dos palabras "de idioma" (≥3 letras, minúsculas).
  const palabras = t.match(/[a-záéíóúñüA-ZÁÉÍÓÚÑÜ]{3,}/g) || []

  return palabras.length >= 3
}

/** Todos los literales de cadena de un fichero, con su nº de línea. */
export function literales(ruta) {
  const src = readFileSync(ruta, 'utf8')
  const salida = []
  // Un solo barrido: comillas simples, dobles y plantillas (sin anidar).
  // Las plantillas conservan su hueco: `${n} propuestas` → `{x} propuestas`.
  const re = /'((?:[^'\\\n]|\\.)*)'|"((?:[^"\\\n]|\\.)*)"|`((?:[^`\\]|\\.)*)`/g
  let m

  while ((m = re.exec(src)) !== null) {
    const texto = (m[1] ?? m[2] ?? m[3] ?? '').replace(/\\(['"`])/g, '$1').replace(/\$\{[^}]*\}/g, '{x}')

    if (!texto) continue

    // Lo que va en className/sx/id/key/href nunca es copy, por mucho texto que tenga.
    const antes = src.slice(Math.max(0, m.index - 24), m.index)

    if (/\b(className|class|sx|id|key|href|src|path|role|type|variant|color|component)\s*[=:]\s*$/.test(antes)) continue
    const linea = src.slice(0, m.index).split('\n').length

    salida.push({ texto, linea })
  }

  return salida
}

/** Recorre RAICES_COPY y devuelve [{fichero, linea, texto}] solo con copy real. */
export function cadenasDeCopy(base = process.cwd()) {
  const ficheros = []
  const anda = p => {
    const abs = join(base, p)
    let st

    try {
      st = statSync(abs)
    } catch {
      return
    }
    if (st.isDirectory()) readdirSync(abs).forEach(h => anda(join(p, h)))
    else if (/\.(tsx?|mjs)$/.test(p)) ficheros.push(p)
  }

  RAICES_COPY.forEach(anda)

  const out = []

  for (const f of ficheros.sort()) {
    for (const { texto, linea } of literales(join(base, f))) {
      if (esCopy(texto)) out.push({ fichero: relative('.', f), linea, texto })
    }
  }

  return out
}

/** Trocea un texto en frases (para reglas que se evalúan "en la misma frase"). */
export function frases(texto) {
  return texto
    .split(/(?<=[.!?…:;])\s+|\s+—\s+|\n/)
    .map(s => s.trim())
    .filter(Boolean)
}
