import { createTheme } from '@mui/material/styles'
import { CSSProperties } from 'react'

import components from '@/theming/components'

declare module '@mui/material/styles' {
  interface Palette {
    ochre: Palette['primary']
    gray: Record<number, string>
  }

  interface PaletteOptions {
    ochre?: PaletteOptions['primary']
    gray?: Record<number, string>
  }
}

declare module '@mui/material/Button' {
  interface ButtonPropsColorOverrides {
    ochre: true
    gray: true
  }
}

declare module '@mui/material/styles' {
  interface TypographyVariants {
    heading1: CSSProperties
    subtext1: CSSProperties
    body1: CSSProperties
    body1B16: CSSProperties
    body1R16: CSSProperties
    body2: CSSProperties
    body6: CSSProperties
  }

  // allow configuration using `createTheme()`
  interface TypographyVariantsOptions {
    heading1?: CSSProperties
    subtext1?: CSSProperties
    body1?: CSSProperties
    body1B16?: CSSProperties
    body1R16?: CSSProperties
    body2?: CSSProperties
    body6?: CSSProperties
  }
}

// Update the Typography's variant prop options
declare module '@mui/material/Typography' {
  interface TypographyPropsVariantOverrides {
    heading1: true
    subtext1: true
    body1: true
    body1B16: true
    body1R16: true
    body2: true
    body6: true
    h1: false
  }
}

const theme = createTheme({
  palette: {
    primary: {
      main: '#2E3F5E',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#6C757D',
      contrastText: '#FFFFFF',
    },
    success: {
      main: '#0CA678',
      contrastText: '#FFFFFF',
    },
    error: {
      main: '#F03E3E',
      contrastText: '#FFFFFF',
    },
    warning: {
      main: '#F0D92D',
      contrastText: '#FFFFFF',
    },
    info: {
      main: '#409FE8',
      contrastText: '#FFFFFF',
    },
    gray: {
      20: '#E9ECEF',
      60: '#868E96',
      70: '#495057',
      90: '#212529',
      30: '#DEE2E6',
    },
    background: {
      default: '#F8F9FA',
      paper: '#FFFFFF',
    },
  },
  spacing: 4, // 1 spacing = 4px
  typography: {
    heading1: {
      fontSize: '32px',
      fontStyle: 'normal',
      fontWeight: 700,
      lineHeight: '1.4',
    },
    subtext1: {
      fontSize: '16px',
      fontStyle: 'normal',
      fontWeight: 400,
      lineHeight: '1.4',
    },
    body1: {
      fontSize: '16px',
      fontStyle: 'normal',
      fontWeight: 600,
      lineHeight: '1.4',
    },
    body1B16: {
      fontSize: '16px',
      fontStyle: 'normal',
      fontWeight: 700,
      lineHeight: '1.4',
    },
    body1R16: {
      fontSize: '16px',
      fontStyle: 'normal',
      fontWeight: 400,
      lineHeight: '1.4',
    },
    body2: {
      fontSize: '14px',
      fontStyle: 'normal',
      fontWeight: 400,
    },
    body6: {
      fontSize: '12px',
      fontStyle: 'normal',
      fontWeight: 600,
      lineHeight: '1.4',
    },
    h1: undefined,
    fontFamily: ['Pretendard', 'sans-serif'].join(','),
  },
  components,
})

export default theme
