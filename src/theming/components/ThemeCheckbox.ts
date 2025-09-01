import { Components, Theme } from '@mui/material/styles'

const ThemeCheckbox: Components<Omit<Theme, 'components'>>['MuiCheckbox'] = {
  styleOverrides: {
    root: {
      padding: 0,
      width: 16,
      height: 16,
      boxSizing: 'border-box',
      margin: '3px 8px 3px 0px',
      flexShrink: 0,
      '&.Mui-checked.Mui-disabled *': {
        backgroundColor: '#CED4DA',
      },
    },
  },
}

export default ThemeCheckbox
