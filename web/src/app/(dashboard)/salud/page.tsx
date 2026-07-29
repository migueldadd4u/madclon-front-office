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
import Latido from '@/components/dashboard/Latido'
import PuntoVivo from '@/components/dashboard/PuntoVivo'

// Hook Imports
import { useLang } from '@/lib/i18n'

// Data Imports
import { fmtFecha } from '@/lib/data'

const esOk = (e: string) => e.toLowerCase().includes('ok') || e.includes('🟢')

const iconoEstado = (e: string) =>
  esOk(e)
    ? 'ri-checkbox-circle-fill text-success'
    : e.toLowerCase().includes('error') || e.includes('🔴')
      ? 'ri-close-circle-fill text-error'
      : 'ri-information-fill text-secondary'

const SaludPage = () => {
  const { t } = useLang()

  return (
  <DataGate>
    {({ overview, clones, manifest }) => (
      <Grid container spacing={6}>
        <Grid size={12} className='flex flex-wrap items-end justify-between gap-4'>
          <div>
            <Typography variant='h4' className='mbe-1'>{t('salud_titulo')}</Typography>
            <Typography color='text.secondary' className='max-is-2xl'>
              {t('salud_intro')}
            </Typography>
          </div>
          <div className='flex items-center gap-4 flex-wrap'>
            <Latido crons={overview.crons} generado={manifest.generado} />
            <Chip
              color={(overview.salud_global ?? '').includes('🟢') ? 'success' : 'warning'}
              variant='tonal'
              label={`${t('salud_global')}: ${overview.salud_global ?? '—'}`}
            />
          </div>
        </Grid>

        {/* Accesos vigilados */}
        <Grid size={{ xs: 12, lg: 6 }}>
          <Card className='bs-full'>
            <CardHeader
              title={t('salud_accesos')}
              subheader={t('salud_accesos_sub')}
            />
            <TableContainer>
              <Table size='small'>
                <TableHead>
                  <TableRow>
                    <TableCell>{t('salud_integracion')}</TableCell>
                    <TableCell>{t('salud_detalle')}</TableCell>
                    <TableCell align='right'>{t('salud_ultimo_ok')}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {clones.integraciones.map(i => (
                    <TableRow key={i.nombre} hover>
                      <TableCell>
                        <div className='flex items-center gap-2'>
                          {esOk(i.estado) ? <PuntoVivo /> : <i className={iconoEstado(i.estado)} />}
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
                {t('salud_ultimo_chequeo')}: {fmtFecha(overview.watchdog_ts)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, lg: 6 }}>
          <Grid container spacing={6}>
            {/* Gateways */}
            <Grid size={12}>
              <Card>
                <CardHeader title={t('salud_puertas')} subheader={t('salud_puertas_sub')} />
                <CardContent className='flex flex-col gap-3'>
                  <div className='flex flex-wrap gap-2'>
                    {(overview.gateways ?? []).map(g => (
                      <Chip key={g} size='small' color='primary' variant='tonal' label={g} className='font-mono' />
                    ))}
                  </div>
                  {overview.healthcheck && (
                    <Typography variant='caption' color='text.secondary'>
                      {t('salud_motor')} <span className='font-mono'>{overview.healthcheck.head}</span>
                      {' · '}
                      {overview.healthcheck.problemas === 0 ? (
                        <span className='text-success'>{t('salud_sin_problemas')}</span>
                      ) : (
                        <span className='text-warning'>{overview.healthcheck.problemas} {t('salud_avisos')}</span>
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
                  title={t('salud_rutinas')}
                  subheader={t('salud_rutinas_sub')}
                />
                <TableContainer>
                  <Table size='small'>
                    <TableBody>
                      {overview.crons.map(c => (
                        <TableRow key={c.nombre} hover>
                          <TableCell>
                            <div className='flex items-center gap-2'>
                              {c.estado === 'ok' ? <PuntoVivo /> : <i className='ri-close-circle-fill text-error' />}
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
}

export default SaludPage
