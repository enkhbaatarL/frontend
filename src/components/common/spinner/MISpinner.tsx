import { Box, styled, SxProps, Theme } from '@mui/material'
import { ReactNode } from 'react'

interface MISpinnerProps {
  children: ReactNode
  size?: number
  speed?: number
  sx?: SxProps<Theme>
}

const SpinnerBox = styled(Box)<{ size: number; speed: number }>(({ size, speed }) => ({
  width: `${size}px`,
  height: `${size}px`,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  animation: `spin ${1.2 / speed}s linear infinite`,
  '@keyframes spin': {
    '0%': {
      transform: 'rotate(0deg)',
    },
    '100%': {
      transform: 'rotate(360deg)',
    },
  },
}))

const MISpinner = ({ children, size = 20, speed = 1, sx }: MISpinnerProps) => (
  <SpinnerBox size={size} speed={speed} sx={sx}>
    {children}
  </SpinnerBox>
)

export default MISpinner
