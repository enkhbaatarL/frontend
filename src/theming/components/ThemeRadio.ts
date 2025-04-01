import { Components, Theme } from '@mui/material/styles'

const ThemeRadio: Components<Omit<Theme, 'components'>>['MuiRadio'] = {
  styleOverrides: {
    root: {
      color: '#CED4DA',
      padding: '2px',
      marginRight: '4px',
    },
  },
}

export default ThemeRadio
