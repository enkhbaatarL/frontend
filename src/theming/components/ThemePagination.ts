import { Components, Theme } from '@mui/material/styles'

const ThemePagination: Components<Omit<Theme, 'components'>>['MuiPagination'] = {
  styleOverrides: {
    root: {
      '.MuiPagination-ul': {
        gap: 8,
      },
      '& .MuiPaginationItem-root': {
        color: '#495057',
        margin: 0,
        fontWeight: 500,
      },
      '& .MuiPaginationItem-root.Mui-selected': {
        color: '#2E3F5E',
        backgroundColor: '#F8F9FA',
        fontWeight: 600,
      },
      '& .MuiPaginationItem-icon': {
        color: '#868E96',
      },
      '& .MuiPaginationItem-root.Mui-disabled': {
        opacity: 1,
      },
      '& .Mui-disabled .MuiPaginationItem-icon': {
        color: '#CED4DA',
      },
    },
  },
}

export default ThemePagination
