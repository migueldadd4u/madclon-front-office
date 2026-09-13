'use client'

// Bienvenida del escaparate público.
//
// Hereda el lenguaje visual del inicio privado (panel-mad · DashboardInicio):
// fondo oscuro con órbita, un titular grande y apretado, una sola frase y UN
// gesto principal. Lo que P-01 dejó dicho no cambia — quién es el clon, para
// qué sirve y qué se puede explorar —; cambia el peso visual de cada cosa.
//
// Referencias Mobbin consultadas el 13/09 (Claude web, Uber web): la acción
// principal es lo único con color sólido y todo lo demás baja de peso.

import Link from 'next/link'

import { TarjetaDelClon } from '@/components/identidad/CaraDelClon'

import { useLang } from '@/lib/i18n'

import styles from './HeroClon.module.css'

type Props = {
  /** Fecha de generación del lote, ya formateada y con su etiqueta. */
  frescura: string
}

const HeroClon = ({ frescura }: Props) => {
  const { t } = useLang()

  return (
    <header className={styles.hero} data-bienvenida>
      <div className={styles.orbita} aria-hidden='true'>
        <span />
        <span />
        <span />
        <b>m.</b>
      </div>

      <div className={styles.contenido}>
        <p className={styles.eyebrow}>
          <span className={styles.punto} aria-hidden='true' />
          <span className={styles.fecha}>{frescura}</span>
        </p>

        <TarjetaDelClon compacta />

        <h1 className={styles.titulo}>{t('home_titulo')}</h1>

        <p className={styles.subtitulo}>{t('home_resumen')}</p>

        <div className={styles.acciones}>
          <Link href='/retos/' className={styles.primaria} data-bienvenida-explorar>
            {t('home_explorar')}
            <i className='ri-arrow-right-line' aria-hidden='true' />
          </Link>
          <a href='#como-funciona' className={styles.secundaria}>
            {t('home_como')}
          </a>
        </div>

        <p className={styles.pie}>{t('home_caption_datos')}</p>
      </div>
    </header>
  )
}

export default HeroClon
