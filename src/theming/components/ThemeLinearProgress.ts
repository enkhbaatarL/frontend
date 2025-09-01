import { Components, Theme } from '@mui/material/styles'

const ThemeLinearProgress: Components<Omit<Theme, 'components'>>['MuiLinearProgress'] = {
  styleOverrides: {
    root: {
      borderRadius: 20,
      backgroundColor: '#F1F3F5',
    },
    bar: {
      borderRadius: 20,
    },
  },
}

export default ThemeLinearProgress
