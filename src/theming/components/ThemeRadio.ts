import { Components, Theme } from '@mui/material/styles'

const ThemeRadio: Components<Omit<Theme, 'components'>>['MuiRadio'] = {
  styleOverrides: {
    root: {
      color: '#CED4DA',
      padding: '2px',
      marginRight: '4px',
      marginTop: '-4px',
      '&.Mui-disabled': {
        backgroundColor: '#E9ECEF',
        outline: '4px solid #ffffff',
        outlineOffset: -4,
        color: '#CED4DA',
        '&.Mui-checked': {
          backgroundColor: '#fff',
        },
      },

      '&:hover': {
        color: '#2E3F5E',
      },
    },
  },
}

export default ThemeRadio
