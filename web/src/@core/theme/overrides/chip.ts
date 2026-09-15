// MUI Imports
import type { Theme } from '@mui/material/styles'

const chip: Theme['components'] = {
  // El texto de los chips «tonal» es el color de marca rebajado a la mitad de luz
  // en claro, y el tono vivo en oscuro. Estaba al 55 % y el 15/09/2026, con el
  // claro ya por defecto, el gate del escaparate midió la etiqueta verde en
  // 4,39:1 sobre su propio relleno — AA pide 4,5. Al 50 % el peor de los seis se
  // queda en 5,15 y hay margen para los rellenos que caen sobre la página (#F7F7F9)
  // y no sobre el papel. El relleno, el borde y el icono no se tocan.
  MuiChip: {
    styleOverrides: {
      root: ({ ownerState, theme }) => ({
        variants: [
          {
            props: { variant: 'tonal', color: 'primary' },
            style: {
              backgroundColor: 'var(--mui-palette-primary-lightOpacity)',
              color: 'color-mix(in srgb, var(--mui-palette-primary-main) 50%, #000)',
              ...theme.applyStyles('dark', {
                color: 'color-mix(in srgb, var(--mui-palette-primary-main) 45%, #fff)'
              }),
              '&.Mui-focusVisible': {
                backgroundColor: 'var(--mui-palette-primary-mainOpacity)'
              },
              '& .MuiChip-deleteIcon': {
                color: 'rgb(var(--mui-palette-primary-mainChannel) / 0.7)',
                '&:hover': {
                  color: 'var(--mui-palette-primary-main)'
                }
              },
              '&.MuiChip-clickable:hover': {
                backgroundColor: 'var(--mui-palette-primary-main)',
                color: 'var(--mui-palette-common-white)'
              }
            }
          },
          {
            props: { variant: 'tonal', color: 'secondary' },
            style: {
              backgroundColor: 'var(--mui-palette-secondary-lightOpacity)',
              color: 'color-mix(in srgb, var(--mui-palette-secondary-main) 50%, #000)',
              ...theme.applyStyles('dark', {
                color: 'color-mix(in srgb, var(--mui-palette-secondary-main) 45%, #fff)'
              }),
              '&.Mui-focusVisible': {
                backgroundColor: 'var(--mui-palette-secondary-mainOpacity)'
              },
              '& .MuiChip-deleteIcon': {
                color: 'rgb(var(--mui-palette-secondary-mainChannel) / 0.7)',
                '&:hover': {
                  color: 'var(--mui-palette-secondary-main)'
                }
              },
              '&.MuiChip-clickable:hover': {
                backgroundColor: 'var(--mui-palette-secondary-main)',
                color: 'var(--mui-palette-common-white)'
              }
            }
          },
          {
            props: { variant: 'tonal', color: 'error' },
            style: {
              backgroundColor: 'var(--mui-palette-error-lightOpacity)',
              color: 'color-mix(in srgb, var(--mui-palette-error-main) 50%, #000)',
              ...theme.applyStyles('dark', {
                color: 'color-mix(in srgb, var(--mui-palette-error-main) 45%, #fff)'
              }),
              '&.Mui-focusVisible': {
                backgroundColor: 'var(--mui-palette-error-mainOpacity)'
              },
              '& .MuiChip-deleteIcon': {
                color: 'rgb(var(--mui-palette-error-mainChannel) / 0.7)',
                '&:hover': {
                  color: 'var(--mui-palette-error-main)'
                }
              },
              '&.MuiChip-clickable:hover': {
                backgroundColor: 'var(--mui-palette-error-main)',
                color: 'var(--mui-palette-common-white)'
              }
            }
          },
          {
            props: { variant: 'tonal', color: 'warning' },
            style: {
              backgroundColor: 'var(--mui-palette-warning-lightOpacity)',
              color: 'color-mix(in srgb, var(--mui-palette-warning-main) 50%, #000)',
              ...theme.applyStyles('dark', {
                color: 'color-mix(in srgb, var(--mui-palette-warning-main) 45%, #fff)'
              }),
              '&.Mui-focusVisible': {
                backgroundColor: 'var(--mui-palette-warning-mainOpacity)'
              },
              '& .MuiChip-deleteIcon': {
                color: 'rgb(var(--mui-palette-warning-mainChannel) / 0.7)',
                '&:hover': {
                  color: 'var(--mui-palette-warning-main)'
                }
              },
              '&.MuiChip-clickable:hover': {
                backgroundColor: 'var(--mui-palette-warning-main)',
                color: 'var(--mui-palette-common-white)'
              }
            }
          },
          {
            props: { variant: 'tonal', color: 'info' },
            style: {
              backgroundColor: 'var(--mui-palette-info-lightOpacity)',
              color: 'color-mix(in srgb, var(--mui-palette-info-main) 50%, #000)',
              ...theme.applyStyles('dark', {
                color: 'color-mix(in srgb, var(--mui-palette-info-main) 45%, #fff)'
              }),
              '&.Mui-focusVisible': {
                backgroundColor: 'var(--mui-palette-info-mainOpacity)'
              },
              '& .MuiChip-deleteIcon': {
                color: 'rgb(var(--mui-palette-info-mainChannel) / 0.7)',
                '&:hover': {
                  color: 'var(--mui-palette-info-main)'
                }
              },
              '&.MuiChip-clickable:hover': {
                backgroundColor: 'var(--mui-palette-info-main)',
                color: 'var(--mui-palette-common-white)'
              }
            }
          },
          {
            props: { variant: 'tonal', color: 'success' },
            style: {
              backgroundColor: 'var(--mui-palette-success-lightOpacity)',
              color: 'color-mix(in srgb, var(--mui-palette-success-main) 50%, #000)',
              ...theme.applyStyles('dark', {
                color: 'color-mix(in srgb, var(--mui-palette-success-main) 45%, #fff)'
              }),
              '&.Mui-focusVisible': {
                backgroundColor: 'var(--mui-palette-success-mainOpacity)'
              },
              '& .MuiChip-deleteIcon': {
                color: 'rgb(var(--mui-palette-success-mainChannel) / 0.7)',
                '&:hover': {
                  color: 'var(--mui-palette-success-main)'
                }
              },
              '&.MuiChip-clickable:hover': {
                backgroundColor: 'var(--mui-palette-success-main)',
                color: 'var(--mui-palette-common-white)'
              }
            }
          }
        ],
        ...theme.typography.body2,
        fontWeight: theme.typography.fontWeightMedium,
        '&.MuiChip-outlined:not(.MuiChip-colorDefault)': {
          borderColor: `var(--mui-palette-${ownerState.color}-main)`,

          // El borde conserva el semáforo; el texto usa la tinta AA del tema.
          // En oscuro, error.main daba 3,75:1 sobre el fondo de /espejo.
          color: 'var(--mui-palette-text-primary)'
        },
        '& .MuiChip-deleteIcon': {
          ...(ownerState.size === 'small'
            ? {
                fontSize: '1rem',
                marginInlineEnd: theme.spacing(1),
                marginInlineStart: theme.spacing(-1)
              }
            : {
                fontSize: '1.25rem',
                marginInlineEnd: theme.spacing(1.5),
                marginInlineStart: theme.spacing(-2)
              })
        },
        '& .MuiChip-avatar, & .MuiChip-icon': {
          '& i, & svg': {
            ...(ownerState.size === 'small'
              ? {
                  fontSize: 13
                }
              : {
                  fontSize: 15
                })
          },
          ...(ownerState.size === 'small'
            ? {
                blockSize: 16,
                inlineSize: 16,
                marginInlineStart: theme.spacing(1),
                marginInlineEnd: theme.spacing(-1)
              }
            : {
                blockSize: 20,
                inlineSize: 20,
                marginInlineStart: theme.spacing(1.5),
                marginInlineEnd: theme.spacing(-2)
              })
        }
      }),
      label: ({ ownerState, theme }) => ({
        ...(ownerState.size === 'small'
          ? {
              paddingInline: theme.spacing(2)
            }
          : {
              paddingInline: theme.spacing(3)
            })
      }),
      iconMedium: {
        fontSize: '1.25rem'
      },
      iconSmall: {
        fontSize: '1rem'
      }
    }
  }
}

export default chip
