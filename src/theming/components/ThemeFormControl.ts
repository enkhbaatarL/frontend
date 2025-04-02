import { Components, Theme } from '@mui/material/styles'

const ThemeFormControl: Components<Omit<Theme, 'components'>>['MuiFormControl'] = {
  styleOverrides: {
    root: {
      border: 0,
    },
  },
}

export default ThemeFormControl
