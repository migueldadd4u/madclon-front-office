'use client'

import { useRef, useState } from 'react'

import Tooltip from '@mui/material/Tooltip'
import IconButton from '@mui/material/IconButton'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'

import type { Mode } from '@core/types'
import { useSettings } from '@core/hooks/useSettings'
import { useLang } from '@/lib/i18n'

const ModeDropdown = () => {
  const [open, setOpen] = useState(false)
  const [tooltipOpen, setTooltipOpen] = useState(false)
  const anchorRef = useRef<HTMLButtonElement>(null)
  const { settings, updateSettings } = useSettings()
  const { t } = useLang()

  const modos = [
    { valor: 'light' as const, nombre: t('modo_claro'), icono: 'ri-sun-line' },
    { valor: 'dark' as const, nombre: t('modo_oscuro'), icono: 'ri-moon-clear-line' },
    { valor: 'system' as const, nombre: t('modo_sistema'), icono: 'ri-computer-line' }
  ]

  const actual = modos.find(modo => modo.valor === settings.mode) ?? modos[0]
  const nombreControl = t('modo_cambiar').replace('{modo}', actual.nombre)

  const handleClose = () => {
    setOpen(false)
    setTooltipOpen(false)
  }

  const handleModeSwitch = (mode: Mode) => {
    handleClose()
    if (settings.mode !== mode) updateSettings({ mode })
  }

  return (
    <>
      <Tooltip title={nombreControl} open={!open && tooltipOpen} onOpen={() => setTooltipOpen(true)} onClose={() => setTooltipOpen(false)}>
        <IconButton
          ref={anchorRef}
          id='selector-apariencia'
          aria-label={nombreControl}
          aria-haspopup='menu'
          aria-expanded={open}
          aria-controls={open ? 'menu-apariencia' : undefined}
          onClick={() => setOpen(prev => !prev)}
          className='text-textPrimary'
          disableFocusRipple
          sx={{ '&:focus-visible, &.Mui-focusVisible': { outline: '2px solid', outlineColor: 'primary.main', outlineOffset: 2 } }}
        >
          <i className={actual.icono} aria-hidden='true' />
        </IconButton>
      </Tooltip>
      <Menu
        id='menu-apariencia'
        anchorEl={anchorRef.current}
        open={open}
        onClose={handleClose}
        slotProps={{ list: { 'aria-label': t('modo_titulo') } }}
      >
        {modos.map(modo => (
          <MenuItem key={modo.valor} className='gap-3 pli-4' onClick={() => handleModeSwitch(modo.valor)} selected={settings.mode === modo.valor}>
            <i className={modo.icono} aria-hidden='true' />
            {modo.nombre}
          </MenuItem>
        ))}
      </Menu>
    </>
  )
}

export default ModeDropdown
