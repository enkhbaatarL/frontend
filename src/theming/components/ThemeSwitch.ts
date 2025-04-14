import { Components, Theme } from '@mui/material/styles'

const ThemeSwitch: Components<Omit<Theme, 'components'>>['MuiSwitch'] = {
  styleOverrides: {
    root: ({ theme, ownerState }) => ({
      width: ownerState.size === 'small' ? 32 : 44,
      height: ownerState.size === 'small' ? 20 : 24,
      marginRight: 6,
      padding: 0,
      '& .MuiSwitch-switchBase': {
        padding: 0,
        margin: ownerState.size === 'small' ? 2 : 3,
        transitionDuration: '200ms',
        '&.Mui-checked': {
          transform: ownerState.size === 'small' ? 'translateX(12px)' : 'translateX(20px)',
          color: '#fff',
          '& + .MuiSwitch-track': {
            backgroundColor: theme.palette.primary.main,
            opacity: 1,
            border: 0,
            ...theme.applyStyles('dark', {
              backgroundColor: theme.palette.primary.main,
            }),
          },
          '&.Mui-disabled + .MuiSwitch-track': {
            opacity: 1,
            backgroundColor: theme.palette.gray[40],
          },
          '&.Mui-disabled .MuiSwitch-thumb': {
            backgroundColor: '#fff',
          },
        },
        '&.Mui-focusVisible .MuiSwitch-thumb': {
          color: theme.palette.primary.main,
          border: '6px solid #fff',
        },
        '&.Mui-disabled .MuiSwitch-thumb': {
          color: theme.palette.grey[100],
          backgroundColor: theme.palette.gray[20],
          ...theme.applyStyles('dark', {
            color: theme.palette.grey[600],
          }),
        },
        '&.Mui-disabled + .MuiSwitch-track': {
          opacity: 1,
          backgroundColor: theme.palette.gray[40],
          ...theme.applyStyles('dark', {
            opacity: 0.3,
          }),
        },
      },
      '& .MuiSwitch-thumb': {
        boxSizing: 'border-box',
        width: ownerState.size === 'small' ? 16 : 18,
        height: ownerState.size === 'small' ? 16 : 18,
        boxShadow: 'none',
      },
      '& .MuiSwitch-track': {
        borderRadius: 26 / 2,
        backgroundColor: theme.palette.gray[60],
        opacity: 1,
        transition: theme.transitions.create(['background-color'], {
          duration: 500,
        }),
        ...theme.applyStyles('dark', {
          backgroundColor: '#39393D',
        }),
      },
    }),
  },
}

export default ThemeSwitch
