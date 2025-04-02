import { Components, Theme } from '@mui/material/styles'

const ThemeSelect: Components<Omit<Theme, 'components'>> = {
  MuiSelect: {
    styleOverrides: {
      root: ({ theme, ownerState }) => {
        const ownerStateSize = ownerState.size as 'small' | 'medium' | 'large'

        let fontSize
        let padding

        switch (ownerStateSize) {
        case 'small':
          fontSize = '12px'
          padding = '5px 12px'
          break
        case 'large':
          fontSize = '16px'
          padding = '10px 12px'
          break
        default: // 'medium'
          fontSize = '14px'
          padding = '7px 12px'
          break
        }

        return {
          borderRadius: 6,
          minWidth: '200px',
          fontSize,
          fontWeight: '400',
          lineHeight: 1.4,
          boxSizing: 'border-box',
          backgroundColor: 'white',
          color: theme.palette.gray['90'],
          border: `1px solid ${theme.palette.gray['30']}`,
          padding,
          '&.Mui-disabled': {
            border: '1px solid #E9ECEF',
            backgroundColor: '#F1F3F5',
          },
        }
      },
      select: {
        borderRadius: 6,
        border: 'none',
        boxSizing: 'border-box',
        padding: 0,
        paddingRight: '10px !important',
      },
      standard: {
        borderRadius: 6,
        border: '1px solid #000',
      },
      icon: {
        width: '6px',
        height: '6px',
        borderLeft: '2px solid #868E96',
        borderBottom: '2px solid #868E96',
        transform: 'rotate(-45deg) scale(0.9)',
        top: '33%',
        right: '12px',
        borderRadius: 1,
        '& *': {
          opacity: 0,
        },
      },
      iconOpen: {
        width: '6px',
        height: '6px',
        borderLeft: '2px solid #868E96',
        borderTop: '2px solid #868E96',
        borderBottom: 0,
        top: '42%',
        transform: 'rotate(45deg) scale(0.9)',
        borderRadius: 1,
        right: '12px',
        '& *': {
          opacity: 0,
        },
      },
    },
  },
  MuiList: {
    styleOverrides: {
      root: {
        borderRadius: '6px',
        boxShadow: '0px 0px 8px 0px rgba(0, 0, 0, 0.20)',
      },
    },
  },
  MuiMenuItem: {
    styleOverrides: {
      root: ({ theme }) => ({
        fontSize: '14px',
        fontWeight: '400',
        lineHeight: '1.4',
        padding: '8px 12px',
        color: theme.palette.gray['70'],
        '&:hover': {
          color: theme.palette.gray['90'],
          backgroundColor: '#F8F9FA',
        },
        '&:hover .MuiSvgIcon-root': {
          color: theme.palette.gray['90'],
        },
      }),
    },
  },
  MuiPaper: {
    styleOverrides: {
      root: {
        //boxShadow: '0px 0px 8px 0px rgba(0, 0, 0, 0.02)'
      },
    },
  },
}

export default ThemeSelect
