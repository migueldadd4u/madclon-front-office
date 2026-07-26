'use client'

// MUI Imports
import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'

// Component Imports
import DataGate from '@/components/dashboard/DataGate'

// Data Imports
import { fmtFecha } from '@/lib/data'

const iconoEstado = (e: string) =>
  e.toLowerCase().includes('ok') || e.includes('🟢')
    ? 'ri-checkbox-circle-fill text-success'
    : e.toLowerCase().includes('error') || e.includes('🔴')
      ? 'ri-close-circle-fill text-error'
      : 'ri-information-fill text-secondary'

const SaludPage = () => (
  <DataGate>
    {({ overview, clones }) => (
      <Grid container spacing={6}>
        <Grid size={12} className='flex flex-wrap items-end justify-between gap-4'>
          <div>
            <Typography variant='h4' className='mbe-1'>Salud del sistema</Typography>
            <Typography color='text.secondary' className='max-is-2xl'>
              Un guardián automático comprueba cada hora que el clon puede leer el correo y las agendas.
              Si algo falla, el panel lo grita antes de que se note.
            </Typography>
          </div>
          <Chip
            color={(overview.salud_global ?? '').includes('🟢') ? 'success' : 'warning'}
            variant='tonal'
            label={`estado global: ${overview.salud_global ?? '—'}`}
          />
        </Grid>

        {/* Accesos vigilados */}
        <Grid size={{ xs: 12, lg: 6 }}>
          <Card className='bs-full'>
            <CardHeader
              title='Accesos vigilados'
              subheader='correos y agendas que el clon necesita para trabajar'
            />
            <TableContainer>
              <Table size='small'>
                <TableHead>
                  <TableRow>
                    <TableCell>Integración</TableCell>
                    <TableCell>Detalle</TableCell>
                    <TableCell align='right'>Último OK</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {clones.integraciones.map(i => (
                    <TableRow key={i.nombre} hover>
                      <TableCell>
                        <div className='flex items-center gap-2'>
                          <i className={iconoEstado(i.estado)} />
                          <Typography variant='body2'>{i.nombre}</Typography>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Typography variant='caption' color='text.secondary'>{i.detalle}</Typography>
                      </TableCell>
                      <TableCell align='right'>
                        <Typography variant='caption' className='font-mono' color='text.secondary'>
                          {fmtFecha(i.ultimo_ok)}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <CardContent>
              <Typography variant='caption' color='text.disabled' className='font-mono'>
                último chequeo del guardián: {fmtFecha(overview.watchdog_ts)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, lg: 6 }}>
          <Grid container spacing={6}>
            {/* Gateways */}
            <Grid size={12}>
              <Card>
                <CardHeader title='Puertas de entrada vivas' subheader='los procesos por los que Miguel habla con su clon' />
                <CardContent className='flex flex-col gap-3'>
                  <div className='flex flex-wrap gap-2'>
                    {(overview.gateways ?? []).map(g => (
                      <Chip key={g} size='small' color='primary' variant='tonal' label={g} className='font-mono' />
                    ))}
                  </div>
                  {overview.healthcheck && (
                    <Typography variant='caption' color='text.secondary'>
                      motor <span className='font-mono'>{overview.healthcheck.head}</span>
                      {' · '}
                      {overview.healthcheck.problemas === 0 ? (
                        <span className='text-success'>sin problemas</span>
                      ) : (
                        <span className='text-warning'>{overview.healthcheck.problemas} aviso(s)</span>
                      )}
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>

            {/* Crons */}
            <Grid size={12}>
              <Card>
                <CardHeader
                  title='Rutinas automáticas'
                  subheader='lo que el sistema hace solo cada día o cada semana'
                />
                <TableContainer>
                  <Table size='small'>
                    <TableBody>
                      {overview.crons.map(c => (
                        <TableRow key={c.nombre} hover>
                          <TableCell>
                            <div className='flex items-center gap-2'>
                              <i className={c.estado === 'ok' ? 'ri-checkbox-circle-fill text-success' : 'ri-close-circle-fill text-error'} />
                              <Typography variant='body2'>{c.nombre}</Typography>
                            </div>
                          </TableCell>
                          <TableCell align='right'>
                            <Chip size='small' variant='outlined' label={c.ambito} />
                          </TableCell>
                          <TableCell align='right'>
                            <Typography variant='caption' className='font-mono' color='text.secondary'>{c.ultima}</Typography>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Card>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    )}
  </DataGate>
)

export default SaludPage
