import { Components, Theme } from '@mui/material/styles'

const ThemeFormControl: Components<Omit<Theme, 'components'>>['MuiFormControl'] = {
  styleOverrides: {
    root: {
      //border: '1px solid #000',
      minWidth: 'unset !important',
      width: '100%',
    },
  },
}

export default ThemeFormControl
