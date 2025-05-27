import { Box, Typography } from '@mui/material'

import type React from 'react'

import CheckIcon from '@/components/common/icons/agent/CheckIcon'
import GeneratingIcon from '@/components/common/icons/agent/GeneratingIcon'
import MariIcon from '@/components/common/icons/agent/MariIcon'
import SearchIcon from '@/components/common/icons/agent/SearchIcon'

// Status types for the MI Agent interaction
export type MIAgentStatusType = 'planning' | 'searching' | 'generating' | 'complete'

export interface MIAgentStatusProps {
  status: MIAgentStatusType
  planningText?: string
  searchingText?: string
  generatingText?: string
  completeText?: string
}

const MIAgentStatus: React.FC<MIAgentStatusProps> = ({
  status,
  planningText = '생각중',
  searchingText = '검색 중',
  generatingText = '답변 생성 중',
  completeText = '완료',
}) => {
  // Get the appropriate icon and text based on status
  const getStatusContent = () => {
    switch (status) {
      case 'searching':
        return {
          icon: <SearchIcon />,
          text: searchingText,
          color: 'gray.50',
        }
      case 'generating':
        return {
          icon: <GeneratingIcon />,
          text: generatingText,
          color: 'gray.50',
        }
      case 'complete':
        return {
          icon: <CheckIcon />,
          text: completeText,
          color: 'mari.Primary',
        }
      default: // planning
        return {
          icon: <MariIcon />,
          text: planningText,
          color: 'gray.50',
        }
    }
  }

  const { icon, text, color } = getStatusContent()

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        color,
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
          // animation: status !== 'complete' ? 'pulse 1.5s infinite' : 'none',
          // '@keyframes pulse': {
          //   '0%': {
          //     opacity: 0.7,
          //   },
          //   '50%': {
          //     opacity: 1,
          //   },
          //   '100%': {
          //     opacity: 0.7,
          //   },
          // },
        }}
      >
        {icon}
      </Box>
      <Typography variant="body2" fontWeight="medium">
        {text}
      </Typography>
    </Box>
  )
}

export default MIAgentStatus
