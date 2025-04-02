import { createTheme } from '@mui/material/styles'
import { CSSProperties } from 'react'

import components from '@/theming/components'

declare module '@mui/material/styles' {
  interface Palette {
    ochre: Palette['primary']
    gray: Record<number, string>
    coolGray: Record<number, string>
    point: Record<string, string>
  }

  interface PaletteOptions {
    ochre?: PaletteOptions['primary']
    gray?: Record<number, string>
    coolGray?: Record<number, string>
    point?: Record<string, string>
  }
}

declare module '@mui/material/Button' {
  interface ButtonPropsColorOverrides {
    ochre: true
    gray: true
    coolGray: true
    point: true
  }
}

// Extend the IconButton component to accept your custom color prop
declare module '@mui/material/IconButton' {
  interface IconButtonPropsColorOverrides {
    ochre: true
    'gray.40': true
    'gray.60': true
    coolGray: true
    'point.red1': true
    // Add any other custom colors you need
  }
}

declare module '@mui/material/styles' {
  interface TypographyVariants {
    heading1: CSSProperties
    heading2: CSSProperties
    subtext1: CSSProperties
    subtext2: CSSProperties
    body1: CSSProperties
    body1B16: CSSProperties
    body1R16: CSSProperties
    body2: CSSProperties
    body2M14: CSSProperties
    body2SB14: CSSProperties
    body3: CSSProperties
    body4: CSSProperties
    body6: CSSProperties
    tableHeader1: CSSProperties
    tableBody1: CSSProperties
    tableBody2: CSSProperties
    chip1: CSSProperties
    chip2: CSSProperties
    breadcrumbs: CSSProperties
    subtitle: CSSProperties
    subtext: CSSProperties
    contentTitle: CSSProperties
    asterisk: CSSProperties
  }

  // allow configuration using `createTheme()`
  interface TypographyVariantsOptions {
    heading1?: CSSProperties
    heading2?: CSSProperties
    subtext1?: CSSProperties
    subtext2?: CSSProperties
    body1?: CSSProperties
    body1B16?: CSSProperties
    body1R16?: CSSProperties
    body2?: CSSProperties
    body2M14?: CSSProperties
    body2SB14?: CSSProperties
    body3?: CSSProperties
    body4?: CSSProperties
    body6?: CSSProperties
    tableHeader1?: CSSProperties
    tableBody1?: CSSProperties
    tableBody2?: CSSProperties
    chip1?: CSSProperties
    chip2?: CSSProperties
    breadcrumbs?: CSSProperties
    subtitle?: CSSProperties
    subtext?: CSSProperties
    contentTitle?: CSSProperties
    asterisk?: CSSProperties
  }
}

// Update the Typography's variant prop options
declare module '@mui/material/Typography' {
  interface TypographyPropsVariantOverrides {
    heading1: true
    heading2: true
    subtext1: true
    subtext2: true
    body1: true
    body1B16: true
    body1R16: true
    body2: true
    body2M14: true
    body2SB14: true
    body4: true
    body3: true
    body6: true
    tableHeader1: true
    tableBody1: true
    tableBody2: true
    chip1: true
    chip2: true
    h1: false
    breadcrumbs: true
    subtitle: true
    subtext: true
    contentTitle: true
    asterisk: true
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
    point: {
      red1: '#F03E3E',
      green1: '#0CA678',
    },
    gray: {
      5: '#F8F9FA',
      20: '#E9ECEF',
      40: '#CED4DA',
      50: '#ADB5BD',
      60: '#868E96',
      70: '#495057',
      90: '#212529',
      30: '#DEE2E6',
    },
    coolGray: {
      5: '#ced4da',
      10: '#909bb0',
      30: '#7e8ba4',
      50: '#43526e',
      70: '#2e3f5e',
      80: '#2e3f5e', // same as 70 in the imag
      90: '#283959',
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
    heading2: {
      fontSize: '24px',
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
    subtext2: {
      fontSize: '12px',
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
    body2M14: {
      fontSize: '14px',
      fontStyle: 'normal',
      fontWeight: 500,
      lineHeight: '1.4',
    },
    body2SB14: {
      fontSize: '14px',
      fontStyle: 'normal',
      fontWeight: 600,
      lineHeight: '1.4',
    },
    body3: {
      fontSize: '12px',
      fontStyle: 'normal',
      fontWeight: 500,
      lineHeight: '1.4',
    },
    body4: {
      fontSize: '14px',
      fontStyle: 'normal',
      fontWeight: 500,
      lineHeight: '1.4',
    },
    body6: {
      fontSize: '12px',
      fontStyle: 'normal',
      fontWeight: 600,
      lineHeight: '1.4',
    },
    tableHeader1: {
      fontSize: '13px',
      fontStyle: 'normal',
      fontWeight: 500,
      lineHeight: '1.4',
    },
    tableBody1: {
      fontSize: '14px',
      fontStyle: 'normal',
      fontWeight: 600,
      lineHeight: '1.4',
    },
    tableBody2: {
      fontSize: '14px',
      fontStyle: 'normal',
      fontWeight: 400,
      lineHeight: '1.4',
    },
    chip1: {
      fontSize: '14px',
      fontStyle: 'normal',
      fontWeight: 700,
      lineHeight: '1.4',
    },
    chip2: {
      fontSize: '12px',
      fontStyle: 'normal',
      fontWeight: 600,
      lineHeight: '1.4',
    },
    breadcrumbs: {
      fontSize: '13px',
      fontStyle: 'normal',
      fontWeight: 500,
      lineHeight: '1.4',
    },
    subtitle: {
      fontSize: '14px',
      fontStyle: 'normal',
      fontWeight: 600,
      lineHeight: '1.4',
    },
    subtext: {
      fontSize: '12px',
      fontStyle: 'normal',
      fontWeight: 400,
      lineHeight: '1.4',
    },
    contentTitle: {
      fontSize: '16px',
      fontStyle: 'normal',
      fontWeight: 700,
      lineHeight: '1.4',
    },
    asterisk: {
      fontSize: '12px',
      fontStyle: 'normal',
      fontWeight: 900,
      lineHeight: '1.4',
      letterSpacing: '0.15px',
      fontFeatureSettings: '\'liga\' off, \'clig\' off',
    },
    h1: undefined,
    fontFamily: ['Pretendard', 'sans-serif'].join(','),
  },
  components,
})

export default theme
