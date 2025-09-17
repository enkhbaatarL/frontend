import { Box, Typography } from '@mui/material'

import ai from '@/assets/ai.svg'
import mariLogoTypo from '@/assets/mari-logo-typo.svg'

interface MariBadgeProps {
  text?: string
}

const MariBadge = ({ text = 'Curated' }: MariBadgeProps) => (
  <Box
    sx={{
      display: 'flex',
      alignItems: 'center',
      backgroundColor: '#F0F4FF',
      borderRadius: '6px',
      padding: '2px 8px 2px 4px',
      boxShadow: '0px 0px 10px 0px rgba(54, 79, 199, 0.35)',
      width: 'fit-content',
      height: 'fit-content',
    }}
  >
    <Box
      component="img"
      src={ai}
      alt="AI"
      sx={{
        width: '22px',
        height: '22px',
        marginRight: '4px',
      }}
    />
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: '2px',
        padding: '4px',
      }}
    >
      <Typography
        sx={{
          fontFamily: 'Pretendard',
          fontWeight: 400,
          fontSize: '12px',
          lineHeight: '1.4em',
          background: 'linear-gradient(90deg, rgba(26, 39, 97, 1) 0%, rgba(54, 79, 199, 1) 100%)',
          backgroundClip: 'text',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}
      >
        {text} by
      </Typography>
      <Box
        component="img"
        src={mariLogoTypo}
        alt="Mari"
        sx={{
          width: '29px',
          height: '9px',
        }}
      />
    </Box>
  </Box>
)

export default MariBadge
