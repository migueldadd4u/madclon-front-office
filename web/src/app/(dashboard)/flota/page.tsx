'use client'

// MUI Imports
import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import LinearProgress from '@mui/material/LinearProgress'
import CustomAvatar from '@core/components/mui/Avatar'

// Component Imports
import DataGate from '@/components/dashboard/DataGate'

// Data Imports
import { fmtCorto } from '@/lib/data'

const ICONOS: Record<string, string> = {
  clon: 'ri-robot-2-line',
  ceo: 'ri-briefcase-4-line',
  patrimonio: 'ri-bank-line',
  padre: 'ri-parent-line',
  ideas: 'ri-lightbulb-flash-line',
  licitador: 'ri-auction-line',
  tecnico: 'ri-tools-line'
}

const COLORES: Record<string, 'primary' | 'success' | 'warning' | 'error' | 'info' | 'secondary'> = {
  clon: 'primary',
  ceo: 'info',
  patrimonio: 'success',
  padre: 'error',
  ideas: 'warning',
  licitador: 'secondary',
  tecnico: 'info'
}

const FlotaPage = () => (
  <DataGate>
    {({ clones, tokens }) => {
      const consumo = new Map(tokens.por_clon.map(c => [c.clon, c.tokens ?? 0]))
      const maxConsumo = Math.max(...consumo.values(), 1)

      return (
        <Grid container spacing={6}>
          <Grid size={12}>
            <Typography variant='h4' className='mbe-1'>La flota: siete clones, siete oficios</Typography>
            <Typography color='text.secondary' className='max-is-3xl'>
              El Clon de MAD no es una sola mente: son siete perfiles especializados que comparten la misma memoria.
              Cada uno atiende un territorio de la vida de Miguel — la empresa, el patrimonio, la familia, las ideas —
              y un octavo actor, el <em>motor</em>, se dedica a mejorar a los demás. La barra muestra cuánto ha
              trabajado cada uno en los últimos 30 días.
            </Typography>
          </Grid>

          {clones.clones.map(c => {
            const usado = consumo.get(c.perfil) ?? 0
            const pct = Math.max((usado / maxConsumo) * 100, usado > 0 ? 2 : 0)

            return (
              <Grid key={c.perfil} size={{ xs: 12, sm: 6, lg: 4 }}>
                <Card className='bs-full'>
                  <CardContent className='flex flex-col gap-4 bs-full'>
                    <div className='flex items-center gap-3'>
                      <CustomAvatar color={COLORES[c.perfil] ?? 'primary'} skin='light' size={42} variant='rounded'>
                        <i className={`${ICONOS[c.perfil] ?? 'ri-robot-2-line'} text-2xl`} />
                      </CustomAvatar>
                      <div>
                        <Typography variant='h6' className='capitalize'>{c.perfil}</Typography>
                        <Typography variant='caption' color='text.secondary'>{c.rol}</Typography>
                      </div>
                    </div>

                    {c.mision && (
                      <Typography variant='body2' color='text.secondary' className='flex-auto'>{c.mision}</Typography>
                    )}

                    <div className='flex flex-wrap gap-1'>
                      {c.canales.map(canal => (
                        <Chip key={canal} size='small' variant='outlined' label={canal} />
                      ))}
                      {c.correo && <Chip size='small' variant='outlined' icon={<i className='ri-mail-line' />} label='correo' />}
                      {c.calendarios.length > 0 && (
                        <Chip size='small' variant='outlined' icon={<i className='ri-calendar-line' />} label={`${c.calendarios.length} agendas`} />
                      )}
                    </div>

                    <div>
                      <div className='flex justify-between mbe-1'>
                        <Typography variant='caption' color='text.secondary'>trabajo 30 d</Typography>
                        <Typography variant='caption' className='font-mono'>{fmtCorto(usado)} tokens</Typography>
                      </div>
                      <LinearProgress variant='determinate' value={pct} color={COLORES[c.perfil] ?? 'primary'} />
                    </div>
                  </CardContent>
                </Card>
              </Grid>
            )
          })}
        </Grid>
      )
    }}
  </DataGate>
)

export default FlotaPage
