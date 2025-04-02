import { Components, Theme } from '@mui/material/styles'

const ThemeButton: Components<Omit<Theme, 'components'>>['MuiButton'] = {
  styleOverrides: {
    root: {
      textTransform: 'none',
      borderRadius: '6px',
      fontWeight: 600,
      boxShadow: 'none',
      lineHeight: '1.4',
      minWidth: '32px',
      whiteSpace: 'nowrap',
      '&:hover': {
        boxShadow: 'none',
      },
      '&.MuiButton-colorSecondary': {
        color: '#495057',
      },
      '&.Mui-disabled': {
        backgroundColor: '#F1F3F5',
      },
    },
    outlined: {
      borderColor: 'currentcolor',
      borderWidth: '1px',
      '&.MuiButton-colorSecondary': {
        borderColor: '#DEE2E6',
        backgroundColor: '#fff',
        '&:hover': {
          borderColor: '#868b8c',
        },
      },
    },
  },
}

export default ThemeButton
