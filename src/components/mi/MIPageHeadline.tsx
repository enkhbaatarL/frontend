import { Box, Typography } from '@mui/material'

import productSymbol from '@/assets/product-symbol.svg'

interface Props {
  title: string
  gradientStart: string
  gradientEnd: string
  height?: string
}

const MIPageHeadline = ({ title, gradientStart, gradientEnd, height }: Props) => (
  <Box
    sx={{
      background: `linear-gradient(90deg, ${gradientStart} 0%, ${gradientEnd} 100%)`,
      zIndex: 0,
      position: 'relative',
      height: height ?? '140px',
      overflow: 'hidden',
    }}
  >
    <Box
      position="absolute"
      sx={{
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: -1,
        boxShadow: '0px 20px 20px 0px rgba(0, 0, 0, 0.25) inset',
      }}
    />
    <Box position="relative" display="flex" justifyContent="center" alignItems="center" height="100%">
      <Box position="relative" boxSizing={'border-box'} paddingX={7.5} paddingY={10.5} minWidth={'1440px'} width={'1440px'} margin={'auto'}>
        <Box component="img" position="absolute" right={-44} bottom={-240} src={productSymbol} width={482} height={482} />
        <Box display="flex" alignItems="baseline" gap="4px">
          <Typography color="white" component="h1" fontSize={40} variant="body1M16">
            {title}
          </Typography>
          {(title === 'Economic Calendar' || title === 'AI Market Summary' || title === 'Topic Tracker') && (
            <Box
              sx={{
                fontSize: '16px',
                fontWeight: 500,
                lineHeight: '140%',
                color: '#868E96',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0 4px',
                borderRadius: '4px',
              }}
            >
              DEMO
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  </Box>
)

export default MIPageHeadline
