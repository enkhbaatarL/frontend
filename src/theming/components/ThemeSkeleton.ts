import { Components, Theme } from '@mui/material/styles'

const ThemeSkeleton: Components<Omit<Theme, 'components'>>['MuiSkeleton'] = {
  styleOverrides: {
    root: ({ theme }) => ({
      background: theme.palette.gray['20'],
      borderRadius: '4px',
    }),
  },
}

export default ThemeSkeleton
