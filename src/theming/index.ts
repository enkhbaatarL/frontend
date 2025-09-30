import { createTheme } from '@mui/material/styles'
import { CSSProperties } from 'react'

import components from '@/theming/components'

declare module '@mui/material/styles' {
  interface Palette {
    ochre: Palette['primary']
    gray: Record<number, string>
    coolGray: Record<number, string>
    commonColor: Record<string, string>
    mari: Record<string, string>
    contentText: Record<string, string>
    contentIcon: Record<string, string>
    contentBorder: Record<string, string>
    contentBG: Record<string, string>
    chartMonochrome4: Record<string, string>
    chartMonochrome7: Record<string, string>
    chartMulti: Record<string, string>
    point: Record<string, string>
    chart: Record<string, string>
    decrease: Record<string, string>
    content: Record<string, string>
  }

  interface PaletteOptions {
    ochre?: PaletteOptions['primary']
    gray?: Record<number, string>
    coolGray?: Record<number, string>
    commonColor?: Record<string, string>
    mari?: Record<string, string>
    contentText?: Record<string, string>
    contentIcon?: Record<string, string>
    contentBorder?: Record<string, string>
    contentBG?: Record<string, string>
    chartMonochrome4?: Record<string, string>
    chartMonochrome7?: Record<string, string>
    chartMulti?: Record<string, string>
    point?: Record<string, string>
    chart?: Record<string, string>
    decrease?: Record<string, string>
    increase?: Record<string, string>
    content: Record<string, string>
  }
}

declare module '@mui/material/Button' {
  interface ButtonPropsColorOverrides {
    ochre: true
    gray: true
    coolGray: true
    commonColor: true
    mari: true
    contentText: true
    contentIcon: true
    contentBorder: true
    contentBG: true
    chartMonochrome4: true
    chartMonochrome7: true
    chartMulti: true
    point: true
    chart: true
    decrease: true
  }
}

// Extend the IconButton component to accept your custom color prop
declare module '@mui/material/IconButton' {
  interface IconButtonPropsColorOverrides {
    ochre: true
    'gray.40': true
    'gray.60': true
    coolGray: true
    commonColor: true
    mari: true
    contentText: true
    contentIcon: true
    contentBorder: true
    contentBG: true
    chartMonochrome4: true
    chartMonochrome7: true
    chartMulti: true
    'point.red1': true
    decrease: true
    // Add any other custom colors you need
  }
}

declare module '@mui/material/styles' {
  interface TypographyVariants {
    heading0: CSSProperties
    heading1: CSSProperties
    heading2: CSSProperties
    heading3: CSSProperties
    heading4: CSSProperties
    subtext0: CSSProperties
    subtext1: CSSProperties
    subtext2: CSSProperties
    subtext3: CSSProperties
    subtext4: CSSProperties
    subtext5: CSSProperties
    mariButton: CSSProperties
    messageText1: CSSProperties
    messageText2: CSSProperties
    body1: CSSProperties
    body1M16: CSSProperties
    body1SB16: CSSProperties
    body1B16: CSSProperties
    body1R16: CSSProperties
    body2: CSSProperties
    body2M14: CSSProperties
    body2SB14: CSSProperties
    body2R14: CSSProperties
    body3: CSSProperties
    body3SB12: CSSProperties
    body3M12: CSSProperties
    body3R12: CSSProperties
    body3R14: CSSProperties
    body4: CSSProperties
    body6: CSSProperties
    tableHeader1: CSSProperties
    tableHeaderSemibold: CSSProperties
    tableBody1: CSSProperties
    tableBody2: CSSProperties
    chip1: CSSProperties
    chipM: CSSProperties
    chip2: CSSProperties
    breadcrumbs: CSSProperties
    subtitle: CSSProperties
    subtext: CSSProperties
    contentTitle: CSSProperties
    asterisk: CSSProperties
    helperText: CSSProperties
    labelText: CSSProperties
    fieldLabel: CSSProperties
    sectionTitle: CSSProperties
    titleBox: CSSProperties
    fileName: CSSProperties
    infoDocument: CSSProperties
    titleSubheader: CSSProperties
    chartToolTipTitle: CSSProperties
    chartToolTipNumber: CSSProperties
    titlePage: CSSProperties
    titleSubPage: CSSProperties
    bage1: CSSProperties
    bage2: CSSProperties
    titleCardInsight: CSSProperties
    sectionTitleTXL: CSSProperties
    textAI: CSSProperties
    mariDescription: CSSProperties
    mariParagraph: CSSProperties
  }

