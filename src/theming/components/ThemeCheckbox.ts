import { Components, Theme } from '@mui/material/styles'

const ThemeCheckbox: Components<Omit<Theme, 'components'>>['MuiCheckbox'] = {
  styleOverrides: {
    root: {
      padding: 0,
      width: 20,
      height: 20,
      boxSizing: 'border-box',
      margin: '4px 8px 4px 4px',
      '&.Mui-checked.Mui-disabled *': {
        backgroundColor: '#CED4DA',
      },
    },
  },
}

export default ThemeCheckbox
