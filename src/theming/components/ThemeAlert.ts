import { Components, Theme } from '@mui/material/styles'
const ThemeAlert: Components<Omit<Theme, 'components'>> = {
  MuiAlert: {
    styleOverrides: {
      root: ({ ownerState, theme }) => {
        if (!ownerState || !theme) return {}

        const color = ownerState.severity ? theme.palette[ownerState.severity]?.main : theme.palette.info.main

        return {
          borderColor: color,
          borderRadius: '8px',
          boxShadow: '0px 6px 12px 0px rgba(0, 0, 0, 0.10)',
          color: theme.palette.gray['70'],
          fontSize: '14px',
          fontWeight: 400,
          lineHeight: 1.4,
          width: '360px',
          padding: '12px 16px',
          boxSizing: 'border-box',
          '&.MuiAlert-outlinedSuccess': {
            backgroundColor: '#E7F6F2',
          },
          '&.MuiAlert-outlinedError': {
            backgroundColor: '#FEECEC',
          },
          '&.MuiAlert-outlinedInfo': {
            backgroundColor: '#ECF5FD',
          },
          '&.MuiAlert-outlinedWarning': {
            backgroundColor: '#FEFBEA',
          },
        }
      },
      message: {
        padding: 0,
        display: 'grid',
        gap: '4px',
      },
      icon: {
        padding: '4px 0',
        marginRight: '8px',
        opacity: 1,
      },
      action: {
        padding: '4px',
        marginRight: 0,
        marginTop: 0,
        boxSizing: 'border-box',
        width: '28px',
        height: '28px',
      },
    },
  },
  MuiAlertTitle: {
    styleOverrides: {
      root: ({ theme }) => ({
        color: theme.palette.gray['90'],
        fontSize: '16px',
        fontWeight: 600,
        lineHeight: 1.4,
        padding: '3px 0',
        marginTop: 0,
        marginBottom: 0,
      }),
    },
  },
}

export default ThemeAlert
