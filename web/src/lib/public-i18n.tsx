'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'

export type Lang = 'es' | 'en'

const STR = {
  nav_panel: { es: 'Panel', en: 'Home' },
  nav_flota: { es: 'La flota', en: 'The fleet' },
  nav_salud: { es: 'Salud', en: 'Health' },
  nav_tokens: { es: 'Tokens', en: 'Tokens' },
  nav_eficiencia: { es: 'Eficiencia', en: 'Efficiency' },
  nav_actividad: { es: 'Actividad', en: 'Activity' },
  nav_historia: { es: 'Historia', en: 'Story' },
  nav_preguntas: { es: 'Preguntas', en: 'FAQ' },
  chrome_tagline: { es: 'Vista pública · solo lectura', en: 'Public view · read only' },
  chrome_footer_1: { es: 'Vista pública protegida y de solo lectura', en: 'Protected, read-only public view' },
  chrome_footer_2: {
    es: 'Solo puede aparecer aquí una proyección pública aprobada por el gate de seguridad.',
    en: 'Only a public projection approved by the safety gate can appear here.'
  },
  footer_version: {
    es: '{v} · generado el {fecha} (hora de Madrid)',
    en: '{v} · built on {fecha} (Madrid time)'
  },
  share_copiar: { es: 'Copiar enlace', en: 'Copy link' },
  share_copiado: { es: '¡Enlace copiado!', en: 'Link copied!' },
  menu_abrir: { es: 'Abrir o cerrar el menú', en: 'Open or close the menu' },
  nav_cierra: { es: 'cerrar el menú', en: 'close the menu' },
  nav_fija: { es: 'fijar el menú abierto', en: 'pin the menu open' },
  nav_pliega: { es: 'plegar el menú', en: 'collapse the menu' },
  kiosk_entrar: {
    es: 'Modo presentación: oculta menús y muestra solo el panel',
    en: 'Presentation mode: hides menus and shows only the dashboard'
  },
  kiosk_salir: { es: 'Salir (Esc)', en: 'Exit (Esc)' },
  contraste_aria: { es: 'Activar o desactivar alto contraste', en: 'Toggle high contrast' },
  atajos_boton: { es: 'Atajos de teclado', en: 'Keyboard shortcuts' },
  atajos_titulo: { es: 'Atajos de teclado', en: 'Keyboard shortcuts' },
  atajos_sub: {
    es: '«g» seguida de una letra lleva a cada sección. «?» abre o cierra esta ayuda.',
    en: '«g» followed by a letter opens each section. «?» opens or closes this help.'
  },
  atajos_ayuda_fila: { es: 'mostrar u ocultar esta ayuda', en: 'show or hide this help' },
  public_cargando: { es: 'Comprobando la instantánea pública', en: 'Checking the public snapshot' },
  public_error_titulo: { es: 'Los datos públicos no están disponibles', en: 'Public data is unavailable' },
  public_error_texto: {
    es: 'La instantánea no ha superado las comprobaciones de seguridad o no se ha podido cargar. No mostraremos datos incompletos.',
    en: 'The snapshot did not pass the safety checks or could not be loaded. We will not show incomplete data.'
  },
  public_retenido_titulo: { es: 'Instantánea pública protegida', en: 'Public snapshot protected' },
  public_retenido_texto: {
    es: 'Los datos permanecen retenidos hasta que exista una proyección pública mínima y segura.',
    en: 'Data remains withheld until a minimal, safe public projection is available.'
  },
  public_retenido_fecha: {
    es: 'Comprobación de seguridad: {fecha}',
    en: 'Safety check: {fecha}'
  },
  offline_titulo: { es: 'Sin conexión', en: 'Offline' },
  offline_texto: {
    es: 'No hay una instantánea pública segura disponible sin conexión.',
    en: 'No safe public snapshot is available offline.'
  },
  nf_titulo: { es: 'Página no encontrada', en: 'Page not found' },
  nf_sub: { es: 'El enlace no existe o se ha movido.', en: 'The link does not exist or has moved.' },
  nf_boton: { es: 'Volver al panel', en: 'Back to the dashboard' },
  nf_pie: { es: 'MAD Clon · vista pública protegida', en: 'MAD Clon · protected public view' }
} as const

export type StrKey = keyof typeof STR

type LangCtx = { lang: Lang; setLang: (lang: Lang) => void; t: (key: StrKey) => string }

const Ctx = createContext<LangCtx>({ lang: 'es', setLang: () => {}, t: key => STR[key].es })

export const PublicLangProvider = ({ children }: { children: ReactNode }) => {
  const [lang, setLangState] = useState<Lang>('es')

  useEffect(() => {
    const saved = window.localStorage.getItem('madclon-lang')

    if (saved === 'en' || saved === 'es') setLangState(saved)
  }, [])

  useEffect(() => {
    document.documentElement.lang = lang
  }, [lang])

  const setLang = (next: Lang) => {
    setLangState(next)
    window.localStorage.setItem('madclon-lang', next)
  }

  const t = (key: StrKey): string => STR[key][lang]

  return <Ctx.Provider value={{ lang, setLang, t }}>{children}</Ctx.Provider>
}

export const usePublicLang = () => useContext(Ctx)
