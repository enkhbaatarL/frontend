import { Components, Theme } from '@mui/material/styles'

const ThemeFormControlLabel: Components<Omit<Theme, 'components'>>['MuiFormControlLabel'] = {
  styleOverrides: {
    root: {
      marginLeft: 0,
      padding: '2px 0',
      alignItems: 'start',
    },
    label: {
      color: '#495057',
      fontWeight: '500',
      fontSize: '14px',
      lineHeight: 1.5,
      '&.Mui-disabled': {
        color: '#ADB5BD',
      },
    },
  },
}

export default ThemeFormControlLabel
