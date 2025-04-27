import { Components, Theme } from '@mui/material/styles'

const ThemeTextField: Components<Omit<Theme, 'components'>>['MuiTextField'] = {
  styleOverrides: {
    root: ({ theme, ownerState }) => ({
      backgroundColor: '#fff',
      minWidth: '160px',
      fontWeight: '400',
      lineHeight: 1.4,
      boxSizing: 'border-box',
      color: theme.palette.gray['90'],
      padding: 0,
      '& .MuiInputBase-root': {
        border: `1px solid ${theme.palette.gray['30']}`,
        borderRadius: 6,
      },
      '& .MuiInputBase-input': {
        fontWeight: '400',
        borderRadius: 6,
        color: theme.palette.gray['90'],
        border: 0,
        fontSize: (ownerState.size as 'small' | 'medium') === 'small' ? '12px' : '14px',
        padding: (ownerState.size as 'small' | 'medium') === 'small' ? '5px 12px' : '8px 12px',
      },
      '& .MuiInputBase-input.Mui-disabled': {
        borderColor: '#E9ECEF',
        backgroundColor: '#F1F3F5',
        color: theme.palette.gray['70'],
        WebkitTextFillColor: 'unset',
      },
      '&[aria-readonly="true"] .MuiInputBase-input': {
        backgroundColor: '#F1F3F5',
      },
      '& .MuiInputBase-multiline': {
        padding: 0,
      },
    }),
  },
}

export default ThemeTextField