  // allow configuration using `createTheme()`
  interface TypographyVariantsOptions {
    heading0?: CSSProperties
    heading1?: CSSProperties
    heading2?: CSSProperties
    heading3?: CSSProperties
    heading4?: CSSProperties
    subtext0?: CSSProperties
    subtext1?: CSSProperties
    subtext2?: CSSProperties
    subtext3?: CSSProperties
    subtext4?: CSSProperties
    subtext5?: CSSProperties
    mariButton?: CSSProperties
    messageText1?: CSSProperties
    messageText2?: CSSProperties
    body1?: CSSProperties
    body1M16?: CSSProperties
    body1SB16?: CSSProperties
    body1B16?: CSSProperties
    body1R16?: CSSProperties
    body2?: CSSProperties
    body2M14?: CSSProperties
    body2SB14?: CSSProperties
    body2R14?: CSSProperties
    body3?: CSSProperties
    body3SB12?: CSSProperties
    body3M12?: CSSProperties
    body3R12?: CSSProperties
    body3R14?: CSSProperties
    body4?: CSSProperties
    body6?: CSSProperties
    tableHeader1?: CSSProperties
    tableHeaderSemibold?: CSSProperties
    tableBody1?: CSSProperties
    tableBody2?: CSSProperties
    chip1?: CSSProperties
    chipM?: CSSProperties
    chip2?: CSSProperties
    mariChip?: CSSProperties
    breadcrumbs?: CSSProperties
    subtitle?: CSSProperties
    subtext?: CSSProperties
    contentTitle?: CSSProperties
    asterisk?: CSSProperties
    helperText?: CSSProperties
    labelText?: CSSProperties
    fieldLabel?: CSSProperties
    sectionTitle?: CSSProperties
    titleBox: CSSProperties
    fileName: CSSProperties
    infoDocument: CSSProperties
    titleSubheader: CSSProperties
    chartToolTipTitle?: CSSProperties
    chartToolTipNumber?: CSSProperties
    titlePage: CSSProperties
    titleSubPage: CSSProperties
    bage1: CSSProperties
    bage2: CSSProperties
    titleCardInsight: CSSProperties
    sectionTitleTXL: CSSProperties
    textAI: CSSProperties
    mariDescription: CSSProperties
    mariParagraph: CSSProperties
  }
}

