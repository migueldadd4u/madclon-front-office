'use client'

// React Imports
import { useEffect, useRef, useState } from 'react'

// «Hero ambiental» — fondo vivo de la tarjeta de bienvenida, en tres capas:
//  1. Póster estático (siempre presente): cielo nocturno indigo→teal con la
//     constelación de la marca, generado por exporter/hero_poster.py.
//  2. Auroras en canvas: tres masas de color de marca derivando despacio.
//     Se apagan con prefers-reduced-motion, con la pestaña oculta y cuando el
//     vídeo toma el relevo.
//  3. Slot de vídeo opcional: si existen /media/hero-loop.webm|mp4 (clip en
//     loop generado con Seedance u similar), entra con un fundido y sustituye
//     al canvas. Si no existen (hoy), el fallo se traga y queda la aurora.
// Todo es decorativo (aria-hidden): no añade contenido, solo atmósfera.

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? ''

// Burbujas de la aurora: [color RGB, x, y, radio, deriva, fase]
const BURBUJAS: Array<[string, number, number, number, number, number]> = [
  ['122,127,255', 0.18, 0.22, 0.42, 0.09, 0.0],
  ['78,143,232', 0.60, 0.55, 0.50, 0.07, 2.1],
  ['6,201,168', 0.88, 0.85, 0.44, 0.08, 4.2],
  ['122,127,255', 0.38, 0.95, 0.30, 0.06, 1.3]
]

const HeroAmbiental = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const [hayVideo, setHayVideo] = useState(false)
  const [videoListo, setVideoListo] = useState(false)
  const [videoFallo, setVideoFallo] = useState(false)
  const [quieto, setQuieto] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )

  // prefers-reduced-motion: sin canvas animado ni vídeo; el póster basta
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')

    setQuieto(mq.matches)
    const alCambiar = (e: MediaQueryListEvent) => setQuieto(e.matches)

    mq.addEventListener('change', alCambiar)

    return () => mq.removeEventListener('change', alCambiar)
  }, [])

  // ¿Hay clip en /media/? Manda media/manifest.json (committed, sin 404):
  // quien suelte un hero-loop.webm/mp4 pone "hero": true y la web lo recoge.
  useEffect(() => {
    if (quieto) return

    let cancelado = false

    fetch(`${BASE}/media/manifest.json`)
      .then(r => (r.ok ? r.json() : null))
      .then(j => !cancelado && setHayVideo(j?.hero === true))
      .catch(() => {})
  }, [quieto])

  // Auroras en canvas: rAF con pausa por pestaña oculta y por vídeo activo
  useEffect(() => {
    if (quieto || videoListo) return

    const canvas = canvasRef.current

    if (!canvas) return

    const ctx = canvas.getContext('2d')

    if (!ctx) return

    let raf = 0
    let corriendo = true
    const dpr = Math.min(window.devicePixelRatio || 1, 2)

    const medir = () => {
      const { clientWidth: w, clientHeight: h } = canvas

      canvas.width = Math.max(1, Math.round(w * dpr))
      canvas.height = Math.max(1, Math.round(h * dpr))
    }

    medir()
    const ro = new ResizeObserver(medir)

    ro.observe(canvas)

    const pintar = (ms: number) => {
      if (!corriendo) return

      const t = ms / 1000
      const w = canvas.width
      const h = canvas.height
      const m = Math.min(w, h)

      ctx.clearRect(0, 0, w, h)
      ctx.globalCompositeOperation = 'lighter'

      for (const [col, bx, by, br, deriva, fase] of BURBUJAS) {
        const x = (bx + Math.sin(t * deriva + fase) * 0.06) * w
        const y = (by + Math.cos(t * deriva * 0.8 + fase) * 0.08) * h
        const r = br * m * (1 + Math.sin(t * 0.15 + fase) * 0.08)
        const g = ctx.createRadialGradient(x, y, 0, x, y, r)

        g.addColorStop(0, `rgba(${col},0.55)`)
        g.addColorStop(0.55, `rgba(${col},0.22)`)
        g.addColorStop(1, `rgba(${col},0)`)
        ctx.fillStyle = g
        ctx.fillRect(x - r, y - r, r * 2, r * 2)
      }

      raf = requestAnimationFrame(pintar)
    }

    const alVisibilidad = () => {
      if (document.hidden) {
        corriendo = false
        cancelAnimationFrame(raf)
      } else if (!corriendo) {
        corriendo = true
        raf = requestAnimationFrame(pintar)
      }
    }

    raf = requestAnimationFrame(pintar)
    document.addEventListener('visibilitychange', alVisibilidad)

    return () => {
      corriendo = false
      cancelAnimationFrame(raf)
      ro.disconnect()
      document.removeEventListener('visibilitychange', alVisibilidad)
    }
  }, [quieto, videoListo])

  return (
    <div aria-hidden='true' className='absolute inset-0 overflow-hidden' style={{ borderRadius: 'inherit' }}>
      {/* 1 · Póster estático: base en todos los casos */}
      <div
        className='absolute inset-0'
        style={{
          backgroundImage: `url(${BASE}/images/hero-ambiental.png)`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      />
      {/* 2 · Auroras vivas (se apagan solas cuando el vídeo toma el relevo) */}
      <canvas ref={canvasRef} className='absolute inset-0 bs-full is-full' style={{ opacity: videoListo ? 0 : 1 }} />
      {/* 3 · Slot de vídeo: entra solo si el clip existe en /media/ */}
      {hayVideo && !quieto && !videoFallo && (
        <video
          ref={videoRef}
          muted
          loop
          autoPlay
          playsInline
          preload='auto'
          disablePictureInPicture
          tabIndex={-1}
          poster={`${BASE}/images/hero-ambiental.png`}
          onCanPlay={() => setVideoListo(true)}
          className='absolute inset-0 bs-full is-full object-cover'
          style={{ opacity: videoListo ? 1 : 0, transition: 'opacity 1.2s ease-in' }}
        >
          <source src={`${BASE}/media/hero-loop.webm`} type='video/webm' />
          <source src={`${BASE}/media/hero-loop.mp4`} type='video/mp4' onError={() => setVideoFallo(true)} />
        </video>
      )}
      {/* Velo de legibilidad: el texto de la tarjeta manda, la atmósfera acompaña */}
      <div
        className='absolute inset-0'
        style={{
          background:
            'linear-gradient(100deg, var(--mui-palette-background-paper) 0%, color-mix(in srgb, var(--mui-palette-background-paper) 88%, transparent) 34%, color-mix(in srgb, var(--mui-palette-background-paper) 55%, transparent) 62%, color-mix(in srgb, var(--mui-palette-background-paper) 25%, transparent) 100%)'
        }}
      />
    </div>
  )
}

export default HeroAmbiental
