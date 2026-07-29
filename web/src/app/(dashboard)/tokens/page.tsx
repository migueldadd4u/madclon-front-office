'use client'

// MUI Imports
import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import LinearProgress from '@mui/material/LinearProgress'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'

// Third-party Imports
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'

// Component Imports
import DataGate from '@/components/dashboard/DataGate'
import CountUp from '@/components/dashboard/CountUp'

// Hook Imports
import { useLang } from '@/lib/i18n'

// Data Imports
import { fmt, fmtCorto } from '@/lib/data'

const COLORES_CLON = [
  'var(--mui-palette-primary-main)',
  'var(--mui-palette-success-main)',
  'var(--mui-palette-info-main)',
  'var(--mui-palette-warning-main)',
  'var(--mui-palette-error-main)',
  'var(--mui-palette-secondary-main)',
  'var(--mui-palette-primary-light)',
  'var(--mui-palette-text-disabled)'
]

const TokensPage = () => {
  const { t } = useLang()

  return (
  <DataGate>
    {({ tokens }) => {
      const c = tokens.contador
      const datosClon = [...tokens.por_clon].sort((a, b) => (b.tokens ?? 0) - (a.tokens ?? 0))

      return (
        <Grid container spacing={6}>
          <Grid size={12}>
            <Typography variant='h4' className='mbe-1'>{t('tokens_titulo')}</Typography>
            <Typography color='text.secondary' className='max-is-3xl'>
              {t('tokens_intro_1')}
            </Typography>
          </Grid>

          {/* Contador común */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Card className='bs-full fo-card-hover border border-solid border-success'>
              <CardContent className='flex flex-col gap-1'>
                <Typography variant='body2' color='success.main' fontWeight={600}>{t('tokens_medido')}</Typography>
                <Typography variant='h3' className='font-mono'><CountUp to={c.medido_tokens} format={fmtCorto} /></Typography>
                <Typography variant='caption' color='text.secondary' className='font-mono'>
                  {fmt(c.medido_tokens)} tokens · {fmt(c.medido_llamadas)} {t('tokens_llamadas')}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <Card className='bs-full fo-card-hover'>
              <CardContent className='flex flex-col gap-1'>
                <Typography variant='body2' color='text.secondary' fontWeight={600}>{t('tokens_estimado')}</Typography>
                <Typography variant='h3' className='font-mono'><CountUp to={c.estimado_tokens} format={fmtCorto} /></Typography>
                <Typography variant='caption' color='text.secondary' className='font-mono'>
                  {t('tokens_banda')}: {fmtCorto(c.banda_p25)} – {fmtCorto(c.banda_p75)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <Card className='bs-full fo-card-hover'>
              <CardContent className='flex flex-col gap-1'>
                <Typography variant='body2' fontWeight={600}>{t('tokens_total')}</Typography>
                <Typography variant='h3' className='font-mono'><CountUp to={c.total_tokens} format={fmtCorto} /></Typography>
                <Typography variant='caption' color='text.secondary' className='font-mono'>
                  {fmt(c.total_llamadas)} {t('tokens_llamadas')}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Cobertura + ventanas */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Card className='bs-full'>
              <CardContent className='flex flex-col gap-2'>
                <div className='flex items-baseline justify-between'>
                  <Typography variant='h6'>{t('tokens_cobertura')}</Typography>
                  <Typography variant='h5' className='font-mono'>{c.cobertura_pct ?? '—'} %</Typography>
                </div>
                <LinearProgress
                  variant='determinate'
                  value={c.cobertura_pct ?? 0}
                  color='success'
                  aria-label={`${t('tokens_cobertura')}: ${c.cobertura_pct ?? 0} %`}
                />
                <Typography variant='caption' color='text.secondary'>
                  {t('tokens_cobertura_caption')}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <Card className='bs-full'>
              <CardContent>
                <Typography variant='h6' className='mbe-3'>{t('tokens_ventanas')}</Typography>
                <div className='flex gap-3'>
                  {[
                    { l: t('tokens_30d'), v: c.ventana_30d },
                    { l: t('tokens_7d'), v: c.ventana_7d },
                    { l: t('tokens_hoy'), v: c.hoy }
                  ].map(w => (
                    <Card key={w.l} variant='outlined' className='flex-auto text-center p-3'>
                      <Typography variant='h6' className='font-mono'>{fmtCorto(w.v)}</Typography>
                      <Typography variant='caption' color='text.secondary'>{w.l}</Typography>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </Grid>

          {/* Valor estimado en euros */}
          <Grid size={12}>
            <Card className='fo-card-hover' sx={{ background: 'linear-gradient(135deg, rgba(122,127,255,.10), rgba(6,201,168,.10))' }}>
              <CardContent className='flex flex-col gap-2'>
                <div className='flex flex-wrap items-center justify-between gap-3'>
                  <div className='flex flex-col gap-1'>
                    <Typography variant='h6'>{t('eur_titulo')}</Typography>
                    <Typography variant='body2' color='text.secondary'>{t('eur_valor')}</Typography>
                  </div>
                  <Typography variant='h3' className='font-mono' sx={{ background: 'linear-gradient(90deg,#7A7FFF,#06C9A8)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>
                    <CountUp to={c.ventana_30d !== null && c.ventana_30d !== undefined ? (c.ventana_30d / 1_000_000) * 3 : null} format={n => `~ ${fmt(Math.round(n))} €`} />
                  </Typography>
                </div>
                <Typography variant='caption' color='text.disabled'>{t('eur_nota')}</Typography>
                <Typography variant='caption' color='success.main' fontWeight={600}>{t('eur_cero')}</Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Por clon */}
          <Grid size={{ xs: 12, lg: 6 }}>
            <Card className='bs-full'>
              <CardHeader
                title={t('tokens_por_clon')}
                subheader={t('tokens_por_clon_sub')}
              />
              <CardContent className='bs-72'>
                <ResponsiveContainer width='100%' height='100%'>
                  <BarChart data={datosClon} layout='vertical' margin={{ left: 8, right: 24 }}>
                    <XAxis type='number' hide />
                    <YAxis
                      type='category'
                      dataKey='clon'
                      width={90}
                      tick={{ fill: 'var(--mui-palette-text-secondary)', fontSize: 12 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      cursor={{ fill: 'var(--mui-palette-action-hover)' }}
                      contentStyle={{
                        background: 'var(--mui-palette-background-paper)',
                        border: '1px solid var(--mui-palette-divider)',
                        borderRadius: 8
                      }}
                      formatter={(v: number) => [`${fmt(v)} tokens`, '']}
                    />
                    <Bar dataKey='tokens' radius={[0, 4, 4, 0]} isAnimationActive={false}>
                      {datosClon.map((d, i) => (
                        <Cell key={d.clon} fill={COLORES_CLON[i % COLORES_CLON.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>

          {/* Por modelo */}
          <Grid size={{ xs: 12, lg: 6 }}>
            <Card className='bs-full'>
              <CardHeader title={t('tokens_por_modelo')} subheader={t('tokens_por_modelo_sub')} />
              <TableContainer>
                <Table size='small'>
                  <TableHead>
                    <TableRow>
                      <TableCell>{t('tokens_modelo')}</TableCell>
                      <TableCell align='right'>Tokens</TableCell>
                      <TableCell align='right'>{t('tokens_llamadas')}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {tokens.por_modelo.slice(0, 8).map(m => (
                      <TableRow key={m.modelo} hover>
                        <TableCell><span className='font-mono text-sm'>{m.modelo}</span></TableCell>
                        <TableCell align='right'><span className='font-mono'>{fmtCorto(m.total)}</span></TableCell>
                        <TableCell align='right'><span className='font-mono text-textSecondary'>{fmt(m.llamadas)}</span></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Card>
          </Grid>
        </Grid>
      )
    }}
  </DataGate>
  )
}

export default TokensPage