// Update the Typography's variant prop options
declare module '@mui/material/Typography' {
  interface TypographyPropsVariantOverrides {
    heading0: true
    heading1: true
    heading2: true
    heading3: true
    heading4: true
    subtext0: true
    subtext1: true
    subtext2: true
    subtext3: true
    subtext4: true
    subtext5: true
    mariButton: true
    messageText1: true
    messageText2: true
    body1: true
    body1M16: true
    body1SB16: true
    body1B16: true
    body1R16: true
    body2: true
    body2M14: true
    body2SB14: true
    body2R14: true
    body4: true
    body3: true
    body3SB12: true
    body3M12: true
    body3R12: true
    body3R14: true
    body6: true
    tableHeader1: true
    tableHeaderSemibold: true
    tableBody1: true
    tableBody2: true
    chip1: true
    chipM: true
    chip2: true
    mariChip: true
    h1: false
    breadcrumbs: true
    subtitle: true
    subtext: true
    contentTitle: true
    asterisk: true
    helperText: true
    labelText: true
    fieldLabel: true
    sectionTitle: true
    titleBox: true
    fileName: true
    infoDocument: true
    titleSubheader: true
    chartToolTipTitle: true
    chartToolTipNumber: true
    titlePage: true
    titleSubPage: true
    bage1: true
    bage2: true
    titleCardInsight: true
    sectionTitleTXL: true
    textAI: true
    mariDescription: true
    mariParagraph: true
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
      orange2: '#F76707',
      purple2: '#7048E8',
    },
    chart: {
      blue2: '#5191F5',
      green6: '#498B47',
      red4: '#CC4D50',
    },
    increase: {
      main: '#498B47',
    },
    decrease: {
      main: '#CC4D50',
    },
    content: {
      backgroundHover: '#F0F3F6',
      backgroundDisabled: '#F1F3F5',
      borderEnabled: '#DEE2E6',
      borderHover: '#CED4DA',
      borderActivePrimary: '#2E3F5E',
      borderDisabled: '#E9ECEF',
      iconEnabled: '#868E96',
      iconHover: '#343A40',
      iconActive: '#343A40',
      iconDisabled: '#CED4DA',
      textDisabled: '#ADB5BD',
      textNormal: '#495057',
      textBlack: '#212529',
    },
    gray: {
      5: '#F8F9FA',
      7: '#D1D5DB',
      8: '#E5E7EB',
      10: '#F1F3F5',
      20: '#E9ECEF',
      40: '#CED4DA',
      50: '#ADB5BD',
      60: '#868E96',
      70: '#495057',
      80: '#343A40',
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
    commonColor: {
      White: '#FFFFFF',
      Black: '#000000',
      Primary: '#2E3F5E',
      Primaryservice: '#414C93',
      Primarylight1: '#F0F4FF',
      Primarylight2: '#DFE5FB',
    },
    mari: {
      Primary: '#364FC7',
      MariBG: '#F9F8F6',
    },
    contentText: {
      Normal: '#495057',
      Disabled: '#ADB5BD',
      Placeholder: '#CED4DA',
      Error: '#F03E3E',
      White: '#FFFFFF',
      Black: '#212529',
      Subtext: '#868E96',
    },
    contentIcon: {
      Activew: '#FFFFFF',
      Activeb: '#343A40',
      ActivePrimary: '#2E3F5E',
      Hover: '#343A40',
      Disabled: '#CED4DA',
      Enabled: '#868E96',
      Error: '#F03E3E',
    },
    contentBorder: {
      Primaryactive: '#2E3F5E',
      Active: '#868E96',
      Normal: '#DEE2E6',
      Hover: '#ced4da',
      Disabled: '#E9ECEF',
      Error: '#F03E3E',
      Inverse: '#FFFFFF',
      Chartdash: '#B5B5B5',
      ChartSolid: '#8B8B8B',
    },
    contentBG: {
      Primaryactive: '#F8F9FA',
      PrimaryFade: '#ECEDF4',
      Active: '#E9ECEF',
      Hover: '#F0F3F6',
      Disabled: '#F1F3F5',
      Tooltip: '#202D44',
      Maribtnhover: '#EDECEA',
    },
  },
  spacing: 4, // 1 spacing = 4px
  typography: {
    heading0: {
      fontSize: '40px',
      fontStyle: 'normal',
      fontWeight: 700,
      lineHeight: '1.4',
    },
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
    heading3: {
      fontSize: '22px',
      fontStyle: 'normal',
      fontWeight: 700,
      lineHeight: '1.4',
    },
    heading4: {
      fontSize: '18px',
      fontStyle: 'normal',
      fontWeight: 400,
      lineHeight: '1.4',
    },
    subtext0: {
      fontSize: '18px',
      fontStyle: 'normal',
      fontWeight: 400,
      lineHeight: '1.6',
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
    subtext3: {
      fontSize: '12px',
      fontStyle: 'normal',
      fontWeight: 600,
      lineHeight: '1.4',
    },
    subtext4: {
      fontSize: '12px',
      fontStyle: 'normal',
      fontWeight: 400,
      lineHeight: '1.4',
    },
    subtext5: {
      fontSize: '16px',
      fontStyle: 'normal',
      fontWeight: 400,
      lineHeight: '1.6',
    },
    body1: {
      fontSize: '16px',
      fontStyle: 'normal',
      fontWeight: 600,
      lineHeight: '1.4',
    },
    body1M16: {
      fontSize: '16px',
      fontStyle: 'normal',
      fontWeight: 500,
      lineHeight: '1.4',
    },
    body1SB16: {
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
    body2R14: {
      fontSize: '14px',
      fontStyle: 'normal',
      fontWeight: 400,
      lineHeight: '1.4',
    },
    body3: {
      fontSize: '12px',
      fontStyle: 'normal',
      fontWeight: 500,
      lineHeight: '1.4',
    },
    body3SB12: {
      fontSize: '12px',
      fontStyle: 'normal',
      fontWeight: 600,
      lineHeight: '1.4',
    },
    body3M12: {
      fontSize: '12px',
      fontStyle: 'normal',
      fontWeight: 500,
      lineHeight: '1.4',
    },
    body3R12: {
      fontSize: '12px',
      fontStyle: 'normal',
      fontWeight: 400,
      lineHeight: '1.4',
    },
    body3R14: {
      fontSize: '14px',
      fontStyle: 'normal',
      fontWeight: 400,
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
    tableHeaderSemibold: {
      fontSize: '13px',
      fontStyle: 'normal',
      fontWeight: 600,
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
    chipM: {
      fontSize: '14px',
      fontStyle: 'normal',
      fontWeight: 700,
      lineHeight: '1',
      display: 'inline-block',
      height: '14px',
      letterSpacing: '0.36px',
    },
    chip2: {
      fontSize: '12px',
      fontStyle: 'normal',
      fontWeight: 600,
      lineHeight: '1.4',
    },
    mariChip: {
      fontSize: '12px',
      fontStyle: 'normal',
      fontWeight: 400,
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
    mariButton: {
      fontSize: '18px',
      fontStyle: 'normal',
      fontWeight: 700,
      lineHeight: '1.4',
    },
    messageText1: {
      fontSize: '20px',
      fontStyle: 'normal',
      fontWeight: 600,
      lineHeight: '1.2',
    },
    messageText2: {
      fontSize: '13px',
      fontStyle: 'normal',
      fontWeight: 400,
      lineHeight: '1.6',
    },
    asterisk: {
      fontSize: '12px',
      fontStyle: 'normal',
      fontWeight: 900,
      lineHeight: '1.4',
      letterSpacing: '0.15px',
      // prettier-ignore
      fontFeatureSettings: '\'liga\' off, \'clig\' off',
    },
    helperText: {
      fontSize: '12px',
      fontStyle: 'normal',
      fontWeight: 400,
      lineHeight: '1.4',
    },
    labelText: {
      fontSize: '12px',
      fontStyle: 'normal',
      fontWeight: 500,
      lineHeight: '100%',
    },
    fieldLabel: {
      fontSize: '14px',
      fontStyle: 'normal',
      fontWeight: 700,
      lineHeight: '1.4',
    },
    sectionTitle: {
      fontSize: '14px',
      fontStyle: 'normal',
      fontWeight: 700,
      lineHeight: '1.4',
    },
    titleBox: {
      fontSize: '20px',
      fontStyle: 'normal',
      fontWeight: 700,
      lineHeight: '1.2',
    },
    fileName: {
      fontSize: '16px',
      fontStyle: 'normal',
      fontWeight: 500,
      overflow: 'hidden',
      display: '-webkit-box',
      WebkitLineClamp: 2,
      WebkitBoxOrient: 'vertical',
    },
    infoDocument: {
      fontSize: '18px',
      fontStyle: 'normal',
      fontWeight: 600,
      lineHeight: '1.4',
    },
    titleSubheader: {
      fontSize: '56px',
      fontStyle: 'normal',
      fontWeight: 300,
    },
    titlePage: {
      fontSize: '28px',
      fontStyle: 'normal',
      fontWeight: 600,
      lineHeight: '1.4',
    },
    titleSubPage: {
      fontSize: '36px',
      fontStyle: 'normal',
      fontWeight: 600,
      lineHeight: '1',
    },
    bage1: {
      fontSize: '12px',
      fontStyle: 'normal',
      fontWeight: 500,
      lineHeight: '1',
    },
    bage2: {
      fontSize: '16px',
      fontStyle: 'normal',
      fontWeight: 500,
      lineHeight: '1.28',
    },
    titleCardInsight: {
      fontSize: '24px',
      fontStyle: 'normal',
      fontWeight: 400,
      overflow: 'hidden',
      display: '-webkit-box',
      WebkitLineClamp: 6,
      WebkitBoxOrient: 'vertical',
    },

    h1: undefined,
    fontFamily: ['Pretendard', 'sans-serif'].join(','),
    chartToolTipTitle: {
      fontSize: '16px',
      fontStyle: 'normal',
      fontWeight: 600,
      lineHeight: '1.5',
      letterSpacing: '-0.5px',
    },
    chartToolTipNumber: {
      fontSize: '14px',
      fontStyle: 'normal',
      fontWeight: 600,
      lineHeight: '1.5',
      letterSpacing: '-0.5px',
    },
    sectionTitleTXL: {
      fontSize: '20px',
      fontStyle: 'normal',
      fontWeight: 600,
      lineHeight: '1.4',
    },
    textAI: {
      background: 'linear-gradient(272deg, #29487B -41.16%, #4B84E1 109.67%)',
      backgroundClip: 'text',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      fontSize: '20px',
      fontStyle: 'normal',
      fontWeight: 600,
      letterSpacing: '-0.4px',
    },
    mariDescription: {
      fontSize: '12px',
      fontStyle: 'normal',
      fontWeight: 400,
      lineHeight: '1.4',
      letterSpacing: '-0.24px',
    },
    mariParagraph: {
      fontSize: '16px',
      fontStyle: 'normal',
      fontWeight: 400,
      lineHeight: '1.5',
      letterSpacing: '-0.16px',
    },
  },
  components,
})

export default theme
