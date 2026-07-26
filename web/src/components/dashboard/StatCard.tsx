'use client'

// MUI Imports
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import CustomAvatar from '@core/components/mui/Avatar'

type Props = {
  icon: string
  valor: string
  label: string
  detalle?: string
  color?: 'primary' | 'success' | 'warning' | 'error' | 'info' | 'secondary'
}

const StatCard = ({ icon, valor, label, detalle, color = 'primary' }: Props) => (
  <Card>
    <CardContent className='flex items-center gap-4'>
      <CustomAvatar color={color} skin='light' size={46} variant='rounded'>
        <i className={`${icon} text-2xl`} />
      </CustomAvatar>
      <div className='flex flex-col'>
        <Typography variant='h5' className='font-mono'>{valor}</Typography>
        <Typography variant='body2' color='text.secondary'>{label}</Typography>
        {detalle && (
          <Typography variant='caption' color='text.disabled' className='font-mono'>{detalle}</Typography>
        )}
      </div>
    </CardContent>
  </Card>
)

export default StatCard
