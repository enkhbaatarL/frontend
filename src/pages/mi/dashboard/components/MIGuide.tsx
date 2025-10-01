import RightIcon from '@mui/icons-material/East'
import { Stack, Typography } from '@mui/material'

import guideBgOverlay from '@/assets/dashboard/guide-bg-overlay.png'
import guideBg from '@/assets/dashboard/guide-bg.png'
import whiteLogo from '@/assets/logow.svg'

const MIGuide = () => (
  <Stack
    alignItems="center"
    padding="24px"
    borderRadius="10px"
    sx={{
      userSelect: 'none',
      cursor: 'pointer',
      position: 'relative',
      backgroundImage: `url(${guideBg})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
      overflow: 'hidden',
      '&::before': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundImage: `url(${guideBgOverlay})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        zIndex: 1,
        opacity: 0.4,
      },
      '&::after': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'linear-gradient(110deg, transparent 30%, rgba(255,255,255,0.4) 50%, transparent 70%)',
        animation: 'shimmer 4s ease-out infinite',
        zIndex: 1,
      },
      '& > *': {
        position: 'relative',
        zIndex: 2,
      },
      '@keyframes shimmer': {
        '0%': {
          transform: 'translateX(-100%) skewX(-15deg)',
          opacity: 0,
        },
        '7.5%': {
          opacity: 0.1,
        },
        '22.5%': {
          opacity: 0.15,
        },
        '52.5%': {
          opacity: 0.4,
          transform: 'translateX(50%) skewX(-8deg)',
        },
        '75%': {
          transform: 'translateX(100%) skewX(-15deg)',
          opacity: 0,
        },
        '100%': {
          transform: 'translateX(100%) skewX(-15deg)',
          opacity: 0,
        },
      },
    }}
  >
    <Stack direction="row" alignItems="center" justifyContent="space-between" width="100%">
      <Stack alignItems="center" padding="7px 30px">
        <img src={whiteLogo} alt="guide" draggable={false} />
      </Stack>
      <Stack direction="row" gap="6px" padding="12px">
        <Typography variant="body2SB14" color="white">
          A Guide to AI Market Intelligence
        </Typography>
        <RightIcon fontSize="small" sx={{ color: 'white' }} />
      </Stack>
    </Stack>
  </Stack>
)

export default MIGuide
