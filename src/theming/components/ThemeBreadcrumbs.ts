import { Components, Theme } from '@mui/material/styles'

const ThemeBreadcrumbs: Components<Omit<Theme, 'components'>>['MuiBreadcrumbs'] = {
  styleOverrides: {
    separator: ({ theme }) => ({
      margin: '0 4px',
      color: theme.palette.gray['40'],
    }),
  },
}

export default ThemeBreadcrumbs
