import { alpha, Components, Theme } from '@mui/material/styles'

const ThemeIconButton: Components<Omit<Theme, 'components'>>['MuiIconButton'] = {
  styleOverrides: {
    root: ({ ownerState, theme }) => {
      const isCustomColor = (color: string): boolean => {
        if (!color) return false

        return typeof color === 'string' && color.includes('.')
      }

      // If it's a custom color, extract the color family and shade
      if (ownerState.color && isCustomColor(ownerState.color)) {
        const [colorFamily, shade] = (ownerState.color as string).split('.')

        // Type guard to check if colorFamily exists in palette and is a CustomPaletteColor
        if (
          colorFamily &&
          shade &&
          colorFamily in theme.palette &&
          typeof theme.palette[colorFamily as keyof typeof theme.palette] === 'object' &&
          shade in (theme.palette[colorFamily as keyof typeof theme.palette] as Record<number | string, string>)
        ) {
          const colorValue = (theme.palette[colorFamily as keyof typeof theme.palette] as Record<number | string, string>)[shade]

          return {
            color: colorValue,
            '&:hover': {
              backgroundColor: alpha(colorValue, 0.08),
            },
          }
        }
      }

      return {}
    },
  },
}

export default ThemeIconButton
