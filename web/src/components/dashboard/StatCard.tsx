'use client'

// MUI Imports
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import CustomAvatar from '@core/components/mui/Avatar'

// Component Imports
import CountUp from '@/components/dashboard/CountUp'

type Props = {
  icon: string
  valor: string
  label: string
  detalle?: string
  color?: 'primary' | 'success' | 'warning' | 'error' | 'info' | 'secondary'
  /** Si se indica, el valor principal sube animado desde 0 hasta esta cifra. */
  countTo?: number | null
  countFormat?: (n: number) => string
}

const StatCard = ({ icon, valor, label, detalle, color = 'primary', countTo, countFormat }: Props) => (
  <Card className='fo-card-hover'>
    <CardContent className='flex items-center gap-4'>
      <CustomAvatar color={color} skin='light' size={46} variant='rounded'>
        <i className={`${icon} text-2xl`} />
      </CustomAvatar>
      <div className='flex flex-col'>
        <Typography variant='h5' className='font-mono'>
          {countTo !== undefined ? <CountUp to={countTo} format={countFormat} /> : valor}
        </Typography>
        <Typography variant='body2' color='text.secondary'>{label}</Typography>
        {detalle && (
          <Typography variant='caption' color='text.disabled' className='font-mono'>{detalle}</Typography>
        )}
      </div>
    </CardContent>
  </Card>
)

export default StatCard
