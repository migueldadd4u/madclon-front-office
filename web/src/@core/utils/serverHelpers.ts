// Type Imports
import type { Settings } from '@core/contexts/settingsContext'
import type { SystemMode } from '@core/types'

// Config Imports
import themeConfig from '@configs/themeConfig'

/*
 * VERSIÓN ESTÁTICA (GitHub Pages / output: 'export')
 * El original leía cookies de servidor; en export estático no existe servidor.
 * El modo (claro/oscuro) se resuelve en cliente via settingsContext + InitColorSchemeScript.
 */

export const getSettingsFromCookie = async (): Promise<Settings> => {
  return {}
}

export const getMode = async () => {
  return themeConfig.mode
}

export const getSystemMode = async (): Promise<SystemMode> => {
  return themeConfig.mode === 'system' ? 'light' : (themeConfig.mode as SystemMode)
}

export const getServerMode = async () => {
  return themeConfig.mode === 'system' ? 'light' : themeConfig.mode
}

export const getSkin = async () => {
  return themeConfig.skin
}
