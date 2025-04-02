import { Components, Theme } from '@mui/material/styles'

const ThemeTextField: Components<Omit<Theme, 'components'>>['MuiTextField'] = {
  styleOverrides: {
    root: ({ theme, ownerState }) => ({
      backgroundColor: '#fff',
      borderRadius: 6,
      minWidth: '200px',
      fontWeight: '400',
      lineHeight: 1.4,
      boxSizing: 'border-box',
      color: theme.palette.gray['90'],
      padding: 0,
      '& .MuiInputBase-input': {
        fontWeight: '400',
        borderRadius: 6,
        color: theme.palette.gray['90'],
        fontSize: (ownerState.size as 'small' | 'medium') === 'small' ? '12px' : '14px',
        border: `1px solid ${theme.palette.gray['30']}`,
        padding: (ownerState.size as 'small' | 'medium') === 'small' ? '5px 12px' : '7px 12px',
      },
      '& .MuiInputBase-input.Mui-disabled': {
        border: '1px solid #E9ECEF',
        backgroundColor: '#F1F3F5',
      },
      '&[aria-readonly="true"] .MuiInputBase-input': {
        border: '1px solid #E9ECEF',
        backgroundColor: '#F1F3F5',
      },
    }),
  },
}

export default ThemeTextField
