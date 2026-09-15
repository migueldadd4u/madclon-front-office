// MUI Imports
import type { Theme } from '@mui/material/styles'

const typography: Theme['components'] = {
  MuiTypography: {
    styleOverrides: {
      root: {
        variants: [
          {
            props: { variant: 'h1' },
            style: { color: 'var(--mui-palette-text-primary)' }
          },
          {
            props: { variant: 'h2' },
            style: { color: 'var(--mui-palette-text-primary)' }
          },
          {
            props: { variant: 'h3' },
            style: { color: 'var(--mui-palette-text-primary)' }
          },
          {
            props: { variant: 'h4' },
            style: { color: 'var(--mui-palette-text-primary)' }
          },
          {
            props: { variant: 'h5' },
            style: { color: 'var(--mui-palette-text-primary)' }
          },
          {
            props: { variant: 'h6' },
            style: { color: 'var(--mui-palette-text-primary)' }
          },
          {
            props: { variant: 'subtitle1' },
            style: { color: 'var(--mui-palette-text-secondary)' }
          },
          {
            props: { variant: 'subtitle2' },
            style: { color: 'var(--mui-palette-text-secondary)' }
          },
          {
            props: { variant: 'body1' },
            style: { color: 'var(--mui-palette-text-secondary)' }
          },
          {
            props: { variant: 'body2' },
            style: { color: 'var(--mui-palette-text-secondary)' }
          },
          {
            props: { variant: 'button' },
            style: { color: 'var(--mui-palette-text-primary)' }
          },
          {
            // El «caption» es el pie de las tarjetas, las fechas y las cifras
            // pequeñas: información, no un control apagado. La plantilla lo traía
            // en `text.disabled` y sobre fondo claro eso son 2,31:1 —medido el
            // 15/09/2026, con el claro ya por defecto: 17 nodos en una sola
            // página—. Con `text.secondary` son 5,30 sobre papel y 4,95 sobre la
            // página, que es lo mismo que ya usan `body1`, `body2` y los
            // subtítulos. El tono de «deshabilitado» se queda para lo que de
            // verdad lo está.
            //
            // Sobre fondos oscuros propios no cambia nada: quien pinta su propio
            // fondo (el hero de la portada) redefine ahí `--mui-palette-text-*`.
            props: { variant: 'caption' },
            style: { color: 'var(--mui-palette-text-secondary)', display: 'inline-block' }
          },
          {
            props: { variant: 'overline' },
            style: { color: 'var(--mui-palette-text-primary)', display: 'inline-block' }
          }
        ]
      },
      gutterBottom: ({ theme }) => ({
        marginBottom: theme.spacing(2)
      })
    }
  }
}

export default typography
