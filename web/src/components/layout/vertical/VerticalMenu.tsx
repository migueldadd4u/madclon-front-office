import { forwardRef } from 'react'
import type { ButtonHTMLAttributes } from 'react'

// MUI Imports
import { useTheme } from '@mui/material/styles'

// Third-party Imports
import PerfectScrollbar from 'react-perfect-scrollbar'

// Type Imports
import type { VerticalMenuContextProps } from '@menu/components/vertical-menu/Menu'

// Component Imports
import { Menu, MenuItem, SubMenu } from '@menu/vertical-menu'

// Hook Imports
import useVerticalNav from '@menu/hooks/useVerticalNav'
import useVerticalMenu from '@menu/hooks/useVerticalMenu'
import { useLang } from '@/lib/i18n'

// Styled Component Imports
import StyledVerticalNavExpandIcon from '@menu/styles/vertical/StyledVerticalNavExpandIcon'

// Style Imports
import menuItemStyles from '@core/styles/vertical/menuItemStyles'
import menuSectionStyles from '@core/styles/vertical/menuSectionStyles'

type RenderExpandIconProps = {
  open?: boolean
  transitionDuration?: VerticalMenuContextProps['transitionDuration']
}

type Props = {
  scrollMenu: (container: any, isPerfectScrollbar: boolean) => void
}

const RenderExpandIcon = ({ open, transitionDuration }: RenderExpandIconProps) => (
  <StyledVerticalNavExpandIcon open={open} transitionDuration={transitionDuration}>
    <i className='ri-arrow-right-s-line' />
  </StyledVerticalNavExpandIcon>
)

// Este es el único grupo de primer nivel del menú público. Lee el mismo
// contexto que lo despliega, también después de navegar o usar Atrás.
const BotonSistema = forwardRef<HTMLButtonElement, ButtonHTMLAttributes<HTMLButtonElement>>((props, ref) => {
  const { openSubmenu } = useVerticalMenu()

  return (
    <button
      {...props}
      ref={ref}
      type='button'
      aria-expanded={openSubmenu?.some(grupo => grupo.level === 0) ?? false}
      onKeyUp={event => event.stopPropagation()}
    />
  )
})

const VerticalMenu = ({ scrollMenu }: Props) => {
  // Hooks
  const theme = useTheme()
  const verticalNavOptions = useVerticalNav()
  const { t } = useLang()

  // Vars
  const { isBreakpointReached, transitionDuration } = verticalNavOptions

  const ScrollWrapper = isBreakpointReached ? 'div' : PerfectScrollbar

  return (
    // eslint-disable-next-line lines-around-comment
    /* Custom scrollbar instead of browser scroll, remove if you want browser scroll only */
    <ScrollWrapper
      {...(isBreakpointReached
        ? {
            className: 'bs-full overflow-y-auto overflow-x-hidden',
            onScroll: container => scrollMenu(container, false)
          }
        : {
            options: { wheelPropagation: false, suppressScrollX: true },
            onScrollY: container => scrollMenu(container, true)
          })}
    >
      {/* Incase you also want to scroll NavHeader to scroll with Vertical Menu, remove NavHeader from above and paste it below this comment */}
      {/* Vertical Menu */}
      <Menu
        popoutMenuOffset={{ mainAxis: 17 }}
        menuItemStyles={menuItemStyles(verticalNavOptions, theme)}
        renderExpandIcon={({ open }) => <RenderExpandIcon open={open} transitionDuration={transitionDuration} />}
        renderExpandedMenuItemIcon={{ icon: <i className='ri-circle-fill' /> }}
        menuSectionStyles={menuSectionStyles(verticalNavOptions, theme)}
      >
        <MenuItem href='/' icon={<i className='ri-dashboard-3-line' />}>
          {t('nav_panel')}
        </MenuItem>
        <MenuItem href='/retos' icon={<i className='ri-focus-3-line' />}>
          {t('nav_retos')}
        </MenuItem>
        <MenuItem href='/historia' icon={<i className='ri-time-line' />}>
          {t('nav_historia')}
        </MenuItem>
        <MenuItem href='/preguntas' icon={<i className='ri-question-line' />}>
          {t('nav_preguntas')}
        </MenuItem>
        <SubMenu
          label={t('nav_sistema')}
          icon={<i className='ri-settings-3-line' />}
          rootStyles={{ '& > button.ts-menu-button': { backgroundColor: 'transparent' } }}

          // El botón nativo activa Enter/Space una sola vez. Se sustituye el
          // keyUp heredado de la plantilla, que duplicaría Enter tras el click.
          component={<BotonSistema />}
        >
          <MenuItem href='/flota/' icon={<i className='ri-robot-2-line' />}>
            {t('nav_flota')}
          </MenuItem>
          <MenuItem href='/hardware/' icon={<i className='ri-computer-line' />}>
            {t('nav_hardware')}
          </MenuItem>
          <MenuItem href='/salud/' icon={<i className='ri-heart-pulse-line' />}>
            {t('nav_salud')}
          </MenuItem>
          <MenuItem href='/tokens/' icon={<i className='ri-coins-line' />}>
            {t('nav_tokens')}
          </MenuItem>
          <MenuItem href='/eficiencia/' icon={<i className='ri-line-chart-line' />}>
            {t('nav_eficiencia')}
          </MenuItem>
          <MenuItem href='/actividad/' icon={<i className='ri-inbox-line' />}>
            {t('nav_actividad')}
          </MenuItem>
        </SubMenu>
      </Menu>
      {/* <Menu
        popoutMenuOffset={{ mainAxis: 17 }}
        menuItemStyles={menuItemStyles(verticalNavOptions, theme)}
        renderExpandIcon={({ open }) => <RenderExpandIcon open={open} transitionDuration={transitionDuration} />}
        renderExpandedMenuItemIcon={{ icon: <i className='ri-circle-fill' /> }}
        menuSectionStyles={menuSectionStyles(verticalNavOptions, theme)}
      >
        <GenerateVerticalMenu menuData={menuData(dictionary, params)} />
      </Menu> */}
    </ScrollWrapper>
  )
}

export default VerticalMenu
