'use client'

// React Imports
import type { ReactNode } from 'react'

// MUI Imports
import CircularProgress from '@mui/material/CircularProgress'
import Typography from '@mui/material/Typography'

// Data Imports
import { usePanelData } from '@/lib/data'
import type { PanelData } from '@/lib/data'

const DataGate = ({ children }: { children: (data: PanelData) => ReactNode }) => {
  const { data, error } = usePanelData()

  if (error) {
    return (
      <div className='flex flex-col items-center gap-2 p-8 text-center'>
        <i className='ri-error-warning-line text-4xl text-error' />
        <Typography color='error' fontWeight={600}>No se pudieron cargar los datos del panel</Typography>
        <Typography variant='body2' color='text.secondary' className='font-mono'>{error}</Typography>
        <Typography variant='body2' color='text.secondary'>
          Ejecuta antes el exportador: <code>python exporter/export_panel.py</code>
        </Typography>
      </div>
    )
  }

  if (!data) {
    return (
      <div className='flex items-center justify-center gap-3 p-16'>
        <CircularProgress size={22} />
        <Typography color='text.secondary'>Cargando la sala de control…</Typography>
      </div>
    )
  }

  return <>{children(data)}</>
}

export default DataGate
