import { Box } from '@mui/material'
import React, { useMemo, useCallback } from 'react'

import loadingDisabledIcon from '@/assets/agent/loading-disabled.svg'
import sendActivatedIcon from '@/assets/agent/send-activated.svg'
import sendDisabledIcon from '@/assets/agent/send-disabled.svg'
import stopActivatedIcon from '@/assets/agent/stop-activated.svg'
import stopDisabledIcon from '@/assets/agent/stop-disabled.svg'
import unableDisabledIcon from '@/assets/agent/unable-disabled.svg'
import MIAgentSpinner from '@/components/common/agent/MIAgentSpinner'

export interface MIAgentPromptButtonProps {
  inputStatus?: 'send-activated' | 'send-disabled' | 'stop-activated' | 'stop-disabled' | 'loading-disabled' | 'unable-disabled'
  disabled?: boolean
  onSendMessage: () => void
}

const MIAgentPromptButton: React.FC<MIAgentPromptButtonProps> = ({ inputStatus = 'send-activated', disabled, onSendMessage }) => {
  const isInteractive = useMemo(() => inputStatus === 'send-activated' || inputStatus === 'stop-activated', [inputStatus])

  const getImageSrc = useCallback(() => {
    if (disabled) {
      return unableDisabledIcon
    }

    switch (inputStatus) {
      case 'send-activated':
        return sendActivatedIcon
      case 'send-disabled':
        return sendDisabledIcon
      case 'stop-activated':
        return stopActivatedIcon
      case 'stop-disabled':
        return stopDisabledIcon
      case 'loading-disabled':
        return loadingDisabledIcon
      default:
        return sendActivatedIcon
    }
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
      {inputStatus === 'loading-disabled' ? <MIAgentSpinner /> : <img src={getImageSrc()} width={32} height={32} alt={inputStatus} />}
    </Box>
  )
}

export default MIAgentPromptButton
