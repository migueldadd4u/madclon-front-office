// GENERADO — no editar a mano.
// Fuente: MAD-brain/00_SISTEMA/identidad-visual-clon/identidad.json
// Se rehace con: python3 MAD-brain/00_SISTEMA/identidad-visual-clon/repartir.py
//
// Quién es el clon que enseña esta aplicación. Para ponerle la cara a OTRO clon
// no se toca este fichero ni ninguna vista: se cambian la foto y el JSON de la
// carpeta canónica y se vuelve a repartir.

export type IdiomaIdentidad = 'es' | 'en'

export type TextosIdentidad = {
  avatarAlt: string
  retratoAlt: string

  /** Encabeza la presentación: «Este es el clon». */
  esElClon: string

  /** De quién es, con nombre y apellidos. */
  deQuien: string

  /** Quién es quién en el retrato, cuando salen dos. */
  quienEsQuien: string

  /** Honestidad obligatoria si la imagen la hizo una IA. */
  avisoIa: string
}

export type IdentidadClon = {
  schema: 'clon.identidad.v1'
  actualizado: string
  slug: string
  nombre: string

  /** Respaldo cuando no hay foto: las iniciales dentro del círculo. */
  iniciales: string

  titular: string
  titularCorto: string

  /** Cómo se le nombra en público; puede ser más corto que `titular`. */
  titularPublico: string

  /** Ruta pública SIN basePath (o null si este clon aún no tiene cara). */
  avatar: string | null
  retrato: string | null
  generadasPorIa: boolean
  textos: Record<IdiomaIdentidad, TextosIdentidad>
}

export const IDENTIDAD_CLON: IdentidadClon = {
  schema: 'clon.identidad.v1',
  actualizado: '2026-09-05',
  slug: 'clon-mad',
  nombre: 'MAD Clon',
  iniciales: 'MC',
  titular: 'Miguel Ángel Domínguez Castellano',
  titularCorto: 'MAD',
  titularPublico: 'Miguel Ángel Domínguez',
  avatar: 'identidad/avatar.png',
  retrato: 'identidad/retrato.png',
  generadasPorIa: true,
  textos: {
    es: {
      esElClon: 'Este es el clon',
      deQuien: 'El clon de Miguel Ángel Domínguez (MAD)',
      quienEsQuien: 'A la izquierda, MAD. A la derecha, su clon.',
      avatarAlt: 'Cara del clon de MAD: un androide con la cúpula craneal cromada.',
      retratoAlt:
        'Miguel Ángel Domínguez, a la izquierda, junto a su clon, a la derecha: un androide con la cúpula craneal cromada.',
      avisoIa: 'Imagen generada con IA'
    },
    en: {
      esElClon: 'This is the clone',
      deQuien: "Miguel Ángel Domínguez's (MAD) clone",
      quienEsQuien: 'On the left, MAD. On the right, his clone.',
      avatarAlt: "The face of MAD's clone: an android with a chrome skull dome.",
      retratoAlt:
        'Miguel Ángel Domínguez, on the left, next to his clone, on the right: an android with a chrome skull dome.',
      avisoIa: 'AI-generated image'
    }
  }
}

/** Los textos del idioma pedido, con el español de respaldo. */
export const textosIdentidad = (lang: IdiomaIdentidad = 'es'): TextosIdentidad =>
  IDENTIDAD_CLON.textos[lang] ?? IDENTIDAD_CLON.textos.es
