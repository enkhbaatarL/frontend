import { Components, Theme } from '@mui/material/styles'

const ThemeSelect: Components<Omit<Theme, 'components'>>['MuiSelect'] = {
  styleOverrides: {
    root: {},
  },
}

export default ThemeSelect
