import { Box, Typography } from '@mui/material'

import MIAgentSpinner from '@/components/common/agent/MIAgentSpinner'

interface SummarizingProps {
  text?: string
  size?: number
}

const Summarizing = ({ text = 'Summarizing...', size = 32 }: SummarizingProps) => (
  <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" gap="10px" padding="50px 0px" width="100%">
    <MIAgentSpinner size={size} />
    <Typography
      variant="body2"
      sx={{
        fontSize: 14,
        lineHeight: '1.4em',
        color: '#868E96',
        textAlign: 'center',
      }}
    >
      {text}
    </Typography>
  </Box>
)

export default Summarizing
