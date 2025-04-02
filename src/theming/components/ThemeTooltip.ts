import { Components, Theme } from '@mui/material/styles'

const ThemeTooltip: Components<Omit<Theme, 'components'>>['MuiTooltip'] = {
  styleOverrides: {
    tooltip: {
      backgroundColor: '#202D44',
      padding: '8px 10px',
      fontSize: '12px',
      borderRadius: '8px',
    },
    arrow: {
      color: '#202D44',
    },
  },
}

export default ThemeTooltip
