import { Components, Theme } from '@mui/material/styles'

const ThemeFormControlLabel: Components<Omit<Theme, 'components'>>['MuiFormControlLabel'] = {
  styleOverrides: {
    root: {
      marginLeft: 0,
      padding: '2px 0',
    },
    label: {
      color: '#495057',
      fontWeight: '500',
      fontSize: '14px',
      '&.Mui-disabled': {
        color: '#495057',
      },
    },
  },
}

export default ThemeFormControlLabel
