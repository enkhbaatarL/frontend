import { Components, Theme } from '@mui/material/styles'

const ThemeButton: Components<Omit<Theme, 'components'>>['MuiButton'] = {
  styleOverrides: {
    root: {
      textTransform: 'none',
      borderRadius: '6px',
      fontWeight: 600,
      boxShadow: 'none',
      lineHeight: '1.4',
      '&:hover': {
        boxShadow: 'none',
      },
      '&.MuiButton-colorSecondary': {
        color: '#495057',
      },
    },
    outlined: {
      borderColor: 'currentcolor',
      borderWidth: '1px',
      '&.MuiButton-colorSecondary': {
        borderColor: '#DEE2E6',
      },
    },
  },
}

export default ThemeButton
