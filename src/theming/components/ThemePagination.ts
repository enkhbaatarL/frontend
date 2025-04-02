import { Components, Theme } from '@mui/material/styles'

const ThemePagination: Components<Omit<Theme, 'components'>>['MuiPagination'] = {
  styleOverrides: {
    root: {
      '& .MuiPaginationItem-root': {
        color: '#495057',
      },
      '& .MuiPaginationItem-root.Mui-selected': {
        color: '#2E3F5E',
        backgroundColor: '#F8F9FA',
      },
      '& .MuiPaginationItem-icon': {
        color: '#868E96',
      },
      '& .MuiPaginationItem-icon.Mui-disabled': {
        color: '#CED4DA',
      },
    },
  },
}

export default ThemePagination
