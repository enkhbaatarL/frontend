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
        borderRadius: '4px',
        '&:hover': {
          backgroundColor: '#F8F9FA',
          color: '#2E3F5E',
        },
        '.MuiTouchRipple-root': {
          display: 'none',
        },
      },
      '& .MuiPaginationItem-root[aria-label="Go to next page"]': {
        '&:hover': {
          backgroundColor: 'transparent',
        },
      },
      '& .MuiPaginationItem-root[aria-label="Go to last page"]': {
        '&:hover': {
          backgroundColor: 'transparent',
        },
      },
      '& .MuiPaginationItem-root[aria-label="Go to previous page"]': {
        '&:hover': {
          backgroundColor: 'transparent',
        },
      },
      '& .MuiPaginationItem-root[aria-label="Go to first page"]': {
        '&:hover': {
          backgroundColor: 'transparent',
        },
      },
      '& .MuiPaginationItem-root.Mui-selected': {
        color: '#2E3F5E',
        backgroundColor: '#F8F9FA',
        fontWeight: 600,
        '&:hover': {
          color: '#2E3F5E',
          backgroundColor: '#F8F9FA',
        },
      },
      '& .MuiPaginationItem-icon': {
        color: '#868E96',
        '&:hover': {
          color: '#343A40',
          backgroundColor: 'transparent',
        },
      },
      '& .MuiPaginationItem-root.Mui-disabled': {
        opacity: 1,
      },
      '& .Mui-disabled .MuiPaginationItem-icon': {
        color: '#CED4DA',
        opacity: 1,
      },
    },
  },
}

export default ThemePagination
