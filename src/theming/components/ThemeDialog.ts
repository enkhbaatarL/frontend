import { Components, Theme } from '@mui/material/styles'

const ThemeDialog: Components<Omit<Theme, 'components'>> = {
  MuiDialog: {
    styleOverrides: {
      paper: {
        maxWidth: '90vw',
        maxHeight: '90vh',
        borderRadius: '12px',
        boxShadow: '0px 18px 50px -10px rgba(0, 0, 0, 0.20)',
        border: '1px solid #DEE2E6',
        boxSizing: 'border-box',
      },
    },
  },
  MuiDialogTitle: {
    styleOverrides: {
      root: {
        fontSize: '16px',
        padding: '20px 20px 30px 20px',
        color: '#495057',
        lineHeight: 1.4,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      },
    },
  },
  MuiDialogContent: {
    styleOverrides: {
      root: {
        padding: '0px 20px',
        fontSize: '14px',
        fontWeight: 400,
        lineHeight: 1.4,
        color: '#495057',
        '&::-webkit-scrollbar': {
          width: 4,
        },
        '&::-webkit-scrollbar-track': {
          background: 'transparent',
        },
        '&::-webkit-scrollbar-thumb': {
          background: '#CED4DA',
          borderRadius: 10,
        },
      },
    },
  },
  MuiDialogContentText: {
    styleOverrides: {
      root: {
        fontSize: '14px',
        fontWeight: 400,
        lineHeight: 1.4,
        color: '#495057',
      },
    },
  },
  MuiDialogActions: {
    styleOverrides: {
      root: {
        padding: '30px 20px 20px 20px',
        gap: '2px',
      },
    },
  },
}

export default ThemeDialog
