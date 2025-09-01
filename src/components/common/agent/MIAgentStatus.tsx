import { Box, Typography } from '@mui/material'
import { t } from 'i18next'

import CheckIcon from '@/components/common/icons/agent/CheckIcon'
import GeneratingIcon from '@/components/common/icons/agent/GeneratingIcon'
import { MIAgentState } from '@/hooks/useMIAgent'

export interface MIAgentStatusProps {
  status: MIAgentState
}

const MIAgentStatus = ({ status }: MIAgentStatusProps) => {
  if (status === null) return null

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        color: status === 'generating' ? 'gray.50' : 'mari.Primary',
        gap: '4px',
        padding: '18px 12px',
        boxSizing: 'border-box',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          animation: status !== 'complete' ? 'pulse 1s infinite' : 'none',
          '@keyframes pulse': {
            '0%': {
              opacity: 0.7,
            },
            '50%': {
              opacity: 1,
            },
            '100%': {
              opacity: 0.7,
            },
          },
        }}
      >
        {status === 'generating' ? <GeneratingIcon /> : <CheckIcon />}
      </Box>
      <Typography variant="body2" fontWeight="medium">
        {status === 'generating' ? t('답변 생성 중') : status === 'complete' ? t('완료') : null}
      </Typography>
    </Box>
  )
}

export default MIAgentStatus
