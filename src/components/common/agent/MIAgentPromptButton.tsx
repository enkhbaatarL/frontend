import { Box, styled } from '@mui/material'
import React, { useMemo, useCallback } from 'react'

import MiAgentSpinner from '@/components/common/icons/MiAgentSpinner'

export interface MIAgentPromptButtonProps {
  inputStatus?: 'send-activated' | 'send-disabled' | 'stop-activated' | 'stop-disabled' | 'loading-disabled' | 'unable-disabled'
  disabled?: boolean
  onSendMessage: () => void
}

const Spinner = styled(Box)({
  width: '32px',
  height: '32px',
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
})

const MIAgentPromptButton: React.FC<MIAgentPromptButtonProps> = ({ inputStatus = 'send-activated', disabled, onSendMessage }) => {
  const isInteractive = useMemo(() => inputStatus === 'send-activated' || inputStatus === 'stop-activated', [inputStatus])

  const getImageSrc = useCallback(() => {
    if (disabled) {
      return '/src/assets/agent/unable-disabled.svg'
    }

    return `/src/assets/agent/${inputStatus}.svg`
  }, [inputStatus, disabled])

  const handleSendMsg = () => {
    if (inputStatus === 'send-activated') {
      onSendMessage()
    }
  }

  return (
    <Box
      display="flex"
      alignItems="center"
      justifyContent="center"
      sx={{
        pointerEvents: isInteractive ? 'initial' : 'none',
        cursor: isInteractive ? 'pointer' : 'not-allowed',
        userSelect: 'none',
      }}
      onClick={handleSendMsg}
    >
      {inputStatus === 'loading-disabled' ? (
        <Spinner>
          <MiAgentSpinner />
        </Spinner>
      ) : (
        <img src={getImageSrc()} width={32} height={32} alt={inputStatus} />
      )}
    </Box>
  )
}

export default MIAgentPromptButton
