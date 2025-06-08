import { Box, styled } from '@mui/material'

import MiAgentSpinnerIcon from '@/components/common/icons/MiAgentSpinnerIcon'

interface MIAgentSpinnerProps {
  size?: number
}

const Spinner = styled(Box)<{ size: number }>(({ size }) => ({
  width: `${size}px`,
  height: `${size}px`,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  animation: 'spin 1s linear infinite',
  '@keyframes spin': {
    '0%': {
      transform: 'rotate(0deg)',
    },
    '100%': {
      transform: 'rotate(360deg)',
    },
  },
}))

const MIAgentSpinner = ({ size = 32 }: MIAgentSpinnerProps) => (
  <Spinner size={size}>
    <MiAgentSpinnerIcon />
  </Spinner>
)

export default MIAgentSpinner
